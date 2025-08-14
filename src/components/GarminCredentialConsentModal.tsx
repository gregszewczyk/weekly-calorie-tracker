/**
 * Garmin Credential Consent Modal
 * 
 * Asks user for consent to securely store Garmin credentials for automatic re-login.
 * Provides clear privacy controls and explains the benefits.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { CredentialConsentOptions } from '../services/GarminCredentialManager';

interface GarminCredentialConsentModalProps {
  visible: boolean;
  onClose: () => void;
  onConsent: (options: CredentialConsentOptions) => void;
  username: string;
}

const GarminCredentialConsentModal: React.FC<GarminCredentialConsentModalProps> = ({
  visible,
  onClose,
  onConsent,
  username,
}) => {
  const { theme } = useTheme();
  const [rememberCredentials, setRememberCredentials] = useState(true);
  const [allowAutoLogin, setAllowAutoLogin] = useState(true);
  const [durationDays, setDurationDays] = useState(30);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      margin: 20,
      maxHeight: '80%',
      width: '90%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
      marginTop: 16,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    benefitsList: {
      marginBottom: 16,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    benefitIcon: {
      fontSize: 16,
      color: theme.colors.success,
      marginRight: 8,
      marginTop: 2,
    },
    benefitText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
      lineHeight: 18,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    optionInfo: {
      flex: 1,
      marginRight: 12,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    durationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 12,
    },
    durationButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      minWidth: 60,
      alignItems: 'center',
    },
    durationButtonSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    durationButtonText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    durationButtonTextSelected: {
      color: theme.colors.buttonText,
    },
    securityNote: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 16,
      marginVertical: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    securityNoteTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    securityNoteText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    buttonContainer: {
      flexDirection: 'row',
      padding: 20,
      paddingTop: 0,
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: theme.colors.text,
    },
    saveButtonText: {
      color: theme.colors.buttonText,
    },
  });

  const durationOptions = [
    { days: 7, label: '1 week' },
    { days: 30, label: '1 month' },
    { days: 90, label: '3 months' },
  ];

  const handleSave = () => {
    const options: CredentialConsentOptions = {
      rememberCredentials,
      durationDays,
      allowAutoLogin: rememberCredentials && allowAutoLogin,
    };
    onConsent(options);
  };

  const handleCancel = () => {
    const options: CredentialConsentOptions = {
      rememberCredentials: false,
      durationDays: 0,
      allowAutoLogin: false,
    };
    onConsent(options);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Remember Garmin Login?</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              You've successfully connected to Garmin Connect as <Text style={{ fontWeight: '600' }}>{username}</Text>. 
              Would you like us to securely remember your login to avoid re-entering credentials when your session expires?
            </Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✅</Text>
                <Text style={styles.benefitText}>Automatic re-login when sessions expire</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>⚡</Text>
                <Text style={styles.benefitText}>Seamless background data sync</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🔒</Text>
                <Text style={styles.benefitText}>Credentials stored securely with encryption</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🗑️</Text>
                <Text style={styles.benefitText}>You can revoke access anytime in settings</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Privacy Settings</Text>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Remember Login</Text>
                <Text style={styles.optionDescription}>
                  Store credentials securely on this device
                </Text>
              </View>
              <Switch
                value={rememberCredentials}
                onValueChange={setRememberCredentials}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.background}
              />
            </View>

            {rememberCredentials && (
              <>
                <View style={styles.optionRow}>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>Auto Re-login</Text>
                    <Text style={styles.optionDescription}>
                      Automatically reconnect when sessions expire
                    </Text>
                  </View>
                  <Switch
                    value={allowAutoLogin}
                    onValueChange={setAllowAutoLogin}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={theme.colors.background}
                  />
                </View>

                <Text style={styles.sectionTitle}>Remember Duration</Text>
                <View style={styles.durationContainer}>
                  {durationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.days}
                      style={[
                        styles.durationButton,
                        durationDays === option.days && styles.durationButtonSelected,
                      ]}
                      onPress={() => setDurationDays(option.days)}
                    >
                      <Text
                        style={[
                          styles.durationButtonText,
                          durationDays === option.days && styles.durationButtonTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.securityNote}>
              <Text style={styles.securityNoteTitle}>
                <Ionicons name="shield-checkmark" size={16} color={theme.colors.primary} />
                {' '}Security & Privacy
              </Text>
              <Text style={styles.securityNoteText}>
                • Credentials are encrypted and stored locally only on your device{'\n'}
                • We never send your password to external servers{'\n'}
                • You can clear stored credentials anytime in app settings{'\n'}
                • Auto-consent expires after your chosen duration
              </Text>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Don't Remember
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {rememberCredentials ? 'Save Preferences' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default GarminCredentialConsentModal;