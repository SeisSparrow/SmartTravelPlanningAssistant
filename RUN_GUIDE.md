# 🚀 Smart Travel Planning Assistant - Run Guide

## Quick Start (2 minutes)

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A web browser

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Start the Application
```bash
npm start
```

### 4. Open in Browser
Visit: `http://localhost:3001`

## Detailed Setup Guide

### Step 1: Environment Setup
```bash
# Check Node.js version (should be 16+)
node --version

# Clone or navigate to the project
cd smart-travel-assistant

# Install all dependencies
npm install
```

### Step 2: Build the Application
```bash
# Compile TypeScript to JavaScript
npm run build

# This creates the build/ directory with compiled files
```

### Step 3: Start the Application
```bash
# Start the main application (runs on port 3001 by default)
npm start

# Or specify a different port
PORT=3002 npm start
```

### Step 4: Access the Application
Open your web browser and navigate to:
- **Main Application**: `http://localhost:3001`
- **With custom port**: `http://localhost:YOUR_PORT`

## 🎯 What You'll See

### Main Features:
1. **Trip Planning Form** - Enter destination, dates, budget, preferences
2. **Destination Comparison** - Compare multiple destinations side-by-side
3. **Interactive Results** - Weather, flights, hotels, activities, costs
4. **Real-time Updates** - Dynamic recommendations based on your input

## 🔧 Advanced Configuration

### Environment Variables
Create a `.env` file in the root directory:
```bash
# Optional: Add real API keys for enhanced functionality
OPENWEATHER_API_KEY=your_openweather_api_key
EXCHANGE_API_KEY=your_exchange_api_key
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key

# Optional: Custom port
PORT=3001
```

### Development Mode
```bash
# Run in development mode with hot reload
npm run dev

# Or start individual MCP servers for debugging
node --loader ts-node/esm src/travel-orchestrator.ts
node --loader ts-node/esm src/weather-server.ts
node --loader ts-node/esm src/currency-server.ts
node --loader ts-node/esm src/translation-server.ts
```

## 📋 Usage Instructions

### 1. Plan a Trip
1. Open `http://localhost:3001` in your browser
2. Fill in the trip planning form:
   - Destination (e.g., "Paris", "Tokyo")
   - Travel dates
   - Budget (optional)
   - Number of travelers
   - Preferences (e.g., "sightseeing, adventure")
3. Click "Plan My Trip"
4. View comprehensive recommendations including:
   - Weather forecast
   - Flight options
   - Hotel recommendations
   - Activities and attractions
   - Total cost breakdown

### 2. Compare Destinations
1. Use the destination comparison form
2. Enter multiple destinations (comma-separated)
3. Add comparison criteria (optional)
4. Click "Compare Destinations"
5. View side-by-side analysis with scoring

## 🔍 Testing the System

### Health Check
Visit: `http://localhost:3001/api/health`
This shows the status of all MCP servers.

### API Testing
You can test individual endpoints:
