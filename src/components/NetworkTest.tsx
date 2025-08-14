/**
 * Network Test Component
 * Simple component to test network connectivity to the proxy server
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Platform } from 'react-native';

const NetworkTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const getProxyUrl = () => {
    // Use production Vercel deployment for all platforms
    return 'https://garmin-proxy-server-lvsj1lvbg-gregs-projects-d9fe7e04.vercel.app';
  };

  const testConnection = async () => {
    setIsLoading(true);
    const proxyUrl = getProxyUrl();
    
    try {
      console.log('🧪 [NetworkTest] Testing connection to:', proxyUrl);
      console.log('📱 [NetworkTest] Platform:', Platform.OS);
      
      const response = await fetch(`${proxyUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 [NetworkTest] Response status:', response.status);
      console.log('📊 [NetworkTest] Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json() as { message?: string };
        console.log('✅ [NetworkTest] Success:', data);
        setLastResult(`✅ SUCCESS: ${data.message || 'Connected successfully'}`);
        Alert.alert('Connection Success!', `Connected to proxy server!\n\nPlatform: ${Platform.OS}\nURL: ${proxyUrl}\nResponse: ${data.message || 'Connected successfully'}`);
      } else {
        const errorText = await response.text();
        console.error('❌ [NetworkTest] HTTP Error:', response.status, errorText);
        setLastResult(`❌ HTTP ${response.status}: ${errorText}`);
        Alert.alert('Connection Failed', `HTTP ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('❌ [NetworkTest] Network Error:', error);
      setLastResult(`❌ Network Error: ${error.message}`);
      Alert.alert('Network Error', `Failed to connect to proxy server:\n\n${error.message}\n\nPlatform: ${Platform.OS}\nTrying URL: ${proxyUrl}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Test</Text>
      <Text style={styles.info}>Platform: {Platform.OS}</Text>
      <Text style={styles.info}>Proxy URL: {getProxyUrl()}</Text>
      
      <TouchableOpacity 
        style={[styles.button, { opacity: isLoading ? 0.6 : 1 }]}
        onPress={testConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>

      {lastResult ? (
        <Text style={styles.result}>{lastResult}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  result: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default NetworkTest;