/**
 * Samsung Health Activity Sync Screen
 * 
 * Provides interface for managing Samsung Health activity synchronization
 * including manual sync, viewing sync status, and configuration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, formatDistanceToNow } from 'date-fns';
import { SamsungHealthDataProcessor } from '../services/SamsungHealthDataProcessor';
import { SamsungHealthBackgroundSync } from '../services/SamsungHealthBackgroundSync';
import { SamsungHealthService } from '../services/SamsungHealthService';
import {
  SamsungHealthSyncResult,
  SamsungHealthActivity,
  SamsungHealthSyncConfig
} from '../types/SamsungHealthTypes';

const { width } = Dimensions.get('window');

interface SyncStats {
  totalProcessed: number;
  lastSyncTime: Date | null;
  processedToday: number;
  isProcessing: boolean;
}

interface BackgroundSyncStatus {
  config: SamsungHealthSyncConfig;
  status: any;
  canSync: boolean;
  minutesToNextSync: number | null;
}

export const SamsungHealthActivitySyncScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [backgroundSyncStatus, setBackgroundSyncStatus] = useState<BackgroundSyncStatus | null>(null);
  const [recentActivities, setRecentActivities] = useState<SamsungHealthActivity[]>([]);
  const [lastSyncResult, setLastSyncResult] = useState<SamsungHealthSyncResult | null>(null);

  // Service instances
  const dataProcessor = SamsungHealthDataProcessor.getInstance();
  const backgroundSync = SamsungHealthBackgroundSync.getInstance();
  const samsungHealthService = SamsungHealthService.getInstance();

  /**
   * Load initial data
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check connection status
      const connected = await samsungHealthService.isConnected();
      setIsConnected(connected);

      if (connected) {
        // Load sync statistics
        const stats = await dataProcessor.getSyncStatistics();
        setSyncStats(stats);

        // Load background sync status
        const bgStatus = backgroundSync.getSyncStatus();
        setBackgroundSyncStatus(bgStatus);
      }

    } catch (error) {
      console.error('❌ [Samsung Sync UI] Failed to load data:', error);
      Alert.alert('Error', 'Failed to load sync data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  /**
   * Perform manual sync
   */
  const handleManualSync = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!isConnected) {
        Alert.alert('Not Connected', 'Please connect to Samsung Health first.');
        return;
      }

      console.log('🔄 [Samsung Sync UI] Starting manual sync...');
      const result = await dataProcessor.performManualSync();
      setLastSyncResult(result);

      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.activitiesCount} activities.`,
          [{ text: 'OK', onPress: () => loadData() }]
        );
      } else {
        Alert.alert('Sync Failed', result.error || 'Unknown error occurred.');
      }

    } catch (error) {
      console.error('❌ [Samsung Sync UI] Manual sync failed:', error);
      Alert.alert('Sync Failed', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, loadData]);

  /**
   * Toggle background sync
   */
  const handleToggleBackgroundSync = useCallback(async (enabled: boolean) => {
    try {
      setIsLoading(true);

      await backgroundSync.updateConfiguration({
        enableBackgroundSync: enabled
      });

      await loadData();

      Alert.alert(
        'Background Sync Updated',
        enabled ? 'Background sync enabled' : 'Background sync disabled'
      );

    } catch (error) {
      console.error('❌ [Samsung Sync UI] Failed to toggle background sync:', error);
      Alert.alert('Error', 'Failed to update background sync setting.');
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

  /**
   * Handle sync interval change
   */
  const handleSyncIntervalChange = useCallback(async (intervalMinutes: number) => {
    try {
      await backgroundSync.updateConfiguration({
        syncIntervalMinutes: intervalMinutes
      });

      await loadData();

      Alert.alert('Sync Interval Updated', `Sync interval set to ${intervalMinutes} minutes.`);

    } catch (error) {
      console.error('❌ [Samsung Sync UI] Failed to update sync interval:', error);
      Alert.alert('Error', 'Failed to update sync interval.');
    }
  }, [loadData]);

  /**
   * Clear processed activities (for testing)
   */
  const handleClearProcessedActivities = useCallback(async () => {
    try {
      Alert.alert(
        'Clear Processed Activities',
        'This will allow previously synced activities to be synced again. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              await dataProcessor.clearProcessedActivities();
              await loadData();
              Alert.alert('Cleared', 'Processed activities cleared.');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ [Samsung Sync UI] Failed to clear processed activities:', error);
      Alert.alert('Error', 'Failed to clear processed activities.');
    }
  }, [loadData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Render connection status
   */
  const renderConnectionStatus = () => (
    <View style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusTitle}>Samsung Health Connection</Text>
        <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
      </View>
      <Text style={styles.statusText}>
        {isConnected ? 'Connected and ready to sync' : 'Not connected - please set up Samsung Health first'}
      </Text>
    </View>
  );

  /**
   * Render sync statistics
   */
  const renderSyncStats = () => {
    if (!syncStats || !isConnected) return null;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Sync Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{syncStats.totalProcessed}</Text>
            <Text style={styles.statLabel}>Total Processed</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{syncStats.processedToday}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {syncStats.lastSyncTime 
                ? formatDistanceToNow(syncStats.lastSyncTime, { addSuffix: true })
                : 'Never'
              }
            </Text>
            <Text style={styles.statLabel}>Last Sync</Text>
          </View>
        </View>

        {syncStats.isProcessing && (
          <View style={styles.processingIndicator}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.processingText}>Sync in progress...</Text>
          </View>
        )}
      </View>
    );
  };

  /**
   * Render background sync settings
   */
  const renderBackgroundSyncSettings = () => {
    if (!backgroundSyncStatus || !isConnected) return null;

    const { config, status, canSync, minutesToNextSync } = backgroundSyncStatus;

    return (
      <View style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Background Sync</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Enable Background Sync</Text>
          <Switch
            value={config.enableBackgroundSync}
            onValueChange={handleToggleBackgroundSync}
            disabled={isLoading}
          />
        </View>

        {config.enableBackgroundSync && (
          <>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Sync Interval</Text>
              <Text style={styles.settingValue}>{config.syncIntervalMinutes} minutes</Text>
            </View>

            <View style={styles.intervalButtons}>
              {[30, 60, 120, 180].map(interval => (
                <TouchableOpacity
                  key={interval}
                  style={[
                    styles.intervalButton,
                    config.syncIntervalMinutes === interval && styles.intervalButtonActive
                  ]}
                  onPress={() => handleSyncIntervalChange(interval)}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.intervalButtonText,
                    config.syncIntervalMinutes === interval && styles.intervalButtonTextActive
                  ]}>
                    {interval}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {status.isRunning && minutesToNextSync && (
              <Text style={styles.nextSyncText}>
                Next sync in {minutesToNextSync} minute{minutesToNextSync !== 1 ? 's' : ''}
              </Text>
            )}

            {!canSync && (
              <Text style={styles.warningText}>
                Sync temporarily disabled (daily limit or quiet hours)
              </Text>
            )}
          </>
        )}
      </View>
    );
  };

  /**
   * Render manual sync section
   */
  const renderManualSync = () => (
    <View style={styles.manualSyncCard}>
      <Text style={styles.sectionTitle}>Manual Sync</Text>
      <Text style={styles.description}>
        Immediately sync recent Samsung Health activities (last 7 days)
      </Text>
      
      <TouchableOpacity
        style={[styles.syncButton, (!isConnected || isLoading) && styles.syncButtonDisabled]}
        onPress={handleManualSync}
        disabled={!isConnected || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.syncButtonText}>Sync Now</Text>
        )}
      </TouchableOpacity>

      {lastSyncResult && (
        <View style={styles.lastSyncResult}>
          <Text style={styles.resultText}>
            Last sync: {lastSyncResult.success ? 'Success' : 'Failed'}
            {lastSyncResult.success && ` - ${lastSyncResult.activitiesCount} activities`}
          </Text>
          {lastSyncResult.error && (
            <Text style={styles.errorText}>{lastSyncResult.error}</Text>
          )}
        </View>
      )}
    </View>
  );

  /**
   * Render debug section
   */
  const renderDebugSection = () => (
    <View style={styles.debugCard}>
      <Text style={styles.sectionTitle}>Debug Options</Text>
      
      <TouchableOpacity
        style={styles.debugButton}
        onPress={handleClearProcessedActivities}
        disabled={isLoading}
      >
        <Text style={styles.debugButtonText}>Clear Processed Activities</Text>
      </TouchableOpacity>

      <Text style={styles.debugText}>
        This will allow previously synced activities to be processed again.
        Use only for testing or troubleshooting.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2196F3"
          />
        }
      >
        <Text style={styles.title}>Samsung Health Activity Sync</Text>
        
        {renderConnectionStatus()}
        {renderSyncStats()}
        {renderBackgroundSyncSettings()}
        {renderManualSync()}
        {renderDebugSection()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2196F3',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  intervalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  intervalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  intervalButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  intervalButtonText: {
    fontSize: 14,
    color: '#666',
  },
  intervalButtonTextActive: {
    color: '#FFFFFF',
  },
  nextSyncText: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9800',
    textAlign: 'center',
    marginTop: 8,
  },
  manualSyncCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  syncButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  syncButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  lastSyncResult: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
  },
  debugCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  debugButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SamsungHealthActivitySyncScreen;
