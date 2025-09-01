// Load essential polyfills first
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { useCalorieStore } from './src/stores/calorieStore';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { DailyActivitySync } from './src/services/DailyActivitySync';
import { garminProxyService } from './src/services/GarminProxyService';
import { BackupService } from './src/services/BackupService';

function AppContent() {
  const { initializeWeek, _hasHydrated, isFullyReady, goalConfiguration } = useCalorieStore();
  const { isDark, theme } = useTheme();

  useEffect(() => {
    // Only initialize after rehydration fully completes
    if (!isFullyReady) {
      console.log('⏳ [App] Waiting for full rehydration before initializing...', {
        isFullyReady,
        _hasHydrated,
      });
      return;
    }

    console.log('🚀 [App] Rehydration fully complete, initializing app...');
    
    // Note: initializeWeek() now called during rehydration to ensure proper timing
    
    // Initialize backup service
    BackupService.initialize();
    
    // Initialize daily activity sync to pull yesterday's activities
    DailyActivitySync.initializeDailySync();
    
    // Attempt Garmin auto-login if credentials are cached
    const attemptGarminAutoLogin = async () => {
      try {
        console.log('🔄 [App] Attempting Garmin auto-login on startup...');
        const autoLoginSuccess = await garminProxyService.attemptAutoLogin();
        if (autoLoginSuccess) {
          console.log('✅ [App] Garmin auto-login successful on startup');
        } else {
          console.log('ℹ️ [App] Garmin auto-login not attempted (no valid credentials or consent)');
        }
      } catch (error: any) {
        console.log('❌ [App] Garmin auto-login failed on startup:', error.message);
      }
    };
    
    // Run auto-login asynchronously (don't block app startup)
    attemptGarminAutoLogin();
  }, [isFullyReady, initializeWeek]);

  useEffect(() => {
    // Force rehydration completion after 3 seconds if stuck
    const timeout = setTimeout(() => {
      if (!isFullyReady) {
        console.log('🚨 [App] Forcing rehydration completion - callback may have failed');
        console.log('🚨 [App] State:', { isFullyReady, _hasHydrated, hasGoalConfig: !!goalConfiguration });
        
        // Get current store state to check if data actually loaded
        const { setIsFullyReady, goalConfiguration: currentGoalConfig } = useCalorieStore.getState();
        
        // If we have goal configuration but rehydration flag is stuck, force it
        const hasValidGoalConfig = currentGoalConfig && typeof currentGoalConfig === 'object';
        const hasValidRootGoalConfig = goalConfiguration && typeof goalConfiguration === 'object';
        
        if (hasValidGoalConfig || hasValidRootGoalConfig) {
          console.log('✅ [App] Data exists, forcing rehydration complete');
          setIsFullyReady(true);
        } else {
          console.log('⚠️ [App] No data found, rehydration timeout without data');
        }
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isFullyReady, goalConfiguration]);

  // Don't render AppNavigator until fully ready
  if (!isFullyReady) {
    return (
      <>
        <StatusBar 
          style={isDark ? "light" : "dark"} 
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 10 }}>🔄</Text>
          <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>Loading your nutrition plan...</Text>
          <Text style={{ fontSize: 12, color: theme.colors.textTertiary, marginTop: 10 }}>
            Initializing app data...
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar 
        style={isDark ? "light" : "dark"} 
      />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}