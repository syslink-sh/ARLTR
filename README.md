# ARLTR - All Roads Lead To Rome

## About

ARLTR is an interactive mapping application that proves the ancient saying "all roads lead to Rome." Click anywhere on the map to calculate a route from that point to Rome, Italy.

## Features

- **Interactive Map**: Point-and-click route planning to Rome from any global location.
- **Theme Support**: Seamless Light and Dark modes with specialized map tile filtering.

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- GraphHopper API key (Get it from [GraphHopper](https://www.graphhopper.com/))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/syslink-sh/ARLTR.git
cd ARLTR
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root:
```bash
GRAPHHOPPER_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Technical Details

- **Framework**: SvelteKit 2
- **Styling**: Tailwind CSS 4
- **Mapping**: Leaflet.js
- **Routing**: GraphHopper Routing

---

Made by [SySLink](https://github.com/syslink-sh) © 2026