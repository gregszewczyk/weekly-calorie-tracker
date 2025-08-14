/**
 * Health Device Status Component
 * 
 * Compact display of connected health devices for the WeeklyBankingScreen.
 * Shows connection status and recent activity sync without taking up much space.
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/NavigationTypes';
import { 
  HealthDeviceConnection, 
  UniversalActivity,
  PLATFORM_INFO 
} from '../types/HealthDeviceTypes';
import { healthDeviceManager } from '../services/HealthDeviceManager';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  onRecentActivities?: (activities: UniversalActivity[]) => void;
}

interface HealthDeviceStatusRef {
  forceRefresh: () => Promise<void>;
}

const HealthDeviceStatus = forwardRef<HealthDeviceStatusRef, Props>(({ onRecentActivities }, ref) => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  
  const [connections, setConnections] = useState<HealthDeviceConnection[]>([]);
  const [recentActivities, setRecentActivities] = useState<UniversalActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Initial load with a small delay to ensure HealthDeviceManager is fully initialized
    const initializeComponent = async () => {
      console.log('🔄 [HealthDeviceStatus] Initializing component...');
      
      // Wait a bit longer to ensure HealthDeviceManager has loaded any persisted connections
      await new Promise(resolve => setTimeout(resolve, 300));
      
      loadStatus();
      
      // If we already have connections, load activities immediately
      if (healthDeviceManager.hasAnyConnection()) {
        console.log('🔄 [HealthDeviceStatus] Found existing connections, loading activities...');
        loadRecentActivities();
      } else {
        console.log('🔄 [HealthDeviceStatus] No existing connections found');
      }
    };
    
    initializeComponent();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from device setup)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [HealthDeviceStatus] Screen focused, refreshing connection status...');
      
      // Force refresh with a small delay to ensure any navigation changes are complete
      setTimeout(() => {
        loadStatus();
        
        // Check if we have connections after the refresh
        if (healthDeviceManager.hasAnyConnection()) {
          console.log('🔄 [HealthDeviceStatus] Connections found after focus, loading activities...');
          loadRecentActivities();
        } else {
          console.log('🔄 [HealthDeviceStatus] No connections found after focus');
        }
      }, 100);
    }, [])
  );

  const loadStatus = () => {
    const currentConnections = healthDeviceManager.getConnections();
    setConnections(currentConnections);
    console.log('🔄 [HealthDeviceStatus] Connection status updated:', currentConnections.map(c => `${c.platform}: ${c.status}`).join(', '));
    
    // If no connections but we expected some, try again in a moment
    if (currentConnections.length === 0) {
      console.log('🔄 [HealthDeviceStatus] No connections found, will retry in 500ms...');
      setTimeout(() => {
        const retryConnections = healthDeviceManager.getConnections();
        if (retryConnections.length > 0) {
          console.log('🔄 [HealthDeviceStatus] Found connections on retry:', retryConnections.map(c => `${c.platform}: ${c.status}`).join(', '));
          setConnections(retryConnections);
          
          // Also load activities if we found connections
          if (healthDeviceManager.hasAnyConnection()) {
            loadRecentActivities();
          }
        }
      }, 500);
    }
  };

  const loadRecentActivities = async () => {
    if (!healthDeviceManager.hasAnyConnection()) {
      console.log('⚠️ [HealthDeviceStatus] No health device connections available');
      setRecentActivities([]);
      setLastSyncTime(null);
      return;
    }
    
    setIsLoadingActivities(true);
    try {
      console.log('🔄 [HealthDeviceStatus] Loading recent activities for display...');
      
      // Optimize: If we need AI analysis (14 days), get that first and use subset for display
      if (onRecentActivities) {
        console.log('🔄 [HealthDeviceStatus] Fetching 14-day data for AI analysis (includes display data)...');
        const extendedActivities = await healthDeviceManager.getRecentActivities(14);
        console.log('✅ [HealthDeviceStatus] Loaded 14-day activities:', extendedActivities.length);
        
        // Use first 3 days for display
        const recentForDisplay = extendedActivities.slice(0, 10); // First 10 activities should cover ~3 days
        setRecentActivities(recentForDisplay);
        
        // Pass full dataset for analysis
        onRecentActivities(extendedActivities);
      } else {
        // Only display needed - get minimal data
        console.log('🔄 [HealthDeviceStatus] Fetching 3-day data for display only...');
        const activities = await healthDeviceManager.getRecentActivities(3);
        console.log('✅ [HealthDeviceStatus] Loaded display activities:', activities.length);
        setRecentActivities(activities);
      }
      
      setLastSyncTime(new Date());
      
      // Refresh connection status in case any sessions became invalid during fetch
      setTimeout(() => {
        loadStatus();
      }, 100);
      
    } catch (error) {
      console.error('❌ [HealthDeviceStatus] Failed to load activities:', error);
      // Refresh connection status to reflect any authentication issues
      loadStatus();
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Force refresh both status and activities - useful for manual refresh
  const forceRefresh = async () => {
    console.log('🔄 [HealthDeviceStatus] Force refreshing all data...');
    loadStatus();
    await loadRecentActivities();
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    forceRefresh
  }));

  const connectedDevices = connections.filter(c => c.status === 'connected');
  const hasConnections = connectedDevices.length > 0;
  const todaysActivities = recentActivities.filter(activity => {
    const today = new Date();
    const activityDate = new Date(activity.startTime);
    return activityDate.toDateString() === today.toDateString();
  });

  const getTotalCaloriesToday = () => {
    return todaysActivities.reduce((total, activity) => total + (activity.calories || 0), 0);
  };

  const handleManageDevices = () => {
    navigation.navigate('HealthDeviceSetup');
  };

  const handleRefreshData = () => {
    forceRefresh();
  };

  if (!hasConnections) {
    return (
      <View style={[styles.container, styles.noConnectionContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.noConnectionContent}>
          <Ionicons name="fitness-outline" size={24} color={theme.colors.textSecondary} />
          <Text style={[styles.noConnectionText, { color: theme.colors.textSecondary }]}>
            Connect a health device to automatically import activities
          </Text>
          <TouchableOpacity 
            style={[styles.connectButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleManageDevices}
          >
            <Ionicons name="add" size={16} color={theme.colors.buttonText} />
            <Text style={[styles.connectButtonText, { color: theme.colors.buttonText }]}>
              Connect Device
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Health Devices</Text>
          <View style={styles.deviceIndicators}>
            {connectedDevices.map((connection, index) => {
              const platformInfo = PLATFORM_INFO[connection.platform];
              return (
                <View key={connection.platform} style={styles.deviceIndicator}>
                  <Text style={styles.deviceIcon}>{platformInfo.icon}</Text>
                  <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                </View>
              );
            })}
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.manageButton}
          onPress={handleManageDevices}
        >
          <Ionicons name="settings-outline" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {todaysActivities.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Activities Today
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>
            {getTotalCaloriesToday().toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Calories Burned
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefreshData}
            disabled={isLoadingActivities}
          >
            {isLoadingActivities ? (
              <ActivityIndicator size="small" color={theme.colors.textSecondary} />
            ) : (
              <Ionicons name="refresh" size={16} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {lastSyncTime ? `Updated ${lastSyncTime.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit'
            })}` : 'Sync Data'}
          </Text>
        </View>
      </View>

      {recentActivities.length > 0 && (
        <View style={styles.recentActivities}>
          <Text style={[styles.recentTitle, { color: theme.colors.text }]}>Recent Activities</Text>
          <View style={styles.activityList}>
            {recentActivities.slice(0, 2).map((activity) => {
              const platformInfo = PLATFORM_INFO[activity.platform];
              const duration = Math.round(activity.duration);
              const activityDate = new Date(activity.startTime);
              const isToday = activityDate.toDateString() === new Date().toDateString();
              
              return (
                <View key={activity.id} style={styles.activityItem}>
                  <Text style={styles.activityIcon}>{platformInfo.icon}</Text>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityName, { color: theme.colors.text }]}>
                      {activity.displayName}
                    </Text>
                    <Text style={[styles.activityDetails, { color: theme.colors.textSecondary }]}>
                      {duration}min • {activity.calories?.toLocaleString() || '0'} cal • {isToday ? 'Today' : activityDate.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noConnectionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noConnectionContent: {
    alignItems: 'center',
    gap: 12,
  },
  noConnectionText: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 200,
    lineHeight: 18,
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
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  deviceIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  deviceIndicator: {
    position: 'relative',
    alignItems: 'center',
  },
  deviceIcon: {
    fontSize: 16,
  },
  statusDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -2,
    right: -2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  manageButton: {
    padding: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 4,
    marginBottom: 4,
  },
  recentActivities: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    fontSize: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: 12,
  },
});

HealthDeviceStatus.displayName = 'HealthDeviceStatus';

export default HealthDeviceStatus;