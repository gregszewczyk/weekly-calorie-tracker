import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useCalorieStore } from '../stores/calorieStore';
import CalorieBankCard from '../components/CalorieBankCard';
import CalorieBankCardV2 from '../components/CalorieBankCardV2';
import WeeklyBankDashboard from '../components/WeeklyBankDashboard';
import { useTheme } from '../contexts/ThemeContext';

const CalorieBankCompareScreen: React.FC = () => {
  const { getCalorieBankStatus } = useCalorieStore();
  const bankStatus = getCalorieBankStatus();
  const { theme } = useTheme();

  if (!bankStatus) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <View style={styles.empty}> 
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No bank status available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>Original</Text>
        <CalorieBankCard bankStatus={bankStatus} />
        <Text style={[styles.heading, { color: theme.colors.text, marginTop: 32 }]}>Redesign (V2)</Text>
        <CalorieBankCardV2 bankStatus={bankStatus} />
        <Text style={[styles.heading, { color: theme.colors.text, marginTop: 32 }]}>Dashboard Prototype</Text>
        <WeeklyBankDashboard bankStatus={bankStatus} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  heading: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16 }
});

export default CalorieBankCompareScreen;
