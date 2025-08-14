/**
 * Apple HealthKit Setup Screen
 * 
 * Comprehensive setup flow for Apple HealthKit integration with
 * permission management, availability checking, and user guidance.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthKitPermissionCard } from '../components/HealthKitPermissionCard';
import { AppleWorkoutSync } from '../components/AppleWorkoutSync';
import { AppleHealthMetrics } from '../components/AppleHealthMetrics';
import { AppleBodyComposition } from '../components/AppleBodyComposition';
import { appleHealthKitService } from '../services/AppleHealthKitService';
import {
  HealthKitAvailability,
  HealthKitPermissionStatus,
  HealthKitConnectionStatus,
  HEALTHKIT_PERMISSION_GROUPS,
  HealthKitPermissionGroup,
  DEFAULT_SETUP_CONFIG,
} from '../types/AppleHealthKitTypes';

interface AppleHealthKitSetupScreenProps {
  onSetupComplete?: (connectionStatus: HealthKitConnectionStatus) => void;
  onSkip?: () => void;
  initialPermissionGroups?: string[];
}

export const AppleHealthKitSetupScreen: React.FC<AppleHealthKitSetupScreenProps> = ({
  onSetupComplete,
  onSkip,
  initialPermissionGroups = DEFAULT_SETUP_CONFIG.permissionGroups,
}) => {
  const [availability, setAvailability] = useState<HealthKitAvailability | null>(null);
  const [permissionStatuses, setPermissionStatuses] = useState<HealthKitPermissionStatus[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<HealthKitConnectionStatus | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(
    new Set(initialPermissionGroups)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentStep, setCurrentStep] = useState<'check' | 'permissions' | 'workouts' | 'metrics' | 'body-composition' | 'testing' | 'complete'>('check');

  useEffect(() => {
    initializeHealthKit();
  }, []);

  const initializeHealthKit = async () => {
    setIsInitializing(true);
    
    try {
      console.log('🚀 [HealthKitSetup] Initializing HealthKit setup...');
      
      // Check availability
      const availabilityResult = await appleHealthKitService.isAvailable();
      setAvailability(availabilityResult);
      
      if (!availabilityResult.isAvailable) {
        setCurrentStep('check');
        setIsInitializing(false);
        return;
      }

      // Load existing permissions and connection status
      const [statuses, connStatus] = await Promise.all([
        appleHealthKitService.getAllPermissionStatuses(),
        appleHealthKitService.getConnectionStatus(),
      ]);
      
      setPermissionStatuses(statuses);
      setConnectionStatus(connStatus);
      
      // Determine current step based on existing setup
      if (connStatus.isConnected && connStatus.permissionsGranted.length > 0) {
        setCurrentStep('complete');
      } else {
        setCurrentStep('permissions');
      }
      
    } catch (error) {
      console.error('❌ [HealthKitSetup] Initialization failed:', error);
      Alert.alert(
        'Setup Error',
        'Failed to initialize HealthKit setup. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleGroupToggle = (groupId: string, enabled: boolean) => {
    const newSelectedGroups = new Set(selectedGroups);
    
    if (enabled) {
      newSelectedGroups.add(groupId);
    } else {
      newSelectedGroups.delete(groupId);
    }
    
    setSelectedGroups(newSelectedGroups);
  };

  const handleRequestPermissions = async () => {
    if (selectedGroups.size === 0) {
      Alert.alert(
        'No Permissions Selected',
        'Please select at least one permission group to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    setCurrentStep('testing');
    
    try {
      console.log('🔐 [HealthKitSetup] Requesting permissions for groups:', Array.from(selectedGroups));
      
      // Build permissions object from selected groups
      const permissions = {
        read: [] as string[],
        write: [] as string[],
      };
      
      selectedGroups.forEach(groupId => {
        const group = HEALTHKIT_PERMISSION_GROUPS.find(g => g.id === groupId);
        if (group) {
          permissions.read.push(...group.dataTypes);
          // Add some write permissions for core data types
          if (groupId === 'activity') {
            permissions.write.push('HKQuantityTypeIdentifierActiveEnergyBurned');
          }
          if (groupId === 'workouts') {
            permissions.write.push('HKWorkoutTypeIdentifier');
          }
        }
      });
      
      // Remove duplicates
      permissions.read = [...new Set(permissions.read)];
      permissions.write = [...new Set(permissions.write)];
      
      console.log('📋 [HealthKitSetup] Final permissions:', permissions);
      
      // Request permissions
      const success = await appleHealthKitService.requestPermissions(permissions);
      
      // Refresh statuses
      const [newStatuses, newConnectionStatus] = await Promise.all([
        appleHealthKitService.getAllPermissionStatuses(),
        appleHealthKitService.getConnectionStatus(),
      ]);
      
      setPermissionStatuses(newStatuses);
      setConnectionStatus(newConnectionStatus);
      
      if (success && newConnectionStatus.isConnected) {
        // Go to workout sync step first
        setCurrentStep('workouts');
      } else {
        Alert.alert(
          'Setup Incomplete',
          'Some permissions were not granted. You can continue with limited functionality or adjust permissions in the Health app.',
          [
            { text: 'Continue Anyway', onPress: () => onSetupComplete?.(newConnectionStatus) },
            { text: 'Try Again', onPress: () => setCurrentStep('permissions') },
          ]
        );
      }
      
    } catch (error) {
      console.error('❌ [HealthKitSetup] Permission request failed:', error);
      Alert.alert(
        'Permission Request Failed',
        'Failed to request HealthKit permissions. Please try again or check your device settings.',
        [
          { text: 'Try Again', onPress: () => setCurrentStep('permissions') },
          { text: 'Skip', onPress: onSkip },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    
    try {
      const result = await appleHealthKitService.testConnection();
      
      Alert.alert(
        result.success ? 'Connection Test Successful' : 'Connection Test Failed',
        result.message,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Test Failed',
        `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderAvailabilityCheck = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="phone-portrait" size={32} color="#007AFF" />
        <Text style={styles.stepTitle}>Device Compatibility</Text>
      </View>
      
      {availability ? (
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityHeader}>
            <Ionicons
              name={availability.isAvailable ? "checkmark-circle" : "close-circle"}
              size={24}
              color={availability.isAvailable ? "#34C759" : "#FF3B30"}
            />
            <Text style={[
              styles.availabilityTitle,
              { color: availability.isAvailable ? "#34C759" : "#FF3B30" }
            ]}>
              {availability.isAvailable ? 'HealthKit Available' : 'HealthKit Unavailable'}
            </Text>
          </View>
          
          <Text style={styles.availabilityMessage}>{availability.message}</Text>
          
          {availability.platform && (
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceInfoLabel}>Platform:</Text>
              <Text style={styles.deviceInfoValue}>{availability.platform}</Text>
            </View>
          )}
          
          {availability.version && (
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceInfoLabel}>iOS Version:</Text>
              <Text style={styles.deviceInfoValue}>{availability.version}</Text>
            </View>
          )}
        </View>
      ) : (
        <ActivityIndicator size="large" color="#007AFF" />
      )}
      
      <View style={styles.buttonContainer}>
        {availability?.isAvailable ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setCurrentStep('permissions')}
          >
            <Text style={styles.primaryButtonText}>Continue Setup</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
            <Text style={styles.secondaryButtonText}>Skip HealthKit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPermissionsSetup = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="shield-checkmark" size={32} color="#007AFF" />
        <Text style={styles.stepTitle}>Choose Permissions</Text>
        <Text style={styles.stepDescription}>
          Select the health data you'd like to share to enhance your nutrition tracking.
        </Text>
      </View>
      
      <ScrollView style={styles.permissionsContainer} showsVerticalScrollIndicator={false}>
        {HEALTHKIT_PERMISSION_GROUPS.map(group => (
          <HealthKitPermissionCard
            key={group.id}
            group={group}
            permissionStatuses={permissionStatuses}
            isEnabled={selectedGroups.has(group.id)}
            onToggle={handleGroupToggle}
            disabled={isLoading}
          />
        ))}
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, selectedGroups.size === 0 && styles.disabledButton]}
          onPress={handleRequestPermissions}
          disabled={isLoading || selectedGroups.size === 0}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Request Permissions ({selectedGroups.size})
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip} disabled={isLoading}>
          <Text style={styles.secondaryButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="checkmark-circle" size={32} color="#34C759" />
        <Text style={styles.stepTitle}>Setup Complete!</Text>
        <Text style={styles.stepDescription}>
          HealthKit is now connected and ready to enhance your nutrition tracking.
        </Text>
      </View>
      
      {connectionStatus && (
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Connection Status:</Text>
            <Text style={[styles.statusValue, { color: "#34C759" }]}>Connected</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Permissions Granted:</Text>
            <Text style={styles.statusValue}>{connectionStatus.permissionsGranted.length}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Connection Health:</Text>
            <Text style={[
              styles.statusValue,
              {
                color: connectionStatus.connectionHealth === 'excellent' ? '#34C759' :
                       connectionStatus.connectionHealth === 'good' ? '#007AFF' :
                       connectionStatus.connectionHealth === 'limited' ? '#FF9500' : '#FF3B30'
              }
            ]}>
              {connectionStatus.connectionHealth.charAt(0).toUpperCase() + connectionStatus.connectionHealth.slice(1)}
            </Text>
          </View>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => onSetupComplete?.(connectionStatus!)}
        >
          <Text style={styles.primaryButtonText}>Start Using HealthKit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleTestConnection}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.secondaryButtonText}>Test Connection</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWorkoutSync = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={{ fontSize: 48 }}>🏃‍♂️</Text>
      </View>
      
      <Text style={styles.stepTitle}>Sync Your Workouts</Text>
      <Text style={styles.stepDescription}>
        Connect your Apple Watch workouts to track calories burned during exercise.
        This helps provide more accurate daily calorie calculations.
      </Text>
      
      <AppleWorkoutSync
        onSyncComplete={() => {
          setCurrentStep('body-composition');
        }}
      />
    </View>
  );

  const renderDailyMetrics = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={{ fontSize: 48 }}>📊</Text>
      </View>
      
      <Text style={styles.stepTitle}>Daily Health Metrics</Text>
      <Text style={styles.stepDescription}>
        Review your comprehensive health data from Apple Health including activity, sleep, and heart rate metrics.
      </Text>
      
      <View style={styles.metricsContainer}>
        <AppleHealthMetrics
          showDatePicker={false}
          onMetricsLoaded={(metrics) => {
            console.log('📊 [Setup] Daily metrics loaded:', metrics);
          }}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setCurrentStep('complete')}
        >
          <Text style={styles.primaryButtonText}>Complete Setup</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep('body-composition')}
        >
          <Text style={styles.secondaryButtonText}>Back to Body Composition</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBodyComposition = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={{ fontSize: 48 }}>⚖️</Text>
      </View>
      
      <Text style={styles.stepTitle}>Body Composition Tracking</Text>
      <Text style={styles.stepDescription}>
        Sync your weight and body measurements from Apple Health to track your progress over time.
      </Text>
      
      <View style={styles.metricsContainer}>
        <AppleBodyComposition
          onSyncComplete={() => {
            console.log('⚖️ [Setup] Body composition sync completed');
          }}
          showSyncButton={true}
          autoSync={false}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setCurrentStep('metrics')}
        >
          <Text style={styles.primaryButtonText}>Continue to Metrics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep('workouts')}
        >
          <Text style={styles.secondaryButtonText}>Back to Workouts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Initializing HealthKit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Apple HealthKit Setup</Text>
        <Text style={styles.subtitle}>
          Connect your Health app data for smarter nutrition tracking
        </Text>
      </View>
      
      {currentStep === 'check' && renderAvailabilityCheck()}
      {currentStep === 'permissions' && renderPermissionsSetup()}
      {currentStep === 'workouts' && renderWorkoutSync()}
      {currentStep === 'body-composition' && renderBodyComposition()}
      {currentStep === 'metrics' && renderDailyMetrics()}
      {(currentStep === 'testing' || currentStep === 'complete') && renderComplete()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  availabilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  availabilityMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  deviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  deviceInfoLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  deviceInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  permissionsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#E5E5EA',
  },
  metricsContainer: {
    flex: 1,
    marginVertical: 20,
  },
});
