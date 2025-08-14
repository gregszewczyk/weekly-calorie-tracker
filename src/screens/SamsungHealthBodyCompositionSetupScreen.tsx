/**
 * Samsung Health Body Composition Setup Screen
 * 
 * Setup and management screen for Samsung Health body composition integration
 * Allows users to configure sync settings, test connection, and view data overview
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SamsungHealthService } from '../services/SamsungHealthService';
import { SamsungHealthBodyCompositionService } from '../services/SamsungHealthBodyCompositionService';
import { useCalorieStore } from '../stores/calorieStore';

interface SamsungHealthBodyCompositionSetupScreenProps {
  // Optional props for configuration
}

const SamsungHealthBodyCompositionSetupScreen: React.FC<SamsungHealthBodyCompositionSetupScreenProps> = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncFrequency: 'daily',
    includeBodyFat: true,
    includeMuscleMass: true,
    includeBMI: true,
    includeBodyWater: true
  });
  const [connectionStatus, setConnectionStatus] = useState({
    lastSync: null as Date | null,
    totalEntries: 0,
    lastEntry: null as any
  });

  const samsungHealthService = SamsungHealthService.getInstance();
  const bodyCompositionService = new SamsungHealthBodyCompositionService();
  const { weightEntries } = useCalorieStore();

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    setIsLoading(true);
    try {
      const connected = await samsungHealthService.isConnected();
      setIsConnected(connected);

      if (connected) {
        // Get recent data to show status
        const recentData = await bodyCompositionService.getRecentBodyCompositionTrend(7);
        setConnectionStatus({
          lastSync: new Date(),
          totalEntries: recentData.length,
          lastEntry: recentData.length > 0 ? recentData[recentData.length - 1] : null
        });
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Not Available',
        'Samsung Health is only available on Android devices. Please use the app on an Android device with Samsung Health installed.'
      );
      return;
    }

    setIsConnecting(true);
    try {
      const success = await samsungHealthService.authenticate();
      if (success) {
        setIsConnected(true);
        Alert.alert(
          'Connected!',
          'Successfully connected to Samsung Health. You can now sync your body composition data.'
        );
        await checkConnectionStatus();
      } else {
        Alert.alert(
          'Connection Failed',
          'Failed to connect to Samsung Health. Please ensure Samsung Health is installed and try again.'
        );
      }
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert(
        'Connection Error',
        'An error occurred while connecting to Samsung Health. Please try again.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Samsung Health',
      'Are you sure you want to disconnect from Samsung Health? Your existing data will remain in the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await samsungHealthService.disconnect();
              setIsConnected(false);
              setConnectionStatus({
                lastSync: null,
                totalEntries: 0,
                lastEntry: null
              });
              Alert.alert('Disconnected', 'Samsung Health has been disconnected.');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect from Samsung Health.');
            }
          }
        }
      ]
    );
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const testData = await bodyCompositionService.getBodyComposition(new Date());
      if (testData) {
        Alert.alert(
          'Connection Test Successful',
          `Successfully retrieved body composition data:\n\nWeight: ${testData.weight.toFixed(1)}kg\n${testData.bodyFat ? `Body Fat: ${testData.bodyFat.toFixed(1)}%` : 'Body Fat: Not available'}`
        );
      } else {
        Alert.alert(
          'No Data Available',
          'Connection is working, but no body composition data was found for today. Try weighing yourself with a Samsung Health compatible scale.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Connection Test Failed',
        'Failed to retrieve data from Samsung Health. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullSync = async () => {
    setIsLoading(true);
    try {
      const syncResult = await bodyCompositionService.syncWithCalorieStore(weightEntries, 30);
      
      if (syncResult.syncedEntries.length > 0) {
        // Add synced entries to CalorieStore
        const { addWeightEntry } = useCalorieStore.getState();
        
        for (const entry of syncResult.syncedEntries) {
          addWeightEntry(entry.weight);
        }

        Alert.alert(
          'Sync Complete',
          `Successfully synced ${syncResult.syncedEntries.length} body composition entries from the last 30 days.`
        );

        await checkConnectionStatus();
      } else {
        Alert.alert(
          'Sync Complete',
          'No new body composition data to sync. Your data is up to date.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Sync Error',
        'Failed to sync data from Samsung Health. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSettingChange = (setting: string, value: boolean | string) => {
    setSyncSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  if (isLoading && !isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Checking Samsung Health connection...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Samsung Health Body Composition</Text>
        <Text style={styles.subtitle}>
          Sync your weight, body fat, muscle mass, and other body composition metrics from Samsung Health for enhanced tracking and insights.
        </Text>
      </View>

      {/* Connection Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Connection Status</Text>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#34C759' : '#FF3B30' }]} />
        </View>
        
        <Text style={[styles.statusText, { color: isConnected ? '#34C759' : '#FF3B30' }]}>
          {isConnected ? 'Connected to Samsung Health' : 'Not connected'}
        </Text>

        {isConnected && connectionStatus.lastEntry && (
          <View style={styles.statusDetails}>
            <Text style={styles.statusDetail}>
              Last sync: {connectionStatus.lastSync?.toLocaleDateString() || 'Never'}
            </Text>
            <Text style={styles.statusDetail}>
              Latest measurement: {connectionStatus.lastEntry.weight.toFixed(1)}kg
            </Text>
            <Text style={styles.statusDetail}>
              Total entries: {connectionStatus.totalEntries}
            </Text>
          </View>
        )}
      </View>

      {/* Connection Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Connection Actions</Text>
        
        {!isConnected ? (
          <TouchableOpacity 
            style={[styles.primaryButton, isConnecting && styles.buttonDisabled]} 
            onPress={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Connect to Samsung Health</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.connectedActions}>
            <TouchableOpacity 
              style={[styles.secondaryButton, isLoading && styles.buttonDisabled]} 
              onPress={handleTestConnection}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.secondaryButtonText}>Test Connection</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]} 
              onPress={handleFullSync}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Sync Data (30 days)</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.dangerButton} 
              onPress={handleDisconnect}
            >
              <Text style={styles.dangerButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sync Settings */}
      {isConnected && (
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Sync Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Automatic Sync</Text>
            <Switch
              value={syncSettings.autoSync}
              onValueChange={(value) => handleSyncSettingChange('autoSync', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={syncSettings.autoSync ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Include Body Fat %</Text>
            <Switch
              value={syncSettings.includeBodyFat}
              onValueChange={(value) => handleSyncSettingChange('includeBodyFat', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={syncSettings.includeBodyFat ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Include Muscle Mass</Text>
            <Switch
              value={syncSettings.includeMuscleMass}
              onValueChange={(value) => handleSyncSettingChange('includeMuscleMass', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={syncSettings.includeMuscleMass ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Include BMI</Text>
            <Switch
              value={syncSettings.includeBMI}
              onValueChange={(value) => handleSyncSettingChange('includeBMI', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={syncSettings.includeBMI ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Include Body Water</Text>
            <Switch
              value={syncSettings.includeBodyWater}
              onValueChange={(value) => handleSyncSettingChange('includeBodyWater', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={syncSettings.includeBodyWater ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>
      )}

      {/* Information */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>About Body Composition Tracking</Text>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>📊 Enhanced Insights</Text>
          <Text style={styles.infoText}>
            Track more than just weight - monitor body fat percentage, muscle mass, and other key metrics for a complete picture of your health progress.
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>🎯 Better Goal Tracking</Text>
          <Text style={styles.infoText}>
            Body composition data helps distinguish between muscle gain and fat loss, ensuring your fitness goals are on track.
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>🔄 Automatic Integration</Text>
          <Text style={styles.infoText}>
            Your Samsung Health body composition data seamlessly integrates with your existing weight tracking and calorie management.
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>📱 Compatible Devices</Text>
          <Text style={styles.infoText}>
            Works with Samsung Health compatible smart scales and body composition monitors. Ensure your device is connected to Samsung Health first.
          </Text>
        </View>
      </View>

      {/* Integration Status */}
      <View style={styles.integrationCard}>
        <Text style={styles.cardTitle}>App Integration</Text>
        <Text style={styles.integrationText}>
          📊 {weightEntries.length} weight entries in your tracking history
        </Text>
        <Text style={styles.integrationSubtext}>
          Body composition data from Samsung Health will enhance your existing weight tracking with detailed insights about body fat, muscle mass, and health trends.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  headerSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
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
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  statusDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  dangerButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  connectedActions: {
    // No specific styles needed
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  integrationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  integrationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  integrationSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default SamsungHealthBodyCompositionSetupScreen;
