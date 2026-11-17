// Configuration for the on-demand ICS calendar worker.
// This replaces the old twice-daily rebuild that pre-generated static .ics files.

module.exports = {
  // Cloudflare Worker URL (deployed via workers/wrangler.toml).
  // Example: https://goodweatherswimmingical.goodweatherswimming-ical-worker.workers.dev/ical/coral-bay.ics
  workerUrl: process.env.ICAL_WORKER_URL || 'https://goodweatherswimmingical.goodweatherswimming-ical-worker.workers.dev'
};