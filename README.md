# 🌍 Smart Travel Planning Assistant

An intelligent travel planning system built using Model Context Protocol (MCP) servers to provide comprehensive travel recommendations, weather forecasts, currency conversions, and translation services.

## Features

### Core Functionality
- **Trip Planning**: Comprehensive travel planning with flights, hotels, activities, and budget optimization
- **Destination Comparison**: Compare multiple destinations based on weather, cost, safety, and activities
- **Weather Integration**: Real-time weather forecasts and alerts for travel destinations
- **Currency Conversion**: Convert budgets and expenses to local currencies with trend analysis
- **Translation Services**: Essential travel phrases and destination information in local languages

### MCP Servers
1. **Travel Orchestrator**: Main coordination server that combines data from all services
2. **Weather Server**: Weather forecasts and alerts using OpenWeatherMap API
3. **Currency Exchange Server**: Real-time currency conversion and trend analysis
4. **Translation Server**: Multi-language support for travel communication

## Architecture

```
Smart Travel Assistant
├── Web Interface (Express.js + HTML/CSS/JS)
├── MCP Servers
│   ├── Travel Orchestrator
│   ├── Weather Server
│   ├── Currency Exchange Server
│   └── Translation Server
└── External APIs
    ├── OpenWeatherMap
    ├── Exchange Rate APIs
    └── Google Translate
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- TypeScript

### Installation

1. Clone the repository:
```bash
git clone git@github.com:SeisSparrow/SmartTravelPlanningAssistant.git
cd smart-travel-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional for enhanced functionality):
```bash
# Create a .env file in the root directory
OPENWEATHER_API_KEY=your_openweather_api_key
EXCHANGE_API_KEY=your_exchange_api_key
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key
```

4. Build the project:
```bash
npm run build
```

5. Start the application:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### Trip Planning
1. Enter your destination and travel dates
2. Specify your budget and number of travelers
3. Add preferences (sightseeing, adventure, relaxation, etc.)
4. Click "Plan My Trip" to get comprehensive recommendations

### Destination Comparison
1. Enter multiple destinations (comma-separated)
2. Add comparison criteria (optional)
3. Click "Compare Destinations" to see side-by-side analysis

## API Endpoints

### Trip Planning
- `POST /api/plan-trip` - Generate comprehensive travel plan
- `POST /api/compare-destinations` - Compare multiple destinations

### Individual Services
- `POST /api/get-weather` - Get weather information
- `POST /api/convert-currency` - Convert currencies
- `POST /api/translate` - Translate text

### Health Check
- `GET /api/health` - Check system status

## MCP Server Configuration

To integrate with MCP-compatible systems, add the following to your MCP settings:

```json
{
  "mcpServers": {
    "travel-orchestrator": {
      "command": "node",
      "args": ["path/to/travel-orchestrator.js"],
      "env": {}
    },
    "weather-server": {
      "command": "node", 
      "args": ["path/to/weather-server.js"],
      "env": {
        "OPENWEATHER_API_KEY": "your-api-key"
      }
    },
    "currency-server": {
      "command": "node",
      "args": ["path/to/currency-server.js"],
      "env": {
        "EXCHANGE_API_KEY": "your-api-key"
      }
    },
    "translation-server": {
      "command": "node",
      "args": ["path/to/translation-server.js"],
      "env": {
        "GOOGLE_TRANSLATE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Development

### Project Structure
```
src/
├── index.ts                 # Main Express server
├── travel-orchestrator.ts   # Main MCP orchestrator
├── weather-server.ts        # Weather MCP server
├── currency-server.ts       # Currency exchange MCP server
├── translation-server.ts    # Translation MCP server
public/
├── index.html              # Main web interface
└── app.js                  # Frontend JavaScript
```

### Running Individual MCP Servers
```bash
# Travel Orchestrator
node --loader ts-node/esm src/travel-orchestrator.ts

# Weather Server
node --loader ts-node/esm src/weather-server.ts

# Currency Server
node --loader ts-node/esm src/currency-server.ts

# Translation Server
node --loader ts
