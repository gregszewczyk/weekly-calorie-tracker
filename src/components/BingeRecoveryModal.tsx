import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  OvereatingEvent,
  RecoveryPlan,
  RebalancingOption,
  RECOVERY_MESSAGES,
} from '../types/RecoveryTypes';

const { width } = Dimensions.get('window');

interface BingeRecoveryModalProps {
  visible: boolean;
  onClose: () => void;
  overeatingEvent: OvereatingEvent | null;
  recoveryPlan: RecoveryPlan | null;
  onSelectOption: (optionId: string) => void;
  onAcknowledge: () => void;
}

const BingeRecoveryModal: React.FC<BingeRecoveryModalProps> = ({
  visible,
  onClose,
  overeatingEvent,
  recoveryPlan,
  onSelectOption,
  onAcknowledge,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  if (!overeatingEvent || !recoveryPlan) {
    return null;
  }

  const messageTemplate = RECOVERY_MESSAGES[overeatingEvent.triggerType];
  const impactAnalysis = recoveryPlan.impactAnalysis;
  const recommendedOptions = recoveryPlan.rebalancingOptions.filter(
    option => option.recommendation === 'recommended'
  );
  const otherOptions = recoveryPlan.rebalancingOptions.filter(
    option => option.recommendation !== 'recommended'
  );

  const handleSelectOption = () => {
    if (!selectedOptionId) {
      Alert.alert('Please select an option', 'Choose a rebalancing strategy to continue.');
      return;
    }

    onSelectOption(selectedOptionId);
    onAcknowledge();
    onClose();
  };

  const handleDismiss = () => {
    onAcknowledge();
    onClose();
  };

  const getColorByTriggerType = (triggerType: OvereatingEvent['triggerType']) => {
    switch (triggerType) {
      case 'mild':
        return '#28A745'; // Green
      case 'moderate':
        return '#FFC107'; // Yellow
      case 'severe':
        return '#DC3545'; // Red
      default:
        return '#6C757D'; // Gray
    }
  };

  const getIconByTriggerType = (triggerType: OvereatingEvent['triggerType']) => {
    switch (triggerType) {
      case 'mild':
        return 'information-circle';
      case 'moderate':
        return 'warning';
      case 'severe':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const headerColor = getColorByTriggerType(overeatingEvent.triggerType);
  const headerIcon = getIconByTriggerType(overeatingEvent.triggerType);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerColor }]}>
          <View style={styles.headerContent}>
            <Ionicons name={headerIcon} size={28} color="#FFFFFF" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{messageTemplate.title}</Text>
              <Text style={styles.headerSubtitle}>
                {overeatingEvent.excessCalories} calories over target
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Positive Reframing Section */}
          <View style={styles.section}>
            <View style={styles.reframeCard}>
              <Text style={styles.reframeMessage}>{impactAnalysis.reframe.message}</Text>
              <Text style={styles.refocusPoint}>{impactAnalysis.reframe.focusPoint}</Text>
              {impactAnalysis.reframe.successReminder && (
                <Text style={styles.successReminder}>
                  💪 {impactAnalysis.reframe.successReminder}
                </Text>
              )}
            </View>
          </View>

          {/* Impact Analysis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Real Impact</Text>
            <View style={styles.impactGrid}>
              <View style={styles.impactCard}>
                <Text style={styles.impactNumber}>
                  {impactAnalysis.realImpact.timelineDelayDays}
                </Text>
                <Text style={styles.impactLabel}>days delay</Text>
              </View>
              <View style={styles.impactCard}>
                <Text style={styles.impactNumber}>
                  {impactAnalysis.realImpact.weeklyGoalImpact}%
                </Text>
                <Text style={styles.impactLabel}>of weekly deficit</Text>
              </View>
              <View style={styles.impactCard}>
                <Text style={styles.impactNumber}>
                  {impactAnalysis.perspective.equivalentWorkouts}
                </Text>
                <Text style={styles.impactLabel}>workout sessions</Text>
              </View>
            </View>
            <Text style={styles.impactSummary}>
              This represents {impactAnalysis.perspective.percentOfTotalJourney}% of your total journey.
              Normal tracking for {impactAnalysis.perspective.daysToNullify} days nullifies this completely.
            </Text>
          </View>

          {/* Recommended Options */}
          {recommendedOptions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ Recommended Options</Text>
              {recommendedOptions.map((option) => (
                <RebalancingOptionCard
                  key={option.id}
                  option={option}
                  isSelected={selectedOptionId === option.id}
                  isExpanded={showDetails === option.id}
                  onSelect={() => setSelectedOptionId(option.id)}
                  onToggleDetails={() => 
                    setShowDetails(showDetails === option.id ? null : option.id)
                  }
                />
              ))}
            </View>
          )}

          {/* Other Options */}
          {otherOptions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Other Options</Text>
              {otherOptions.map((option) => (
                <RebalancingOptionCard
                  key={option.id}
                  option={option}
                  isSelected={selectedOptionId === option.id}
                  isExpanded={showDetails === option.id}
                  onSelect={() => setSelectedOptionId(option.id)}
                  onToggleDetails={() => 
                    setShowDetails(showDetails === option.id ? null : option.id)
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
            <Text style={styles.dismissButtonText}>I'll Handle This Myself</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.selectButton,
              !selectedOptionId && styles.selectButtonDisabled,
            ]}
            onPress={handleSelectOption}
            disabled={!selectedOptionId}
          >
            <Text style={styles.selectButtonText}>Start Recovery Plan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

interface RebalancingOptionCardProps {
  option: RebalancingOption;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleDetails: () => void;
}

const RebalancingOptionCard: React.FC<RebalancingOptionCardProps> = ({
  option,
  isSelected,
  isExpanded,
  onSelect,
  onToggleDetails,
}) => {
  const getEffortLevelColor = (effortLevel: string) => {
    switch (effortLevel) {
      case 'minimal':
        return '#28A745';
      case 'moderate':
        return '#FFC107';
      case 'challenging':
        return '#FD7E14';
      default:
        return '#6C757D';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return '#28A745';
      case 'moderate':
        return '#FFC107';
      case 'aggressive':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        isSelected && styles.optionCardSelected,
        option.recommendation === 'not-recommended' && styles.optionCardNotRecommended,
      ]}
      onPress={onSelect}
    >
      <View style={styles.optionHeader}>
        <View style={styles.optionTitleRow}>
          <View style={styles.optionRadio}>
            {isSelected && <View style={styles.optionRadioSelected} />}
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionName}>{option.name}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onToggleDetails} style={styles.expandButton}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6C757D"
          />
        </TouchableOpacity>
      </View>

      {/* Quick Impact Preview */}
      <View style={styles.optionPreview}>
        <View style={styles.previewItem}>
          <Text style={styles.previewLabel}>New Target:</Text>
          <Text style={styles.previewValue}>{option.impact.newDailyTarget} cal</Text>
        </View>
        <View style={styles.previewItem}>
          <Text style={styles.previewLabel}>Effort:</Text>
          <Text style={[
            styles.previewValue,
            { color: getEffortLevelColor(option.impact.effortLevel) }
          ]}>
            {option.impact.effortLevel}
          </Text>
        </View>
        <View style={styles.previewItem}>
          <Text style={styles.previewLabel}>Risk:</Text>
          <Text style={[
            styles.previewValue,
            { color: getRiskLevelColor(option.impact.riskLevel) }
          ]}>
            {option.impact.riskLevel}
          </Text>
        </View>
      </View>

      {/* Expanded Details */}
      {isExpanded && (
        <View style={styles.optionDetails}>
          <View style={styles.prosConsContainer}>
            <View style={styles.prosContainer}>
              <Text style={styles.prosConsTitle}>✅ Pros:</Text>
              {option.pros.map((pro, index) => (
                <Text key={index} style={styles.prosConsItem}>• {pro}</Text>
              ))}
            </View>
            
            {option.cons && option.cons.length > 0 && (
              <View style={styles.consContainer}>
                <Text style={styles.prosConsTitle}>⚠️ Considerations:</Text>
                {option.cons.map((con, index) => (
                  <Text key={index} style={styles.prosConsItem}>• {con}</Text>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Recommendation Badge */}
      {option.recommendation === 'recommended' && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
        </View>
      )}
      {option.recommendation === 'not-recommended' && (
        <View style={styles.notRecommendedBadge}>
          <Text style={styles.notRecommendedBadgeText}>ADVANCED</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 16,
  },
  reframeCard: {
    backgroundColor: '#E7F3FF',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#339AF0',
  },
  reframeMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
    lineHeight: 24,
  },
  refocusPoint: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 22,
  },
  successReminder: {
    fontSize: 15,
    color: '#28A745',
    fontWeight: '600',
    lineHeight: 22,
  },
  impactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  impactCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  impactNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#339AF0',
    marginBottom: 4,
  },
  impactLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    fontWeight: '500',
  },
  impactSummary: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#339AF0',
    backgroundColor: '#F0F8FF',
  },
  optionCardNotRecommended: {
    opacity: 0.8,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  optionRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#339AF0',
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  expandButton: {
    padding: 8,
    marginLeft: 8,
  },
  optionPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  previewItem: {
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
  },
  optionDetails: {
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  prosConsContainer: {
    gap: 12,
  },
  prosContainer: {
    marginBottom: 8,
  },
  consContainer: {
    marginBottom: 8,
  },
  prosConsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  prosConsItem: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 4,
    lineHeight: 18,
    paddingLeft: 8,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#28A745',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recommendedBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  notRecommendedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFC107',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  notRecommendedBadgeText: {
    fontSize: 10,
    color: '#212529',
    fontWeight: '700',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    gap: 12,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6C757D',
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '600',
  },
  selectButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#339AF0',
    alignItems: 'center',
  },
  selectButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default BingeRecoveryModal;