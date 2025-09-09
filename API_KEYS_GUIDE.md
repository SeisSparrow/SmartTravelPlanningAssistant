# 🔑 API Keys Setup Guide - Smart Travel Planning Assistant

## Overview
This guide will walk you through obtaining API keys for enhanced functionality in your smart travel planning assistant. While the system works with mock data, real API keys will provide live, accurate information.

## 📋 API Keys Needed

1. **OpenWeatherMap API Key** - For real weather data
2. **Exchange Rate API Key** - For live currency conversion
3. **Google Translate API Key** - For translation services

---

## 1. 🌤️ OpenWeatherMap API Key

### Step-by-Step Instructions:

1. **Visit OpenWeatherMap**
   - Go to: https://openweathermap.org/api
   - Click "Sign Up" or "Get API Key"

2. **Create Account**
   - Fill in your email, password, and basic information
   - Verify your email address

3. **Get Your API Key**
   - Log in to your account
   - Go to "API Keys" section in your dashboard
   - Your default API key will be visible there
   - Copy the key (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### Free Tier Details:
- **Price**: FREE (with limitations)
- **Calls**: 1,000 calls/day
- **Data**: Current weather, 5-day forecast, weather maps
- **Signup**: Instant activation

### Test Your Key:
```bash
curl "http://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY"
```

---

## 2. 💱 Exchange Rate API Key

### Option A: ExchangeRate-API (Recommended - Free)

1. **Visit ExchangeRate-API**
   - Go to: https://www.exchangerate-api.com/
   - Click "Sign Up Free"

2. **Create Account**
   - Enter your email and create password
   - Verify your email

3. **Get Your API Key**
   - Log in to your dashboard
   - Your API key will be displayed prominently
   - Copy the key (it looks like: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`)

### Free Tier Details:
- **Price**: FREE
- **Calls**: 1,500 requests/month
- **Data**: Real-time exchange rates for 160+ currencies
- **Update**: Hourly updates

### Test Your Key:
```bash
curl "https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/USD"
```

### Option B: CurrencyFreaks (Alternative)

1. **Visit CurrencyFreaks**
   - Go to: https://currencyfreaks.com/
   - Click "Get Free API Key"

2. **Create Account**
   - Fill in registration form
   - Verify email

3. **Get Your API Key**
   - Access your dashboard
   - Copy your API key

---

## 3. 🌐 Google Translate API Key

### Important Notes:
- **Google Translate API requires a billing account** (even for free tier)
- **Free tier**: First 500,000 characters/month are free
- **Setup is more complex** than other APIs

### Step-by-Step Instructions:

1. **Create Google Cloud Account**
   - Go to: https://cloud.google.com/
   - Click "Get started for free"
   - You'll need to provide billing information (credit card required)

2. **Create a New Project**
   - Go to Google Cloud Console: https://console.cloud.google.com/
   - Click "Select a project" → "New Project"
   - Name your project (e.g., "smart-travel-assistant")
   - Click "Create"

3. **Enable Google Translate API**
   - In your project, go to "APIs & Services" → "Library"
   - Search for "Cloud Translation API"
   - Click on it and press "Enable"

4. **Create API Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Your API key will be generated
   - **Important**: Restrict the key to your domain for security

5. **Set Up Billing (Required)**
   - Go to "Billing" section
   - Add a payment method
   - Set up billing alerts to avoid unexpected charges

### Free Tier Details:
- **Price**: $0 for first 500,000 characters/month
- **After free tier**: $20 per million characters

### Test Your Key:
```bash
# Test with curl
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "q": "Hello world",
    "target": "es"
  }' \
  "https://translation.googleapis.com/language/translate/v2"
```

---

## 🔧 Setting Up API Keys in Your Application

### Step 1: Create Environment File
Create a `.env` file in your project root:
```bash
# Copy the example file
cp .env.example .env

# Or create a new one
touch .env
```

### Step 2: Add Your API Keys
Edit the `.env` file and add your keys:
```env
# OpenWeatherMap API
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Exchange Rate API
EXCHANGE_API_KEY=your_exchange_api_key_here

# Google Translate API
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here

# Optional: Custom port
PORT=3001
```

### Step 3: Update MCP Server Configuration
The MCP servers will automatically read these environment variables. No code changes needed!

### Step 4: Test the Integration
```bash
# Start your application
npm start

# Test weather endpoint
curl -X POST http://localhost:3001/api/get-weather \
  -H "Content-Type: application/json" \
  -d '{"destination": "Paris", "startDate": "2024-01-01", "endDate": "2024-01-07"}'

# Test currency endpoint
curl -X POST http://localhost:3001/api/convert-currency \
  -H "Content-Type: application/json" \
  -d '{"from": "USD", "to": "EUR", "amount": 100}'
```

---

## 🚨 Important Security Notes

### 1. **Never Commit API Keys to Git**
```bash
# Add .env to .gitignore
echo ".env" >> .gitignore

# If you accidentally committed, remove from history
git rm --cached .env
```

### 2. **Use Environment Variables**
```javascript
// Good ✅
const apiKey = process.env.OPENWEATHER_API_KEY;

// Bad ❌
const apiKey = "your_actual_key_here";
```

### 3. **Restrict API Keys**
- **OpenWeatherMap**: Restrict by IP address
- **Google Cloud**: Restrict by HTTP referrer and IP
- **ExchangeRate-API**: Monitor usage regularly

### 4. **Monitor Usage**
Set up billing alerts and monitor your API usage to avoid unexpected charges.

---

## 🔍 Testing Your Setup

### Quick Test Script
Create a `test-apis.js` file:
```javascript
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testAPIs() {
    console.log('Testing API connections...');
    
    // Test OpenWeatherMap
    try {
        const weatherResponse = await axios.get(
            `http://api.openweathermap.org/data/2.5/weather?q=London&appid=${process.env.OPENWEATHER_API_KEY}`
        );
        console.log('✅ OpenWeatherMap: Connected');
    } catch (error) {
        console.log('❌ OpenWeatherMap: Failed', error.message);
    }
    
    // Test Exchange Rate API
    try {
        const currencyResponse = await axios.get(
            `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/USD`
        );
        console.log('✅ Exchange Rate API: Connected');
    } catch (error) {
        console.log('❌ Exchange Rate API: Failed', error.message);
    }
    
    // Test Google Translate (if configured)
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
        try {
            const translateResponse = await axios.post(
                'https://translation.googleapis.com/language/translate/v2',
                {
                    q: 'Hello',
                    target: 'es'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.GOOGLE_TRANSLATE_API_KEY}`
                    }
                }
            );
            console.log('✅ Google Translate: Connected');
        } catch (error) {
            console.log('❌ Google Translate: Failed', error.message);
        }
    } else {
        console.log('ℹ️ Google Translate: Not configured (using mock data)');
    }
}

// Run the test
testAPIs();
```

### Run the Test
```bash
# Save the file and run it
node test-apis.js
```

---

## 🎯 Summary

### **Quick Checklist:**
- [ ] Sign up for OpenWeatherMap (FREE)
- [ ] Sign up for ExchangeRate-API (FREE)  
- [ ] Set up Google Cloud account (requires billing)
- [ ] Create `.env` file with your keys
- [ ] Test all API connections
- [ ] Monitor usage regularly

### **Time Required:**
- **OpenWeatherMap**: 5 minutes
- **ExchangeRate-API**: 5 minutes
- **Google Translate**: 15-20 minutes (due to billing setup)

### **Cost:**
- **OpenWeatherMap**: FREE (1,000 calls/day)
- **ExchangeRate-API**: FREE (1,500 requests/month)
- **Google Translate**: FREE for first 500K characters/month

### **Benefits:**
- ✅ Real-time weather data
- ✅ Live currency exchange rates
- ✅ Professional translation services
- ✅ More accurate travel recommendations
- ✅ Production-ready application

---

## 🚀 Next Steps

1. **Get your API keys** using the instructions above
2. **Set up your `.env` file** with the keys
3. **Restart your application** to use real data
4. **Test the enhanced functionality**
5. **Monitor usage** and optimize as needed

Your smart travel planning assistant is now ready to provide real, accurate travel information!
