import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  colors: {
    // Background colors
    background: string;
    surface: string;
    card: string;
    modal: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;
    
    // Primary colors
    primary: string;
    primaryDark: string;
    primaryLight: string;
    
    // Accent colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Border colors
    border: string;
    borderLight: string;
    
    // Chart colors
    chart: {
      primary: string;
      secondary: string;
      tertiary: string;
      background: string;
      grid: string;
    };
    
    // Status colors
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    water: string;
    
    // Interactive colors
    buttonBackground: string;
    buttonText: string;
    inputBackground: string;
    inputBorder: string;
    
    // Tab colors
    tabActive: string;
    tabInactive: string;
    tabBackground: string;
  };
  dark: boolean;
}

const lightTheme: Theme = {
  colors: {
    // Background colors
    background: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',
    modal: '#FFFFFF',
    
    // Text colors
    text: '#212529',
    textSecondary: '#6C757D',
    textTertiary: '#ADB5BD',
    
    // Primary colors
    primary: '#339AF0',
    primaryDark: '#228BE6',
    primaryLight: '#74C0FC',
    
    // Accent colors
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
    
    // Border colors
    border: '#DEE2E6',
    borderLight: '#E9ECEF',
    
    // Chart colors
    chart: {
      primary: '#339AF0',
      secondary: '#28A745',
      tertiary: '#FFC107',
      background: '#F8F9FA',
      grid: '#E9ECEF',
    },
    
    // Status colors
    calories: '#339AF0',
    protein: '#E03131',
    carbs: '#FD7E14',
    fat: '#7C2D12',
    water: '#15AABF',
    
    // Interactive colors
    buttonBackground: '#339AF0',
    buttonText: '#FFFFFF',
    inputBackground: '#F8F9FA',
    inputBorder: '#DEE2E6',
    
    // Tab colors
    tabActive: '#339AF0',
    tabInactive: '#6C757D',
    tabBackground: '#FFFFFF',
  },
  dark: false,
};

const darkTheme: Theme = {
  colors: {
    // Background colors
    background: '#121212',
    surface: '#1E1E1E',
    card: '#2D2D2D',
    modal: '#2D2D2D',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textTertiary: '#8C8C8C',
    
    // Primary colors
    primary: '#4DABF7',
    primaryDark: '#339AF0',
    primaryLight: '#74C0FC',
    
    // Accent colors
    success: '#51CF66',
    warning: '#FFD43B',
    error: '#FF6B6B',
    info: '#22B8CF',
    
    // Border colors
    border: '#404040',
    borderLight: '#333333',
    
    // Chart colors
    chart: {
      primary: '#4DABF7',
      secondary: '#51CF66',
      tertiary: '#FFD43B',
      background: '#1E1E1E',
      grid: '#404040',
    },
    
    // Status colors
    calories: '#4DABF7',
    protein: '#FF8787',
    carbs: '#FFA94D',
    fat: '#F59E0B',
    water: '#3BC9DB',
    
    // Interactive colors
    buttonBackground: '#4DABF7',
    buttonText: '#121212',
    inputBackground: '#2D2D2D',
    inputBorder: '#404040',
    
    // Tab colors
    tabActive: '#4DABF7',
    tabInactive: '#8C8C8C',
    tabBackground: '#1E1E1E',
  },
  dark: true,
};

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'app_theme_mode';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.log('Failed to load theme preference:', error);
    }
  };

  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.log('Failed to save theme preference:', error);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveThemePreference(mode);
  };

  const toggleTheme = () => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  // Determine current theme based on mode and system preference
  const getCurrentTheme = (): Theme => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  const currentTheme = getCurrentTheme();
  const isDark = currentTheme.dark;

  const value: ThemeContextType = {
    theme: currentTheme,
    themeMode,
    toggleTheme,
    setThemeMode,
    isDark,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for creating themed styles
export const useThemedStyles = <T extends Record<string, any>>(
  createStyles: (theme: Theme) => T
): T => {
  const { theme } = useTheme();
  return createStyles(theme);
};