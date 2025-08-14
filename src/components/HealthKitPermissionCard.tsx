/**
 * HealthKit Permission Card Component
 * 
 * Displays permission groups with clear explanations and benefits
 * for Apple HealthKit integration setup.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  HealthKitPermissionGroup,
  HealthKitPermissionStatus,
} from '../types/AppleHealthKitTypes';

interface HealthKitPermissionCardProps {
  group: HealthKitPermissionGroup;
  permissionStatuses?: HealthKitPermissionStatus[];
  isEnabled: boolean;
  onToggle: (groupId: string, enabled: boolean) => void;
  onDetailsPress?: (group: HealthKitPermissionGroup) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const HealthKitPermissionCard: React.FC<HealthKitPermissionCardProps> = ({
  group,
  permissionStatuses = [],
  isEnabled,
  onToggle,
  onDetailsPress,
  isLoading = false,
  disabled = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate permission status for this group
  const groupPermissionStatus = React.useMemo(() => {
    const groupStatuses = permissionStatuses.filter(status =>
      group.dataTypes.includes(status.type)
    );

    if (groupStatuses.length === 0) return 'unknown';

    const authorized = groupStatuses.filter(s => s.status === 'authorized').length;
    const denied = groupStatuses.filter(s => s.status === 'denied').length;
    const total = groupStatuses.length;

    if (authorized === total) return 'authorized';
    if (denied === total) return 'denied';
    if (authorized > 0) return 'partial';
    return 'notDetermined';
  }, [group.dataTypes, permissionStatuses]);

  const getStatusIcon = () => {
    switch (groupPermissionStatus) {
      case 'authorized':
        return <Ionicons name="checkmark-circle" size={20} color="#34C759" />;
      case 'denied':
        return <Ionicons name="close-circle" size={20} color="#FF3B30" />;
      case 'partial':
        return <Ionicons name="warning" size={20} color="#FF9500" />;
      default:
        return <Ionicons name="help-circle" size={20} color="#8E8E93" />;
    }
  };

  const getStatusText = () => {
    switch (groupPermissionStatus) {
      case 'authorized':
        return 'All permissions granted';
      case 'denied':
        return 'Permissions denied';
      case 'partial':
        return 'Some permissions granted';
      default:
        return 'Not configured';
    }
  };

  const handleToggle = (value: boolean) => {
    if (disabled || isLoading) return;
    
    if (!value && group.required) {
      Alert.alert(
        'Required Permission Group',
        `${group.title} is required for core app functionality and cannot be disabled.`,
        [{ text: 'OK' }]
      );
      return;
    }

    onToggle(group.id, value);
  };

  const handleDetailsPress = () => {
    if (onDetailsPress) {
      onDetailsPress(group);
    } else {
      setShowDetails(!showDetails);
    }
  };

  return (
    <View style={[
      styles.container,
      group.required && styles.requiredContainer,
      disabled && styles.disabledContainer
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{group.icon}</Text>
          {group.required && (
            <View style={styles.requiredBadge}>
              <Ionicons name="star" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{group.title}</Text>
          <Text style={styles.description}>{group.description}</Text>
          
          {/* Status indicator */}
          <View style={styles.statusRow}>
            {getStatusIcon()}
            <Text style={[
              styles.statusText,
              groupPermissionStatus === 'authorized' && styles.statusAuthorized,
              groupPermissionStatus === 'denied' && styles.statusDenied,
              groupPermissionStatus === 'partial' && styles.statusPartial,
            ]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            disabled={disabled || isLoading || (group.required && isEnabled)}
            trackColor={{ false: '#E5E5E5', true: '#34C759' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Benefits list */}
      {isEnabled && (
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Benefits:</Text>
          {group.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Ionicons name="checkmark" size={14} color="#34C759" />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Details toggle */}
      <TouchableOpacity
        style={styles.detailsToggle}
        onPress={handleDetailsPress}
        disabled={disabled}
      >
        <Text style={styles.detailsToggleText}>
          {showDetails ? 'Hide' : 'Show'} Data Types ({group.dataTypes.length})
        </Text>
        <Ionicons
          name={showDetails ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#007AFF"
        />
      </TouchableOpacity>

      {/* Data types details */}
      {showDetails && (
        <View style={styles.dataTypesContainer}>
          <Text style={styles.dataTypesTitle}>Data Types:</Text>
          {group.dataTypes.map((dataType, index) => {
            const status = permissionStatuses.find(s => s.type === dataType);
            return (
              <View key={index} style={styles.dataTypeRow}>
                <Text style={styles.dataTypeName}>
                  {dataType.replace('HKQuantityTypeIdentifier', '').replace('HKCategoryTypeIdentifier', '')}
                </Text>
                {status && (
                  <View style={styles.dataTypeStatus}>
                    {status.status === 'authorized' && (
                      <Ionicons name="checkmark" size={12} color="#34C759" />
                    )}
                    {status.status === 'denied' && (
                      <Ionicons name="close" size={12} color="#FF3B30" />
                    )}
                    {status.status === 'notDetermined' && (
                      <Ionicons name="help" size={12} color="#8E8E93" />
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  requiredContainer: {
    borderColor: '#FF9500',
    borderWidth: 2,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  requiredBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF9500',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  statusAuthorized: {
    color: '#34C759',
  },
  statusDenied: {
    color: '#FF3B30',
  },
  statusPartial: {
    color: '#FF9500',
  },
  controls: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitsContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
    color: '#3C3C43',
    flex: 1,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  dataTypesContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  dataTypesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  dataTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dataTypeName: {
    fontSize: 12,
    color: '#3C3C43',
    flex: 1,
  },
  dataTypeStatus: {
    marginLeft: 8,
  },
});
