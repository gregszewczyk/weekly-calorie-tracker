import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCalorieStore } from '../stores/calorieStore';
import { useTheme } from '../contexts/ThemeContext';
import { CalorieProgressRing } from '../components/charts';
import MealHistoryList from '../components/MealHistoryList';
import { Ionicons } from '@expo/vector-icons';
import ThemeToggle from '../components/ThemeToggle';
import { MacroBreakdownChart, WaterIntakeTracker } from '../components/charts';

/**
 * DailyLoggingScreenV2
 * Full thematic redesign: elevated modern dashboard aesthetic.
 * Focus: information density reduction, strong hierarchy, glanceable chips.
 */
const DailyLoggingScreenV2: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { getDailyProgress, getTodaysData, updateWaterIntake } = useCalorieStore();
  const daily = getDailyProgress();
  const today = getTodaysData();

  const calories = {
    consumed: daily?.calories.consumed || 0,
    target: daily?.calories.target || 2000,
    remaining: Math.max(0, daily?.calories.remaining || 0),
    burned: daily?.calories.burned || 0,
  };

  const hydrationPct = useMemo(() => {
    const g = daily?.water.glasses || 0;
    const target = daily?.water.target || 8;
    return Math.min(100, (g / target) * 100);
  }, [daily]);

  const macroData = {
    protein: { cur: daily?.macros.protein.current || 0, tgt: daily?.macros.protein.target || 150 },
    carbs: { cur: daily?.macros.carbs.current || 0, tgt: daily?.macros.carbs.target || 250 },
    fat: { cur: daily?.macros.fat.current || 0, tgt: daily?.macros.fat.target || 80 },
  };

  const macroBars = [
    { key: 'Protein', color: theme.colors.success, ...macroData.protein },
    { key: 'Carbs', color: theme.colors.info || theme.colors.primary, ...macroData.carbs },
    { key: 'Fat', color: theme.colors.warning, ...macroData.fat },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.dark ? '#0E1116' : '#F5F7FA' }]}>      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top App Bar */}
        <View style={[styles.appBar, { backgroundColor: theme.dark ? '#151A21' : '#FFFFFF', borderColor: theme.colors.border }]}>          
          <View style={styles.appBarLeft}>            
            <Text style={[styles.appBarTitle, { color: theme.colors.text }]}>Daily Overview</Text>
            <Text style={[styles.appBarSub, { color: theme.colors.textSecondary }]}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric'})}</Text>
          </View>
          <View style={styles.appBarActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('DailyLogging')} accessibilityLabel="Go to original design">
              <Ionicons name="swap-horizontal-outline" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
            <ThemeToggle size="small" showLabel={false} />
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Summary Card */}
        <View style={[styles.heroCard, { backgroundColor: theme.dark ? '#18212B' : '#FFFFFF', borderColor: theme.dark ? '#223040' : '#E4EAF0' }]}>          
          <View style={styles.heroLeft}>            
            <CalorieProgressRing consumed={calories.consumed} target={calories.target} size={150} />
          </View>
          <View style={styles.heroRight}>
            <MetricBlock label="Consumed" value={calories.consumed} color={theme.colors.text} />
            <MetricBlock label="Target" value={calories.target} color={theme.colors.textSecondary} />
            <MetricBlock label="Remaining" value={calories.remaining} color={theme.colors.primary} accent />
            <View style={styles.inlineChipsRow}>
              <StatusChip label={`${daily?.water.glasses || 0} / ${daily?.water.target || 8} H2O`} tone={hydrationPct >= 100 ? 'success' : hydrationPct >= 50 ? 'info' : 'neutral'} themeColors={theme.colors} />
              <StatusChip label={`${today?.meals.length || 0} meals`} tone={(today?.meals.length || 0) >= 4 ? 'info' : 'neutral'} themeColors={theme.colors} />
              <StatusChip label={`${Math.round(calories.burned)} burned`} tone={calories.burned > 0 ? 'warning' : 'neutral'} themeColors={theme.colors} />
            </View>
          </View>
        </View>

        {/* Macro Distribution */}
        <Section title="Macronutrients" themeColors={theme.colors}>
          <View style={styles.macroBarsWrapper}>
            {macroBars.map(b => (
              <MacroBar key={b.key} label={b.key} current={b.cur} target={b.tgt} color={b.color} theme={theme} />
            ))}
          </View>
          <View style={{ marginTop: 12 }}>
            <MacroBreakdownChart
              macros={{ protein: macroData.protein.cur, carbs: macroData.carbs.cur, fat: macroData.fat.cur }}
              targets={{ protein: macroData.protein.tgt, carbs: macroData.carbs.tgt, fat: macroData.fat.tgt }}
            />
          </View>
        </Section>

        {/* Meals */}
        <Section title="Meals" actionLabel="Add" onAction={() => {/* hook modal later */}} themeColors={theme.colors}>
          <MealHistoryList meals={today?.meals || []} onEditMeal={() => {}} onDeleteMeal={() => {}} showEmptyState />
        </Section>

        {/* Hydration & Quick Actions */}
        <View style={styles.dualRow}>          
          <Section title="Hydration" style={styles.dual} themeColors={theme.colors}>
            <WaterIntakeTracker currentIntake={daily?.water.glasses || 0} dailyTarget={daily?.water.target || 8} onUpdate={updateWaterIntake} />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={() => updateWaterIntake((daily?.water.glasses || 0) + 1)}>
              <Ionicons name="water" size={16} color={theme.colors.buttonText} />
              <Text style={[styles.primaryBtnText, { color: theme.colors.buttonText }]}>+ Glass</Text>
            </TouchableOpacity>
          </Section>
          <Section title="Quick" style={styles.dual} themeColors={theme.colors}>
            <View style={styles.quickGrid}>
              <QuickAction label="Meal" icon="pizza-outline" color={theme.colors.primary} />
              <QuickAction label="Workout" icon="barbell-outline" color={theme.colors.success} />
              <QuickAction label="Water" icon="water-outline" color={theme.colors.info || theme.colors.primary} onPress={() => updateWaterIntake((daily?.water.glasses || 0) + 1)} />
              <QuickAction label="Suggest" icon="bulb-outline" color={theme.colors.warning} />
            </View>
          </Section>
        </View>

        {/* Workouts Preview */}
        <Section title="Workouts" subtitle="Next iteration will show full detail" themeColors={theme.colors}>
          <View style={styles.placeholderBox}>
            <Ionicons name="barbell-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginLeft: 6 }}>No workouts listed yet</Text>
          </View>
        </Section>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper components moved up before usage
const MetricBlock = ({ label, value, color, accent }: { label: string; value: number; color: string; accent?: boolean }) => (
  <View style={[styles.metricBlock, accent && styles.metricAccent]}>
    <Text style={[styles.metricValue, { color }]}>{Math.round(value)}</Text>
    <Text style={[styles.metricLabel, { color, opacity: 0.65 }]}>{label}</Text>
  </View>
);

const StatusChip = ({ label, tone, themeColors }: { label: string; tone: 'success' | 'info' | 'warning' | 'neutral'; themeColors: any }) => {
  const toneMap: Record<string, { bg: string; fg: string; br: string }> = {
    success: { bg: themeColors.success + '1A', fg: themeColors.success, br: themeColors.success + '55' },
    info: { bg: (themeColors.info || themeColors.primary) + '1A', fg: themeColors.info || themeColors.primary, br: (themeColors.info || themeColors.primary) + '55' },
    warning: { bg: themeColors.warning + '1A', fg: themeColors.warning, br: themeColors.warning + '55' },
    neutral: { bg: themeColors.borderLight + '60', fg: themeColors.textSecondary, br: themeColors.borderLight + 'AA' },
  };
  const t = toneMap[tone];
  return (
    <View style={[styles.statusChip, { backgroundColor: t.bg, borderColor: t.br }]}>      
      <Text style={[styles.statusChipText, { color: t.fg }]}>{label}</Text>
    </View>
  );
};

const MacroBar = ({ label, current, target, color, theme }: { label: string; current: number; target: number; color: string; theme: any }) => {
  const pct = Math.min(100, (current / target) * 100 || 0);
  return (
    <View style={styles.macroBarContainer}>      
      <View style={styles.macroBarHeader}>
        <Text style={[styles.macroBarLabel, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.macroBarValue, { color: theme.colors.textSecondary }]}>{Math.round(current)}/{Math.round(target)}</Text>
      </View>
      <View style={[styles.macroTrack, { backgroundColor: theme.dark ? '#1F2A33' : '#E9EEF2' }]}>        
        <View style={[styles.macroFill, { width: pct + '%' as any, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const QuickAction = ({ label, icon, color, onPress }: { label: string; icon: any; color: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} accessibilityLabel={label}>
    <View style={[styles.quickActionCircle, { backgroundColor: color + '22' }]}>      
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={[styles.quickActionText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const Section: React.FC<{ title: string; subtitle?: string; actionLabel?: string; onAction?: () => void; children: React.ReactNode; style?: any; themeColors: any; }> = ({ title, subtitle, actionLabel, onAction, children, style, themeColors }) => (
  <View style={[styles.sectionCard, style, { backgroundColor: themeColors.surface, borderColor: themeColors.borderLight }]}>    
    <View style={styles.sectionHeader}>      
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} style={[styles.actionPill, { backgroundColor: themeColors.primary }]} accessibilityLabel={actionLabel}>
          <Text style={[styles.actionPillText, { color: themeColors.buttonText }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
    {children}
  </View>
);

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  appBar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  appBarLeft: { flex: 1 },
  appBarTitle: { fontSize: 20, fontWeight: '700' },
  appBarSub: { fontSize: 13, marginTop: 2 },
  appBarActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, marginLeft: 4, borderRadius: 12 },
  heroCard: { flexDirection: 'row', borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 20 },
  heroLeft: { justifyContent: 'center', alignItems: 'center' },
  heroRight: { flex: 1, marginLeft: 24, justifyContent: 'space-between' },
  inlineChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  metricBlock: { marginBottom: 4 },
  metricAccent: { },
  metricValue: { fontSize: 22, fontWeight: '700' },
  metricLabel: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '600' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  statusChipText: { fontSize: 11, fontWeight: '600' },
  sectionCard: { borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionSubtitle: { fontSize: 12, marginTop: 2 },
  actionPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  actionPillText: { fontSize: 13, fontWeight: '600' },
  macroBarsWrapper: { marginBottom: 4 },
  macroBarContainer: { marginBottom: 10 },
  macroBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  macroBarLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  macroBarValue: { fontSize: 12, fontWeight: '500' },
  macroTrack: { height: 10, borderRadius: 6, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 6 },
  dualRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  dual: { flex: 1, marginBottom: 0 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, marginTop: 12 },
  primaryBtnText: { fontSize: 13, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  quickAction: { width: 64, alignItems: 'center', marginBottom: 4 },
  quickActionCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickActionText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  placeholderBox: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
});

export default DailyLoggingScreenV2;
