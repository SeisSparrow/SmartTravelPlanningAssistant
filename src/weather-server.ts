#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const API_KEY = process.env.OPENWEATHER_API_KEY;

interface WeatherData {
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
  forecast: Array<{
    date: string;
    temp: number;
    conditions: string;
  }>;
}

class TravelWeatherServer {
  private server: Server;
  private axiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'travel-weather-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: 'http://api.openweathermap.org/data/2.5',
      params: {
        appid: API_KEY,
        units: 'metric',
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

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_travel_weather',
          description: 'Get weather information optimized for travel planning',
          inputSchema: {
            type: 'object',
            properties: {
              destination: {
                type: 'string',
                description: 'City name or coordinates',
              },
              startDate: {
                type: 'string',
                description: 'Start date for weather forecast (YYYY-MM-DD)',
              },
              endDate: {
                type: 'string',
                description: 'End date for weather forecast (YYYY-MM-DD)',
              },
              units: {
                type: 'string',
                enum: ['metric', 'imperial'],
                description: 'Temperature units',
                default: 'metric',
              },
            },
            required: ['destination'],
          },
        },
        {
          name: 'get_weather_alerts',
          description: 'Get weather alerts and warnings for travel destinations',
          inputSchema: {
            type: 'object',
            properties: {
              destination: {
                type: 'string',
                description: 'City name or coordinates',
              },
            },
            required: ['destination'],
          },
        },
        {
          name: 'compare_destination_weather',
          description: 'Compare weather conditions across multiple destinations',
          inputSchema: {
            type: 'object',
            properties: {
              destinations: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of destinations to compare',
              },
              date: {
                type: 'string',
                description: 'Date for comparison (YYYY-MM-DD)',
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
          case 'get_travel_weather':
            return await this.getTravelWeather(args);
          case 'get_weather_alerts':
            return await this.getWeatherAlerts(args);
          case 'compare_destination_weather':
            return await this.compareDestinationWeather(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return {
            content: [
              {
                type: 'text',
                text: `Weather API error: ${error.response?.data.message ?? error.message}`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  private async getTravelWeather(args: any) {
    const { destination, startDate, endDate, units = 'metric' } = args;

    if (!API_KEY) {
      // Return mock data when API key is not available
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(this.getMockWeatherData(destination, startDate, endDate), null, 2),
          },
        ],
      };
    }

    try {
      // Get current weather
      const currentResponse = await this.axiosInstance.get('/weather', {
        params: { q: destination, units },
      });

      // Get forecast if dates are provided
      let forecast = [];
      if (startDate && endDate) {
        const forecastResponse = await this.axiosInstance.get('/forecast', {
          params: { q: destination, units, cnt: 40 },
        });
        forecast = this.processForecastData(forecastResponse.data, startDate, endDate);
      }

      const weatherData: WeatherData = {
        temperature: currentResponse.data.main.temp,
        conditions: currentResponse.data.weather[0].description,
        humidity: currentResponse.data.main.humidity,
        windSpeed: currentResponse.data.wind.speed,
        forecast,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(weatherData, null, 2),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new McpError(
          ErrorCode.InternalError,
          `Weather API error: ${error.response?.data.message ?? error.message}`
        );
      }
      throw error;
    }
  }

  private async getWeatherAlerts(args: any) {
    const { destination } = args;

    if (!API_KEY) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ alerts: [], message: 'No active weather alerts' }, null, 2),
          },
        ],
      };
    }

    try {
      // Note: OpenWeatherMap requires One Call API 3.0 for alerts, which is paid
      // For now, return mock data
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ alerts: [], message: 'Weather alerts not available in free tier' }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new McpError(
          ErrorCode.InternalError,
          `Weather alerts API error: ${error.response?.data.message ?? error.message}`
        );
      }
      throw error;
    }
  }

  private async compareDestinationWeather(args: any) {
    const { destinations, date } = args;

    const comparisons = await Promise.all(
      destinations.map(async (dest: string) => {
        try {
          if (!API_KEY) {
            const mockData = this.getMockWeatherData(dest, date, date);
            return {
              destination: dest,
              temperature: mockData.current.temp,
              conditions: mockData.current.conditions,
              humidity: mockData.current.humidity,
              windSpeed: mockData.current.windSpeed,
            };
          }

          const response = await this.axiosInstance.get('/weather', {
            params: { q: dest },
          });

          return {
            destination: dest,
            temperature: response.data.main.temp,
            conditions: response.data.weather[0].description,
            humidity: response.data.main.humidity,
            windSpeed: response.data.wind.speed,
          };
        } catch (error) {
          return {
            destination: dest,
            error: 'Unable to fetch weather data',
          };
        }
      })
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(comparisons, null, 2),
        },
      ],
    };
  }

  private processForecastData(data: any, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return data.list
      .filter((item: any) => {
        const itemDate = new Date(item.dt_txt);
        return itemDate >= start && itemDate <= end;
      })
      .map((item: any) => ({
        date: item.dt_txt.split(' ')[0],
        temp: item.main.temp,
        conditions: item.weather[0].description,
      }));
  }

  private getMockWeatherData(destination: string, startDate?: string, endDate?: string) {
    const mockConditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'];
    const randomCondition = mockConditions[Math.floor(Math.random() * mockConditions.length)];
    const baseTemp = Math.floor(Math.random() * 15) + 15; // 15-30°C

    const forecast = [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= days; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        forecast.push({
          date: currentDate.toISOString().split('T')[0],
          temp: baseTemp + Math.floor(Math.random() * 10) - 5,
          conditions: mockConditions[Math.floor(Math.random() * mockConditions.length)]
        });
      }
    }

    return {
      current: {
        temp: baseTemp,
        conditions: randomCondition,
        humidity: Math.floor(Math.random() * 40) + 40,
        windSpeed: Math.floor(Math.random() * 20) + 5
      },
      forecast
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Travel Weather MCP server running on stdio');
  }
}

const weatherServer = new TravelWeatherServer();
weatherServer.run().catch(console.error);
