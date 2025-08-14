import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { CalorieBankStatus } from '../types/CalorieTypes';

interface CalorieBankCardProps {
  bankStatus: CalorieBankStatus;
  showDetailed?: boolean;
}

const CalorieBankCard: React.FC<CalorieBankCardProps> = ({
  bankStatus,
  showDetailed = true,
}) => {
  const getProgressPercentage = (): number => {
    return Math.min((bankStatus.totalUsed / bankStatus.weeklyAllowance) * 100, 100);
  };

  const getStatusColor = (): string => {
    switch (bankStatus.projectedOutcome) {
      case 'on-track': return '#51CF66';
      case 'over-budget': return '#FF6B6B';
      case 'under-budget': return '#FFD43B';
      default: return '#339AF0';
    }
  };

  const getStatusIcon = (): string => {
    switch (bankStatus.projectedOutcome) {
      case 'on-track': return '✅';
      case 'over-budget': return '🚨';
      case 'under-budget': return '⚠️';
      default: return '📊';
    }
  };

  const getStatusText = (): string => {
    switch (bankStatus.projectedOutcome) {
      case 'on-track': return 'ON TRACK';
      case 'over-budget': return 'OVER BUDGET';
      case 'under-budget': return 'UNDER BUDGET';
      default: return 'CALCULATING';
    }
  };

  const formatNumber = (num: number): string => {
    return Math.round(num).toLocaleString();
  };

  const formatPercentage = (num: number): string => {
    return `${Math.round(num)}%`;
  };

  const progressPercentage = getProgressPercentage();
  const statusColor = getStatusColor();

  return (
    <View style={styles.container}>
      {/* Header with Status */}
      <View style={styles.header}>
        <Text style={styles.title}>Calorie Bank</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* Main Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Allowance</Text>
          <Text style={styles.metricValue}>
            {formatNumber(bankStatus.weeklyAllowance)}
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>
            Used ({formatPercentage(progressPercentage)})
          </Text>
          <Text style={[styles.metricValue, { color: statusColor }]}>
            {formatNumber(bankStatus.totalUsed)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercentage}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {formatPercentage(progressPercentage)}
        </Text>
      </View>

      {/* Remaining Balance */}
      <View style={styles.remainingSection}>
        <Text style={styles.remainingLabel}>Remaining</Text>
        <Text style={[
          styles.remainingValue,
          { color: bankStatus.remaining >= 0 ? '#51CF66' : '#FF6B6B' }
        ]}>
          {bankStatus.remaining >= 0 ? '+' : ''}{formatNumber(bankStatus.remaining)}
        </Text>
        <Text style={styles.remainingSubtext}>calories this week</Text>
      </View>

      {/* Detailed Section */}
      {showDetailed && (
        <View style={styles.detailsSection}>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{bankStatus.daysLeft}</Text>
              <Text style={styles.detailLabel}>Days Left</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>
                {formatNumber(bankStatus.dailyAverage)}
              </Text>
              <Text style={styles.detailLabel}>Daily Average</Text>
            </View>
          </View>

          <View style={styles.safeSection}>
            <View style={styles.safeHeader}>
              <Text style={styles.safeLabel}>Safe to Eat Today</Text>
              <Text style={styles.safeValue}>
                {formatNumber(bankStatus.safeToEatToday)}
              </Text>
            </View>
            <Text style={styles.safeSubtext}>
              Conservative recommendation with buffer
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    minWidth: 2,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    minWidth: 35,
  },
  remainingSection: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginBottom: 16,
  },
  remainingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  remainingValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  remainingSubtext: {
    fontSize: 12,
    color: '#999',
  },
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#339AF0',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  safeSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  safeHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  safeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  safeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#51CF66',
  },
  safeSubtext: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});

export default CalorieBankCard;
