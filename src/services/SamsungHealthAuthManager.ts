/**
 * Samsung Health Authentication Manager
 * 
 * Handles OAuth 2.0 authentication flow, token management, and secure storage
 * for Samsung Health API access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
// Note: In production, use react-native-keychain for secure storage
// import * as Keychain from 'react-native-keychain';
import {
  SamsungHealthCredentials,
  SamsungOAuthConfig,
  SamsungAuthResponse,
  SamsungHealthConnectionStatus,
  SamsungHealthException,
  SamsungHealthErrorType,
  SAMSUNG_HEALTH_ENDPOINTS,
  SAMSUNG_HEALTH_SCOPES
} from '../types/SamsungHealthTypes';

export class SamsungHealthAuthManager {
  private static instance: SamsungHealthAuthManager;
  private credentials: SamsungHealthCredentials | null = null;
  private isAuthenticating = false;
  private config: SamsungOAuthConfig;
  private encryptionKey: string;

  private constructor() {
    // Initialize with default configuration
    this.config = {
      clientId: 'demo_samsung_health_client_id',
      clientSecret: 'demo_samsung_health_client_secret',
      redirectUri: 'calorie-tracker://samsung-auth',
      scope: [
        SAMSUNG_HEALTH_SCOPES.ACTIVITY,
        SAMSUNG_HEALTH_SCOPES.NUTRITION,
        SAMSUNG_HEALTH_SCOPES.SLEEP,
        SAMSUNG_HEALTH_SCOPES.BODY_COMPOSITION,
        SAMSUNG_HEALTH_SCOPES.HEART_RATE
      ]
    };

    // Generate encryption key for secure storage
    this.encryptionKey = this.generateEncryptionKey();
    
    // Load saved credentials on initialization
    this.loadCredentials();
  }

  public static getInstance(): SamsungHealthAuthManager {
    if (!SamsungHealthAuthManager.instance) {
      SamsungHealthAuthManager.instance = new SamsungHealthAuthManager();
    }
    return SamsungHealthAuthManager.instance;
  }

  /**
   * Initialize OAuth 2.0 authentication flow
   */
  public async authenticate(): Promise<boolean> {
    try {
      console.log('🔐 [Samsung Auth] Starting authentication flow...');
      
      if (this.isAuthenticating) {
        throw new SamsungHealthException(
          SamsungHealthErrorType.AUTHENTICATION_FAILED,
          'Authentication already in progress'
        );
      }

      this.isAuthenticating = true;

      // Check if already authenticated and token is valid
      if (await this.isConnected()) {
        console.log('✅ [Samsung Auth] Already authenticated');
        this.isAuthenticating = false;
        return true;
      }

      // Generate authorization URL
      const authUrl = this.buildAuthorizationUrl();
      console.log('🌐 [Samsung Auth] Opening authorization URL...');

      // Open Samsung Account OAuth page
      const supported = await Linking.canOpenURL(authUrl);
      if (!supported) {
        throw new SamsungHealthException(
          SamsungHealthErrorType.AUTHENTICATION_FAILED,
          'Cannot open Samsung authentication URL'
        );
      }

      await Linking.openURL(authUrl);

      // Set up deep link listener for OAuth callback
      return new Promise((resolve, reject) => {
        const handleAuthCallback = (event: { url: string }) => {
          try {
            console.log('📱 [Samsung Auth] Received callback:', event.url);
            
            if (event.url.startsWith(this.config.redirectUri)) {
              this.handleAuthCallback(event.url)
                .then(() => {
                  Linking.removeAllListeners('url');
                  this.isAuthenticating = false;
                  resolve(true);
                })
                .catch((error) => {
                  Linking.removeAllListeners('url');
                  this.isAuthenticating = false;
                  reject(error);
                });
            }
          } catch (error) {
            Linking.removeAllListeners('url');
            this.isAuthenticating = false;
            reject(error);
          }
        };

        Linking.addEventListener('url', handleAuthCallback);

        // Timeout after 5 minutes
        setTimeout(() => {
          Linking.removeAllListeners('url');
          this.isAuthenticating = false;
          reject(new SamsungHealthException(
            SamsungHealthErrorType.AUTHENTICATION_FAILED,
            'Authentication timeout'
          ));
        }, 300000);
      });

    } catch (error) {
      this.isAuthenticating = false;
      console.error('❌ [Samsung Auth] Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback from Samsung
   */
  private async handleAuthCallback(callbackUrl: string): Promise<void> {
    try {
      // Parse URL manually for React Native compatibility
      const urlParts = callbackUrl.split('?');
      if (urlParts.length < 2) {
        throw new SamsungHealthException(
          SamsungHealthErrorType.AUTHENTICATION_FAILED,
          'Invalid callback URL format'
        );
      }

      const params = urlParts[1].split('&').reduce((acc, param) => {
        const [key, value] = param.split('=');
        acc[key] = decodeURIComponent(value);
        return acc;
      }, {} as Record<string, string>);

      const authCode = params.code;
      const error = params.error;

      if (error) {
        throw new SamsungHealthException(
          SamsungHealthErrorType.AUTHENTICATION_FAILED,
          `OAuth error: ${error}`
        );
      }

      if (!authCode) {
        throw new SamsungHealthException(
          SamsungHealthErrorType.AUTHENTICATION_FAILED,
          'No authorization code received'
        );
      }

      console.log('🔑 [Samsung Auth] Exchanging code for tokens...');
      await this.exchangeCodeForTokens(authCode);

    } catch (error) {
      console.error('❌ [Samsung Auth] Callback handling failed:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(authCode: string): Promise<void> {
    try {
      const tokenUrl = `${SAMSUNG_HEALTH_ENDPOINTS.OAUTH_BASE}${SAMSUNG_HEALTH_ENDPOINTS.TOKEN}`;
      
      const requestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        code: authCode
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: requestBody.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new SamsungHealthException(
          SamsungHealthErrorType.AUTHENTICATION_FAILED,
          `Token exchange failed: ${response.status} - ${errorText}`
        );
      }

      const authResponse = await response.json() as SamsungAuthResponse;
      
      // Store credentials
      this.credentials = {
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        userId: authResponse.user_id,
        expiresAt: new Date(Date.now() + (authResponse.expires_in * 1000))
      };

      await this.saveCredentials();
      console.log('✅ [Samsung Auth] Tokens saved successfully');

    } catch (error) {
      console.error('❌ [Samsung Auth] Token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Check if user is currently connected to Samsung Health
   */
  public async isConnected(): Promise<boolean> {
    try {
      if (!this.credentials) {
        await this.loadCredentials();
      }

      if (!this.credentials) {
        return false;
      }

      // Check if token is expired
      if (new Date() >= this.credentials.expiresAt) {
        console.log('⏰ [Samsung Auth] Token expired, attempting refresh...');
        return await this.refreshTokens();
      }

      // Test API connection
      return await this.testConnection();

    } catch (error) {
      console.error('❌ [Samsung Auth] Connection check failed:', error);
      return false;
    }
  }

  /**
   * Refresh access tokens using refresh token
   */
  public async refreshTokens(): Promise<boolean> {
    try {
      if (!this.credentials?.refreshToken) {
        console.log('❌ [Samsung Auth] No refresh token available');
        return false;
      }

      console.log('🔄 [Samsung Auth] Refreshing tokens...');

      const tokenUrl = `${SAMSUNG_HEALTH_ENDPOINTS.OAUTH_BASE}${SAMSUNG_HEALTH_ENDPOINTS.TOKEN}`;
      
      const requestBody = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.credentials.refreshToken
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: requestBody.toString()
      });

      if (!response.ok) {
        console.error('❌ [Samsung Auth] Token refresh failed:', response.status);
        await this.disconnect();
        return false;
      }

      const authResponse = await response.json() as SamsungAuthResponse;
      
      // Update credentials
      this.credentials = {
        ...this.credentials,
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token || this.credentials.refreshToken,
        expiresAt: new Date(Date.now() + (authResponse.expires_in * 1000))
      };

      await this.saveCredentials();
      console.log('✅ [Samsung Auth] Tokens refreshed successfully');
      return true;

    } catch (error) {
      console.error('❌ [Samsung Auth] Token refresh failed:', error);
      await this.disconnect();
      return false;
    }
  }

  /**
   * Test API connection with current credentials
   */
  private async testConnection(): Promise<boolean> {
    try {
      if (!this.credentials) {
        return false;
      }

      const response = await fetch(
        `${SAMSUNG_HEALTH_ENDPOINTS.BASE_URL}${SAMSUNG_HEALTH_ENDPOINTS.USER_PROFILE}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.credentials.accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      return response.ok;

    } catch (error) {
      console.error('❌ [Samsung Auth] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Disconnect from Samsung Health and clear credentials
   */
  public async disconnect(): Promise<void> {
    try {
      console.log('🔌 [Samsung Auth] Disconnecting...');

      // Clear in-memory credentials
      this.credentials = null;
      this.isAuthenticating = false;

      // Clear stored credentials
      await AsyncStorage.removeItem('samsung_health_credentials');
      
      console.log('✅ [Samsung Auth] Disconnected successfully');

    } catch (error) {
      console.error('❌ [Samsung Auth] Disconnect failed:', error);
      throw error;
    }
  }

  /**
   * Get current connection status
   */
  public async getConnectionStatus(): Promise<SamsungHealthConnectionStatus> {
    try {
      const isConnected = await this.isConnected();
      
      return {
        isConnected,
        isAuthenticating: this.isAuthenticating,
        lastSyncTime: null, // This will be managed by sync service
        connectionError: null,
        userId: this.credentials?.userId || null,
        permissions: this.config.scope
      };

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
   * Get current access token for API requests
   */
  public async getAccessToken(): Promise<string | null> {
    try {
      if (!this.credentials) {
        await this.loadCredentials();
      }

      if (!this.credentials) {
        return null;
      }

      // Check if token needs refresh
      if (new Date() >= this.credentials.expiresAt) {
        const refreshed = await this.refreshTokens();
        if (!refreshed) {
          return null;
        }
      }

      return this.credentials.accessToken;

    } catch (error) {
      console.error('❌ [Samsung Auth] Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Build OAuth authorization URL
   */
  private buildAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(' '),
      state: this.generateRandomState()
    });

    return `${SAMSUNG_HEALTH_ENDPOINTS.OAUTH_BASE}${SAMSUNG_HEALTH_ENDPOINTS.AUTHORIZE}?${params.toString()}`;
  }

  /**
   * Generate random state for OAuth security
   */
  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate encryption key for secure storage
   */
  private generateEncryptionKey(): string {
    // In production, this should be more sophisticated
    return Platform.OS + '_samsung_health_key_v1';
  }

  /**
   * Save credentials to encrypted storage
   */
  private async saveCredentials(): Promise<void> {
    try {
      if (!this.credentials) {
        return;
      }

      // For development, using simple encoding
      // In production, use react-native-keychain for proper encryption
      const credentialsData = {
        ...this.credentials,
        expiresAt: this.credentials.expiresAt.toISOString()
      };
      
      await AsyncStorage.setItem('samsung_health_credentials', JSON.stringify(credentialsData));

    } catch (error) {
      console.error('❌ [Samsung Auth] Failed to save credentials:', error);
      throw error;
    }
  }

  /**
   * Load credentials from encrypted storage
   */
  private async loadCredentials(): Promise<void> {
    try {
      const credentialsJson = await AsyncStorage.getItem('samsung_health_credentials');
      
      if (!credentialsJson) {
        this.credentials = null;
        return;
      }

      const credentialsData = JSON.parse(credentialsJson);
      
      this.credentials = {
        ...credentialsData,
        expiresAt: new Date(credentialsData.expiresAt)
      };

      console.log('✅ [Samsung Auth] Credentials loaded from storage');

    } catch (error) {
      console.error('❌ [Samsung Auth] Failed to load credentials:', error);
      this.credentials = null;
    }
  }

  /**
   * Update OAuth configuration
   */
  public updateConfig(config: Partial<SamsungOAuthConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): SamsungOAuthConfig {
    return { ...this.config };
  }
}

export default SamsungHealthAuthManager;
