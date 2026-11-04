#!/usr/bin/env node
// Generates .ics files per location using Open-Meteo forecasts.

const fs = require('fs/promises');
const path = require('path');
const ICAL = require('ical.js');
const locations = require('../src/_data/locations.js');

ICAL.foldLength = 73;

const OUT_DIR = path.join(__dirname, '..', 'src', 'ical');
const LOCATION_TIME_ZONE = 'Asia/Nicosia';
const WEATHER_REQUEST_INTERVAL_MS = 2_000;
const WEATHER_REQUEST_TIMEOUT_MS = 10_000;
const WEATHER_MAX_ATTEMPTS = 2;
const WEATHER_RETRY_DELAY_MS = 2_000;
const WEATHER_MAX_RETRY_AFTER_MS = 15_000;
const DANGEROUS_WEATHER_CODES = new Set([45, 48, 56, 57, 65, 66, 67, 75, 82, 86, 95, 96, 99]);

let weatherRequestQueue = Promise.resolve();
let lastWeatherRequestStartedAt = 0;

const RATING_THRESHOLDS = {
  Ideal: {
    minWaterTemp: 18,
    maxWindWaveHeight: 0.3,
    maxUVIndex: 3
  },
  OK: {
    minWaterTemp: 18,
    maxWindWaveHeight: 0.7,
    maxUVIndex: 5
  }
};

async function ensureOutDir() {
  await fs.mkdir(OUT_DIR, { recursive: true });
}

function createICS(calendarName, events, beachUrl) {
  const calendar = new ICAL.Component('vcalendar');
  calendar.addPropertyWithValue('version', '2.0');
  calendar.addPropertyWithValue('prodid', '-//Good-Weather-Swimming//Open-Meteo iCal Generator//EN');
  calendar.addPropertyWithValue('x-wr-calname', calendarName);
  calendar.addPropertyWithValue('x-wr-caldesc', `Beach details: ${beachUrl}`);

  for (const event of events) {
    const component = new ICAL.Component('vevent');
    const calendarEvent = new ICAL.Event(component);
    calendarEvent.uid = event.uid;
    calendarEvent.startDate = ICAL.Time.fromJSDate(new Date(`${event.start}:00Z`), true);
    calendarEvent.endDate = ICAL.Time.fromJSDate(new Date(`${event.end}:00Z`), true);
    calendarEvent.summary = event.summary;
    calendarEvent.description = event.description;
    component.addPropertyWithValue('url', event.url);
    component.addPropertyWithValue('dtstamp', ICAL.Time.fromJSDate(new Date(), true));
    calendar.addSubcomponent(component);
  }

  return calendar.toString();
}

function uidFor(locationId, start) {
  return `${locationId}-${start.replace(/[-:]/g, '')}@good-weather-swimming`;
}

function openMeteoMarineUrl(latitude, longitude) {
  return `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&hourly=wave_height,wind_wave_height,wave_period,sea_surface_temperature&timezone=UTC`;
}

function fetchJSON(url) {
  const request = weatherRequestQueue.then(() => fetchJSONWithRetry(url));
  weatherRequestQueue = request.then(() => undefined, () => undefined);
  return request;
}

function retryAfterMilliseconds(response) {
  const retryAfter = response.headers.get('retry-after');
  if (!retryAfter) return 0;

  const seconds = Number(retryAfter);
  const delay = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(retryAfter) - Date.now();
  return Number.isFinite(delay) ? Math.max(0, Math.min(delay, WEATHER_MAX_RETRY_AFTER_MS)) : 0;
}

async function fetchJSONWithRetry(url) {
  for (let attempt = 1; attempt <= WEATHER_MAX_ATTEMPTS; attempt++) {
    const waitForSlot = WEATHER_REQUEST_INTERVAL_MS - (Date.now() - lastWeatherRequestStartedAt);
    if (waitForSlot > 0) await new Promise(resolve => setTimeout(resolve, waitForSlot));
    lastWeatherRequestStartedAt = Date.now();

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(WEATHER_REQUEST_TIMEOUT_MS) });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status} for ${url}`);
        error.retryAfterMs = retryAfterMilliseconds(response);
        error.retryable = response.status === 408 || response.status === 429 || response.status >= 500;
        throw error;
      }
      return await response.json();
    } catch (error) {
      if (error.retryable === false || attempt === WEATHER_MAX_ATTEMPTS) {
        console.error(`Fetch failed (${attempt}/${WEATHER_MAX_ATTEMPTS}):`, error.message);
        return null;
      }

      const backoff = WEATHER_RETRY_DELAY_MS * (2 ** (attempt - 1));
      const retryDelay = Math.max(backoff, error.retryAfterMs || 0);
      console.error(`Fetch failed (${attempt}/${WEATHER_MAX_ATTEMPTS}); retrying in ${retryDelay / 1000}s:`, error.message);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  return null;
}

function hourlyValue(hourly, index, field) {
  const value = hourly?.[field]?.[index];
  return Number.isFinite(value) ? value : null;
}

function formatLocalTime(utcDateTime) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: LOCATION_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(new Date(`${utcDateTime}:00Z`));
}

function addOneHour(utcDateTime) {
  return new Date(new Date(`${utcDateTime}:00Z`).getTime() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}

function formatValue(value, decimals = 1) {
  return Number.isFinite(value) ? Number(value.toFixed(decimals)) : 'N/A';
}

function describeWeatherCode(code) {
  const descriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return descriptions[code] || 'Unknown conditions';
}

function meetsRatingThresholds(sample, thresholds) {
  return sample.waterTemp >= thresholds.minWaterTemp
    && sample.uvIndex <= thresholds.maxUVIndex
    && sample.windWaveHeight <= thresholds.maxWindWaveHeight;
}

function rateConditions(sample) {
  if (DANGEROUS_WEATHER_CODES.has(sample.weatherCode)) return 'Poor';
  if (meetsRatingThresholds(sample, RATING_THRESHOLDS.Ideal)) return 'Ideal';
  if (meetsRatingThresholds(sample, RATING_THRESHOLDS.OK)) return 'OK';
  return 'Poor';
}

function findSwimWindows(air, marine) {
  const marineIndices = new Map(marine.hourly.time.map((time, index) => [time, index]));
  const daylightByDate = new Map(air.daily.time.map((date, index) => [date, {
    sunrise: air.daily.sunrise?.[index],
    sunset: air.daily.sunset?.[index]
  }]));
  const windows = [];
  let currentWindow = null;

  function finishWindow() {
    if (currentWindow) windows.push(currentWindow);
    currentWindow = null;
  }

  for (let index = 0; index < air.hourly.time.length; index++) {
    const start = air.hourly.time[index];
    const end = addOneHour(start);
    const marineIndex = marineIndices.get(start);
    const daylight = daylightByDate.get(start.slice(0, 10));
    const startTime = new Date(`${start}:00Z`).getTime();
    const endTime = new Date(`${end}:00Z`).getTime();
    const sunrise = daylight?.sunrise ? new Date(`${daylight.sunrise}:00Z`).getTime() : NaN;
    const sunset = daylight?.sunset ? new Date(`${daylight.sunset}:00Z`).getTime() : NaN;
    const isDaylight = Number.isFinite(sunrise) && Number.isFinite(sunset)
      && startTime >= sunrise && endTime <= sunset;
    const sample = marineIndex === undefined ? null : {
      start,
      airTemp: hourlyValue(air.hourly, index, 'temperature_2m'),
      windSpeed: hourlyValue(air.hourly, index, 'wind_speed_10m'),
      windDirection: hourlyValue(air.hourly, index, 'wind_direction_10m'),
      weatherCode: hourlyValue(air.hourly, index, 'weathercode'),
      uvIndex: hourlyValue(air.hourly, index, 'uv_index'),
      waterTemp: hourlyValue(marine.hourly, marineIndex, 'sea_surface_temperature'),
      waveHeight: hourlyValue(marine.hourly, marineIndex, 'wave_height'),
      windWaveHeight: hourlyValue(marine.hourly, marineIndex, 'wind_wave_height'),
      wavePeriod: hourlyValue(marine.hourly, marineIndex, 'wave_period')
    };
    const hasRequiredData = sample && [
      sample.waterTemp,
      sample.uvIndex,
      sample.windWaveHeight,
      sample.weatherCode
    ].every(Number.isFinite);
    if (!hasRequiredData || !isDaylight) {
      finishWindow();
      continue;
    }

    const rating = rateConditions(sample);
    if (currentWindow && currentWindow.end === start && currentWindow.rating === rating) {
      currentWindow.end = end;
      currentWindow.samples.push(sample);
    } else {
      finishWindow();
      currentWindow = {
        rating,
        start,
        end,
        sunrise: daylight.sunrise,
        sunset: daylight.sunset,
        samples: [sample]
      };
    }
  }

  finishWindow();
  return windows;
}

function createSwimEvent(location, window) {
  const beachUrl = `https://goodweatherswimming.github.io${location.urlPath}`;
  const samples = window.samples;
  const valuesOf = field => samples.map(sample => sample[field]).filter(Number.isFinite);
  const minOf = field => valuesOf(field).length ? Math.min(...valuesOf(field)) : null;
  const maxOf = field => valuesOf(field).length ? Math.max(...valuesOf(field)) : null;
  const minWaterTemp = minOf('waterTemp');
  const maxWaterTemp = maxOf('waterTemp');
  const waterTempRange = minWaterTemp === maxWaterTemp
    ? `${formatValue(minWaterTemp)}°C`
    : `${formatValue(minWaterTemp)}-${formatValue(maxWaterTemp)}°C`;
  const signalForLimit = (value, idealLimit, okLimit) => value <= idealLimit ? '🟢' : value <= okLimit ? '🟡' : '🔴';
  const duration = samples.length;
  const hourlyConditions = samples.map(sample => {
    const findings = [];

    if (sample.waterTemp < RATING_THRESHOLDS.Ideal.minWaterTemp) {
      findings.push(`🔴 Water ${formatValue(sample.waterTemp)}°C (below ${RATING_THRESHOLDS.Ideal.minWaterTemp}°C).`);
    }
    if (sample.uvIndex > RATING_THRESHOLDS.Ideal.maxUVIndex) {
      findings.push(`${signalForLimit(sample.uvIndex, RATING_THRESHOLDS.Ideal.maxUVIndex, RATING_THRESHOLDS.OK.maxUVIndex)} UV ${formatValue(sample.uvIndex)} (target ≤${RATING_THRESHOLDS.Ideal.maxUVIndex}; limit ${RATING_THRESHOLDS.OK.maxUVIndex}).`);
    }
    if (sample.windWaveHeight > RATING_THRESHOLDS.Ideal.maxWindWaveHeight) {
      findings.push(`${signalForLimit(sample.windWaveHeight, RATING_THRESHOLDS.Ideal.maxWindWaveHeight, RATING_THRESHOLDS.OK.maxWindWaveHeight)} Wind waves ${formatValue(sample.windWaveHeight)} m (target ≤${RATING_THRESHOLDS.Ideal.maxWindWaveHeight}; limit ${RATING_THRESHOLDS.OK.maxWindWaveHeight} m).`);
    }
    if (DANGEROUS_WEATHER_CODES.has(sample.weatherCode)) {
      findings.push(`🔴 ${describeWeatherCode(sample.weatherCode)} (code ${sample.weatherCode}).`);
    }

    return findings.length
      ? [formatLocalTime(sample.start), ...findings.map(finding => `- ${finding}`)].join('\n')
      : null;
  }).filter(Boolean);
  const windowFindings = [
    {
      signal: minWaterTemp >= RATING_THRESHOLDS.Ideal.minWaterTemp ? '🟢' : '🔴',
      text: `Water ${waterTempRange} (minimum ${RATING_THRESHOLDS.Ideal.minWaterTemp}°C).`
    },
    {
      signal: signalForLimit(maxOf('uvIndex'), RATING_THRESHOLDS.Ideal.maxUVIndex, RATING_THRESHOLDS.OK.maxUVIndex),
      text: `UV up to ${formatValue(maxOf('uvIndex'))} (target ≤${RATING_THRESHOLDS.Ideal.maxUVIndex}; limit ${RATING_THRESHOLDS.OK.maxUVIndex}).`
    },
    {
      signal: signalForLimit(maxOf('windWaveHeight'), RATING_THRESHOLDS.Ideal.maxWindWaveHeight, RATING_THRESHOLDS.OK.maxWindWaveHeight),
      text: `Wind waves up to ${formatValue(maxOf('windWaveHeight'))} m (target ≤${RATING_THRESHOLDS.Ideal.maxWindWaveHeight}; limit ${RATING_THRESHOLDS.OK.maxWindWaveHeight} m).`
    },
    ...[...new Set(samples.map(sample => sample.weatherCode).filter(code => DANGEROUS_WEATHER_CODES.has(code)))].map(code => ({
      signal: '🔴',
      text: `${describeWeatherCode(code)} (code ${code}).`
    }))
  ];
  const ratingSignal = window.rating === 'Ideal' ? '🟢' : window.rating === 'OK' ? '🟡' : '🔴';
  const summaryFindings = window.rating === 'Ideal'
    ? [`Water ${waterTempRange}`, `Wind waves up to ${formatValue(maxOf('windWaveHeight'))} m`]
    : windowFindings.filter(finding => finding.signal === ratingSignal).map(finding => finding.text);

  return {
    uid: uidFor(location.id, window.start),
    start: window.start,
    end: window.end,
    summary: `${ratingSignal} ${summaryFindings.join('; ')}`,
    url: beachUrl,
    description: [
      `Beach details: ${beachUrl}`,
      ...windowFindings.map(finding => `${finding.signal} ${finding.text}`),
      ...(hourlyConditions.length ? ['', ...hourlyConditions] : [])
    ].join('\n')
  };
}

async function generateForLocation(location) {
  console.log('Generating iCal for', location.id);

  const [air, marine] = await Promise.all([
    fetchJSON(location.weatherDataUrl),
    fetchJSON(openMeteoMarineUrl(location.openMeteoLat, location.openMeteoLng))
  ]);
  if (!air?.hourly?.time?.length || !air?.daily?.time?.length || !marine?.hourly?.time?.length) {
    console.warn(`Skipping ${location.id} due to missing data`);
    return;
  }

  const events = findSwimWindows(air, marine)
    .map(window => createSwimEvent(location, window));

  const beachUrl = `https://goodweatherswimming.github.io${location.urlPath}`;
  const ics = createICS(`${location.name} - Swim calendar`, events, beachUrl);
  const outFile = path.join(OUT_DIR, `${location.id}.ics`);
  await fs.writeFile(outFile, ics, 'utf8');
  console.log('Wrote', outFile);
}

async function main() {
  await ensureOutDir();
  for (const location of locations.locations) {
    try {
      await generateForLocation(location);
    } catch (error) {
      console.error('Error generating for', location.id, error.message);
    }
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { createICS, createSwimEvent, rateConditions };