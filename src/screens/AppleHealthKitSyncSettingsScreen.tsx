/**
 * Apple HealthKit Sync Settings Screen
 * 
 * Provides user controls for background sync configuration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppleHealthKitSyncScheduler } from '../services/AppleHealthKitSyncScheduler';
import { AppleHealthKitService } from '../services/AppleHealthKitService';
import { SyncStatus, SyncMetrics } from '../types/AppleHealthKitTypes';

interface AppleHealthKitSyncSettingsScreenProps {
  navigation: any;
}

export const AppleHealthKitSyncSettingsScreen: React.FC<AppleHealthKitSyncSettingsScreenProps> = ({
  navigation,
}) => {
  const [syncScheduler, setSyncScheduler] = useState<AppleHealthKitSyncScheduler | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    initializeSyncScheduler();
  }, []);

  const initializeSyncScheduler = async () => {
    try {
      if (Platform.OS !== 'ios') {
        setIsLoading(false);
        return;
      }

      const healthKitService = new AppleHealthKitService();
      const scheduler = AppleHealthKitSyncScheduler.getInstance();
      
      setSyncScheduler(scheduler);
      await loadSyncData(scheduler);
    } catch (error) {
      console.error('❌ [SyncSettings] Failed to initialize sync scheduler:', error);
      Alert.alert('Error', 'Failed to initialize sync settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncData = async (scheduler: AppleHealthKitSyncScheduler) => {
    try {
      const [status, metrics] = await Promise.all([
        scheduler.getSyncStatus(),
        scheduler.getSyncMetrics(),
      ]);

      setSyncStatus(status);
      setSyncMetrics(metrics);
    } catch (error) {
      console.error('❌ [SyncSettings] Failed to load sync data:', error);
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    if (!syncScheduler) return;

    try {
      if (enabled) {
        await syncScheduler.resumeSync();
      } else {
        await syncScheduler.pauseSync();
      }

      await loadSyncData(syncScheduler);
    } catch (error) {
      console.error('❌ [SyncSettings] Failed to toggle sync:', error);
      Alert.alert('Error', 'Failed to update sync settings');
    }
  };

  const handleToggleRealTimeSync = async (enabled: boolean) => {
    if (!syncScheduler) return;

    try {
      if (enabled) {
        await syncScheduler.enableRealTimeSync();
      } else {
        await syncScheduler.disableRealTimeSync();
      }

      await loadSyncData(syncScheduler);
    } catch (error) {
      console.error('❌ [SyncSettings] Failed to toggle real-time sync:', error);
      Alert.alert('Error', 'Failed to update real-time sync settings');
    }
  };

  const handleManualSync = async () => {
    if (!syncScheduler || isManualSyncing) return;

    setIsManualSyncing(true);
    try {
      const result = await syncScheduler.performManualSync();
      
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.syncedDataTypes.join(', ')} in ${Math.round(result.duration / 1000)}s`
        );
      } else {
        Alert.alert(
          'Sync Failed',
          `Sync failed: ${result.errors.join(', ')}`
        );
      }

      await loadSyncData(syncScheduler);
    } catch (error) {
      console.error('❌ [SyncSettings] Manual sync failed:', error);
      Alert.alert('Error', 'Manual sync failed');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formatLastSyncTime = (lastSyncTime: Date): string => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSyncTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const formatSyncSuccess = (total: number, successful: number): string => {
    if (total === 0) return 'No syncs yet';
    const percentage = Math.round((successful / total) * 100);
    return `${percentage}% success (${successful}/${total})`;
  };

  if (Platform.OS !== 'ios') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sync Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.notAvailableContainer}>
          <Ionicons name="phone-portrait" size={64} color="#8E8E93" />
          <Text style={styles.notAvailableTitle}>iOS Only Feature</Text>
          <Text style={styles.notAvailableText}>
            Apple HealthKit background sync is only available on iOS devices.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sync Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sync settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apple Health Sync</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sync Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sync" size={24} color="#34C759" />
            <Text style={styles.cardTitle}>Sync Status</Text>
          </View>

          {syncStatus && (
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Last Sync</Text>
                <Text style={styles.statusValue}>
                  {syncStatus.lastSyncTime ? formatLastSyncTime(syncStatus.lastSyncTime) : 'Never'}
                </Text>
              </View>

              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: syncStatus.enabled ? '#34C759' : '#8E8E93' }
                  ]} />
                  <Text style={styles.statusValue}>
                    {syncStatus.syncInProgress ? 'Syncing...' : syncStatus.enabled ? 'Active' : 'Paused'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Active Observers</Text>
                <Text style={styles.statusValue}>
                  {syncStatus.activeObservers.length}
                </Text>
              </View>

              {syncMetrics && (
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Sync Success</Text>
                  <Text style={styles.statusValue}>
                    {formatSyncSuccess(syncMetrics.totalSyncs, syncMetrics.successfulSyncs)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Sync Controls */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sync Controls</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Background Sync</Text>
              <Text style={styles.settingDescription}>
                Automatically sync Apple Health data when the app is running
              </Text>
            </View>
            <Switch
              value={syncStatus?.enabled || false}
              onValueChange={handleToggleSync}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Real-time Updates</Text>
              <Text style={styles.settingDescription}>
                Instantly sync new workouts and health data changes
              </Text>
            </View>
            <Switch
              value={syncStatus?.realTimeEnabled || false}
              onValueChange={handleToggleRealTimeSync}
              disabled={!syncStatus?.enabled}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.manualSyncButton,
              (isManualSyncing || !syncStatus?.enabled) && styles.manualSyncButtonDisabled
            ]}
            onPress={handleManualSync}
            disabled={isManualSyncing || !syncStatus?.enabled}
          >
            <Ionicons
              name={isManualSyncing ? "sync" : "refresh"}
              size={20}
              color={isManualSyncing || !syncStatus?.enabled ? "#8E8E93" : "#007AFF"}
            />
            <Text style={[
              styles.manualSyncText,
              (isManualSyncing || !syncStatus?.enabled) && styles.manualSyncTextDisabled
            ]}>
              {isManualSyncing ? 'Syncing...' : 'Manual Sync'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sync Metrics */}
        {syncMetrics && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sync Statistics</Text>

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{syncMetrics.totalSyncs}</Text>
                <Text style={styles.metricLabel}>Total Syncs</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{syncMetrics.successfulSyncs}</Text>
                <Text style={styles.metricLabel}>Successful</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{syncMetrics.failedSyncs}</Text>
                <Text style={styles.metricLabel}>Failed</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {syncMetrics.averageSyncDuration > 0 
                    ? `${Math.round(syncMetrics.averageSyncDuration / 1000)}s`
                    : 'N/A'
                  }
                </Text>
                <Text style={styles.metricLabel}>Avg Duration</Text>
              </View>
            </View>

            {syncMetrics.lastError && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={16} color="#FF3B30" />
                <Text style={styles.errorText}>
                  Last Error: {syncMetrics.lastError}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About Background Sync</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              • Automatically syncs workouts, daily activity, and body composition
            </Text>
            <Text style={styles.infoText}>
              • Real-time observers detect new data immediately
            </Text>
            <Text style={styles.infoText}>
              • Periodic sync ensures no data is missed
            </Text>
            <Text style={styles.infoText}>
              • Battery optimized for background operation
            </Text>
            <Text style={styles.infoText}>
              • All data processing happens locally on your device
            </Text>
          </View>
        </View>

        {/* Data Export */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Export</Text>
          
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => navigation.navigate('AppleHealthExport')}
          >
            <Ionicons name="download-outline" size={20} color="#007AFF" />
            <View style={styles.exportButtonContent}>
              <Text style={styles.exportButtonTitle}>Export Health Data</Text>
              <Text style={styles.exportButtonDescription}>
                Download your Apple Health and nutrition data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notAvailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  notAvailableTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  notAvailableText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    width: '48%',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  manualSyncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  manualSyncButtonDisabled: {
    opacity: 0.5,
  },
  manualSyncText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  manualSyncTextDisabled: {
    color: '#8E8E93',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
    flex: 1,
  },
  infoSection: {
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginTop: 8,
  },
  exportButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  exportButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 2,
  },
  exportButtonDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

export default AppleHealthKitSyncSettingsScreen;
