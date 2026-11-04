const assert = require('node:assert/strict');
const test = require('node:test');
const ICAL = require('ical.js');
const { createICS, createSwimEvent, rateConditions } = require('./generate-ical');

function conditions(overrides = {}) {
  return {
    waterTemp: 22,
    uvIndex: 2,
    windWaveHeight: 0.2,
    windSpeed: 8,
    weatherCode: 0,
    ...overrides
  };
}

test('wind-wave height drives ratings regardless of total waves, wind speed, or rain chance', () => {
  assert.equal(rateConditions(conditions({
    windWaveHeight: 0.3,
    waveHeight: 2.5,
    windSpeed: 40,
    precipProbability: 100
  })), 'Ideal');
  assert.equal(rateConditions(conditions({ windWaveHeight: 0.5 })), 'OK');
  assert.equal(rateConditions(conditions({ windWaveHeight: 0.8, waveHeight: 0.1 })), 'Poor');
});

test('dangerous weather codes override otherwise ideal conditions', () => {
  for (const weatherCode of [45, 48, 56, 57, 65, 66, 67, 75, 82, 86, 95, 96, 99]) {
    assert.equal(rateConditions(conditions({ weatherCode })), 'Poor');
  }
});

test('calendar and events include the relevant beach page URL', () => {
  const beachUrl = 'https://goodweatherswimming.github.io/peyia-coral-bay-beach/';
  const sample = {
    start: '2026-11-04T08:00',
    weatherCode: 0,
    airTemp: 22,
    waterTemp: 23,
    uvIndex: 2,
    windWaveHeight: 0.2,
    waveHeight: 0.3,
    wavePeriod: 4,
    windSpeed: 5,
    windDirection: 180
  };
  const event = createSwimEvent({
    id: 'coral-bay',
    name: 'Coral Bay',
    urlPath: '/peyia-coral-bay-beach/'
  }, {
    rating: 'Ideal',
    start: sample.start,
    end: '2026-11-04T09:00',
    sunrise: '2026-11-04T04:00',
    sunset: '2026-11-04T15:00',
    samples: [sample]
  });
  const calendar = new ICAL.Component(ICAL.parse(createICS('Coral Bay', [event], beachUrl)));
  const calendarEvent = calendar.getFirstSubcomponent('vevent');

  assert.equal(calendar.getFirstPropertyValue('x-wr-caldesc'), `Beach details: ${beachUrl}`);
  assert.equal(calendarEvent.getFirstPropertyValue('url'), beachUrl);
  assert.equal(calendarEvent.getFirstPropertyValue('summary'), '🟢 Water 23°C; Wind waves up to 0.2 m');
  assert.match(calendarEvent.getFirstPropertyValue('description'), new RegExp(beachUrl));
  assert.match(calendarEvent.getFirstPropertyValue('description'), /🟢 Water 23°C/);
  assert.doesNotMatch(calendarEvent.getFirstPropertyValue('description'), /10:00/);
});

test('OK title lists every yellow reason without green factors', () => {
  const sample = {
    start: '2026-11-04T08:00',
    weatherCode: 0,
    waterTemp: 22,
    uvIndex: 4,
    windWaveHeight: 0.5,
    waveHeight: 0.6,
    wavePeriod: 4,
    windSpeed: 8,
    windDirection: 180
  };
  const event = createSwimEvent({
    id: 'coral-bay',
    name: 'Coral Bay',
    urlPath: '/peyia-coral-bay-beach/'
  }, {
    rating: 'OK',
    start: sample.start,
    end: '2026-11-04T09:00',
    sunrise: '2026-11-04T04:00',
    sunset: '2026-11-04T15:00',
    samples: [sample]
  });
  const calendar = new ICAL.Component(ICAL.parse(createICS('Coral Bay', [event], event.url)));
  const summary = calendar.getFirstSubcomponent('vevent').getFirstPropertyValue('summary');

  assert.match(summary, /🟡 UV up to 4/);
  assert.match(summary, /Wind waves up to 0\.5 m/);
  assert.doesNotMatch(summary, /Water 22°C/);
});

test('hourly details show each yellow or red finding under its hour heading', () => {
  const sample = {
    start: '2026-11-04T08:00',
    weatherCode: 95,
    airTemp: 22,
    waterTemp: 23,
    uvIndex: 4,
    windWaveHeight: 0.8,
    waveHeight: 1.1,
    wavePeriod: 4,
    windSpeed: 5,
    windDirection: 180
  };
  const event = createSwimEvent({
    id: 'coral-bay',
    name: 'Coral Bay',
    urlPath: '/peyia-coral-bay-beach/'
  }, {
    rating: 'Poor',
    start: sample.start,
    end: '2026-11-04T09:00',
    sunrise: '2026-11-04T04:00',
    sunset: '2026-11-04T15:00',
    samples: [sample]
  });
  const calendar = new ICAL.Component(ICAL.parse(createICS('Coral Bay', [event], event.url)));
  const description = calendar.getFirstSubcomponent('vevent').getFirstPropertyValue('description');

  assert.match(description, /10:00\n- 🟡 UV 4/);
  assert.match(description, /- 🔴 Wind waves 0\.8 m/);
  assert.match(description, /- 🔴 Thunderstorm/);
  assert.doesNotMatch(description, /Conditions by hour|Rating:|\b(Ideal|OK|Poor)\b/);
  assert.match(calendar.getFirstSubcomponent('vevent').getFirstPropertyValue('summary'), /🔴 Wind waves up to 0\.8 m/);
  assert.match(calendar.getFirstSubcomponent('vevent').getFirstPropertyValue('summary'), /Thunderstorm/);
  assert.doesNotMatch(calendar.getFirstSubcomponent('vevent').getFirstPropertyValue('summary'), /UV up to 4/);
});