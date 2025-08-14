/**
 * Samsung Health Service
 * 
 * Main service for Samsung Health API integration with authentication,
 * connection testing, and data access capabilities
 */

import { Platform } from 'react-native';
import { SamsungHealthAuthManager } from './SamsungHealthAuthManager';
import {
  SamsungHealthConnectionStatus,
  SamsungHealthServiceConfig,
  SamsungHealthException,
  SamsungHealthErrorType,
  SAMSUNG_HEALTH_ENDPOINTS,
  SAMSUNG_HEALTH_SCOPES,
  SamsungHealthApiResponse
} from '../types/SamsungHealthTypes';

export class SamsungHealthService {
  private static instance: SamsungHealthService;
  private authManager: SamsungHealthAuthManager;
  private config: SamsungHealthServiceConfig;
  private isInitialized = false;

  private constructor() {
    this.authManager = SamsungHealthAuthManager.getInstance();
    this.config = {
      clientId: 'demo_samsung_health_client_id',
      clientSecret: 'demo_samsung_health_client_secret',
      redirectUri: 'calorie-tracker://samsung-auth',
      scopes: [
        SAMSUNG_HEALTH_SCOPES.ACTIVITY,
        SAMSUNG_HEALTH_SCOPES.NUTRITION,
        SAMSUNG_HEALTH_SCOPES.SLEEP,
        SAMSUNG_HEALTH_SCOPES.BODY_COMPOSITION,
        SAMSUNG_HEALTH_SCOPES.HEART_RATE
      ],
      apiTimeout: 30000, // 30 seconds
      retryAttempts: 3,
      enableLogging: __DEV__
    };
  }

  public static getInstance(): SamsungHealthService {
    if (!SamsungHealthService.instance) {
      SamsungHealthService.instance = new SamsungHealthService();
    }
    return SamsungHealthService.instance;
  }

  /**
   * Initialize Samsung Health Service
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log('🚀 [Samsung Health] Initializing service...');

      // Check platform compatibility
      if (Platform.OS !== 'android') {
        console.log('⚠️ [Samsung Health] Not running on Android, skipping initialization');
        return false;
      }

      // Update auth manager configuration
      this.authManager.updateConfig({
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        redirectUri: this.config.redirectUri,
        scope: this.config.scopes
      });

      this.isInitialized = true;
      console.log('✅ [Samsung Health] Service initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ [Samsung Health] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Authenticate with Samsung Health
   */
  public async authenticate(): Promise<boolean> {
    try {
      this.ensureInitialized();
      
      console.log('🔐 [Samsung Health] Starting authentication...');
      
      // Check if already connected
      if (await this.isConnected()) {
        console.log('✅ [Samsung Health] Already authenticated');
        return true;
      }

      // Start OAuth flow
      const success = await this.authManager.authenticate();
      
      if (success) {
        console.log('✅ [Samsung Health] Authentication successful');
        
        // Test the connection
        const connectionWorking = await this.testConnection();
        if (connectionWorking) {
          console.log('✅ [Samsung Health] Connection test passed');
          return true;
        } else {
          console.error('❌ [Samsung Health] Connection test failed');
          await this.disconnect();
          return false;
        }
      }

      return false;

    } catch (error) {
      console.error('❌ [Samsung Health] Authentication failed:', error);
      throw new SamsungHealthException(
        SamsungHealthErrorType.AUTHENTICATION_FAILED,
        `Authentication failed: ${(error as Error).message}`,
        undefined,
        error
      );
    }
  }

  /**
   * Check if connected to Samsung Health
   */
  public async isConnected(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return false;
      }

      return await this.authManager.isConnected();

    } catch (error) {
      console.error('❌ [Samsung Health] Connection check failed:', error);
      return false;
    }
  }

  /**
   * Disconnect from Samsung Health
   */
  public async disconnect(): Promise<void> {
    try {
      console.log('🔌 [Samsung Health] Disconnecting...');
      
      await this.authManager.disconnect();
      
      console.log('✅ [Samsung Health] Disconnected successfully');

    } catch (error) {
      console.error('❌ [Samsung Health] Disconnect failed:', error);
      throw error;
    }
  }

  /**
   * Test Samsung Health API connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized();
      
      if (!await this.isConnected()) {
        return false;
      }

      console.log('🔍 [Samsung Health] Testing API connection...');

      // Try to fetch user profile
      const response = await this.makeApiRequest('/user/profile', 'GET');
      
      if (response.ok) {
        console.log('✅ [Samsung Health] Connection test successful');
        return true;
      } else {
        console.error('❌ [Samsung Health] Connection test failed:', response.status);
        return false;
      }

    } catch (error) {
      console.error('❌ [Samsung Health] Connection test error:', error);
      return false;
    }
  }

  /**
   * Get current connection status
   */
  public async getConnectionStatus(): Promise<SamsungHealthConnectionStatus> {
    try {
      return await this.authManager.getConnectionStatus();
    } catch (error) {
      return {
        isConnected: false,
        isAuthenticating: false,
        lastSyncTime: null,
        connectionError: (error as Error).message,
        userId: null,
        permissions: []
      };
    }
  }

  /**
   * Refresh authentication tokens
   */
  public async refreshTokens(): Promise<boolean> {
    try {
      this.ensureInitialized();
      return await this.authManager.refreshTokens();
    } catch (error) {
      console.error('❌ [Samsung Health] Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Make authenticated API request to Samsung Health
   */
  public async makeApiRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    additionalHeaders?: Record<string, string>
  ): Promise<Response> {
    try {
      this.ensureInitialized();

      const accessToken = await this.authManager.getAccessToken();
      if (!accessToken) {
        throw new SamsungHealthException(
          SamsungHealthErrorType.INVALID_TOKEN,
          'No valid access token available'
        );
      }

      const url = `${SAMSUNG_HEALTH_ENDPOINTS.BASE_URL}${endpoint}`;
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...additionalHeaders
      };

      const requestOptions: RequestInit = {
        method,
        headers
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      if (this.config.enableLogging) {
        console.log(`📡 [Samsung Health] ${method} ${url}`);
      }

      const response = await fetch(url, requestOptions);

      if (this.config.enableLogging) {
        console.log(`📡 [Samsung Health] Response: ${response.status}`);
      }

      // Handle token expiration
      if (response.status === 401) {
        console.log('🔄 [Samsung Health] Token expired, attempting refresh...');
        const refreshed = await this.refreshTokens();
        
        if (refreshed) {
          // Retry request with new token
          const newAccessToken = await this.authManager.getAccessToken();
          if (newAccessToken) {
            headers['Authorization'] = `Bearer ${newAccessToken}`;
            return await fetch(url, { ...requestOptions, headers });
          }
        }
        
        throw new SamsungHealthException(
          SamsungHealthErrorType.INVALID_TOKEN,
          'Authentication token expired and refresh failed'
        );
      }

      // Handle rate limiting
      if (response.status === 429) {
        throw new SamsungHealthException(
          SamsungHealthErrorType.RATE_LIMIT_EXCEEDED,
          'API rate limit exceeded'
        );
      }

      return response;

    } catch (error) {
      if (error instanceof SamsungHealthException) {
        throw error;
      }

      console.error('❌ [Samsung Health] API request failed:', error);
      throw new SamsungHealthException(
        SamsungHealthErrorType.API_ERROR,
        `API request failed: ${(error as Error).message}`,
        undefined,
        error
      );
    }
  }

  /**
   * Get Samsung Health API data with pagination support
   */
  public async getApiData<T>(
    endpoint: string,
    params?: Record<string, string>,
    maxResults?: number
  ): Promise<T[]> {
    try {
      this.ensureInitialized();

      const results: T[] = [];
      let nextPageToken: string | undefined;
      let hasMore = true;

      while (hasMore) {
        // Build query parameters
        const queryParams = new URLSearchParams(params);
        if (nextPageToken) {
          queryParams.append('page_token', nextPageToken);
        }
        if (maxResults && results.length < maxResults) {
          queryParams.append('limit', Math.min(50, maxResults - results.length).toString());
        }

        const url = queryParams.toString() ? 
          `${endpoint}?${queryParams.toString()}` : endpoint;

        const response = await this.makeApiRequest(url, 'GET');

        if (!response.ok) {
          throw new SamsungHealthException(
            SamsungHealthErrorType.API_ERROR,
            `API request failed: ${response.status}`
          );
        }

        const apiResponse = await response.json() as SamsungHealthApiResponse<T>;
        
        results.push(...apiResponse.result);

        // Check pagination
        hasMore = apiResponse.has_more && (!maxResults || results.length < maxResults);
        nextPageToken = apiResponse.next_page_token;

        if (this.config.enableLogging) {
          console.log(`📊 [Samsung Health] Fetched ${apiResponse.result.length} items, total: ${results.length}`);
        }
      }

      return results;

    } catch (error) {
      console.error('❌ [Samsung Health] Data fetch failed:', error);
      throw error;
    }
  }

  /**
   * Update service configuration
   */
  public updateConfig(config: Partial<SamsungHealthServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update auth manager if authentication config changed
    if (config.clientId || config.clientSecret || config.redirectUri || config.scopes) {
      this.authManager.updateConfig({
        clientId: config.clientId || this.config.clientId,
        clientSecret: config.clientSecret || this.config.clientSecret,
        redirectUri: config.redirectUri || this.config.redirectUri,
        scope: config.scopes || this.config.scopes
      });
    }
  }

  /**
   * Get current service configuration
   */
  public getConfig(): SamsungHealthServiceConfig {
    return { ...this.config };
  }

  /**
   * Enable or disable debug logging
   */
  public setLogging(enabled: boolean): void {
    this.config.enableLogging = enabled;
  }

  /**
   * Get service initialization status
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get available Samsung Health permissions/scopes
   */
  public getAvailableScopes(): string[] {
    return Object.values(SAMSUNG_HEALTH_SCOPES);
  }

  /**
   * Check if specific permission is granted
   */
  public async hasPermission(scope: string): Promise<boolean> {
    try {
      const status = await this.getConnectionStatus();
      return status.permissions.includes(scope);
    } catch (error) {
      return false;
    }
  }

  /**
   * Ensure service is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new SamsungHealthException(
        SamsungHealthErrorType.UNKNOWN_ERROR,
        'Samsung Health service not initialized. Call initialize() first.'
      );
    }
  }

  /**
   * Get platform compatibility info
   */
  public static isPlatformSupported(): boolean {
    return Platform.OS === 'android';
  }

  /**
   * Get service version and capabilities
   */
  public getServiceInfo(): {
    version: string;
    platform: string;
    isSupported: boolean;
    availableScopes: string[];
  } {
    return {
      version: '1.0.0',
      platform: Platform.OS,
      isSupported: SamsungHealthService.isPlatformSupported(),
      availableScopes: this.getAvailableScopes()
    };
  }
}

export default SamsungHealthService;
