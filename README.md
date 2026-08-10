# mapia — route optimizer

A lightweight, open-source route planner that finds the most efficient order for your stops and draws the path on an interactive map.

![mapia screenshot](ui-03-map.png)

## What it does

- **Add destinations** by searching any address or clicking directly on the map
- **Optimize the stop order** using the OpenRouteService TSP algorithm
- **Drag to reorder** stops manually — the route recalculates without overriding your choice
- **Pin stops** to lock them in place before optimizing
- **See the details** — total distance, estimated duration, and fuel consumption per leg
- **Open in Google Maps or Waze** with a single tap for turn-by-turn navigation
- **Share your route** via a URL that restores the full trip for anyone who opens it

## Tech stack

| Layer | Tech |
|-------|------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Map | MapLibre GL JS + OpenFreeMap tiles (no API key needed) |
| Routing | OpenRouteService API |
| Drag & drop | dnd-kit |
| Styling | Tailwind CSS 4 |
| Tests | Vitest |

## Getting started

### 1. Get a free API key

Sign up at [openrouteservice.org](https://openrouteservice.org/) and grab a free API key.

### 2. Configure the environment

```bash
cp .env.example .env
```

Edit `.env` and set your key:

```
VITE_ORS_API_KEY=your_key_here
```

### 3. Run locally

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm test           # unit tests
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```

## Limits

- Max **10 destinations** per route
- Fuel estimate assumes **8 L/100 km** (generic average)
- Duration is based on road distance — does **not** reflect live traffic

## License

MIT
