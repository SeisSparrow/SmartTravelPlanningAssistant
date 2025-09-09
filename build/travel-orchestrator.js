#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
class SmartTravelOrchestrator {
    server;
    constructor() {
        this.server = new Server({
            name: 'smart-travel-orchestrator',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        // Error handling
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'plan_trip',
                    description: 'Create a comprehensive travel plan with recommendations',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            destination: {
                                type: 'string',
                                description: 'Destination city or country',
                            },
                            origin: {
                                type: 'string',
                                description: 'Origin city (optional)',
                            },
                            startDate: {
                                type: 'string',
                                description: 'Start date (YYYY-MM-DD)',
                            },
                            endDate: {
                                type: 'string',
                                description: 'End date (YYYY-MM-DD)',
                            },
                            budget: {
                                type: 'number',
                                description: 'Total budget in USD',
                            },
                            travelers: {
                                type: 'number',
                                description: 'Number of travelers',
                                default: 1,
                            },
                            preferences: {
                                type: 'object',
                                properties: {
                                    weatherPreference: {
                                        type: 'string',
                                        description: 'Preferred weather (sunny, mild, cold, etc.)',
                                    },
                                    activityTypes: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        description: 'Preferred activities (sightseeing, adventure, relaxation, etc.)',
                                    },
                                    accommodationType: {
                                        type: 'string',
                                        description: 'Preferred accommodation (hotel, hostel, airbnb, etc.)',
                                    },
                                    transportationPreference: {
                                        type: 'string',
                                        description: 'Preferred transportation (flight, train, car, etc.)',
                                    },
                                },
                            },
                        },
                        required: ['destination', 'startDate', 'endDate'],
                    },
                },
                {
                    name: 'get_travel_insights',
                    description: 'Get travel insights and recommendations for a destination',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            destination: {
                                type: 'string',
                                description: 'Destination city or country',
                            },
                            travelDate: {
                                type: 'string',
                                description: 'Planned travel date (YYYY-MM-DD)',
                            },
                        },
                        required: ['destination'],
                    },
                },
                {
                    name: 'compare_destinations',
                    description: 'Compare multiple destinations for travel planning',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            destinations: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'List of destinations to compare',
                            },
                            criteria: {
                                type: 'object',
                                properties: {
                                    budget: {
                                        type: 'number',
                                        description: 'Budget constraint',
                                    },
                                    weather: {
                                        type: 'string',
                                        description: 'Weather preference',
                                    },
                                    activities: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        description: 'Desired activities',
                                    },
                                },
                            },
                        },
                        required: ['destinations'],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'plan_trip':
                        return await this.planTrip(args);
                    case 'get_travel_insights':
                        return await this.getTravelInsights(args);
                    case 'compare_destinations':
                        return await this.compareDestinations(args);
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                if (axios.isAxiosError(error)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Travel API error: ${error.response?.data.message ?? error.message}`,
                            },
                        ],
                        isError: true,
                    };
                }
                throw error;
            }
        });
    }
    async planTrip(args) {
        const { destination, origin, startDate, endDate, budget, travelers = 1, preferences = {} } = args;
        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            throw new McpError(ErrorCode.InvalidParams, 'End date must be after start date');
        }
        // Simulate comprehensive travel planning
        const weather = await this.getWeatherForecast(destination, startDate, endDate);
        const flights = await this.searchFlights(origin, destination, startDate, endDate, travelers);
        const hotels = await this.searchHotels(destination, startDate, endDate, travelers, preferences.accommodationType);
        const activities = await this.getActivities(destination, preferences.activityTypes);
        const currency = await this.getCurrencyInfo(destination);
        const language = await this.getLanguageInfo(destination);
        const safetyRating = await this.getSafetyRating(destination);
        const totalCost = this.calculateTotalCost(flights, hotels, activities, travelers);
        const recommendation = {
            destination,
            weather,
            flights,
            hotels,
            activities,
            totalCost,
            currency,
            language,
            safetyRating,
        };
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(recommendation, null, 2),
                },
            ],
        };
    }
    async getTravelInsights(args) {
        const { destination, travelDate } = args;
        const insights = {
            destination,
            bestTimeToVisit: await this.getBestTimeToVisit(destination),
            weatherOutlook: await this.getWeatherForecast(destination, travelDate),
            localEvents: await this.getLocalEvents(destination, travelDate),
            culturalTips: await this.getCulturalTips(destination),
            visaRequirements: await this.getVisaRequirements(destination),
            vaccinationRequirements: await this.getVaccinationRequirements(destination),
        };
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(insights, null, 2),
                },
            ],
        };
    }
    async compareDestinations(args) {
        const { destinations, criteria = {} } = args;
        const comparisons = await Promise.all(destinations.map(async (dest) => {
            const weather = await this.getWeatherForecast(dest);
            const avgHotelCost = await this.getAverageHotelCost(dest);
            const safety = await this.getSafetyRating(dest);
            const activities = await this.getActivities(dest, criteria.activities);
            return {
                destination: dest,
                weather: weather.current,
                averageHotelCost: avgHotelCost,
                safetyRating: safety,
                activityScore: activities.length,
                overallScore: this.calculateOverallScore(weather, avgHotelCost, safety, activities, criteria),
            };
        }));
        // Sort by overall score
        comparisons.sort((a, b) => b.overallScore - a.overallScore);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(comparisons, null, 2),
                },
            ],
        };
    }
    // Mock implementations of helper methods
    async getWeatherForecast(destination, startDate, endDate) {
        // This would integrate with weather MCP server
        return {
            current: { temp: 22, conditions: 'Sunny', humidity: 65 },
            forecast: [
                { date: startDate || '2024-01-01', temp: 20, conditions: 'Partly Cloudy' },
                { date: endDate || '2024-01-07', temp: 25, conditions: 'Clear' }
            ]
        };
    }
    async searchFlights(origin, destination, startDate, endDate, travelers) {
        // This would integrate with flight search MCP server
        return [
            {
                airline: 'Example Airlines',
                flightNumber: 'EX123',
                departure: startDate,
                arrival: startDate,
                price: 450 * travelers,
                duration: '3h 30m'
            },
            {
                airline: 'Sample Airways',
                flightNumber: 'SA456',
                departure: endDate,
                arrival: endDate,
                price: 420 * travelers,
                duration: '3h 15m'
            }
        ];
    }
    async searchHotels(destination, startDate, endDate, travelers, accommodationType) {
        // This would integrate with hotel booking MCP server
        const nights = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
        return [
            {
                name: 'Grand Hotel Example',
                type: accommodationType || 'hotel',
                rating: 4.5,
                pricePerNight: 150,
                totalPrice: 150 * nights,
                amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant']
            },
            {
                name: 'Cozy Boutique Stay',
                type: accommodationType || 'hotel',
                rating: 4.2,
                pricePerNight: 120,
                totalPrice: 120 * nights,
                amenities: ['WiFi', 'Breakfast', 'Spa']
            }
        ];
    }
    async getActivities(destination, activityTypes) {
        // This would integrate with local activities MCP server
        return [
            {
                name: 'City Walking Tour',
                type: 'sightseeing',
                price: 25,
                duration: '3 hours',
                rating: 4.8
            },
            {
                name: 'Local Food Experience',
                type: 'culinary',
                price: 60,
                duration: '2 hours',
                rating: 4.9
            },
            {
                name: 'Adventure Park',
                type: 'adventure',
                price: 45,
                duration: '4 hours',
                rating: 4.6
            }
        ].filter(activity => !activityTypes || activityTypes.length === 0 || activityTypes.includes(activity.type));
    }
    async getCurrencyInfo(destination) {
        // This would integrate with currency MCP server
        const currencyMap = {
            'Paris': 'EUR',
            'London': 'GBP',
            'Tokyo': 'JPY',
            'New York': 'USD',
            'Sydney': 'AUD'
        };
        return currencyMap[destination] || 'USD';
    }
    async getLanguageInfo(destination) {
        // This would integrate with language/translation MCP server
        const languageMap = {
            'Paris': 'French',
            'London': 'English',
            'Tokyo': 'Japanese',
            'New York': 'English',
            'Sydney': 'English'
        };
        return languageMap[destination] || 'Local Language';
    }
    async getSafetyRating(destination) {
        // This would integrate with safety/travel advisory MCP server
        return Math.floor(Math.random() * 2) + 4; // Random rating between 4-5
    }
    calculateTotalCost(flights, hotels, activities, travelers) {
        const flightCost = flights.reduce((sum, flight) => sum + flight.price, 0);
        const hotelCost = hotels.reduce((sum, hotel) => sum + hotel.totalPrice, 0);
        const activityCost = activities.reduce((sum, activity) => sum + activity.price, 0) * travelers;
        return flightCost + hotelCost + activityCost;
    }
    async getBestTimeToVisit(destination) {
        // Mock implementation
        return 'Spring (March-May) and Fall (September-November)';
    }
    async getLocalEvents(destination, travelDate) {
        // Mock implementation
        return [
            { name: 'Local Festival', date: travelDate, description: 'Traditional cultural festival' },
            { name: 'Food Market', date: travelDate, description: 'Weekly local food market' }
        ];
    }
    async getCulturalTips(destination) {
        // Mock implementation
        return {
            greeting: 'Learn basic local greetings',
            tipping: 'Check local tipping customs',
            dressCode: 'Respect local dress codes for religious sites'
        };
    }
    async getVisaRequirements(destination) {
        // Mock implementation
        return 'Check with local embassy for visa requirements';
    }
    async getVaccinationRequirements(destination) {
        // Mock implementation
        return 'Consult travel clinic for recommended vaccinations';
    }
    async getAverageHotelCost(destination) {
        // Mock implementation
        return Math.floor(Math.random() * 100) + 100; // Random cost between 100-200
    }
    calculateOverallScore(weather, hotelCost, safety, activities, criteria) {
        let score = 0;
        // Weather score (0-30 points)
        if (criteria.weather && weather.current.conditions.toLowerCase().includes(criteria.weather.toLowerCase())) {
            score += 30;
        }
        else {
            score += 20; // Default weather score
        }
        // Cost score (0-25 points) - lower cost is better
        const costScore = Math.max(0, 25 - (hotelCost / 10));
        score += costScore;
        // Safety score (0-25 points)
        score += (safety / 5) * 25;
        // Activities score (0-20 points)
        score += Math.min(activities.length * 5, 20);
        return Math.round(score);
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Smart Travel Orchestrator MCP server running on stdio');
    }
}
const orchestrator = new SmartTravelOrchestrator();
orchestrator.run().catch(console.error);
//# sourceMappingURL=travel-orchestrator.js.map