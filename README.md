# Good Weather Swimming - 11ty Project

A weather-based open water swimming community website built with **Eleventy (11ty)** and deployed to **GitHub Pages**.

## Project Structure

```
.
├── src/
│   ├── _data/
│   │   └── locations.js          # Location data for all beaches
│   ├── _includes/
│   │   ├── base.html             # Main layout template
│   │   └── location.html         # Location-specific template (deprecated)
│   ├── index.html                # Home page with location listing (pagination)
│   ├── coral-bay.html            # Coral Bay location page
│   └── laourou-beach.html        # Laourou Beach location page
├── .github/
│   └── workflows/
│       └── build-and-deploy.yml  # GitHub Pages deployment workflow
├── .eleventy.js                  # Eleventy configuration
├── package.json                  # Dependencies and scripts
├── .gitignore
└── README.md
```

## Features

- **Multi-location Support**: Easily manage multiple swimming locations
- **Dynamic Pages**: Each location gets its own dedicated page at:
  - `/cyprus-peyia-coral-bay-beach/`
  - `/cyprus-peyia-laourou-beach/`
- **Home Page**: Centralized entry point with all locations listed
- **Responsive Design**: Beautiful UI with Tailwind CSS
- **Weather Integration**: Embedded calendar with real-time weather forecasts
- **Location Navigation**: Quick switcher between locations in navbar
- **GitHub Pages**: Automated deployment on push to `main` branch

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Local Development

```bash
# Start development server with live reload
npm run serve
```

Or separately:
```bash
# Watch for changes
npm run watch

# Build the site
npm run build
```

The site will be available at `http://localhost:8080`

## Editing Content

### Adding a New Location

1. **Update `src/_data/locations.js`** with new location data:

```javascript
{
  id: "your-beach-id",
  name: "Your Beach Name",
  urlPath: "/cyprus-peyia-your-beach/",
  region: "Peyia, Paphos",
  coordinates: {
    lat: 34.xxx,
    lng: 32.xxx,
    zoom: 15
  },
  googleMapsEmbed: "https://www.google.com/maps/embed?pb=...",
  description: "Beach description",
  whatsappGroup: "https://chat.whatsapp.com/...",
  meetingNotes: "How to find the group",
  weatherDataUrl: "https://rezerv.it/weather/v1/forecast?latitude=34.xxx&longitude=32.xxx&preset=openwater_swimming"
}
```

2. **Create a new page** at `src/your-beach.html`:

```yaml
---
layout: location.html
permalink: /cyprus-peyia-your-beach/
location: "{{ locations.locations[X] }}"
---
```

Replace `X` with the array index of your new location.

### Customizing Location Info

Edit the meeting notes, WhatsApp group links, and other location-specific details in `src/_data/locations.js`.

### Area Map Images

Each area page and home-page area card uses a generated map image. The generator reads area centers and swimming-spot coordinates from `src/_data/locations.js`; it is not run by the normal site build.

Map generation requires Python 3. After adding an area or changing its map center or swimming locations, install Pillow and regenerate the images:

```bash
npm run setup:area-maps
python3 scripts/generate-area-maps.py
```

The images use OpenStreetMap tiles and include visible contributor attribution. Keep the attribution in place.

## Deployment

### GitHub Pages Workflow

The site automatically deploys to GitHub Pages when you push to the `main` branch. The workflow:

1. Installs Node.js dependencies
2. Builds the site with Eleventy
3. Deploys to GitHub Pages

View the workflow status in `.github/workflows/build-and-deploy.yml`

### Manual Deployment

```bash
npm run build
# Output is in _site/ directory
```

## Technologies

- **Eleventy (11ty)**: Static site generator
- **Nunjucks**: Templating engine
- **Tailwind CSS**: Utility-first CSS framework
- **GitHub Pages**: Free hosting
- **GitHub Actions**: CI/CD automation

## Customization

### Styling

Main styles are in `src/_includes/base.html` within the `<style>` tag. Theme colors:

```css
--primary-blue: #004d7a;
--deep-navy: #002d4d;
--ocean-blue: #0077be;
--energy-pink: #ff4d6d;
--sand: #fdf5e6;
```

### Navigation

Location switcher is automatically generated from `src/_data/locations.js` in the navbar.

## Support

For issues or questions, contact the Good Weather Swimming community via WhatsApp!
