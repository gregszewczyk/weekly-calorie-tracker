/**
 * API Configuration
 * 
 * Centralized configuration for all external API services including
 * Perplexity Sonar API, Garmin Connect API, and other integrations.
 * 
 * This file manages endpoints, API keys, and configuration settings
 * with secure environment variable handling and fallback values.
 */

// Temporary direct API key (move to @env once Metro restarts properly)
const PERPLEXITY_API_KEY = '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';
const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai';

// Environment variable helper for React Native
const getEnvVar = (key: string, fallback: string = ''): string => {
  switch (key) {
    case 'PERPLEXITY_API_KEY':
      return PERPLEXITY_API_KEY || fallback;
    case 'PERPLEXITY_BASE_URL':
      return PERPLEXITY_BASE_URL || fallback;
    default:
      return fallback;
  }
};

// API Base URLs and Endpoints
export const API_ENDPOINTS = {
  PERPLEXITY: {
    BASE_URL: 'https://api.perplexity.ai',
    CHAT_COMPLETIONS: '/chat/completions',
    get FULL_URL() {
      return `${this.BASE_URL}${this.CHAT_COMPLETIONS}`;
    }
  },
  GARMIN: {
    BASE_URL: 'https://connect.garmin.com',
    API_BASE: 'https://connectapi.garmin.com',
    VERSION: 'v1',
    OAUTH_URL: 'https://connect.garmin.com/oauthConfirm',
    ENDPOINTS: {
      USER_PROFILE: '/userprofile-service/userprofile',
      ACTIVITIES: '/activitylist-service/activities/search/activities',
      DAILY_SUMMARY: '/usersummary-service/usersummary/daily',
      WELLNESS: '/wellness-service/wellness',
      HEART_RATE: '/wellness-service/wellness/dailyHeartRate',
      SLEEP: '/wellness-service/wellness/dailySleep',
      BODY_COMPOSITION: '/weight-service/weight/dateRange',
      TRAINING_STATUS: '/metrics-service/metrics/trainingStatus'
    }
  },
  // Future API integrations
  STRAVA: {
    BASE_URL: 'https://www.strava.com/api',
    VERSION: 'v3',
    OAUTH_URL: 'https://www.strava.com/oauth/authorize'
  },
  MYFITNESSPAL: {
    BASE_URL: 'https://api.myfitnesspal.com',
    VERSION: 'v2'
  }
} as const;

// Perplexity API Configuration
export const PERPLEXITY_CONFIG = {
  // API Authentication
  API_KEY: getEnvVar('PERPLEXITY_API_KEY', ''), // Set your API key here or via env vars
  
  // Model Configuration
  MODELS: {
    SONAR_REASONING: 'sonar-reasoning', // Best reasoning for complex analysis  
    SONAR_PRO: 'sonar-pro', // Enhanced capabilities
    SONAR: 'sonar' // Standard model
  },
  
  // Default model selection - using sonar for structured output without thinking process
  DEFAULT_MODEL: 'sonar',
  
  // Request Configuration
  REQUEST_DEFAULTS: {
    max_tokens: 4000, // Reduced further - structured output only
    temperature: 0, // Deterministic output for consistent parsing
    top_p: 0.9,
    top_k: 0,
    stream: false,
    presence_penalty: 0,
    frequency_penalty: 1,
    return_citations: true,
    search_recency_filter: 'year' as const,
    search_mode: 'academic' as const, // Focus on academic content
    // , // Focus on recent research
    // search_domain_filter: [
    //   'pubmed.ncbi.nlm.nih.gov',
    //   'scholar.google.com',
    //   'mysportscience.com',
    //   'journals.humankinetics.com',
    //   'link.springer.com'
    // ]
  },
  
  // Rate Limiting
  RATE_LIMITS: {
    requests_per_minute: 20,
    requests_per_hour: 1000,
    tokens_per_minute: 100000
  },
  
  // Timeout Configuration
  TIMEOUTS: {
    connect_timeout: 15000, // 15 seconds
    read_timeout: 60000,    // 60 seconds
    total_timeout: 90000    // 90 seconds total - increased for complex AI analysis
  }
} as const;

// Garmin Connect API Configuration
export const GARMIN_CONFIG = {
  // OAuth Configuration
  CLIENT_ID: getEnvVar('GARMIN_CLIENT_ID', ''),
  CLIENT_SECRET: getEnvVar('GARMIN_CLIENT_SECRET', ''),
  
  // Redirect URI for OAuth flow
  REDIRECT_URI: getEnvVar('GARMIN_REDIRECT_URI', 'weekly-calorie-tracker://garmin-auth'),
  
  // OAuth Scopes
  SCOPES: [
    'read:activities',
    'read:wellness',
    'read:profile',
    'read:training'
  ],
  
  // API Configuration
  REQUEST_DEFAULTS: {
    timeout: 15000,
    retries: 3,
    retry_delay: 1000
  },
  
  // Data Sync Configuration
  SYNC_SETTINGS: {
    auto_sync_enabled: true,
    sync_interval_hours: 6,
    max_activities_per_sync: 50,
    historical_data_days: 30
  },
  
  // Webhook Configuration (for real-time updates)
  WEBHOOK: {
    enabled: false, // Enable when webhook endpoint is ready
    endpoint: getEnvVar('GARMIN_WEBHOOK_ENDPOINT', ''),
    verification_token: getEnvVar('GARMIN_WEBHOOK_TOKEN', '')
  }
} as const;

// Error Handling Configuration
export const ERROR_CONFIG = {
  // Retry Configuration
  RETRY_SETTINGS: {
    max_retries: 3,
    initial_delay: 1000,
    max_delay: 10000,
    backoff_multiplier: 2,
    retry_on_status_codes: [429, 500, 502, 503, 504]
  },
  
  // Timeout Settings
  DEFAULT_TIMEOUTS: {
    connection: 10000,
    request: 30000,
    total: 45000
  },
  
  // Fallback Behavior
  FALLBACK_ENABLED: true,
  CACHE_FALLBACK_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  
  // Error Logging
  LOGGING: {
    enabled: true,
    log_api_errors: true,
    log_rate_limits: true,
    log_timeouts: true,
    sensitive_data_mask: true
  }
} as const;

// Development Configuration
export const DEVELOPMENT_CONFIG = {
  // Mock Data Settings
  USE_MOCK_DATA: getEnvVar('USE_MOCK_API', 'false') === 'true',
  MOCK_RESPONSE_DELAY: 1000, // Simulate network delay
  
  // Debug Settings
  DEBUG_API_CALLS: getEnvVar('DEBUG_API', 'false') === 'true',
  LOG_REQUEST_DETAILS: getEnvVar('LOG_REQUESTS', 'false') === 'true',
  LOG_RESPONSE_DETAILS: getEnvVar('LOG_RESPONSES', 'false') === 'true',
  
  // Development API Keys (never commit real keys)
  DEV_API_KEYS: {
    perplexity: 'dev-key-placeholder',
    garmin: 'dev-garmin-placeholder'
  }
} as const;

// Production Configuration
export const PRODUCTION_CONFIG = {
  // Security Settings
  ENFORCE_HTTPS: true,
  VALIDATE_SSL_CERTIFICATES: true,
  
  // Performance Settings
  CONNECTION_POOLING: true,
  COMPRESSION_ENABLED: true,
  
  // Monitoring
  PERFORMANCE_MONITORING: true,
  ERROR_REPORTING: true,
  ANALYTICS_ENABLED: true
} as const;

// API Client Configuration Factory
export const createAPIConfig = (service: 'perplexity' | 'garmin') => {
  const baseConfig = {
    timeout: ERROR_CONFIG.DEFAULT_TIMEOUTS.total,
    retries: ERROR_CONFIG.RETRY_SETTINGS.max_retries,
    retryDelay: ERROR_CONFIG.RETRY_SETTINGS.initial_delay,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'WeeklyCalorieTracker/1.0'
    }
  };

  switch (service) {
    case 'perplexity':
      return {
        ...baseConfig,
        baseURL: PERPLEXITY_CONFIG.DEFAULT_MODEL ? API_ENDPOINTS.PERPLEXITY.FULL_URL : '',
        headers: {
          ...baseConfig.headers,
          'Authorization': `Bearer ${PERPLEXITY_CONFIG.API_KEY}`,
        },
        timeout: PERPLEXITY_CONFIG.TIMEOUTS.total_timeout,
        model: PERPLEXITY_CONFIG.DEFAULT_MODEL,
        requestDefaults: PERPLEXITY_CONFIG.REQUEST_DEFAULTS
      };
    
    case 'garmin':
      return {
        ...baseConfig,
        baseURL: API_ENDPOINTS.GARMIN.API_BASE,
        timeout: GARMIN_CONFIG.REQUEST_DEFAULTS.timeout,
        retries: GARMIN_CONFIG.REQUEST_DEFAULTS.retries,
        retryDelay: GARMIN_CONFIG.REQUEST_DEFAULTS.retry_delay,
        scopes: GARMIN_CONFIG.SCOPES,
        redirectUri: GARMIN_CONFIG.REDIRECT_URI
      };
    
    default:
      return baseConfig;
  }
};

// Configuration Validation
export const validateAPIConfig = () => {
  const errors: string[] = [];
  
  // Validate Perplexity Configuration
  if (!PERPLEXITY_CONFIG.API_KEY && !DEVELOPMENT_CONFIG.USE_MOCK_DATA) {
    errors.push('Perplexity API key is required for production use');
  }
  
  // Validate Garmin Configuration (if OAuth is being used)
  if (GARMIN_CONFIG.CLIENT_ID && !GARMIN_CONFIG.CLIENT_SECRET) {
    errors.push('Garmin Client Secret is required when Client ID is provided');
  }
  
  // Validate URLs
  try {
    new URL(API_ENDPOINTS.PERPLEXITY.BASE_URL);
    new URL(API_ENDPOINTS.GARMIN.BASE_URL);
  } catch (error) {
    errors.push('Invalid API endpoint URLs');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Environment Detection
export const getCurrentEnvironment = (): 'development' | 'production' | 'test' => {
  // Add your environment detection logic here
  return 'development'; // Default to development
};

// Export main configuration object
export const API_CONFIG = {
  endpoints: API_ENDPOINTS,
  perplexity: PERPLEXITY_CONFIG,
  garmin: GARMIN_CONFIG,
  errors: ERROR_CONFIG,
  development: DEVELOPMENT_CONFIG,
  production: PRODUCTION_CONFIG,
  environment: getCurrentEnvironment(),
  createAPIConfig,
  validateAPIConfig
} as const;

// Helper function to get API key securely
export const getAPIKey = (service: 'perplexity' | 'garmin'): string => {
  const isDevelopment = getCurrentEnvironment() === 'development';
  
  switch (service) {
    case 'perplexity':
      return isDevelopment && DEVELOPMENT_CONFIG.USE_MOCK_DATA 
        ? DEVELOPMENT_CONFIG.DEV_API_KEYS.perplexity
        : PERPLEXITY_CONFIG.API_KEY;
    
    case 'garmin':
      return isDevelopment && DEVELOPMENT_CONFIG.USE_MOCK_DATA
        ? DEVELOPMENT_CONFIG.DEV_API_KEYS.garmin
        : GARMIN_CONFIG.CLIENT_ID;
    
    default:
      return '';
  }
};

// Helper function to check if service is configured
export const isServiceConfigured = (service: 'perplexity' | 'garmin'): boolean => {
  switch (service) {
    case 'perplexity':
      return !!PERPLEXITY_CONFIG.API_KEY || DEVELOPMENT_CONFIG.USE_MOCK_DATA;
    
    case 'garmin':
      return !!(GARMIN_CONFIG.CLIENT_ID && GARMIN_CONFIG.CLIENT_SECRET) || DEVELOPMENT_CONFIG.USE_MOCK_DATA;
    
    default:
      return false;
  }
};

// Export types for TypeScript usage
export type APIService = 'perplexity' | 'garmin';
export type Environment = 'development' | 'production' | 'test';
export type PerplexityModel = keyof typeof PERPLEXITY_CONFIG.MODELS;

// Default export
export default API_CONFIG;
