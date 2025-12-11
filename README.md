# ARLTR - All Roads Lead To Rome

## About

ARLTR is an interactive mapping application that proves the ancient saying "all roads lead to Rome." Click anywhere on the map to calculate a route from that point to Rome, Italy. The application features a nostalgic Windows Classic interface design.

## Features

- Interactive world map with point-and-click route planning

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- GraphHopper API key ( get it from [here](https://support.graphhopper.com/a/solutions/articles/44001976027) )

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
```bash
cp .env.example .env
```

Edit `.env` and add your GraphHopper API key:
```
GRAPHHOPPER_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
```

4. Start the development server:
```bash
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## NOTES
There is Netlify Configuration, If you would like to host on netlify you can else just delete the configuration.



## License

MIT License - See LICENSE file for details

---

Made by [SySLink](https://github.com/syslink-sh) © 2025