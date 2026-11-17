// Cloudflare Worker that generates .ics swim calendars on demand.
// Replaces the twice-daily rebuild that pre-generated static .ics files.

import { generateICSForLocation } from './ical-core.js';
import locationsData from '../../src/_data/locations.js';

const LOCATIONS_BY_ID = new Map(locationsData.locations.map(location => [location.id, location]));
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/(?:ical\/)?([A-Za-z0-9-]+)\.ics$/);
    if (!match) {
      return new Response('Not found', { status: 404 });
    }

    const location = LOCATIONS_BY_ID.get(match[1]);
    if (!location) {
      return new Response('Location not found', { status: 404 });
    }

    try {
      const ics = await generateICSForLocation(location);
      if (!ics) {
        return new Response('Unable to generate calendar', { status: 502 });
      }
      return new Response(ics, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `inline; filename="${location.id}.ics"`,
          'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, stale-while-revalidate=3600, stale-if-error=86400`,
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('Error generating iCal for', location.id, error);
      return new Response('Internal error', { status: 500 });
    }
  }
};
