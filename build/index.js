#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
// Store MCP server processes
const mcpServers = {};
// Start MCP servers
function startMCPServers() {
    const servers = [
        { name: 'travel-orchestrator', path: path.join(__dirname, 'travel-orchestrator.ts') },
        { name: 'weather-server', path: path.join(__dirname, 'weather-server.ts') },
        { name: 'currency-server', path: path.join(__dirname, 'currency-server.ts') },
        { name: 'translation-server', path: path.join(__dirname, 'translation-server.ts') },
    ];
    servers.forEach(server => {
        console.log(`Starting ${server.name}...`);
        const serverProcess = spawn('node', ['--loader', 'ts-node/esm', server.path], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, NODE_OPTIONS: '--loader ts-node/esm' }
        });
        mcpServers[server.name] = serverProcess;
        serverProcess.stdout.on('data', (data) => {
            console.log(`[${server.name}] ${data.toString()}`);
        });
        serverProcess.stderr.on('data', (data) => {
            console.error(`[${server.name}] ERROR: ${data.toString()}`);
        });
        serverProcess.on('close', (code) => {
            console.log(`[${server.name}] Process exited with code ${code}`);
        });
    });
}
// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', servers: Object.keys(mcpServers) });
});
app.post('/api/plan-trip', async (req, res) => {
    try {
        const { destination, startDate, endDate, budget, travelers, preferences } = req.body;
        // Here you would integrate with the MCP servers
        // For now, return a mock response
        const mockResponse = {
            destination,
            weather: {
                current: { temp: 22, conditions: 'Sunny', humidity: 65 },
                forecast: [
                    { date: startDate, temp: 20, conditions: 'Partly Cloudy' },
                    { date: endDate, temp: 25, conditions: 'Clear' }
                ]
            },
            flights: [
                {
                    airline: 'Example Airlines',
                    flightNumber: 'EX123',
                    price: 450 * (travelers || 1),
                    duration: '3h 30m'
                }
            ],
            hotels: [
                {
                    name: 'Grand Hotel Example',
                    rating: 4.5,
                    pricePerNight: 150,
                    totalPrice: 150 * 3, // assuming 3 nights
                    amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant']
                }
            ],
            activities: [
                {
                    name: 'City Walking Tour',
                    type: 'sightseeing',
                    price: 25,
                    duration: '3 hours',
                    rating: 4.8
                }
            ],
            totalCost: 1500,
            currency: 'USD',
            language: 'English',
            safetyRating: 4.5,
        };
        res.json(mockResponse);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to plan trip' });
    }
});
app.post('/api/compare-destinations', async (req, res) => {
    try {
        const { destinations, criteria } = req.body;
        const mockComparisons = destinations.map((dest, index) => ({
            destination: dest,
            weather: { temp: 20 + index * 2, conditions: 'Sunny' },
            averageHotelCost: 100 + index * 25,
            safetyRating: 4 + Math.random(),
            activityScore: 5 + index,
            overallScore: 80 + index * 5,
        }));
        res.json(mockComparisons);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to compare destinations' });
    }
});
app.post('/api/get-weather', async (req, res) => {
    try {
        const { destination, startDate, endDate } = req.body;
        const mockWeather = {
            destination,
            current: { temp: 22, conditions: 'Sunny', humidity: 65 },
            forecast: [
                { date: startDate, temp: 20, conditions: 'Partly Cloudy' },
                { date: endDate, temp: 25, conditions: 'Clear' }
            ]
        };
        res.json(mockWeather);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get weather' });
    }
});
app.post('/api/convert-currency', async (req, res) => {
    try {
        const { from, to, amount } = req.body;
        const mockConversion = {
            from,
            to,
            amount,
            convertedAmount: amount * 0.85, // mock exchange rate
            exchangeRate: 0.85,
            timestamp: new Date().toISOString()
        };
        res.json(mockConversion);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to convert currency' });
    }
});
app.post('/api/translate', async (req, res) => {
    try {
        const { text, targetLanguage, sourceLanguage } = req.body;
        const mockTranslation = {
            originalText: text,
            translatedText: `[${targetLanguage.toUpperCase()}] ${text}`,
            sourceLanguage: sourceLanguage || 'en',
            targetLanguage,
            confidence: 0.95
        };
        res.json(mockTranslation);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to translate text' });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`🌍 Smart Travel Planning Assistant running on http://localhost:${PORT}`);
    console.log('Starting MCP servers...');
    startMCPServers();
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    Object.values(mcpServers).forEach(server => {
        server.kill();
    });
    process.exit(0);
});
//# sourceMappingURL=index.js.map