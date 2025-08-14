import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  style?: any;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  style,
  showLabel = true,
  size = 'medium',
}) => {
  const { theme, themeMode, setThemeMode, isDark, toggleTheme } = useTheme();
  
  const handleToggle = () => {
    console.log('🎨 [ThemeToggle] Toggle pressed!');
    console.log('🎨 [ThemeToggle] Current mode:', themeMode, 'isDark:', isDark);
    
    // If currently in system mode, switch to the opposite of current appearance
    if (themeMode === 'system') {
      const newMode = isDark ? 'light' : 'dark';
      console.log('🎨 [ThemeToggle] System mode detected, switching to:', newMode);
      setThemeMode(newMode);
    } else {
      // If in explicit mode, toggle between light and dark
      const newMode = themeMode === 'light' ? 'dark' : 'light';
      console.log('🎨 [ThemeToggle] Explicit mode, switching to:', newMode);
      setThemeMode(newMode);
    }
  };
  
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: size === 'small' ? 8 : size === 'large' ? 16 : 12,
        paddingHorizontal: size === 'small' ? 12 : size === 'large' ? 20 : 16,
      },
      iconContainer: {
        marginRight: showLabel ? 12 : 0,
      },
      textContainer: {
        flex: 1,
        marginRight: 12,
      },
      title: {
        fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
      },
      subtitle: {
        fontSize: size === 'small' ? 12 : size === 'large' ? 14 : 13,
        color: theme.colors.textSecondary,
      },
      switch: {
        transform: [
          { 
            scaleX: size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1 
          },
          { 
            scaleY: size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1 
          }
        ],
      },
      quickToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
      },
      quickToggleText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginLeft: 4,
      },
    })
  );

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return 'sunny';
      case 'dark':
        return 'moon';
      case 'system':
        return 'phone-portrait';
      default:
        return 'sunny';
    }
  };

  const getThemeDescription = () => {
    switch (themeMode) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'system':
        return 'Follow system setting';
      default:
        return 'Light mode';
    }
  };

  if (!showLabel) {
    // Quick toggle button without labels
    return (
      <TouchableOpacity
        style={[styles.quickToggle, style]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Ionicons
          name={getThemeIcon()}
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          color={theme.colors.primary}
        />
        <Text style={styles.quickToggleText}>
          {isDark ? 'Dark' : 'Light'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={getThemeIcon()}
          size={size === 'small' ? 20 : size === 'large' ? 28 : 24}
          color={theme.colors.primary}
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>Theme</Text>
        <Text style={styles.subtitle}>{getThemeDescription()}</Text>
      </View>
      
      <Switch
        style={styles.switch}
        value={isDark}
        onValueChange={handleToggle}
        trackColor={{
          false: theme.colors.borderLight,
          true: theme.colors.primary,
        }}
        thumbColor={isDark ? theme.colors.background : theme.colors.surface}
        ios_backgroundColor={theme.colors.borderLight}
      />
    </View>
  );
};

export default ThemeToggle;