# API Configuration Guide

This guide explains how to configure and manage external API services in the Weekly Calorie Tracker app, including Perplexity Sonar API for AI-powered nutrition calculations and Garmin Connect API for fitness data integration.

## 📁 File Structure

```
src/config/
├── apiConfig.ts          # Main API configuration file
├── README_apiConfig.md   # This documentation
```

## 🔧 Configuration Overview

The API configuration system provides:

- **Centralized API Management**: All API endpoints and settings in one place
- **Secure Key Management**: Environment variable support with fallbacks
- **Service Validation**: Built-in validation for API configurations
- **Development/Production Modes**: Different settings for each environment
- **Error Handling**: Comprehensive error handling and retry logic
- **Fallback Support**: Graceful degradation when APIs are unavailable

## 🚀 Quick Setup

### 1. Perplexity API Configuration

#### Get Your API Key
1. Sign up at [Perplexity](https://www.perplexity.ai/)
2. Navigate to your dashboard and get your API key
3. Keep your API key secure - never commit it to version control

#### Configure the Service
**Option A: Direct Configuration (Quick Start)**
```typescript
// In src/config/apiConfig.ts
export const PERPLEXITY_CONFIG = {
  API_KEY: 'your-perplexity-api-key-here', // Replace with your actual key
  // ... rest of config
};
```

**Option B: Environment Variables (Recommended)**
```bash
# Create .env file in project root
PERPLEXITY_API_KEY=your-perplexity-api-key-here
```

Then update the `getEnvVar` function in `apiConfig.ts` to read from environment variables.

### 2. Garmin Connect API Configuration (Optional)

#### OAuth Setup
1. Register your app at [Garmin Connect IQ](https://developer.garmin.com/)
2. Get your Client ID and Client Secret
3. Configure redirect URI for your app

#### Configure the Service
```typescript
// In src/config/apiConfig.ts
export const GARMIN_CONFIG = {
  CLIENT_ID: 'your-garmin-client-id',
  CLIENT_SECRET: 'your-garmin-client-secret',
  REDIRECT_URI: 'weekly-calorie-tracker://garmin-auth',
  // ... rest of config
};
```

## 📊 Configuration Options

### Perplexity API Settings

```typescript
PERPLEXITY_CONFIG = {
  // API Authentication
  API_KEY: 'your-api-key',
  
  // Model Selection
  DEFAULT_MODEL: 'llama-3.1-sonar-large-128k-online', // Standard model
  // Available models:
  // - 'llama-3.1-sonar-huge-128k-online'  // Premium (best results)
  // - 'llama-3.1-sonar-large-128k-online' // Standard (balanced)
  // - 'llama-3.1-sonar-small-128k-online' // Fast (cost-effective)
  
  // Request Configuration
  REQUEST_DEFAULTS: {
    max_tokens: 4000,        // Maximum response length
    temperature: 0.2,        // Lower = more consistent
    search_recency_filter: 'year', // Focus on recent research
    search_domain_filter: [
      'pubmed.ncbi.nlm.nih.gov',    // Medical research
      'scholar.google.com',          // Academic papers
      'mysportscience.com'           // Sports science
    ]
  }
}
```

### Garmin Connect Settings

```typescript
GARMIN_CONFIG = {
  // OAuth Configuration
  CLIENT_ID: 'your-client-id',
  CLIENT_SECRET: 'your-client-secret',
  REDIRECT_URI: 'your-app://garmin-auth',
  
  // Data Permissions
  SCOPES: [
    'read:activities',  // Workout data
    'read:wellness',    // Health metrics
    'read:profile',     // User profile
    'read:training'     // Training plans
  ],
  
  // Sync Settings
  SYNC_SETTINGS: {
    auto_sync_enabled: true,
    sync_interval_hours: 6,
    max_activities_per_sync: 50
  }
}
```

## 🛠️ Usage Examples

### Basic Service Configuration Check

```typescript
import { checkAPIConfiguration } from '../examples/PerplexityServiceExample';

// Check if all APIs are properly configured
const configStatus = checkAPIConfiguration();

if (configStatus.isValid) {
  console.log('✅ All APIs configured correctly');
} else {
  console.log('❌ Configuration issues:', configStatus.errors);
}

// Check individual services
if (configStatus.services.perplexity) {
  console.log('🤖 Perplexity AI ready for nutrition calculations');
}

if (configStatus.services.garmin) {
  console.log('⌚ Garmin Connect ready for fitness data');
}
```

### Initialize Services with Custom Configuration

```typescript
import { PerplexityService } from '../services/PerplexityService';
import { createAPIConfig } from '../config/apiConfig';

// Method 1: Use configured service
import { perplexityService } from '../services/PerplexityService';

// Method 2: Create custom instance with different API key
const customService = new PerplexityService('custom-api-key');

// Method 3: Get API configuration for custom implementation
const apiConfig = createAPIConfig('perplexity');
console.log('API Config:', apiConfig);
```

### Environment-Based Configuration

```typescript
import { getCurrentEnvironment, API_CONFIG } from '../config/apiConfig';

const env = getCurrentEnvironment();

if (env === 'development') {
  // Use development settings
  console.log('🔧 Development mode - using fallback calculations');
  
} else if (env === 'production') {
  // Use production settings
  console.log('🚀 Production mode - full API integration');
}

// Access environment-specific settings
const isDevelopment = env === 'development';
const useMockData = API_CONFIG.development.USE_MOCK_DATA;
```

## 🔒 Security Best Practices

### 1. API Key Management

**✅ DO:**
- Store API keys in environment variables
- Use different keys for development/production
- Rotate keys regularly
- Monitor API usage and costs

**❌ DON'T:**
- Commit API keys to version control
- Share keys in code comments
- Use production keys in development
- Hard-code keys in source files

### 2. Environment Variables Setup

For React Native with environment variables:

```bash
# Install react-native-config
npm install react-native-config

# Create .env file
PERPLEXITY_API_KEY=your-key-here
GARMIN_CLIENT_ID=your-client-id
GARMIN_CLIENT_SECRET=your-client-secret
NODE_ENV=development
```

Update `apiConfig.ts`:
```typescript
import Config from 'react-native-config';

const getEnvVar = (key: string, fallback: string = ''): string => {
  return Config[key] || fallback;
};
```

### 3. Production Configuration

```typescript
// Update production settings in apiConfig.ts
export const PRODUCTION_CONFIG = {
  ENFORCE_HTTPS: true,
  VALIDATE_SSL_CERTIFICATES: true,
  PERFORMANCE_MONITORING: true,
  ERROR_REPORTING: true
};
```

## 🔧 Error Handling & Debugging

### Configuration Validation

```typescript
import { validateAPIConfig, isServiceConfigured } from '../config/apiConfig';

// Validate complete configuration
const validation = validateAPIConfig();
console.log('Config validation:', validation);

// Check specific services
const perplexityReady = isServiceConfigured('perplexity');
const garminReady = isServiceConfigured('garmin');
```

### Debug Mode

Enable debug logging by updating configuration:

```typescript
export const DEVELOPMENT_CONFIG = {
  DEBUG_API_CALLS: true,
  LOG_REQUEST_DETAILS: true,
  LOG_RESPONSE_DETAILS: true
};
```

### Common Issues & Solutions

**Issue: "API key not found"**
```typescript
// Solution: Check if API key is properly set
import { getAPIKey, isServiceConfigured } from '../config/apiConfig';

const apiKey = getAPIKey('perplexity');
const isConfigured = isServiceConfigured('perplexity');

console.log('API Key present:', !!apiKey);
console.log('Service configured:', isConfigured);
```

**Issue: "Connection timeout"**
```typescript
// Solution: Adjust timeout settings
export const PERPLEXITY_CONFIG = {
  TIMEOUTS: {
    connect_timeout: 15000, // Increase if needed
    read_timeout: 45000,
    total_timeout: 60000
  }
};
```

**Issue: "Rate limit exceeded"**
```typescript
// Solution: Check rate limits and implement backoff
export const PERPLEXITY_CONFIG = {
  RATE_LIMITS: {
    requests_per_minute: 20,  // Adjust based on your plan
    requests_per_hour: 1000
  }
};
```

## 📈 Monitoring & Analytics

### Usage Tracking

```typescript
// Monitor API usage
import { API_CONFIG } from '../config/apiConfig';

if (API_CONFIG.production.PERFORMANCE_MONITORING) {
  // Track API response times
  // Monitor error rates
  // Log usage patterns
}
```

### Cost Management

```typescript
// Estimate API costs
const estimatePerplexityCost = (requestsPerMonth: number) => {
  const costPerRequest = 0.002; // Example cost
  return requestsPerMonth * costPerRequest;
};

console.log('Monthly cost estimate:', estimatePerplexityCost(1000));
```

## 🚀 Advanced Configuration

### Custom Models and Parameters

```typescript
// Custom Perplexity model for specific use cases
export const PERPLEXITY_CUSTOM_CONFIG = {
  SPORTS_NUTRITION_MODEL: {
    model: 'llama-3.1-sonar-huge-128k-online',
    temperature: 0.1, // Very consistent for nutrition advice
    search_domain_filter: ['pubmed.ncbi.nlm.nih.gov'],
    max_tokens: 6000
  },
  
  GENERAL_FITNESS_MODEL: {
    model: 'llama-3.1-sonar-large-128k-online',
    temperature: 0.3, // More creative for general advice
    search_domain_filter: ['mysportscience.com', 'scholar.google.com'],
    max_tokens: 3000
  }
};
```

### Multi-Region Support

```typescript
// Configure different endpoints for different regions
export const REGIONAL_CONFIG = {
  US: { endpoint: 'https://api-us.perplexity.ai' },
  EU: { endpoint: 'https://api-eu.perplexity.ai' },
  ASIA: { endpoint: 'https://api-asia.perplexity.ai' }
};
```

---

## 📚 Additional Resources

- [Perplexity API Documentation](https://docs.perplexity.ai/)
- [Garmin Connect IQ Developer Guide](https://developer.garmin.com/connect-iq/overview/)
- [React Native Config Setup](https://github.com/luggit/react-native-config)
- [API Security Best Practices](https://owasp.org/www-project-api-security/)

## 🤝 Contributing

When adding new API integrations:

1. Add endpoint configuration to `API_ENDPOINTS`
2. Create service-specific configuration object
3. Add validation in `validateAPIConfig()`
4. Update `isServiceConfigured()` function
5. Add examples and documentation

---

**Note**: Always test API configurations in development before deploying to production. Keep API keys secure and monitor usage to avoid unexpected costs.
