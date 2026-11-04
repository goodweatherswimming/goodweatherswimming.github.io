const assert = require('node:assert/strict');
const test = require('node:test');
const { rateConditions } = require('./generate-ical');

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