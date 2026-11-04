function openMeteoWeatherUrl(latitude, longitude) {
  return `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation_probability,weathercode,uv_index&daily=sunrise,sunset&timezone=UTC`;
}

function commonsPhoto(filename, title, alt, credit, license, licenseUrl, sourceUrl, caption = '') {
  return {
    src: `/assets/beaches/${filename}`,
    title,
    alt,
    credit,
    license,
    licenseUrl,
    sourceUrl,
    caption
  };
}

function createListedBeach({ id, areaId, name, region, latitude, longitude, description, lifeguardSeason, safetySourceUrl, photo }) {
  return {
    id,
    areaId,
    name,
    urlPath: `/${id}/`,
    region,
    coordinates: { lat: latitude, lng: longitude, zoom: 15 },
    googleMapsEmbed: `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`,
    description,
    photo,
    meetingNotes: "Use the public beach access; check posted flags and current lifeguard hours.",
    openMeteoLat: latitude,
    openMeteoLng: longitude,
    weatherDataUrl: openMeteoWeatherUrl(latitude, longitude),
    dataCacheExpiryMinutes: 30,
    blueFlagSourceUrl: safetySourceUrl,
    lifeguardSeason
  };
}

const locationsData = {
  generalWhatsAppGroup: "https://chat.whatsapp.com/FUTD7w2EH2742L1HvYyu1o",
  areas: [
    {
      id: "peyia",
      name: "Peyia",
      urlPath: "/peyia/",
      description: "Western shores of Paphos with beautiful sandy and rocky beaches",
      whatsappGroup: "https://chat.whatsapp.com/Fz2UKMPTm5q0ABkD2Oz89I",
      region: "Paphos, Cyprus",
      map: {
        src: "/assets/areas/peyia.jpg",
        alt: "Map of Peyia showing Coral Bay and Laourou Beach",
        latitude: 34.900874,
        longitude: 32.341167,
        zoom: 11
      }
    },
    {
      id: "paphos",
      name: "Paphos",
      urlPath: "/paphos/",
      description: "Urban seaside swimming spots along the Kato Paphos waterfront.",
      region: "Paphos, Cyprus",
      map: {
        src: "/assets/areas/paphos.jpg",
        alt: "Map of Kato Paphos showing Municipal Baths",
        latitude: 34.75545488614151,
        longitude: 32.4157725018998,
        zoom: 14
      }
    },
    {
      id: "ayia-napa",
      name: "Ayia Napa",
      urlPath: "/ayia-napa/",
      description: "Blue Flag-listed sandy beaches and coves on the southeast coast.",
      region: "Famagusta, Cyprus",
      map: {
        src: "/assets/areas/ayia-napa.jpg",
        alt: "Map of Ayia Napa showing Nissi, Makronisos and Landa beaches",
        latitude: 34.9862,
        longitude: 33.9615,
        zoom: 12
      }
    },
    {
      id: "protaras",
      name: "Protaras",
      urlPath: "/protaras/",
      description: "Organized bathing beaches and clear-water coves on the east coast.",
      region: "Famagusta, Cyprus",
      map: {
        src: "/assets/areas/protaras.jpg",
        alt: "Map of Protaras showing Fig Tree Bay and Konnos Bay",
        latitude: 34.99817,
        longitude: 34.06385,
        zoom: 12
      }
    },
    {
      id: "larnaca",
      name: "Larnaca",
      urlPath: "/larnaca/",
      description: "Urban Blue Flag beaches along Larnaca's palm-lined waterfront.",
      region: "Larnaca, Cyprus",
      map: {
        src: "/assets/areas/larnaca.jpg",
        alt: "Map of Larnaca showing Foinikoudes and Mackenzie beaches",
        latitude: 34.9015,
        longitude: 33.6379,
        zoom: 11
      }
    },
    {
      id: "limassol",
      name: "Limassol",
      urlPath: "/limassol/",
      description: "Blue Flag-listed beaches from the city coast to Pissouri Bay.",
      region: "Limassol, Cyprus",
      map: {
        src: "/assets/areas/limassol.jpg",
        alt: "Map of the Limassol area showing Pissouri and Kourion beaches",
        latitude: 34.6564,
        longitude: 32.8023,
        zoom: 10
      }
    }
  ],
  locations: [
    {
      id: "coral-bay",
      areaId: "peyia",
      name: "Coral Bay",
      urlPath: "/peyia-coral-bay-beach/",
      region: "Peyia, Paphos",
      coordinates: {
        lat: 34.853807656535146,
        lng: 32.369171826053105,
        zoom: 15
      },
      googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3274.096295122031!2d32.369171826053105!3d34.853807656535146!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14e709002bc60d11%3A0x2368ebdf6a9da634!2sGood%20Weather%20Swimming%20-%20Coral%20Bay!5e0!3m2!1sen!2s!4v1766509943632!5m2!1sen!2s",
      description: "Beautiful golden sandy beach in western Peyia",
      whatsappGroup: "https://chat.whatsapp.com/LW7HuuSKNrQ5xIRWjk8uau", // Location-level group
      meetingNotes: "Decided on the spot - choose between Left or Right side based on conditions",
      blueFlagSourceUrl: "https://www.visitcyprus.com/discover-cyprus/sun-sea/beaches/coral-bay-beach-blue-flag/",
      lifeguardSeason: "April-October",
      photo: commonsPhoto(
        "coral-bay.jpg",
        "Flickr - ronsaunders47 - CORAL BAY. PAPHOS CYPRUS.",
        "Rocky Coral Bay shoreline and calm water in Peyia",
        "Ronald Saunders",
        "CC BY-SA 2.0",
        "https://creativecommons.org/licenses/by-sa/2.0/",
        "https://commons.wikimedia.org/wiki/File:Flickr_-_ronsaunders47_-_CORAL_BAY._PAPHOS_CYPRUS.jpg"
      ),
      // Open-Meteo fields (used by the generate-ical script and API integration)
      openMeteoLat: 34.884468,
      openMeteoLng: 32.367428,
      weatherDataUrl: openMeteoWeatherUrl(34.884468, 32.367428),
      dataCacheExpiryMinutes: 30
    },
    {
      id: "laourou-beach",
      areaId: "peyia",
      name: "Laourou Beach",
      urlPath: "/peyia-laourou-beach/",
      region: "Peyia, Paphos",
      coordinates: {
        lat: 34.85773252605116,
        lng: 32.36083934767451,
        zoom: 15
      },
      googleMapsEmbed: "https://www.google.com/maps?q=34.85773252605116,32.36083934767451&z=15&output=embed",
      description: "Scenic beach with rocky areas and calm waters",
      whatsappGroup: "https://chat.whatsapp.com/GJgJGYaQTmFGIOaQRdjv8I",
      meetingNotes: "Meet at the main beach entrance near the parking area",
      blueFlagSourceUrl: "https://www.visitcyprus.com/discover-cyprus/sun-sea/beaches/laourou-beach-blue-flag/",
      lifeguardSeason: "April-October",
      photo: commonsPhoto(
        "coral-bay.jpg",
        "Flickr - ronsaunders47 - CORAL BAY. PAPHOS CYPRUS.",
        "Nearby Coral Bay on the Peyia coast; regional reference photo, not Laourou Beach",
        "Ronald Saunders",
        "CC BY-SA 2.0",
        "https://creativecommons.org/licenses/by-sa/2.0/",
        "https://commons.wikimedia.org/wiki/File:Flickr_-_ronsaunders47_-_CORAL_BAY._PAPHOS_CYPRUS.jpg",
        "Nearby Coral Bay, used as a regional Peyia coastline reference; this is not a photo of Laourou Beach."
      ),
      openMeteoLat: 34.85773252605116,
      openMeteoLng: 32.36083934767451,
      weatherDataUrl: openMeteoWeatherUrl(34.85773252605116, 32.36083934767451),
      dataCacheExpiryMinutes: 30
    },
    createListedBeach({
      id: "municipal-baths-paphos",
      areaId: "paphos",
      name: "Municipal Baths",
      region: "Kato Paphos, Paphos",
      latitude: 34.75545488614151,
      longitude: 32.4157725018998,
      description: "Blue Flag urban beach in the heart of Kato Paphos, with wooden decking, sandy sections and calm but deep water.",
      lifeguardSeason: "April-October",
      safetySourceUrl: "https://www.visitcyprus.com/discover-cyprus/sun-sea/beaches/municipal-baths-beach-blue-flag/",
      photo: commonsPhoto(
        "municipal-baths-paphos.jpg",
        "Vrysoudia II Beach and Alykes Beach, Paphos, Cyprus",
        "Rocky shoreline and swimming access at Vrysoudia II Beach in Paphos",
        "Fry72, Karel Frydrýšek",
        "CC BY-SA 4.0",
        "https://creativecommons.org/licenses/by-sa/4.0/",
        "https://commons.wikimedia.org/wiki/File:Vrysoudia_II_Beach_and_Alykes_Beach,_Paphos,_Cyprus.jpg",
        "Nearby Vrysoudia II Beach, about 280 m southeast; this is a local coastline reference, not Municipal Baths."
      )
    }),
    createListedBeach({
      id: "nissi-beach",
      areaId: "ayia-napa",
      name: "Nissi Beach",
      region: "Ayia Napa, Famagusta",
      latitude: 34.98829,
      longitude: 33.9712,
      description: "Blue Flag-listed sandy bay with shallow, sheltered water and an offshore islet.",
      lifeguardSeason: "April-October",
      safetySourceUrl: "https://www.visitcyprus.com/discover-cyprus/sun-sea/beaches/nissi-beach-blue-flag/",
      photo: commonsPhoto("nissi-beach.jpg", "Nissi beach Cyprus (43006730484)", "Nissi Beach's sandy swimming bay in Ayia Napa", "dronepicr", "CC BY 2.0", "https://creativecommons.org/licenses/by/2.0/", "https://commons.wikimedia.org/wiki/File:Nissi_beach_Cyprus_(43006730484).jpg")
    }),
    createListedBeach({
      id: "makronisos-beach",
      areaId: "ayia-napa",
      name: "Makronisos Beach",
      region: "Ayia Napa, Famagusta",
      latitude: 34.982847,
      longitude: 33.955065,
      description: "Blue Flag-listed group of sandy bays with relatively calm, clear water.",
      lifeguardSeason: "April-October",
      safetySourceUrl: "https://www.visitcyprus.com/discover-cyprus/sun-sea/beaches/makronisos-beach-blue-flag/",
      photo: commonsPhoto("makronisos-beach.jpg", "Makronissos Beach in Ayia Napa", "Sandy Makronisos Beach in Ayia Napa", "Marek Ślusarczyk", "CC BY 3.0", "https://creativecommons.org/licenses/by/3.0/", "https://commons.wikimedia.org/wiki/File:03_Cyprus_beach_-_Makronissos_Beach_in_Ayia_Napa_-_sandy_Cyprus_beach_-_Zypern_Urlaubsgebiet.jpg")
    }),
    createListedBeach({
      id: "landa-beach",
      areaId: "ayia-napa",
      name: "Landa Beach",
      region: "Ayia Napa, Famagusta",
      latitude: 34.98743,
      longitude: 33.95833,
      description: "Blue Flag-listed sandy beach with organized swimming facilities.",
      lifeguardSeason: "April-October",
      safetySourceUrl: "https://www.visitcyprus.com/discover-cyprus/sun-sea/beaches/landa-beach-blue-flag/",
      photo: commonsPhoto("landa-beach.jpg", "Landa Golden Beach - Ayia Napa", "Landa Golden Beach at sunset in Ayia Napa", "ant0ni0c", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "https://commons.wikimedia.org/wiki/File:Landa_Golden_Beach_-_Ayia_Napa_-_panoramio.jpg")
    }),
    createListedBeach({
      id: "fig-tree-bay",
      areaId: "protaras",
      name: "Fig Tree Bay",
      region: "Protaras, Famagusta",
      latitude: 35.012567,
      longitude: 34.058549,
      description: "Blue Flag-listed sandy beach with clear water and an organized bathing area.",
      lifeguardSeason: "April-October",
      safetySourceUrl: "https://www.visitcyprus.com/discover-cyprus/sun-sea/beaches/protaras-beach-fig-tree-bay-blue-flag/",
      photo: commonsPhoto("fig-tree-bay.jpg", "Fig Tree Beach Cyprus (41914209900)", "Fig Tree Bay's clear water and sandy beach in Protaras", "dronepicr", "CC BY 2.0", "https://creativecommons.org/licenses/by/2.0/", "https://commons.wikimedia.org/wiki/File:Fig_Tree_Beach_Cyprus_(41914209900).jpg")
    }),
    createListedBeach({
      id: "konnos-bay",
      areaId: "protaras",
      name: "Konnos Bay",
      region: "Protaras, Famagusta",
      latitude: 34.98378,
      longitude: 34.06916,
      description: "Blue Flag-listed sandy cove in a sheltered setting between Protaras and Cape Greco.",
      lifeguardSeason: "April-October",
      safetySourceUrl: "https://www.visitcyprus.com/discover-cyprus/sun-sea/beaches/konnos-bay-blue-flag/",
      photo: commonsPhoto("konnos-bay.jpg", "Konnos Bay Cyprus (29852107688)", "Konnos Bay's sheltered cove and clear water", "dronepicr", "CC BY 2.0", "https://creativecommons.org/licenses/by/2.0/", "https://commons.wikimedia.org/wiki/File:Konnos_Bay_Cyprus_(29852107688).jpg")
    }),
    createListedBeach({
      id: "foinikoudes-beach",
      areaId: "larnaca",
      name: "Foinikoudes Beach",
      region: "Larnaca, Cyprus",
      latitude: 34.913895,
      longitude: 33.638418,
      description: "Blue Flag-listed urban beach with shallow water along Larnaca's palm-lined promenade.",
      lifeguardSeason: "June-October",
      safetySourceUrl: "https://www.visitcyprus.com/discover-cyprus/sun-sea/beaches/foinikoudes-beach-blue-flag/",
      photo: commonsPhoto("foinikoudes-beach.jpg", "Finikoudes Beach, Larnaca", "Finikoudes Beach beside the Larnaca seafront", "Cypriot Chauvinist", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:Finikoudes_Beach,_Larnaca.jpg")
    }),
    createListedBeach({
      id: "mackenzie-beach",
      areaId: "larnaca",
      name: "Mackenzie Beach",
      region: "Larnaca, Cyprus",
      latitude: 34.889136,
      longitude: 33.637372,
      description: "Blue Flag-listed Larnaca beach described by Visit Cyprus as calm, clear and shallow.",
      lifeguardSeason: "June-October",
      safetySourceUrl: "https://www.visitcyprus.com/discover-cyprus/sun-sea/beaches/mckenzie-beach-blue-flag/",
      photo: commonsPhoto("mackenzie-beach.jpg", "Mackenzie, Larnaca, Cyprus", "Mackenzie Beach's sandy urban shoreline in Larnaca", "Andris Malygin", "CC BY 3.0", "https://creativecommons.org/licenses/by/3.0/", "https://commons.wikimedia.org/wiki/File:Mackenzie,_Larnaca,_Cyprus_-_panoramio.jpg")
    }),
    createListedBeach({
      id: "pissouri-beach",
      areaId: "limassol",
      name: "Pissouri Beach",
      region: "Pissouri, Limassol",
      latitude: 34.64974,
      longitude: 32.72205,
      description: "Blue Flag-listed resort beach with golden sand, pebbles and seasonal lifeguard service.",
      lifeguardSeason: "April-October",
      safetySourceUrl: "https://www.visitcyprus.com/discover-cyprus/sun-sea/beaches/pissouri-beach-blue-flag/",
      photo: commonsPhoto("pissouri-beach.jpg", "Pissouri Beach", "Pissouri Beach and the surrounding bay", "Valentina Powers", "CC BY 2.0", "https://creativecommons.org/licenses/by/2.0/", "https://commons.wikimedia.org/wiki/File:Pissouri_Beach.jpg")
    }),
    createListedBeach({
      id: "kourion-beach",
      areaId: "limassol",
      name: "Kourion Beach",
      region: "Episkopi Bay, Limassol",
      latitude: 34.663057,
      longitude: 32.882584,
      description: "Blue Flag-listed sand-and-pebble beach with a designated bathing area.",
      lifeguardSeason: "April-October",
      safetySourceUrl: "https://www.visitcyprus.com/discover-cyprus/sun-sea/beaches/kourion-beach-blue-flag/",
      photo: commonsPhoto("kourion-beach.jpg", "Kourion Beach Cyprus", "Kourion Beach and its coastline in Episkopi Bay", "Radosław Botev", "CC BY 3.0 PL", "https://creativecommons.org/licenses/by/3.0/pl/deed.en", "https://commons.wikimedia.org/wiki/File:Kourion_Beach_Cyprus.jpg")
    })
  ]
};

const areasById = new Map(locationsData.areas.map(area => [area.id, area]));
locationsData.locations = locationsData.locations.map(location => {
  const area = areasById.get(location.areaId);
  return {
    ...location,
    areaName: area?.name,
    areaWhatsAppGroup: area?.whatsappGroup
  };
});

module.exports = locationsData;
