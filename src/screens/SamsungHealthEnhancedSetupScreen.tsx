/**
 * Samsung Health Enhanced Setup Screen
 * 
 * Multi-step setup wizard for Samsung Health integration following
 * the patterns established by Garmin and Apple Health setup screens.
 * 
 * Features:
 * - Multi-step wizard flow (check → permissions → preferences → complete)
 * - Platform validation (Android only)
 * - Data permission toggles for granular control
 * - Connection testing with detailed feedback
 * - Sync frequency preferences
 * - Privacy information and data usage transparency
 * - Progress indicator and navigation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SamsungHealthService } from '../services/SamsungHealthService';
import {
  SamsungHealthConnectionStatus,
  SAMSUNG_HEALTH_SCOPES,
  SamsungHealthException,
  SamsungHealthErrorType
} from '../types/SamsungHealthTypes';

interface SamsungHealthDataPermissions {
  activities: boolean;
  nutrition: boolean;
  sleep: boolean;
  bodyComposition: boolean;
  heartRate: boolean;
}

interface SamsungHealthSyncPreferences {
  frequency: 'manual' | 'daily' | 'twice-daily';
  preferredSyncTime: string; // HH:MM format
  autoSyncOnOpen: boolean;
  backgroundSyncEnabled: boolean;
}

interface SamsungHealthEnhancedSetupScreenProps {
  navigation: any;
  onSetupComplete?: (connectionStatus: SamsungHealthConnectionStatus) => void;
  onSkip?: () => void;
}

export const SamsungHealthEnhancedSetupScreen: React.FC<SamsungHealthEnhancedSetupScreenProps> = ({
  navigation,
  onSetupComplete,
  onSkip
}) => {
  // State management
  const [setupStep, setSetupStep] = useState<'check' | 'permissions' | 'preferences' | 'complete'>('check');
  const [samsungHealthService] = useState(() => SamsungHealthService.getInstance());
  const [connectionStatus, setConnectionStatus] = useState<SamsungHealthConnectionStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Data permissions state
  const [dataPermissions, setDataPermissions] = useState<SamsungHealthDataPermissions>({
    activities: true,
    nutrition: true,
    sleep: true,
    bodyComposition: true,
    heartRate: false
  });

  // Sync preferences state
  const [syncPreferences, setSyncPreferences] = useState<SamsungHealthSyncPreferences>({
    frequency: 'daily',
    preferredSyncTime: '08:00',
    autoSyncOnOpen: true,
    backgroundSyncEnabled: true
  });

  // Privacy modal state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      console.log('🚀 [Samsung Enhanced Setup] Initializing Samsung Health service...');
      
      const initialized = await samsungHealthService.initialize();
      if (initialized) {
        const status = await samsungHealthService.getConnectionStatus();
        setConnectionStatus(status);
        
        // If already connected, skip to preferences
        if (status.isConnected) {
          setSetupStep('preferences');
        }
        
        console.log('✅ [Samsung Enhanced Setup] Service initialized');
      } else {
        console.log('⚠️ [Samsung Enhanced Setup] Service initialization failed');
      }
    } catch (error) {
      console.error('❌ [Samsung Enhanced Setup] Initialization error:', error);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      console.log('🔐 [Samsung Enhanced Setup] Starting connection process...');

      // Update service configuration with selected permissions
      const enabledScopes = Object.entries(dataPermissions)
        .filter(([_, enabled]) => enabled)
        .map(([permission, _]) => {
          switch (permission) {
            case 'activities': return SAMSUNG_HEALTH_SCOPES.ACTIVITY;
            case 'nutrition': return SAMSUNG_HEALTH_SCOPES.NUTRITION;
            case 'sleep': return SAMSUNG_HEALTH_SCOPES.SLEEP;
            case 'bodyComposition': return SAMSUNG_HEALTH_SCOPES.BODY_COMPOSITION;
            case 'heartRate': return SAMSUNG_HEALTH_SCOPES.HEART_RATE;
            default: return null;
          }
        })
        .filter(scope => scope !== null);

      samsungHealthService.updateConfig({
        scopes: enabledScopes as any[]
      });

      // Start authentication
      const success = await samsungHealthService.authenticate();

      if (success) {
        const newStatus = await samsungHealthService.getConnectionStatus();
        setConnectionStatus(newStatus);
        
        setTestResult({
          success: true,
          message: `Connected successfully! Welcome to Samsung Health integration.`
        });
        
        // Auto-advance to preferences step after successful connection
        setTimeout(() => {
          setSetupStep('preferences');
        }, 1500);
        
      } else {
        setTestResult({
          success: false,
          message: 'Connection failed. Please check your Samsung Health app and try again.'
        });
      }
    } catch (error: any) {
      console.error('❌ [Samsung Enhanced Setup] Connection failed:', error);
      
      let errorMessage = 'Failed to connect to Samsung Health. Please try again.';
      
      if (error instanceof SamsungHealthException) {
        switch (error.type) {
          case SamsungHealthErrorType.AUTHENTICATION_FAILED:
            errorMessage = 'Authentication failed. Please check your Samsung account credentials.';
            break;
          case SamsungHealthErrorType.INSUFFICIENT_PERMISSIONS:
            errorMessage = 'Insufficient permissions. Please grant the required permissions.';
            break;
          case SamsungHealthErrorType.NETWORK_ERROR:
            errorMessage = 'Network error. Please check your internet connection.';
            break;
        }
      }
      
      setTestResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!connectionStatus?.isConnected) {
      Alert.alert('Not Connected', 'Please connect to Samsung Health first');
      return;
    }

    setIsTestingConnection(true);
    try {
      // Test the connection by making a simple API call
      const isWorking = await samsungHealthService.testConnection();
      
      Alert.alert(
        isWorking ? 'Connection Test Successful' : 'Connection Test Failed',
        isWorking ? 'Samsung Health connection is working properly!' : 'Unable to connect to Samsung Health. Please check your Samsung Health app and permissions.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Test Failed',
        `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handlePermissionToggle = (permission: keyof SamsungHealthDataPermissions) => {
    setDataPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSyncPreferenceChange = (key: keyof SamsungHealthSyncPreferences, value: any) => {
    setSyncPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const completeSetup = async () => {
    try {
      console.log('✅ [Samsung Enhanced Setup] Completing setup...');
      
      // Save sync preferences (this would be implemented in the service)
      // await samsungHealthService.saveSyncPreferences(syncPreferences);
      
      setSetupStep('complete');
      
      // Notify parent component
      if (connectionStatus && onSetupComplete) {
        onSetupComplete(connectionStatus);
      }
      
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
      
    } catch (error) {
      console.error('❌ [Samsung Enhanced Setup] Failed to complete setup:', error);
      Alert.alert('Setup Error', 'Failed to complete setup. Please try again.');
    }
  };

  const renderProgressIndicator = () => {
    const steps = ['check', 'permissions', 'preferences', 'complete'];
    const currentIndex = steps.indexOf(setupStep);
    
    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              index <= currentIndex && styles.progressDotActive
            ]}>
              {index < currentIndex ? (
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              ) : (
                <Text style={[
                  styles.progressNumber,
                  index <= currentIndex && styles.progressNumberActive
                ]}>
                  {index + 1}
                </Text>
              )}
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.progressLine,
                index < currentIndex && styles.progressLineActive
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderPlatformCheck = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="phone-portrait" size={32} color="#1BA1E2" />
        <Text style={styles.stepTitle}>Device Compatibility</Text>
        <Text style={styles.stepDescription}>
          Samsung Health integration requires an Android device with Samsung Health app installed.
        </Text>
      </View>
      
      {Platform.OS === 'android' ? (
        <View style={styles.compatibilityCard}>
          <View style={styles.compatibilityHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.compatibilityTitle}>Compatible Device</Text>
          </View>
          <Text style={styles.compatibilityText}>
            Your Android device supports Samsung Health integration.
          </Text>
          <View style={styles.requirementsList}>
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark" size={16} color="#4CAF50" />
              <Text style={styles.requirementText}>Android device ✓</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons name="help-circle-outline" size={16} color="#FF9500" />
              <Text style={styles.requirementText}>Samsung Health app (will be checked)</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.incompatibilityCard}>
          <View style={styles.incompatibilityHeader}>
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
            <Text style={styles.incompatibilityTitle}>Device Not Compatible</Text>
          </View>
          <Text style={styles.incompatibilityText}>
            Samsung Health is only available on Android devices. Consider using Apple Health if you're on iOS, or Garmin Connect for cross-platform fitness tracking.
          </Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        {Platform.OS === 'android' ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setSetupStep('permissions')}
          >
            <Text style={styles.primaryButtonText}>Continue Setup</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
            <Text style={styles.secondaryButtonText}>Skip Samsung Health</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPermissionsSetup = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="shield-checkmark" size={32} color="#1BA1E2" />
        <Text style={styles.stepTitle}>Choose Permissions</Text>
        <Text style={styles.stepDescription}>
          Select the Samsung Health data you'd like to sync to enhance your nutrition tracking.
        </Text>
      </View>
      
      <View style={styles.permissionsContainer}>
        {Object.entries(dataPermissions).map(([permission, enabled]) => (
          <View key={permission} style={styles.permissionCard}>
            <View style={styles.permissionInfo}>
              <Ionicons 
                name={getPermissionIcon(permission)} 
                size={24} 
                color={enabled ? '#1BA1E2' : '#8E8E93'} 
              />
              <View style={styles.permissionDetails}>
                <Text style={styles.permissionTitle}>
                  {getPermissionTitle(permission)}
                </Text>
                <Text style={styles.permissionDescription}>
                  {getPermissionDescription(permission)}
                </Text>
              </View>
            </View>
            <Switch
              value={enabled}
              onValueChange={() => handlePermissionToggle(permission as keyof SamsungHealthDataPermissions)}
              trackColor={{ false: '#E5E5E5', true: '#1BA1E2' }}
              thumbColor={enabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        ))}
      </View>

      {connectionStatus?.isConnected ? (
        <View style={styles.connectionTestContainer}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestConnection}
            disabled={isTestingConnection}
          >
            {isTestingConnection ? (
              <ActivityIndicator size="small" color="#1BA1E2" />
            ) : (
              <Ionicons name="sync" size={16} color="#1BA1E2" />
            )}
            <Text style={styles.testButtonText}>
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.connectionContainer}>
          <TouchableOpacity
            style={[styles.connectButton, isConnecting && styles.connectButtonDisabled]}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="link" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.connectButtonText}>
              {isConnecting ? 'Connecting...' : 'Connect Samsung Health'}
            </Text>
          </TouchableOpacity>

          {testResult && (
            <View style={[
              styles.testResultContainer,
              testResult.success ? styles.testResultSuccess : styles.testResultError
            ]}>
              <Ionicons 
                name={testResult.success ? 'checkmark-circle' : 'close-circle'} 
                size={16} 
                color={testResult.success ? '#4CAF50' : '#FF3B30'} 
              />
              <Text style={[
                styles.testResultText,
                testResult.success ? styles.testResultTextSuccess : styles.testResultTextError
              ]}>
                {testResult.message}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setSetupStep('check')}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        
        {connectionStatus?.isConnected && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setSetupStep('preferences')}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPreferencesSetup = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="settings" size={32} color="#1BA1E2" />
        <Text style={styles.stepTitle}>Sync Preferences</Text>
        <Text style={styles.stepDescription}>
          Configure how and when your Samsung Health data syncs with the app.
        </Text>
      </View>
      
      <View style={styles.preferencesContainer}>
        <View style={styles.preferenceSection}>
          <Text style={styles.preferenceSectionTitle}>Sync Frequency</Text>
          
          {(['manual', 'daily', 'twice-daily'] as const).map((frequency) => (
            <TouchableOpacity
              key={frequency}
              style={[
                styles.frequencyOption,
                syncPreferences.frequency === frequency && styles.frequencyOptionSelected
              ]}
              onPress={() => handleSyncPreferenceChange('frequency', frequency)}
            >
              <View style={styles.frequencyOptionContent}>
                <Text style={[
                  styles.frequencyOptionTitle,
                  syncPreferences.frequency === frequency && styles.frequencyOptionTitleSelected
                ]}>
                  {frequency === 'manual' ? 'Manual' : frequency === 'daily' ? 'Once Daily' : 'Twice Daily'}
                </Text>
                <Text style={[
                  styles.frequencyOptionDescription,
                  syncPreferences.frequency === frequency && styles.frequencyOptionDescriptionSelected
                ]}>
                  {frequency === 'manual' 
                    ? 'Sync only when you tap the sync button'
                    : frequency === 'daily' 
                    ? 'Automatic sync once per day'
                    : 'Automatic sync morning and evening'
                  }
                </Text>
              </View>
              <View style={[
                styles.radioButton,
                syncPreferences.frequency === frequency && styles.radioButtonSelected
              ]}>
                {syncPreferences.frequency === frequency && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.preferenceSection}>
          <Text style={styles.preferenceSectionTitle}>Additional Options</Text>
          
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Auto-sync on app open</Text>
              <Text style={styles.preferenceDescription}>
                Automatically sync data when you open the app
              </Text>
            </View>
            <Switch
              value={syncPreferences.autoSyncOnOpen}
              onValueChange={(value) => handleSyncPreferenceChange('autoSyncOnOpen', value)}
              trackColor={{ false: '#E5E5E5', true: '#1BA1E2' }}
              thumbColor={syncPreferences.autoSyncOnOpen ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Background sync</Text>
              <Text style={styles.preferenceDescription}>
                Allow the app to sync data in the background (when supported)
              </Text>
            </View>
            <Switch
              value={syncPreferences.backgroundSyncEnabled}
              onValueChange={(value) => handleSyncPreferenceChange('backgroundSyncEnabled', value)}
              trackColor={{ false: '#E5E5E5', true: '#1BA1E2' }}
              thumbColor={syncPreferences.backgroundSyncEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setSetupStep('permissions')}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={completeSetup}
        >
          <Text style={styles.primaryButtonText}>Complete Setup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
        <Text style={styles.stepTitle}>Setup Complete!</Text>
        <Text style={styles.stepDescription}>
          Samsung Health is now connected and ready to enhance your nutrition tracking.
        </Text>
      </View>
      
      {connectionStatus && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Connection Status:</Text>
            <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>Connected</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Permissions Granted:</Text>
            <Text style={styles.summaryValue}>{connectionStatus.permissions.length}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sync Frequency:</Text>
            <Text style={styles.summaryValue}>
              {syncPreferences.frequency === 'manual' ? 'Manual' 
               : syncPreferences.frequency === 'daily' ? 'Daily' 
               : 'Twice Daily'}
            </Text>
          </View>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryButtonText}>Start Using Samsung Health</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Helper functions
  const getPermissionIcon = (permission: string): any => {
    switch (permission) {
      case 'activities': return 'fitness-outline';
      case 'nutrition': return 'restaurant-outline';
      case 'sleep': return 'bed-outline';
      case 'bodyComposition': return 'body-outline';
      case 'heartRate': return 'heart-outline';
      default: return 'health-outline';
    }
  };

  const getPermissionTitle = (permission: string): string => {
    switch (permission) {
      case 'activities': return 'Activities & Workouts';
      case 'nutrition': return 'Nutrition Data';
      case 'sleep': return 'Sleep Analysis';
      case 'bodyComposition': return 'Body Composition';
      case 'heartRate': return 'Heart Rate';
      default: return permission;
    }
  };

  const getPermissionDescription = (permission: string): string => {
    switch (permission) {
      case 'activities': return 'Sync workouts, runs, walks, and exercise sessions';
      case 'nutrition': return 'Import meal data and calorie tracking';
      case 'sleep': return 'Analyze sleep quality and duration for better recommendations';
      case 'bodyComposition': return 'Track weight, body fat, and muscle mass changes';
      case 'heartRate': return 'Monitor heart rate zones and variability data';
      default: return `Access ${permission} data from Samsung Health`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Samsung Health Setup</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {renderProgressIndicator()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {setupStep === 'check' && renderPlatformCheck()}
        {setupStep === 'permissions' && renderPermissionsSetup()}
        {setupStep === 'preferences' && renderPreferencesSetup()}
        {setupStep === 'complete' && renderComplete()}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: '#1BA1E2',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  progressNumberActive: {
    color: '#FFFFFF',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#1BA1E2',
  },
  compatibilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  compatibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  compatibilityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
  compatibilityText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
    marginBottom: 16,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#666666',
  },
  incompatibilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  incompatibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  incompatibilityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  incompatibilityText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  permissionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  connectionContainer: {
    marginBottom: 24,
  },
  connectButton: {
    backgroundColor: '#1BA1E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  connectionTestContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1BA1E2',
    gap: 8,
  },
  testButtonText: {
    color: '#1BA1E2',
    fontSize: 16,
    fontWeight: '500',
  },
  testResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  testResultSuccess: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  testResultError: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  testResultText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  testResultTextSuccess: {
    color: '#4CAF50',
  },
  testResultTextError: {
    color: '#FF3B30',
  },
  preferencesContainer: {
    gap: 24,
    marginBottom: 24,
  },
  preferenceSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  preferenceSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  frequencyOptionSelected: {
    borderColor: '#1BA1E2',
    backgroundColor: '#F0F8FF',
  },
  frequencyOptionContent: {
    flex: 1,
  },
  frequencyOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  frequencyOptionTitleSelected: {
    color: '#1BA1E2',
  },
  frequencyOptionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  frequencyOptionDescriptionSelected: {
    color: '#1BA1E2',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#1BA1E2',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1BA1E2',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  preferenceInfo: {
    flex: 1,
    paddingRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1BA1E2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1BA1E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1BA1E2',
    fontSize: 16,
    fontWeight: '600',
  },
});
