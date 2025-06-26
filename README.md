# Tidal Forces Visualization


2D physics simulation showing tidal forces on a planet with customizable moon distance.
Allow real-time adjustment of moon distance (including infinite distance)




## Tech Stack
- **TypeScript** + **WebGL** for graphics
- **Custom physics** for tidal force calculations
- Static files only (no server-side code)

## Goal
- WebGL for efficient rendering of hundreds of particles
- TypeScript for type safety with WebGL APIs
- Custom physics instead of libraries.
- Two hosting modes: local dev server + GitHub Pages



## Development Plan
- Use `tsc` for TypeScript compilation
- TBD: Choose web server for local development
- Build static files for GitHub Pages deployment

# Cheet sheet

## Setup

**Prerequisites:** Node.js + npm installed

```bash
# Install dependencies
npm install

# Build once
npm run build

# Watch mode (auto-rebuild on file changes)
npm run watch
```

## Start local web server

To have http://localhost:8000 in browser run:

```bash
python3 -m http.server 8000
```

## Cleanup

```bash
# Remove all build dependencies (safe to delete)
rm -rf node_modules/
```
