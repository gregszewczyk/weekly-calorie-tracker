import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CalorieBankStatus } from '../types/CalorieTypes';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  bankStatus: CalorieBankStatus;
  testID?: string;
}

/**
 * WeeklyBankDashboard
 * Lean dashboard-style redesign focusing on current metrics only (calories, no macros yet):
 * - Remaining emphasis
 * - Horizontal progress bar
 * - Compact metric grid (Allowance, Used, Safe Today, Daily Avg, Days Left)
 * - Subtle status accent left + badge
 */
export const WeeklyBankDashboard: React.FC<Props> = ({ bankStatus, testID }) => {
  const { theme } = useTheme();

  const progress = Math.min(bankStatus.weeklyAllowance > 0 ? bankStatus.totalUsed / bankStatus.weeklyAllowance : 0, 1);
  const remainingPositive = bankStatus.remaining >= 0;

  const outcome = bankStatus.projectedOutcome;
  const tone = outcome === 'over-budget' ? 'error' : outcome === 'under-budget' ? 'warning' : 'neutral';

  const toneColors = {
    neutral: { accent: theme.colors.primary, badgeBg: theme.colors.surface, badgeText: theme.colors.textSecondary, icon: '•', label: 'On Track' },
    warning: { accent: theme.colors.warning, badgeBg: theme.colors.warning + '22', badgeText: theme.colors.warning, icon: '↺', label: 'Buffer' },
    error: { accent: theme.colors.error, badgeBg: theme.colors.error + '22', badgeText: theme.colors.error, icon: '⚠️', label: 'Over' }
  } as const;
  const colors = toneColors[tone];

  return (
    <View style={[styles.wrapper]} testID={testID || 'weekly-bank-dashboard'}>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}> 
        {tone !== 'neutral' && <View style={[styles.accent, { backgroundColor: colors.accent }]} />}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Weekly Bank</Text>
          <View style={[styles.badge, { backgroundColor: colors.badgeBg, borderColor: colors.badgeText }]}> 
            <Text style={[styles.badgeIcon, { color: colors.badgeText }]}>{colors.icon}</Text>
            <Text style={[styles.badgeText, { color: colors.badgeText }]}>{colors.label}</Text>
          </View>
        </View>

        <View style={styles.topRow}> 
          <View style={styles.remainingBlock}>
            <Text style={[styles.remainingLabel, { color: theme.colors.textSecondary }]}>Remaining</Text>
            <Text style={[styles.remainingValue, { color: remainingPositive ? theme.colors.success : theme.colors.error }]}>
              {remainingPositive ? '+' : ''}{Math.round(bankStatus.remaining).toLocaleString()}
            </Text>
            <Text style={[styles.remainingSub, { color: theme.colors.textTertiary }]}>cal this week</Text>
          </View>
          <View style={styles.metricsColumn}>
            <View style={styles.metricRow}> 
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: theme.colors.textTertiary }]}>Allowance</Text>
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>{Math.round(bankStatus.weeklyAllowance).toLocaleString()}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: theme.colors.textTertiary }]}>Used</Text>
                <Text style={[styles.metricValue, { color: colors.accent }]}>{Math.round(bankStatus.totalUsed).toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.metricRow}> 
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: theme.colors.textTertiary }]}>Safe Today</Text>
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>{Math.round(bankStatus.safeToEatToday).toLocaleString()}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: theme.colors.textTertiary }]}>Daily Avg</Text>
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>{Math.round(bankStatus.dailyAverage).toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.metricRow}> 
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: theme.colors.textTertiary }]}>Days Left</Text>
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>{bankStatus.daysLeft}</Text>
              </View>
              <View style={styles.metricItem} />
            </View>
          </View>
        </View>

        <View style={styles.progressWrapper}>
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.borderLight }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressPercent, { color: theme.colors.textSecondary }]}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  card: { borderRadius: 20, padding: 18, overflow: 'hidden' },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '600' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 18, borderWidth: 1 },
  badgeIcon: { fontSize: 12, marginRight: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  topRow: { flexDirection: 'row' },
  remainingBlock: { width: 140 },
  remainingLabel: { fontSize: 12, letterSpacing: 0.5 },
  remainingValue: { fontSize: 34, fontWeight: '700' },
  remainingSub: { fontSize: 11, marginTop: 2 },
  metricsColumn: { flex: 1, marginLeft: 8 },
  metricRow: { flexDirection: 'row', marginBottom: 10 },
  metricItem: { flex: 1 },
  metricLabel: { fontSize: 11, marginBottom: 2 },
  metricValue: { fontSize: 16, fontWeight: '600' },
  progressWrapper: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  progressTrack: { flex: 1, height: 10, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  progressPercent: { marginLeft: 10, fontSize: 12, fontWeight: '600' }
});

export default WeeklyBankDashboard;
