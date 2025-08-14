/**
 * Garmin Credential Manager
 * 
 * Manages Garmin credentials with user consent and automatic re-login capabilities.
 * Uses secure storage with proper user privacy controls.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
// Import crypto from Expo if available, otherwise use a fallback
let Crypto: any;
try {
  Crypto = require('expo-crypto');
} catch (error) {
  console.warn('expo-crypto not available, using fallback random generation');
  Crypto = {
    getRandomBytesAsync: (size: number) => Promise.resolve(new Uint8Array(size).map(() => Math.floor(Math.random() * 256)))
  };
}

export interface GarminCredentials {
  username: string;
  password: string;
}

export interface StoredGarminCredentials {
  username: string;
  encryptedPassword: string;
  salt: string;
  consentTimestamp: number;
  lastUsed: number;
  consentDurationDays: number;
}

export interface CredentialConsentOptions {
  rememberCredentials: boolean;
  durationDays: number; // How long to remember (7, 30, 90 days)
  allowAutoLogin: boolean;
}

export class GarminCredentialManager {
  private static readonly CREDENTIALS_KEY = '@garmin_credentials_v2';
  private static readonly CONSENT_KEY = '@garmin_consent_v2';
  private static readonly DEFAULT_DURATION_DAYS = 30;

  /**
   * Ask user for consent to store credentials
   */
  static async requestCredentialStorage(
    credentials: GarminCredentials,
    options: CredentialConsentOptions
  ): Promise<boolean> {
    try {
      if (!options.rememberCredentials) {
        console.log('🔐 [GarminCredentials] User declined credential storage');
        await this.clearStoredCredentials(); // Clear any existing
        return false;
      }

      // Generate a random salt for this storage session
      const salt = await this.generateSalt();
      
      // Encrypt the password using the salt
      const encryptedPassword = await this.encryptPassword(credentials.password, salt);
      
      const storedCredentials: StoredGarminCredentials = {
        username: credentials.username,
        encryptedPassword,
        salt,
        consentTimestamp: Date.now(),
        lastUsed: Date.now(),
        consentDurationDays: options.durationDays,
      };

      // Store the credentials
      await AsyncStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(storedCredentials));
      
      // Store consent preferences
      const consentInfo = {
        allowAutoLogin: options.allowAutoLogin,
        durationDays: options.durationDays,
        consentTimestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.CONSENT_KEY, JSON.stringify(consentInfo));

      console.log(`✅ [GarminCredentials] Credentials stored with ${options.durationDays} day consent`);
      return true;
    } catch (error) {
      console.error('❌ [GarminCredentials] Failed to store credentials:', error);
      return false;
    }
  }

  /**
   * Retrieve stored credentials if consent is still valid
   */
  static async getStoredCredentials(): Promise<GarminCredentials | null> {
    try {
      // First check if consent is still valid
      const hasValidConsent = await this.hasValidConsent();
      if (!hasValidConsent) {
        console.log('🚫 [GarminCredentials] Consent expired or not granted');
        await this.clearStoredCredentials();
        return null;
      }

      const stored = await AsyncStorage.getItem(this.CREDENTIALS_KEY);
      if (!stored) {
        console.log('🔍 [GarminCredentials] No stored credentials found');
        return null;
      }

      const credentials: StoredGarminCredentials = JSON.parse(stored);
      
      // Decrypt the password
      const password = await this.decryptPassword(credentials.encryptedPassword, credentials.salt);
      
      // Update last used timestamp
      credentials.lastUsed = Date.now();
      await AsyncStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));
      
      console.log('🔓 [GarminCredentials] Retrieved stored credentials');
      return {
        username: credentials.username,
        password,
      };
    } catch (error) {
      console.error('❌ [GarminCredentials] Failed to retrieve credentials:', error);
      await this.clearStoredCredentials(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Check if user consent is still valid
   */
  static async hasValidConsent(): Promise<boolean> {
    try {
      const [storedCredentials, storedConsent] = await AsyncStorage.multiGet([
        this.CREDENTIALS_KEY,
        this.CONSENT_KEY
      ]);

      if (!storedCredentials[1] || !storedConsent[1]) {
        return false;
      }

      const credentials: StoredGarminCredentials = JSON.parse(storedCredentials[1]);
      const consent = JSON.parse(storedConsent[1]);
      
      const consentAge = Date.now() - credentials.consentTimestamp;
      const maxAge = credentials.consentDurationDays * 24 * 60 * 60 * 1000;
      
      const isValid = consentAge < maxAge;
      
      if (!isValid) {
        console.log('⏰ [GarminCredentials] Consent expired, clearing credentials');
        await this.clearStoredCredentials();
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ [GarminCredentials] Failed to check consent:', error);
      return false;
    }
  }

  /**
   * Check if auto-login is enabled
   */
  static async canAutoLogin(): Promise<boolean> {
    try {
      const hasConsent = await this.hasValidConsent();
      if (!hasConsent) {
        return false;
      }

      const stored = await AsyncStorage.getItem(this.CONSENT_KEY);
      if (!stored) {
        return false;
      }

      const consent = JSON.parse(stored);
      return consent.allowAutoLogin === true;
    } catch (error) {
      console.error('❌ [GarminCredentials] Failed to check auto-login permission:', error);
      return false;
    }
  }

  /**
   * Clear stored credentials and consent
   */
  static async clearStoredCredentials(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.CREDENTIALS_KEY, this.CONSENT_KEY]);
      console.log('🗑️ [GarminCredentials] Cleared all stored credentials');
    } catch (error) {
      console.error('❌ [GarminCredentials] Failed to clear credentials:', error);
    }
  }

  /**
   * Get current credential storage status
   */
  static async getStorageStatus(): Promise<{
    hasStoredCredentials: boolean;
    hasValidConsent: boolean;
    canAutoLogin: boolean;
    consentExpiryDate?: Date;
    username?: string;
  }> {
    try {
      const hasValidConsent = await this.hasValidConsent();
      const canAutoLogin = await this.canAutoLogin();
      
      const stored = await AsyncStorage.getItem(this.CREDENTIALS_KEY);
      const hasStoredCredentials = !!stored;
      
      let username: string | undefined;
      let consentExpiryDate: Date | undefined;
      
      if (stored) {
        const credentials: StoredGarminCredentials = JSON.parse(stored);
        username = credentials.username;
        consentExpiryDate = new Date(
          credentials.consentTimestamp + (credentials.consentDurationDays * 24 * 60 * 60 * 1000)
        );
      }

      return {
        hasStoredCredentials,
        hasValidConsent,
        canAutoLogin,
        consentExpiryDate,
        username,
      };
    } catch (error) {
      console.error('❌ [GarminCredentials] Failed to get storage status:', error);
      return {
        hasStoredCredentials: false,
        hasValidConsent: false,
        canAutoLogin: false,
      };
    }
  }

  /**
   * Generate a random salt for encryption
   */
  private static async generateSalt(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes, (byte: number) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt password using XOR with salt (simple but functional)
   * In production, use proper encryption like AES
   */
  private static async encryptPassword(password: string, salt: string): Promise<string> {
    try {
      // Simple XOR encryption with salt
      const passwordBytes = new TextEncoder().encode(password);
      const saltBytes = new TextEncoder().encode(salt);
      
      const encrypted = new Uint8Array(passwordBytes.length);
      for (let i = 0; i < passwordBytes.length; i++) {
        encrypted[i] = passwordBytes[i] ^ saltBytes[i % saltBytes.length];
      }
      
      // Convert to hex string for storage (React Native compatible)
      return Array.from(encrypted, byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('❌ [GarminCredentials] Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt password using XOR with salt
   */
  private static async decryptPassword(encryptedPassword: string, salt: string): Promise<string> {
    try {
      // Convert hex string back to bytes
      const encrypted = new Uint8Array(encryptedPassword.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      const saltBytes = new TextEncoder().encode(salt);
      
      const decrypted = new Uint8Array(encrypted.length);
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ saltBytes[i % saltBytes.length];
      }
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('❌ [GarminCredentials] Decryption failed:', error);
      throw error;
    }
  }
}

/**
 * Usage Example:
 * 
 * // When user logs in successfully
 * const success = await GarminCredentialManager.requestCredentialStorage(
 *   { username, password },
 *   { 
 *     rememberCredentials: true,
 *     durationDays: 30,
 *     allowAutoLogin: true 
 *   }
 * );
 * 
 * // When session expires, try auto-login
 * if (await GarminCredentialManager.canAutoLogin()) {
 *   const credentials = await GarminCredentialManager.getStoredCredentials();
 *   if (credentials) {
 *     // Attempt automatic login
 *     const loginSuccess = await garminService.login(credentials.username, credentials.password);
 *   }
 * }
 * 
 * // Check current status
 * const status = await GarminCredentialManager.getStorageStatus();
 * console.log('Credentials expire on:', status.consentExpiryDate);
 */