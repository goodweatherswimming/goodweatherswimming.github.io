#!/usr/bin/env node
// Generates .ics files per location using Open-Meteo forecasts.

const fs = require('fs/promises');
const path = require('path');
const locations = require('../src/_data/locations.js');
const { generateICSForLocation, createICS, createSwimEvent, rateConditions, findSwimWindows, openMeteoMarineUrl } = require('./lib/ical-core');

const OUT_DIR = path.join(__dirname, '..', 'src', 'ical');

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const location of locations.locations) {
    try {
      const ics = await generateICSForLocation(location);
      if (!ics) {
        console.warn(`Skipping ${location.id} due to missing data`);
        continue;
      }
      const outFile = path.join(OUT_DIR, `${location.id}.ics`);
      await fs.writeFile(outFile, ics, 'utf8');
      console.log('Wrote', outFile);
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