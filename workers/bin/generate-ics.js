#!/usr/bin/env node
// Generates static .ics files for every location using the same core logic
// the Cloudflare Worker uses. This is optional: the worker generates
// calendars on demand, but this lets you materialise the files locally.
//
// Usage:
//   gws-generate-ics                 # writes to <repo>/src/ical
//   gws-generate-ics ./out           # writes to ./out
//   ICAL_OUT_DIR=./out gws-generate-ics

const fs = require('fs/promises');
const path = require('path');
const locations = require('../../src/_data/locations.js');
const { generateICSForLocation } = require('../src/ical-core.js');

const OUT_DIR = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.env.ICAL_OUT_DIR
    ? path.resolve(process.env.ICAL_OUT_DIR)
    : path.join(__dirname, '..', '..', 'src', 'ical');

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  let failures = 0;
  for (const location of locations.locations) {
    try {
      const ics = await generateICSForLocation(location);
      if (!ics) {
        console.warn(`Skipping ${location.id}: missing weather data`);
        failures += 1;
        continue;
      }
      const outFile = path.join(OUT_DIR, `${location.id}.ics`);
      await fs.writeFile(outFile, ics, 'utf8');
      console.log(`Wrote ${outFile}`);
    } catch (error) {
      console.error(`Error generating ${location.id}:`, error.message);
      failures += 1;
    }
  }

  if (failures > 0) {
    console.error(`${failures} location(s) failed`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});