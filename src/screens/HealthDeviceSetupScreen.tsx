/**
 * Health Device Setup Screen
 * 
 * Unified connection interface for all health platforms:
 * - Garmin Connect
 * - Samsung Health  
 * - Apple HealthKit
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/NavigationTypes';
import { 
  HealthPlatform, 
  HealthDeviceConnection, 
  ConnectionRequest,
  PLATFORM_INFO 
} from '../types/HealthDeviceTypes';
import { healthDeviceManager } from '../services/HealthDeviceManager';
import NetworkTest from '../components/NetworkTest';
import GarminCredentialConsentModal from '../components/GarminCredentialConsentModal';
import { CredentialConsentOptions } from '../services/GarminCredentialManager';

type HealthDeviceSetupNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HealthDeviceSetup'>;

interface Props {
  onConnectionSuccess?: (platform: HealthPlatform, connection: HealthDeviceConnection) => void;
  onSkip?: () => void;
  allowSkip?: boolean;
}

const HealthDeviceSetupScreen: React.FC<Props> = ({ 
  onConnectionSuccess, 
  onSkip, 
  allowSkip = true 
}) => {
  const navigation = useNavigation<HealthDeviceSetupNavigationProp>();
  const { theme } = useTheme();
  
  const [connections, setConnections] = useState<HealthDeviceConnection[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<HealthPlatform | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = () => {
    const currentConnections = healthDeviceManager.getConnections();
    setConnections(currentConnections);
  };

  const handlePlatformSelect = (platform: HealthPlatform) => {
    setSelectedPlatform(platform);
    
    // Check if already connected
    const existingConnection = connections.find(c => c.platform === platform);
    if (existingConnection && existingConnection.status === 'connected') {
      Alert.alert(
        'Already Connected',
        `You're already connected to ${PLATFORM_INFO[platform].displayName}. Would you like to reconnect?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reconnect', onPress: () => connectToPlatform(platform) }
        ]
      );
      return;
    }
    
    connectToPlatform(platform);
  };

  const connectToPlatform = (platform: HealthPlatform) => {
    switch (platform) {
      case 'garmin':
        setCredentials({ username: '', password: '' });
        setShowCredentialsModal(true);
        break;
      case 'samsung':
        // Samsung Health typically uses OAuth or device permissions
        handleSamsungConnection();
        break;
      case 'apple':
        // Apple HealthKit uses native permissions
        handleAppleConnection();
        break;
    }
  };

  const handleGarminConnection = async () => {
    if (!credentials.username || !credentials.password) {
      Alert.alert('Missing Credentials', 'Please enter your Garmin Connect username and password.');
      return;
    }

    setShowCredentialsModal(false);
    setShowConsentModal(true);
  };

  const handleCredentialConsent = async (consentOptions: CredentialConsentOptions) => {
    setShowConsentModal(false);
    setIsConnecting(true);

    try {
      const request: ConnectionRequest = {
        platform: 'garmin',
        credentials: {
          username: credentials.username,
          password: credentials.password
        },
        // Pass consent options to the connection manager
        consentOptions
      };

      const result = await healthDeviceManager.connect(request);
      
      if (result.success && result.connection) {
        loadConnections();
        onConnectionSuccess?.(result.connection.platform, result.connection);
        
        const consentMessage = consentOptions.rememberCredentials 
          ? ' Your login will be remembered securely for seamless reconnection.'
          : '';
        
        Alert.alert(
          'Connected Successfully!',
          `Your Garmin Connect account has been linked. We can now import your activities and training data.${consentMessage}`,
          [{ text: 'Great!', onPress: () => {} }]
        );
      } else {
        Alert.alert(
          'Connection Failed',
          result.error || 'Failed to connect to Garmin Connect. Please check your credentials and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Connection Error',
        error.message || 'An unexpected error occurred while connecting to Garmin Connect.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsConnecting(false);
      setSelectedPlatform(null);
    }
  };

  const handleSamsungConnection = async () => {
    Alert.alert(
      'Samsung Health',
      'Samsung Health integration is coming soon. We\'ll support automatic activity sync and health metrics import.',
      [{ text: 'OK' }]
    );
  };

  const handleAppleConnection = async () => {
    Alert.alert(
      'Apple HealthKit',
      'Apple HealthKit integration is coming soon. We\'ll support workout import and health data sync.',
      [{ text: 'OK' }]
    );
  };

  const handleDisconnect = (platform: HealthPlatform) => {
    Alert.alert(
      'Disconnect Device',
      `Are you sure you want to disconnect from ${PLATFORM_INFO[platform].displayName}? This will stop syncing your activity data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: async () => {
            const success = await healthDeviceManager.disconnect(platform);
            if (success) {
              loadConnections();
            }
          }
        }
      ]
    );
  };

  const getConnectionStatus = (platform: HealthPlatform) => {
    const connection = connections.find(c => c.platform === platform);
    return connection?.status || 'disconnected';
  };

  const renderPlatformCard = (platform: HealthPlatform) => {
    const platformInfo = PLATFORM_INFO[platform];
    const status = getConnectionStatus(platform);
    const connection = connections.find(c => c.platform === platform);
    
    const isConnected = status === 'connected';
    const isConnecting = status === 'connecting';
    const hasError = status === 'error';

    return (
      <View key={platform} style={[styles.platformCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.platformHeader}>
          <View style={styles.platformIcon}>
            <Text style={styles.platformIconText}>{platformInfo.icon}</Text>
          </View>
          <View style={styles.platformInfo}>
            <Text style={[styles.platformName, { color: theme.colors.text }]}>
              {platformInfo.displayName}
            </Text>
            <Text style={[styles.platformDescription, { color: theme.colors.textSecondary }]}>
              {platformInfo.description}
            </Text>
          </View>
        </View>

        <View style={styles.platformStatus}>
          {isConnected && (
            <View style={styles.connectedStatus}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={[styles.statusText, { color: '#4CAF50' }]}>Connected</Text>
              {connection?.deviceName && (
                <Text style={[styles.deviceName, { color: theme.colors.textSecondary }]}>
                  {connection.deviceName}
                </Text>
              )}
            </View>
          )}
          
          {isConnecting && (
            <View style={styles.connectingStatus}>
              <ActivityIndicator size="small" color={platformInfo.color} />
              <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>Connecting...</Text>
            </View>
          )}
          
          {hasError && (
            <View style={styles.errorStatus}>
              <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
              <Text style={[styles.statusText, { color: '#FF6B6B' }]}>Connection Error</Text>
              {connection?.error && (
                <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
                  {connection.error}
                </Text>
              )}
            </View>
          )}
          
          {status === 'disconnected' && (
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: platformInfo.color }]}
              onPress={() => handlePlatformSelect(platform)}
              disabled={isConnecting}
            >
              <Ionicons name="link" size={16} color="#FFFFFF" />
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          )}
          
          {isConnected && (
            <TouchableOpacity
              style={[styles.disconnectButton, { borderColor: theme.colors.textSecondary }]}
              onPress={() => handleDisconnect(platform)}
            >
              <Text style={[styles.disconnectButtonText, { color: theme.colors.textSecondary }]}>
                Disconnect
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const hasAnyConnection = connections.some(c => c.status === 'connected');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Connect Health Devices</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Link your fitness devices to automatically import activities and get personalized nutrition recommendations
          </Text>
        </View>

        {/* Temporary Network Test Component */}
        <NetworkTest />

        <View style={styles.platformList}>
          {renderPlatformCard('garmin')}
          {renderPlatformCard('samsung')}
          {renderPlatformCard('apple')}
        </View>

        {hasAnyConnection && (
          <View style={[styles.successCard, { backgroundColor: theme.colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <Text style={[styles.successText, { color: theme.colors.success }]}>
              Great! Your devices are connected and ready to sync data.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          {allowSkip && (
            <TouchableOpacity 
              style={[styles.skipButton, { borderColor: theme.colors.textSecondary }]}
              onPress={onSkip}
            >
              <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary }]}>
                Skip for Now
              </Text>
            </TouchableOpacity>
          )}
          
          {hasAnyConnection && (
            <TouchableOpacity 
              style={[styles.continueButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.continueButtonText, { color: theme.colors.buttonText }]}>
                Continue
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Garmin Credentials Modal */}
      <Modal
        visible={showCredentialsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCredentialsModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCredentialsModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Connect Garmin
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
              Enter your Garmin Connect credentials to sync your activities and training data.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Username or Email</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                value={credentials.username}
                onChangeText={(text) => setCredentials(prev => ({ ...prev, username: text }))}
                placeholder="Enter username or email"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Password</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                value={credentials.password}
                onChangeText={(text) => setCredentials(prev => ({ ...prev, password: text }))}
                placeholder="Enter password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { 
                backgroundColor: PLATFORM_INFO.garmin.color,
                opacity: isConnecting ? 0.6 : 1
              }]}
              onPress={handleGarminConnection}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="link" size={16} color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>Connect to Garmin</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.securityNote, { color: theme.colors.textSecondary }]}>
              🔒 Your credentials are securely transmitted and not stored on your device.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Credential Consent Modal */}
      <GarminCredentialConsentModal
        visible={showConsentModal}
        username={credentials.username}
        onClose={() => setShowConsentModal(false)}
        onConsent={handleCredentialConsent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  platformList: {
    gap: 16,
    marginBottom: 24,
  },
  platformCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  platformIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  platformIconText: {
    fontSize: 24,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  platformDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  platformStatus: {
    alignItems: 'flex-start',
  },
  connectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorStatus: {
    alignItems: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deviceName: {
    fontSize: 12,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    gap: 12,
  },
  skipButton: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default HealthDeviceSetupScreen;