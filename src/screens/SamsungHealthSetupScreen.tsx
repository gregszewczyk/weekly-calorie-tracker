/**
 * Samsung Health Setup Screen
 * 
 * User interface for connecting to Samsung Health with OAuth flow,
 * permission selection, and connection testing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SamsungHealthService } from '../services/SamsungHealthService';
import {
  SamsungHealthConnectionStatus,
  SAMSUNG_HEALTH_SCOPES,
  SamsungHealthException,
  SamsungHealthErrorType
} from '../types/SamsungHealthTypes';

interface SamsungHealthSetupScreenProps {
  navigation: any;
  onSetupComplete?: (connectionStatus: SamsungHealthConnectionStatus) => void;
  onSkip?: () => void;
}

export const SamsungHealthSetupScreen: React.FC<SamsungHealthSetupScreenProps> = ({
  navigation,
  onSetupComplete,
  onSkip
}) => {
  const [samsungHealthService] = useState(() => SamsungHealthService.getInstance());
  const [connectionStatus, setConnectionStatus] = useState<SamsungHealthConnectionStatus>({
    isConnected: false,
    isAuthenticating: false,
    lastSyncTime: null,
    connectionError: null,
    userId: null,
    permissions: []
  });

  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({
    [SAMSUNG_HEALTH_SCOPES.ACTIVITY]: true,
    [SAMSUNG_HEALTH_SCOPES.NUTRITION]: true,
    [SAMSUNG_HEALTH_SCOPES.SLEEP]: true,
    [SAMSUNG_HEALTH_SCOPES.BODY_COMPOSITION]: true,
    [SAMSUNG_HEALTH_SCOPES.HEART_RATE]: true,
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      console.log('🚀 [Samsung Setup] Initializing Samsung Health service...');
      
      const initialized = await samsungHealthService.initialize();
      if (initialized) {
        const status = await samsungHealthService.getConnectionStatus();
        setConnectionStatus(status);
        console.log('✅ [Samsung Setup] Service initialized');
      } else {
        console.log('⚠️ [Samsung Setup] Service initialization failed');
      }
    } catch (error) {
      console.error('❌ [Samsung Setup] Initialization error:', error);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize Samsung Health service. Please try again.'
      );
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus(prev => ({ ...prev, isAuthenticating: true, connectionError: null }));

      console.log('🔐 [Samsung Setup] Starting connection process...');

      // Update service configuration with selected permissions
      const enabledScopes = Object.entries(selectedPermissions)
        .filter(([_, enabled]) => enabled)
        .map(([scope, _]) => scope);

      samsungHealthService.updateConfig({
        scopes: enabledScopes as any[]
      });

      // Start authentication
      const success = await samsungHealthService.authenticate();

      if (success) {
        const newStatus = await samsungHealthService.getConnectionStatus();
        setConnectionStatus(newStatus);

        Alert.alert(
          'Connection Successful! 🎉',
          'Your Samsung Health account has been connected successfully. You can now sync your fitness data.',
          [
            {
              text: 'Test Connection',
              onPress: handleTestConnection
            },
            {
              text: 'Continue',
              style: 'default',
              onPress: () => {
                onSetupComplete?.(newStatus);
              }
            }
          ]
        );
      } else {
        throw new Error('Authentication failed');
      }

    } catch (error) {
      console.error('❌ [Samsung Setup] Connection failed:', error);
      
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

      setConnectionStatus(prev => ({
        ...prev,
        isAuthenticating: false,
        connectionError: errorMessage
      }));

      Alert.alert('Connection Failed', errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTestingConnection(true);
      console.log('🔍 [Samsung Setup] Testing connection...');

      const isWorking = await samsungHealthService.testConnection();

      if (isWorking) {
        Alert.alert(
          'Connection Test Successful! ✅',
          'Your Samsung Health connection is working properly.',
          [{ text: 'Great!', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Connection Test Failed ❌',
          'The connection test failed. Please try reconnecting.',
          [
            { text: 'Reconnect', onPress: handleReconnect },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ [Samsung Setup] Connection test failed:', error);
      Alert.alert('Test Failed', 'Connection test failed. Please try again.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleReconnect = async () => {
    try {
      await samsungHealthService.disconnect();
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: false,
        connectionError: null
      }));
      await handleConnect();
    } catch (error) {
      console.error('❌ [Samsung Setup] Reconnection failed:', error);
      Alert.alert('Reconnection Failed', 'Failed to reconnect. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    try {
      Alert.alert(
        'Disconnect Samsung Health',
        'Are you sure you want to disconnect your Samsung Health account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              await samsungHealthService.disconnect();
              const status = await samsungHealthService.getConnectionStatus();
              setConnectionStatus(status);
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ [Samsung Setup] Disconnect failed:', error);
      Alert.alert('Disconnect Failed', 'Failed to disconnect. Please try again.');
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Samsung Health Setup',
      'You can always connect Samsung Health later from the settings.',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Skip',
          style: 'default',
          onPress: () => {
            onSkip?.();
          }
        }
      ]
    );
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const getPermissionDescription = (permission: string): string => {
    switch (permission) {
      case SAMSUNG_HEALTH_SCOPES.ACTIVITY:
        return 'Workouts, steps, and exercise sessions';
      case SAMSUNG_HEALTH_SCOPES.NUTRITION:
        return 'Food logging and nutrition data';
      case SAMSUNG_HEALTH_SCOPES.SLEEP:
        return 'Sleep duration and quality metrics';
      case SAMSUNG_HEALTH_SCOPES.BODY_COMPOSITION:
        return 'Weight, body fat, and composition data';
      case SAMSUNG_HEALTH_SCOPES.HEART_RATE:
        return 'Heart rate and variability data';
      default:
        return 'Health data access';
    }
  };

  const getPermissionIcon = (permission: string): string => {
    switch (permission) {
      case SAMSUNG_HEALTH_SCOPES.ACTIVITY:
        return 'fitness-outline';
      case SAMSUNG_HEALTH_SCOPES.NUTRITION:
        return 'restaurant-outline';
      case SAMSUNG_HEALTH_SCOPES.SLEEP:
        return 'bed-outline';
      case SAMSUNG_HEALTH_SCOPES.BODY_COMPOSITION:
        return 'body-outline';
      case SAMSUNG_HEALTH_SCOPES.HEART_RATE:
        return 'heart-outline';
      default:
        return 'health-outline';
    }
  };

  // Platform check
  if (Platform.OS !== 'android') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="phone-portrait-outline" size={64} color="#8E8E93" />
          <Text style={styles.notAvailableTitle}>Samsung Health Integration</Text>
          <Text style={styles.notAvailableText}>
            Samsung Health integration is only available on Android devices with Samsung Health app installed.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="phone-portrait" size={32} color="#1BA1E2" />
              <Text style={styles.logoText}>Samsung Health</Text>
            </View>
            <Text style={styles.headerTitle}>Connect Your Health Data</Text>
            <Text style={styles.headerSubtitle}>
              Sync your Samsung Health data to enhance your nutrition tracking with AI-powered insights
            </Text>
          </View>
        </View>

        {/* Connection Status */}
        {connectionStatus.isConnected ? (
          <View style={styles.connectedSection}>
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                <Text style={styles.connectedText}>Connected to Samsung Health</Text>
              </View>
              {connectionStatus.userId && (
                <Text style={styles.userIdText}>User ID: {connectionStatus.userId}</Text>
              )}
              <View style={styles.permissionsList}>
                <Text style={styles.permissionsTitle}>Active Permissions:</Text>
                {connectionStatus.permissions.map((permission, index) => (
                  <View key={index} style={styles.permissionItem}>
                    <Ionicons 
                      name={getPermissionIcon(permission) as any} 
                      size={16} 
                      color="#28a745" 
                    />
                    <Text style={styles.permissionText}>{getPermissionDescription(permission)}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.connectedActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.testButton]}
                  onPress={handleTestConnection}
                  disabled={isTestingConnection}
                >
                  {isTestingConnection ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Ionicons name="refresh" size={16} color="#007AFF" />
                  )}
                  <Text style={styles.testButtonText}>
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.disconnectButton]}
                  onPress={handleDisconnect}
                >
                  <Ionicons name="unlink" size={16} color="#dc3545" />
                  <Text style={styles.disconnectButtonText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* Data Permissions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Data to Sync</Text>
              <Text style={styles.sectionSubtitle}>
                Select the Samsung Health data you want to integrate with your nutrition tracking
              </Text>

              {Object.entries(selectedPermissions).map(([permission, enabled]) => (
                <View key={permission} style={styles.permissionCard}>
                  <View style={styles.permissionInfo}>
                    <Ionicons 
                      name={getPermissionIcon(permission) as any} 
                      size={24} 
                      color={enabled ? "#007AFF" : "#8E8E93"} 
                    />
                    <View style={styles.permissionDetails}>
                      <Text style={styles.permissionTitle}>
                        {permission.split(':').pop()?.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.permissionDescription}>
                        {getPermissionDescription(permission)}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={enabled}
                    onValueChange={() => togglePermission(permission)}
                    trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ))}
            </View>

            {/* Connection Error */}
            {connectionStatus.connectionError && (
              <View style={styles.errorSection}>
                <View style={styles.errorCard}>
                  <Ionicons name="warning" size={20} color="#dc3545" />
                  <Text style={styles.errorText}>{connectionStatus.connectionError}</Text>
                </View>
              </View>
            )}

            {/* Connect Button */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  (isConnecting || connectionStatus.isAuthenticating) && styles.connectButtonDisabled
                ]}
                onPress={handleConnect}
                disabled={isConnecting || connectionStatus.isAuthenticating}
              >
                {isConnecting || connectionStatus.isAuthenticating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="link" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.connectButtonText}>
                  {isConnecting || connectionStatus.isAuthenticating
                    ? 'Connecting...'
                    : 'Connect Samsung Health'
                  }
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Information */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Samsung Health Integration</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Automatically sync workouts and daily activity</Text>
            <Text style={styles.infoItem}>• Get AI nutrition recommendations based on your activity level</Text>
            <Text style={styles.infoItem}>• Track sleep quality and its impact on your goals</Text>
            <Text style={styles.infoItem}>• Monitor body composition changes over time</Text>
            <Text style={styles.infoItem}>• All data processing happens locally on your device</Text>
          </View>
        </View>

        {/* Setup Guide */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Setup Requirements</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Samsung device with Samsung Health app installed</Text>
            <Text style={styles.infoItem}>• Samsung account signed in to Samsung Health</Text>
            <Text style={styles.infoItem}>• Internet connection for initial setup</Text>
            <Text style={styles.infoItem}>• Permission to access your health data</Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flex: 1,
    marginLeft: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1BA1E2',
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
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
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  connectedSection: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#28a745',
    marginLeft: 8,
  },
  userIdText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  permissionsList: {
    marginBottom: 20,
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  connectedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  testButton: {
    backgroundColor: '#F2F2F7',
  },
  testButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  disconnectButton: {
    backgroundColor: '#FFEBEE',
  },
  disconnectButtonText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  permissionText: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 8,
  },
  errorSection: {
    paddingHorizontal: 20,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  connectButton: {
    backgroundColor: '#1BA1E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  infoList: {
    marginLeft: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default SamsungHealthSetupScreen;
