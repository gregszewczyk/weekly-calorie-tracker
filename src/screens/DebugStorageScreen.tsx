import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCalorieStore } from '../stores/calorieStore';

const DebugStorageScreen: React.FC = () => {
  const [storageKeys, setStorageKeys] = useState<string[]>([]);
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const { goalConfiguration, debugStore, clearAllData, setGoalConfiguration } = useCalorieStore();

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      console.log('🔍 Loading AsyncStorage data...');
      const keys = await AsyncStorage.getAllKeys();
      console.log('📋 AsyncStorage keys:', keys);
      setStorageKeys([...keys]); // Convert readonly array to mutable array

      const data: Record<string, any> = {};
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          data[key] = value ? JSON.parse(value) : null;
        } catch (error) {
          data[key] = `Error parsing: ${error}`;
        }
      }
      setStorageData(data);
      console.log('💾 AsyncStorage data:', data);
    } catch (error) {
      console.error('❌ Error loading AsyncStorage:', error);
      Alert.alert('Error', 'Failed to load storage data');
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      clearAllData();
      await loadStorageData();
      Alert.alert('Success', 'Storage cleared');
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
      Alert.alert('Error', 'Failed to clear storage');
    }
  };

  const testStore = () => {
    debugStore();
    console.log('🧪 Current goalConfiguration from store:', goalConfiguration);
  };

  const testAsyncStorage = async () => {
    try {
      console.log('🧪 Testing AsyncStorage directly...');
      
      // Test write
      await AsyncStorage.setItem('test-key', 'test-value');
      console.log('✅ AsyncStorage write successful');
      
      // Test read
      const value = await AsyncStorage.getItem('test-key');
      console.log('✅ AsyncStorage read successful:', value);
      
      // Clean up
      await AsyncStorage.removeItem('test-key');
      console.log('✅ AsyncStorage cleanup successful');
      
      Alert.alert('Success', 'AsyncStorage is working correctly');
      await loadStorageData(); // Refresh the display
    } catch (error) {
      console.error('❌ AsyncStorage test failed:', error);
      Alert.alert('Error', `AsyncStorage test failed: ${error}`);
    }
  };

  const testZustandSave = () => {
    console.log('🧪 Testing Zustand store save...');
    
    // Create a test goal configuration
    const testConfig = {
      mode: 'cut' as const,
      performanceMode: false,
      startDate: '2025-01-01',  
      weeklyDeficitTarget: -2500,
      isOpenEnded: true,
      targetGoals: {
        weight: {
          target: 70,
          current: 75,
          priority: 'primary' as const
        }
      }
    };
    
    console.log('🧪 Calling setGoalConfiguration with test config:', testConfig);
    setGoalConfiguration(testConfig);
    
    // Wait a bit then check storage
    setTimeout(async () => {
      await loadStorageData();
      console.log('🧪 Storage reloaded after test save');
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Debug Storage</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zustand Store</Text>
        <Text style={styles.text}>
          Goal Config: {goalConfiguration ? 'EXISTS' : 'NULL'}
        </Text>
        {goalConfiguration && (
          <Text style={styles.text}>
            Mode: {goalConfiguration.mode}
          </Text>
        )}
        <TouchableOpacity style={styles.button} onPress={testStore}>
          <Text style={styles.buttonText}>Debug Store</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.testButton]} onPress={testAsyncStorage}>
          <Text style={styles.buttonText}>Test AsyncStorage</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.saveTestButton]} onPress={testZustandSave}>
          <Text style={styles.buttonText}>Test Zustand Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AsyncStorage Keys ({storageKeys.length})</Text>
        {storageKeys.map((key, index) => (
          <Text key={index} style={styles.text}>
            {key}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AsyncStorage Data</Text>
        {Object.entries(storageData).map(([key, value]) => (
          <View key={key} style={styles.dataItem}>
            <Text style={styles.dataKey}>{key}:</Text>
            <Text style={styles.dataValue}>
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={[styles.button, styles.refreshButton]} onPress={loadStorageData}>
          <Text style={styles.buttonText}>Refresh Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearStorage}>
          <Text style={styles.buttonText}>Clear All Storage</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  dataItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
  },
  dataKey: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  dataValue: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#339AF0',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshButton: {
    backgroundColor: '#28a745',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  testButton: {
    backgroundColor: '#ffc107',
  },
  saveTestButton: {
    backgroundColor: '#17a2b8',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DebugStorageScreen;