/**
 * BackupService - Multi-location data backup and recovery
 * 
 * Provides automatic backup to multiple AsyncStorage keys
 * with auto-recovery capabilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BackupData {
  currentWeekGoal: any;
  weeklyData: any[];
  goalConfiguration: any;
  weightEntries: any[];
  recoveryState: any;
  timestamp: string;
  version: string;
}

export interface BackupMetadata {
  timestamp: string;
  version: string;
  source: 'auto' | 'manual';
}

class BackupServiceImpl {
  private readonly PRIMARY_BACKUP_KEY = 'calorie-backup-primary';
  private readonly SECONDARY_BACKUP_KEY = 'calorie-backup-secondary';
  private readonly HISTORY_KEY = 'calorie-backup-history';
  private readonly MAX_BACKUPS = 5; // Keep last 5 backups in history
  private readonly BACKUP_VERSION = '1.0';

  /**
   * Create backup to multiple AsyncStorage locations
   */
  async createBackup(data: Partial<BackupData>, source: 'auto' | 'manual' = 'auto'): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString();
      const backupData: BackupData = {
        currentWeekGoal: data.currentWeekGoal || null,
        weeklyData: data.weeklyData || [],
        goalConfiguration: data.goalConfiguration || null,
        weightEntries: data.weightEntries || [],
        recoveryState: data.recoveryState || null,
        timestamp,
        version: this.BACKUP_VERSION,
      };

      const backupString = JSON.stringify(backupData);

      // 1. Save to primary backup location
      await AsyncStorage.setItem(this.PRIMARY_BACKUP_KEY, backupString);
      
      // 2. Save to secondary backup location
      await AsyncStorage.setItem(this.SECONDARY_BACKUP_KEY, backupString);
      
      // 3. Update backup history
      await this.updateBackupHistory(timestamp, source);

      console.log(`✅ [BackupService] ${source} backup created successfully at ${timestamp}`);
      return true;

    } catch (error) {
      console.error(`❌ [BackupService] Failed to create ${source} backup:`, error);
      return false;
    }
  }

  /**
   * Update backup history metadata
   */
  private async updateBackupHistory(timestamp: string, source: 'auto' | 'manual'): Promise<void> {
    try {
      let history: BackupMetadata[] = [];
      
      const historyData = await AsyncStorage.getItem(this.HISTORY_KEY);
      if (historyData) {
        history = JSON.parse(historyData);
      }

      history.push({
        timestamp,
        version: this.BACKUP_VERSION,
        source,
      });

      // Keep only recent backups in history
      if (history.length > this.MAX_BACKUPS) {
        history = history.slice(-this.MAX_BACKUPS);
      }

      await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('❌ [BackupService] Failed to update backup history:', error);
    }
  }

  /**
   * Restore data from backup (try primary first, then secondary)
   */
  async restoreFromBackup(): Promise<BackupData | null> {
    try {
      console.log('🔄 [BackupService] Attempting to restore from backup...');

      // Try primary backup first
      let backupData = await this.tryRestoreFromKey(this.PRIMARY_BACKUP_KEY, 'primary');
      
      if (!backupData) {
        // Fallback to secondary backup
        backupData = await this.tryRestoreFromKey(this.SECONDARY_BACKUP_KEY, 'secondary');
      }

      if (backupData) {
        console.log(`✅ [BackupService] Backup restored from ${backupData.timestamp}`);
        return backupData;
      } else {
        console.log('⚠️ [BackupService] No backup data found to restore');
        return null;
      }
    } catch (error) {
      console.error('❌ [BackupService] Failed to restore from backup:', error);
      return null;
    }
  }

  /**
   * Try to restore from a specific AsyncStorage key
   */
  private async tryRestoreFromKey(key: string, location: string): Promise<BackupData | null> {
    try {
      const backupString = await AsyncStorage.getItem(key);
      if (backupString) {
        const backupData: BackupData = JSON.parse(backupString);
        console.log(`✅ [BackupService] Found valid backup in ${location} location`);
        return backupData;
      }
      return null;
    } catch (error) {
      console.error(`❌ [BackupService] Failed to restore from ${location} backup:`, error);
      return null;
    }
  }

  /**
   * Get backup status and metadata
   */
  async getBackupStatus(): Promise<{
    hasPrimaryBackup: boolean;
    hasSecondaryBackup: boolean;
    lastBackupTime?: string;
    backupCount: number;
  }> {
    try {
      const primaryExists = !!(await AsyncStorage.getItem(this.PRIMARY_BACKUP_KEY));
      const secondaryExists = !!(await AsyncStorage.getItem(this.SECONDARY_BACKUP_KEY));
      
      let lastBackupTime: string | undefined;
      let backupCount = 0;

      const historyData = await AsyncStorage.getItem(this.HISTORY_KEY);
      if (historyData) {
        const history: BackupMetadata[] = JSON.parse(historyData);
        backupCount = history.length;
        if (history.length > 0) {
          lastBackupTime = history[history.length - 1].timestamp;
        }
      }

      return {
        hasPrimaryBackup: primaryExists,
        hasSecondaryBackup: secondaryExists,
        lastBackupTime,
        backupCount,
      };
    } catch (error) {
      console.error('❌ [BackupService] Failed to get backup status:', error);
      return {
        hasPrimaryBackup: false,
        hasSecondaryBackup: false,
        backupCount: 0,
      };
    }
  }

  /**
   * Create manual backup (user-initiated)
   */
  async createManualBackup(data: Partial<BackupData>): Promise<boolean> {
    return this.createBackup(data, 'manual');
  }

  /**
   * List all available backups
   */
  async getBackupHistory(): Promise<BackupMetadata[]> {
    try {
      const historyData = await AsyncStorage.getItem(this.HISTORY_KEY);
      if (historyData) {
        return JSON.parse(historyData);
      }
      return [];
    } catch (error) {
      console.error('❌ [BackupService] Failed to get backup history:', error);
      return [];
    }
  }

  /**
   * Initialize backup service (check for existing backups)
   */
  async initialize(): Promise<void> {
    try {
      const status = await this.getBackupStatus();
      console.log('📁 [BackupService] Initialized. Status:', status);
    } catch (error) {
      console.error('❌ [BackupService] Failed to initialize:', error);
    }
  }
}

export const BackupService = new BackupServiceImpl();