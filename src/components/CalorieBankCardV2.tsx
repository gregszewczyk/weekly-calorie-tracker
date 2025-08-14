import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CalorieBankStatus } from '../types/CalorieTypes';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  bankStatus: CalorieBankStatus;
  onPress?: () => void;
  compact?: boolean;
  testID?: string;
}

/**
 * CalorieBankCardV2
 * - Uses theme tokens
 * - Accessible labels
 * - Reduced color clutter
 * - Clear hierarchy
 * - Ready for light/dark
 */
export const CalorieBankCardV2: React.FC<Props> = ({ bankStatus, onPress, compact = false, testID }) => {
  const { theme, isDark } = useTheme();

  const statusConfig = useMemo(() => {
    switch (bankStatus.projectedOutcome) {
      case 'over-budget':
        return { key: 'over', label: 'Over Budget', tone: 'error' as const, icon: '⚠️', assist: 'You are projected to exceed allowance. Tighten adherence.' };
      case 'under-budget':
        return { key: 'under', label: 'Buffer Available', tone: 'warning' as const, icon: '🛈', assist: 'You have a buffer. Maintain quality intake – avoid excessive restriction.' };
      case 'on-track':
        return { key: 'on', label: 'On Track', tone: 'neutral' as const, icon: '✓', assist: 'Trajectory matches weekly allowance.' };
      default:
        return { key: 'calc', label: 'Calculating', tone: 'neutral' as const, icon: '…', assist: 'Awaiting more data.' };
    }
  }, [bankStatus.projectedOutcome]);

  const progress = Math.min(bankStatus.weeklyAllowance > 0 ? bankStatus.totalUsed / bankStatus.weeklyAllowance : 0, 1);
  const remainingPositive = bankStatus.remaining >= 0;

  // Map tones to badge/background colors (minimal palette usage)
  const toneColors = {
    neutral: { border: theme.colors.borderLight, badgeBg: theme.colors.surface, badgeText: theme.colors.textSecondary, accent: theme.colors.primary },
    warning: { border: theme.colors.warning, badgeBg: theme.colors.warning + '22', badgeText: theme.colors.warning, accent: theme.colors.warning },
    error: { border: theme.colors.error, badgeBg: theme.colors.error + '22', badgeText: theme.colors.error, accent: theme.colors.error }
  } as const;
  const tone = toneColors[statusConfig.tone];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'summary'}
      accessibilityLabel={`Calorie bank status: ${statusConfig.label}. ${statusConfig.assist}`}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.borderLight, // unified neutral border
          paddingLeft: 16 // consistent padding
        },
        pressed && { opacity: 0.9 }
      ]}
      testID={testID || 'calorie-bank-card-v2'}
    >
      {statusConfig.tone !== 'neutral' && (
        <View style={[styles.accentStrip, { backgroundColor: tone.accent }]} accessibilityElementsHidden importantForAccessibility="no" />
      )}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Weekly Bank</Text>
        <View style={[styles.statusPill, { backgroundColor: tone.badgeBg, borderColor: tone.badgeText }]}> 
          <Text style={[styles.statusIcon, { color: tone.badgeText }]}>{statusConfig.icon}</Text>
          <Text style={[styles.statusText, { color: tone.badgeText }]}>{statusConfig.label}</Text>
        </View>
      </View>

      <View style={styles.primaryRow}>
        <View style={styles.primaryBlock}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Allowance</Text>
          <Text style={[styles.primaryValue, { color: theme.colors.text }]}>{Math.round(bankStatus.weeklyAllowance).toLocaleString()}</Text>
        </View>
        <View style={styles.primaryBlock}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Used</Text>
          <Text style={[styles.primaryValue, { color: theme.colors.text }]}>{Math.round(bankStatus.totalUsed).toLocaleString()}</Text>
        </View>
        <View style={styles.primaryBlock}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Remaining</Text>
          <Text style={[styles.primaryValue, { color: theme.colors.text }]}>
            {remainingPositive ? '+' : ''}{Math.round(bankStatus.remaining).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.progressWrapper} accessible accessibilityLabel={`Progress ${Math.round(progress * 100)} percent`}>
        <View style={[styles.progressTrack, { backgroundColor: theme.colors.borderLight }]}> 
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: tone.accent }]} />
        </View>
        <Text style={[styles.progressPercent, { color: theme.colors.textSecondary }]}>{Math.round(progress * 100)}%</Text>
      </View>

      {!compact && (
        <View style={styles.secondaryRow}>
          <View style={styles.secondaryItem}>
            <Text style={[styles.secondaryValue, { color: theme.colors.text }]}>{bankStatus.daysLeft}</Text>
            <Text style={[styles.secondaryLabel, { color: theme.colors.textTertiary }]}>Days Left</Text>
          </View>
          <View style={styles.secondaryItem}>
            <Text style={[styles.secondaryValue, { color: theme.colors.text }]}>{Math.round(bankStatus.dailyAverage).toLocaleString()}</Text>
            <Text style={[styles.secondaryLabel, { color: theme.colors.textTertiary }]}>Avg / Day</Text>
          </View>
          <View style={styles.secondaryItem}>
            <Text style={[styles.secondaryValue, { color: theme.colors.text }]}>{Math.round(bankStatus.safeToEatToday).toLocaleString()}</Text>
            <Text style={[styles.secondaryLabel, { color: theme.colors.textTertiary }]}>Safe Today</Text>
          </View>
        </View>
      )}

      {!compact && (
        <Text style={[styles.assistText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {statusConfig.assist}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontSize: 17,
    fontWeight: '600'
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  primaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  primaryBlock: {
    flex: 1,
    alignItems: 'center'
  },
  label: {
    fontSize: 12,
    marginBottom: 4
  },
  primaryValue: {
    fontSize: 20,
    fontWeight: '700'
  },
  progressWrapper: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center'
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 6
  },
  progressPercent: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '600'
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  secondaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  secondaryValue: {
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryLabel: {
    fontSize: 11,
    marginTop: 2
  },
  assistText: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 16
  }
});

export default CalorieBankCardV2;
