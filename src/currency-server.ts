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

const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY || 'demo';

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
}

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  country: string;
}

class CurrencyExchangeServer {
  private server: Server;
  private axiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'currency-exchange-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: 'https://api.exchangerate-api.com/v4/latest',
      timeout: 10000,
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
          name: 'convert_currency',
          description: 'Convert between different currencies for travel budgeting',
          inputSchema: {
            type: 'object',
            properties: {
              from: {
                type: 'string',
                description: 'Source currency code (e.g., USD, EUR, GBP)',
              },
              to: {
                type: 'string',
                description: 'Target currency code (e.g., USD, EUR, GBP)',
              },
              amount: {
                type: 'number',
                description: 'Amount to convert',
                default: 1,
              },
            },
            required: ['from', 'to'],
          },
        },
        {
          name: 'get_destination_currency',
          description: 'Get currency information for travel destinations',
          inputSchema: {
            type: 'object',
            properties: {
              destination: {
                type: 'string',
                description: 'Country or city name',
              },
            },
            required: ['destination'],
          },
        },
        {
          name: 'get_travel_budget_conversion',
          description: 'Convert travel budget to local currency',
          inputSchema: {
            type: 'object',
            properties: {
              budget: {
                type: 'number',
                description: 'Budget amount in home currency',
              },
              homeCurrency: {
                type: 'string',
                description: 'Home currency code',
                default: 'USD',
              },
              destinations: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of destination countries/cities',
              },
            },
            required: ['budget', 'destinations'],
          },
        },
        {
          name: 'get_currency_trends',
          description: 'Get currency exchange rate trends for travel planning',
          inputSchema: {
            type: 'object',
            properties: {
              from: {
                type: 'string',
                description: 'Source currency code',
              },
              to: {
                type: 'string',
                description: 'Target currency code',
              },
              days: {
                type: 'number',
                description: 'Number of days for trend analysis',
                default: 30,
                minimum: 7,
                maximum: 365,
              },
            },
            required: ['from', 'to'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'convert_currency':
            return await this.convertCurrency(args);
          case 'get_destination_currency':
            return await this.getDestinationCurrency(args);
          case 'get_travel_budget_conversion':
            return await this.getTravelBudgetConversion(args);
          case 'get_currency_trends':
            return await this.getCurrencyTrends(args);
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
                text: `Currency API error: ${error.response?.data.message ?? error.message}`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  private async convertCurrency(args: any) {
    const { from, to, amount = 1 } = args;

    try {
      const response = await this.axiosInstance.get(`/${from}`);
      const rate = response.data.rates[to];
      
      if (!rate) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Exchange rate not available for ${from} to ${to}`
        );
      }

      const exchangeRate: ExchangeRate = {
        from,
        to,
        rate,
        timestamp: new Date().toISOString(),
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              exchangeRate,
              convertedAmount: amount * rate,
              originalAmount: amount,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new McpError(
          ErrorCode.InternalError,
          `Currency conversion error: ${error.response?.data.message ?? error.message}`
        );
      }
      throw error;
    }
  }

  private async getDestinationCurrency(args: any) {
    const { destination } = args;

    // Mock currency mapping for popular destinations
    const destinationCurrencies: { [key: string]: CurrencyInfo } = {
      'Paris': { code: 'EUR', name: 'Euro', symbol: '€', country: 'France' },
      'London': { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom' },
      'Tokyo': { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan' },
      'New York': { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States' },
      'Sydney': { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'Australia' },
      'Bangkok': { code: 'THB', name: 'Thai Baht', symbol: '฿', country: 'Thailand' },
      'Dubai': { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'UAE' },
      'Singapore': { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', country: 'Singapore' },
    };

    const currencyInfo = destinationCurrencies[destination] || {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      country: 'Unknown',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(currencyInfo, null, 2),
        },
      ],
    };
  }

  private async getTravelBudgetConversion(args: any) {
    const { budget, homeCurrency = 'USD', destinations } = args;

    const conversions = await Promise.all(
      destinations.map(async (dest: string) => {
        try {
          const destCurrency = await this.getDestinationCurrency({ destination: dest });
          const currencyInfo = JSON.parse(destCurrency.content[0].text);
          
          const exchangeRate = await this.convertCurrency({
            from: homeCurrency,
            to: currencyInfo.code,
            amount: budget,
          });

          const rateInfo = JSON.parse(exchangeRate.content[0].text);
          
          return {
            destination: dest,
            localCurrency: currencyInfo,
            budgetInLocalCurrency: rateInfo.convertedAmount,
            exchangeRate: rateInfo.exchangeRate.rate,
          };
        } catch (error) {
          return {
            destination: dest,
            error: 'Unable to convert currency',
          };
        }
      })
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(conversions, null, 2),
        },
      ],
    };
  }

  private async getCurrencyTrends(args: any) {
    const { from, to, days = 30 } = args;

    // Mock trend data since most free APIs don't provide historical data
    const trends = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate some random variation in exchange rates
      const baseRate = 0.85 + (Math.random() * 0.3);
      const variation = (Math.random() - 0.5) * 0.1;
      
      trends.push({
        date: date.toISOString().split('T')[0],
        rate: baseRate + variation,
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            from,
            to,
            days,
            trends,
            averageRate: trends.reduce((sum, item) => sum + item.rate, 0) / trends.length,
            minRate: Math.min(...trends.map(item => item.rate)),
            maxRate: Math.max(...trends.map(item => item.rate)),
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Currency Exchange MCP server running on stdio');
  }
}

const currencyServer = new CurrencyExchangeServer();
currencyServer.run().catch(console.error);
