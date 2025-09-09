#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
class TranslationServer {
    server;
    axiosInstance;
    constructor() {
        this.server = new Server({
            name: 'translation-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.axiosInstance = axios.create({
            baseURL: 'https://translation.googleapis.com/language/translate/v2',
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
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'translate_text',
                    description: 'Translate text for travel communication',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            text: {
                                type: 'string',
                                description: 'Text to translate',
                            },
                            targetLanguage: {
                                type: 'string',
                                description: 'Target language code (e.g., es, fr, de, ja)',
                            },
                            sourceLanguage: {
                                type: 'string',
                                description: 'Source language code (optional, auto-detected if not provided)',
                            },
                        },
                        required: ['text', 'targetLanguage'],
                    },
                },
                {
                    name: 'detect_language',
                    description: 'Detect the language of travel-related text',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            text: {
                                type: 'string',
                                description: 'Text to analyze',
                            },
                        },
                        required: ['text'],
                    },
                },
                {
                    name: 'get_travel_phrases',
                    description: 'Get essential travel phrases in the target language',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            language: {
                                type: 'string',
                                description: 'Target language code',
                            },
                            category: {
                                type: 'string',
                                enum: ['basic', 'emergency', 'food', 'transport', 'accommodation'],
                                description: 'Category of phrases',
                                default: 'basic',
                            },
                        },
                        required: ['language'],
                    },
                },
                {
                    name: 'translate_destination_info',
                    description: 'Translate destination information and guides',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            destination: {
                                type: 'string',
                                description: 'Destination city or country',
                            },
                            targetLanguage: {
                                type: 'string',
                                description: 'Target language for translation',
                            },
                            contentType: {
                                type: 'string',
                                enum: ['guide', 'menu', 'signs', 'emergency', 'customs'],
                                description: 'Type of content to translate',
                                default: 'guide',
                            },
                        },
                        required: ['destination', 'targetLanguage'],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'translate_text':
                        return await this.translateText(args);
                    case 'detect_language':
                        return await this.detectLanguage(args);
                    case 'get_travel_phrases':
                        return await this.getTravelPhrases(args);
                    case 'translate_destination_info':
                        return await this.translateDestinationInfo(args);
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
                                text: `Translation API error: ${error.response?.data.message ?? error.message}`,
                            },
                        ],
                        isError: true,
                    };
                }
                throw error;
            }
        });
    }
    async translateText(args) {
        const { text, targetLanguage, sourceLanguage } = args;
        if (!GOOGLE_TRANSLATE_API_KEY) {
            // Return mock translation when API key is not available
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(this.getMockTranslation(text, targetLanguage, sourceLanguage), null, 2),
                    },
                ],
            };
        }
        try {
            const response = await this.axiosInstance.post('', {
                q: text,
                target: targetLanguage,
                source: sourceLanguage,
                key: GOOGLE_TRANSLATE_API_KEY,
            });
            const translation = {
                originalText: text,
                translatedText: response.data.data.translations[0].translatedText,
                sourceLanguage: response.data.data.translations[0].detectedSourceLanguage || sourceLanguage,
                targetLanguage,
            };
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(translation, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new McpError(ErrorCode.InternalError, `Translation API error: ${error.response?.data.message ?? error.message}`);
            }
            throw error;
        }
    }
    async detectLanguage(args) {
        const { text } = args;
        if (!GOOGLE_TRANSLATE_API_KEY) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ language: 'en', confidence: 0.95, text }, null, 2),
                    },
                ],
            };
        }
        try {
            const response = await this.axiosInstance.post('/detect', {
                q: text,
                key: GOOGLE_TRANSLATE_API_KEY,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(response.data.data, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new McpError(ErrorCode.InternalError, `Language detection API error: ${error.response?.data.message ?? error.message}`);
            }
            throw error;
        }
    }
    async getTravelPhrases(args) {
        const { language, category = 'basic' } = args;
        const phrases = {
            basic: {
                hello: 'Hello',
                thank_you: 'Thank you',
                please: 'Please',
                excuse_me: 'Excuse me',
                sorry: 'Sorry',
                yes: 'Yes',
                no: 'No',
                goodbye: 'Goodbye',
            },
            emergency: {
                help: 'Help',
                emergency: 'Emergency',
                hospital: 'Hospital',
                police: 'Police',
                fire: 'Fire',
                doctor: 'Doctor',
                medicine: 'Medicine',
            },
            food: {
                menu: 'Menu',
                water: 'Water',
                coffee: 'Coffee',
                tea: 'Tea',
                bread: 'Bread',
                vegetarian: 'Vegetarian',
                allergic: 'Allergic',
                bill: 'Bill',
            },
            transport: {
                taxi: 'Taxi',
                bus: 'Bus',
                train: 'Train',
                airport: 'Airport',
                station: 'Station',
                ticket: 'Ticket',
                left: 'Left',
                right: 'Right',
            },
            accommodation: {
                hotel: 'Hotel',
                room: 'Room',
                bathroom: 'Bathroom',
                key: 'Key',
                reservation: 'Reservation',
                check_in: 'Check in',
                check_out: 'Check out',
            },
        };
        const categoryPhrases = phrases[category] || phrases.basic;
        // Mock translation for demonstration
        const translatedPhrases = {};
        Object.entries(categoryPhrases).forEach(([key, value]) => {
            translatedPhrases[key] = this.mockTranslate(value, language);
        });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        language,
                        category,
                        phrases: translatedPhrases,
                    }, null, 2),
                },
            ],
        };
    }
    async translateDestinationInfo(args) {
        const { destination, targetLanguage, contentType = 'guide' } = args;
        const contentTemplates = {
            guide: `Welcome to ${destination}. This beautiful destination offers amazing experiences for travelers.`,
            menu: `Local cuisine in ${destination} features traditional dishes and fresh ingredients.`,
            signs: `Important signs and directions in ${destination} for tourists.`,
            emergency: `Emergency contacts and procedures in ${destination}.`,
            customs: `Local customs and etiquette guidelines for ${destination}.`,
        };
        const template = contentTemplates[contentType] || contentTemplates.guide;
        const translatedContent = this.mockTranslate(template, targetLanguage);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        destination,
                        targetLanguage,
                        contentType,
                        originalText: template,
                        translatedText: translatedContent,
                    }, null, 2),
                },
            ],
        };
    }
    getMockTranslation(text, targetLanguage, sourceLanguage) {
        const mockTranslations = {
            'es': {
                'Hello': 'Hola',
                'Thank you': 'Gracias',
                'Please': 'Por favor',
                'Excuse me': 'Disculpe',
                'Sorry': 'Lo siento',
                'Yes': 'Sí',
                'No': 'No',
                'Goodbye': 'Adiós',
            },
            'fr': {
                'Hello': 'Bonjour',
                'Thank you': 'Merci',
                'Please': 'S\'il vous plaît',
                'Excuse me': 'Excusez-moi',
                'Sorry': 'Désolé',
                'Yes': 'Oui',
                'No': 'Non',
                'Goodbye': 'Au revoir',
            },
            'de': {
                'Hello': 'Hallo',
                'Thank you': 'Danke',
                'Please': 'Bitte',
                'Excuse me': 'Entschuldigung',
                'Sorry': 'Es tut mir leid',
                'Yes': 'Ja',
                'No': 'Nein',
                'Goodbye': 'Auf Wiedersehen',
            },
            'ja': {
                'Hello': 'こんにちは',
                'Thank you': 'ありがとう',
                'Please': 'お願いします',
                'Excuse me': 'すみません',
                'Sorry': 'ごめんなさい',
                'Yes': 'はい',
                'No': 'いいえ',
                'Goodbye': 'さようなら',
            },
        };
        const translation = mockTranslations[targetLanguage]?.[text] || `[${targetLanguage.toUpperCase()}] ${text}`;
        return {
            originalText: text,
            translatedText: translation,
            sourceLanguage: sourceLanguage || 'en',
            targetLanguage,
            confidence: 0.95,
        };
    }
    mockTranslate(text, targetLanguage) {
        const translation = this.getMockTranslation(text, targetLanguage);
        return translation.translatedText;
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Translation MCP server running on stdio');
    }
}
const translationServer = new TranslationServer();
translationServer.run().catch(console.error);
//# sourceMappingURL=translation-server.js.map