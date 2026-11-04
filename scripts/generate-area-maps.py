#!/usr/bin/env python3

import json
import math
import os
import re
import subprocess
import time
from email.utils import parsedate_to_datetime
from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
TILE_SIZE = 256
MAP_WIDTH = 768
MAP_HEIGHT = 512
TILE_URL = "https://tile.openstreetmap.org/{zoom}/{x}/{y}.png"
USER_AGENT = "GoodWeatherSwimming map image generator (+https://goodweatherswimming.github.io/)"
CACHE_DIR = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "good-weather-swimming" / "osm-tiles"
MIN_CACHE_SECONDS = 7 * 24 * 60 * 60
REQUEST_INTERVAL_SECONDS = 1
last_request_at = 0

AREA_DATA_JS = """
const data = require("./src/_data/locations");
process.stdout.write(JSON.stringify(data.areas.map(area => ({
  id: area.id,
  map: area.map,
  locations: data.locations
    .filter(location => location.areaId === area.id)
    .map(location => ({
      name: location.name,
      latitude: location.coordinates.lat,
      longitude: location.coordinates.lng
    }))
}))));
"""


def load_area_data():
    result = subprocess.run(
        ["node", "-e", AREA_DATA_JS],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def tile_coordinates(latitude, longitude, zoom):
    scale = 2 ** zoom
    x = (longitude + 180) / 360 * scale
    latitude_radians = math.radians(latitude)
    y = (1 - math.asinh(math.tan(latitude_radians)) / math.pi) / 2 * scale
    return x, y, math.floor(x), math.floor(y)


def cache_expiry(headers):
    cache_control = headers.get("Cache-Control", "")
    if "no-store" in cache_control.lower():
        return None
    if "no-cache" in cache_control.lower():
        return time.time()

    max_age = re.search(r"(?:^|,)\s*max-age=(\d+)", cache_control, re.IGNORECASE)
    if max_age:
        return time.time() + int(max_age.group(1))

    expires = headers.get("Expires")
    if expires:
        return parsedate_to_datetime(expires).timestamp()

    return time.time() + MIN_CACHE_SECONDS


def get_tile(zoom, x, y):
    global last_request_at

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    tile_path = CACHE_DIR / f"{zoom}-{x}-{y}.png"
    metadata_path = tile_path.with_suffix(".json")
    metadata = json.loads(metadata_path.read_text()) if metadata_path.exists() else {}

    if tile_path.exists() and metadata.get("expires_at", 0) > time.time():
        return tile_path.read_bytes()

    headers = {
        "User-Agent": USER_AGENT,
        "Referer": "https://goodweatherswimming.github.io/",
    }
    if tile_path.exists():
        if metadata.get("etag"):
            headers["If-None-Match"] = metadata["etag"]
        if metadata.get("last_modified"):
            headers["If-Modified-Since"] = metadata["last_modified"]

    wait = REQUEST_INTERVAL_SECONDS - (time.monotonic() - last_request_at)
    if wait > 0:
        time.sleep(wait)

    request = Request(TILE_URL.format(zoom=zoom, x=x, y=y), headers=headers)
    last_request_at = time.monotonic()
    try:
        with urlopen(request, timeout=30) as response:
            data = response.read()
            response_headers = response.headers
    except HTTPError as error:
        if error.code != 304 or not tile_path.exists():
            raise
        response_headers = error.headers
        data = tile_path.read_bytes()

    expires_at = cache_expiry(response_headers)
    if expires_at is None:
        tile_path.unlink(missing_ok=True)
        metadata_path.unlink(missing_ok=True)
    else:
        tile_path.write_bytes(data)
        metadata_path.write_text(json.dumps({
            "expires_at": expires_at,
            "etag": response_headers.get("ETag", metadata.get("etag")),
            "last_modified": response_headers.get("Last-Modified", metadata.get("last_modified")),
        }))
    return data


def create_area_map(area):
    map_data = area["map"]
    zoom = map_data["zoom"]
    center_x, center_y, _, _ = tile_coordinates(
        map_data["latitude"],
        map_data["longitude"],
        zoom,
    )
    left = round(center_x * TILE_SIZE - MAP_WIDTH / 2)
    top = round(center_y * TILE_SIZE - MAP_HEIGHT / 2)
    first_tile_x = math.floor(left / TILE_SIZE)
    first_tile_y = math.floor(top / TILE_SIZE)
    last_tile_x = math.floor((left + MAP_WIDTH - 1) / TILE_SIZE)
    last_tile_y = math.floor((top + MAP_HEIGHT - 1) / TILE_SIZE)
    world_tile_count = 2 ** zoom
    image = Image.new("RGB", (MAP_WIDTH, MAP_HEIGHT))

    for tile_y in range(first_tile_y, last_tile_y + 1):
        if not 0 <= tile_y < world_tile_count:
            raise ValueError(f"Map for {area['id']} exceeds the valid latitude range.")
        for tile_x in range(first_tile_x, last_tile_x + 1):
            tile = Image.open(BytesIO(
                get_tile(zoom, tile_x % world_tile_count, tile_y)
            )).convert("RGB")
            if tile.size != (TILE_SIZE, TILE_SIZE):
                raise ValueError(
                    f"Unexpected tile dimensions for {area['id']}: {tile.size}"
                )
            image.paste(
                tile,
                (tile_x * TILE_SIZE - left, tile_y * TILE_SIZE - top),
            )

    draw = ImageDraw.Draw(image)
    marker_positions = []
    for location in area["locations"]:
        point_x, point_y, _, _ = tile_coordinates(
            location["latitude"],
            location["longitude"],
            zoom,
        )
        x = round(point_x * TILE_SIZE - left)
        y = round(point_y * TILE_SIZE - top)
        if not (0 <= x < MAP_WIDTH and 0 <= y < MAP_HEIGHT):
            raise ValueError(
                f"{location['name']} is outside {area['id']}'s map image; "
                "adjust the area's map center or zoom in locations.js."
            )
        x = min(max(x, 7), MAP_WIDTH - 7)
        y = min(max(y, 7), MAP_HEIGHT - 7)
        marker_positions.append((x, y))
        draw.ellipse((x - 6, y - 6, x + 6, y + 6), fill="#ff4d6d", outline="white", width=3)

    attribution = "© OpenStreetMap contributors"
    font = ImageFont.load_default()
    text_bounds = draw.textbbox((0, 0), attribution, font=font)
    label_width = text_bounds[2] - text_bounds[0] + 8
    label_height = text_bounds[3] - text_bounds[1] + 6
    margin = 3
    positions = [
        (margin, margin),
        (MAP_WIDTH - label_width - margin, margin),
        (margin, MAP_HEIGHT - label_height - margin),
        (MAP_WIDTH - label_width - margin, MAP_HEIGHT - label_height - margin),
    ]

    def distance_from_markers(position):
        x1, y1 = position
        x2, y2 = x1 + label_width, y1 + label_height
        return min(
            (
                max(x1 - x, 0, x - x2) ** 2 + max(y1 - y, 0, y - y2) ** 2
                for x, y in marker_positions
            ),
            default=float("inf"),
        )

    label_x, label_y = max(positions, key=distance_from_markers)
    draw.rectangle(
        (label_x, label_y, label_x + label_width, label_y + label_height),
        fill="white",
    )
    draw.text((label_x + 4, label_y + 3), attribution, fill="#263238", font=font)

    output_path = ROOT / "src" / map_data["src"].lstrip("/")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="JPEG", quality=90, optimize=True)
    print(f"Created {output_path.relative_to(ROOT)}")


def main():
    for area in load_area_data():
        create_area_map(area)


if __name__ == "__main__":
    main()
