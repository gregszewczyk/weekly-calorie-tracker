// Load essential polyfills first
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useCalorieStore } from './src/stores/calorieStore';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { DailyActivitySync } from './src/services/DailyActivitySync';
import { garminProxyService } from './src/services/GarminProxyService';
import { BackupService } from './src/services/BackupService';

function AppContent() {
  const { initializeWeek, _hasHydrated, goalConfiguration } = useCalorieStore();
  const { isDark, theme } = useTheme();

  useEffect(() => {
    // Initialize the current week when app starts
    initializeWeek();
    
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
  }, [initializeWeek]);

   useEffect(() => {
  //   // Force hydration check after 2 seconds if not hydrated
  //   const timeout = setTimeout(() => {
  //     if (!_hasHydrated) {
  //       console.log('🚨 [App] Forcing hydration check - rehydration callback may have failed');
  //       console.log('🚨 [App] Current goalConfiguration:', !!goalConfiguration);
  //     }
  //   }, 2000);

  //   return () => clearTimeout(timeout);
  }, [_hasHydrated, goalConfiguration]);

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