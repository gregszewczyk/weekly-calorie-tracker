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
  ActivityBoostSuggestion,
  RECOVERY_MESSAGES,
} from '../types/RecoveryTypes';
import { useTheme } from '../contexts/ThemeContext';

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
  const { theme } = useTheme();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [showActivitySuggestions, setShowActivitySuggestions] = useState(false);

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

  const getStatusColor = (triggerType: OvereatingEvent['triggerType']) => {
    switch (triggerType) {
      case 'mild':
        return '#51CF66'; // Success green
      case 'moderate':
        return '#FFD43B'; // Warning yellow
      case 'severe':
        return '#FF6B6B'; // Error red
      default:
        return theme.colors.textSecondary;
    }
  };

  const getIconByTriggerType = (triggerType: OvereatingEvent['triggerType']) => {
    switch (triggerType) {
      case 'mild':
        return 'information-circle-outline';
      case 'moderate':
        return 'warning-outline';
      case 'severe':
        return 'alert-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const statusColor = getStatusColor(overeatingEvent.triggerType);
  const statusIcon = getIconByTriggerType(overeatingEvent.triggerType);

  const formatNumber = (num: number): string => {
    return Math.round(num).toLocaleString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Clean Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{messageTemplate.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section - Following WeeklyBankingScreen Pattern */}
          <View style={[styles.heroSection, { backgroundColor: theme.colors.surface }]}>
            {/* Status Header */}
            <View style={styles.statusHeader}>
              <View style={styles.statusIndicator}>
                <Ionicons name={statusIcon} size={20} color={statusColor} />
                <Text style={[styles.statusText, { color: theme.colors.text }]}>
                  {formatNumber(overeatingEvent.excessCalories)} calories over target
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusLabel, { color: statusColor }]}>
                  {overeatingEvent.triggerType.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Positive Reframing */}
            <View style={[styles.reframeSection, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.reframeMessage, { color: theme.colors.text }]}>
                {impactAnalysis.reframe.message}
              </Text>
              <Text style={[styles.refocusPoint, { color: theme.colors.textSecondary }]}>
                {impactAnalysis.reframe.focusPoint}
              </Text>
              {impactAnalysis.reframe.successReminder && (
                <Text style={[styles.successReminder, { color: '#51CF66' }]}>
                  {impactAnalysis.reframe.successReminder}
                </Text>
              )}
            </View>
          </View>

          {/* Impact Analysis - Streamlined Cards */}
          <View style={[styles.impactSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Real Impact</Text>
            
            <View style={styles.impactGrid}>
              <View style={[styles.impactCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.impactLabel, { color: theme.colors.textSecondary }]}>WEEKS TO RECOVER</Text>
                <Text style={[styles.impactValue, { color: theme.colors.primary }]}>
                  {isNaN(impactAnalysis.realImpact.timelineDelayDays) ? '0' : Math.round(impactAnalysis.realImpact.timelineDelayDays / 7 * 10) / 10}
                </Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.impactLabel, { color: theme.colors.textSecondary }]}>OF WEEKLY BUDGET</Text>
                <Text style={[styles.impactValue, { color: theme.colors.primary }]}>
                  {isNaN(impactAnalysis.realImpact.weeklyGoalImpact) ? '0' : impactAnalysis.realImpact.weeklyGoalImpact}%
                </Text>
              </View>
            </View>

            <Text style={[styles.impactSummary, { color: theme.colors.textSecondary }]}>
              This represents {isNaN(impactAnalysis.perspective.percentOfTotalJourney) ? '0' : Math.round(impactAnalysis.perspective.percentOfTotalJourney * 10) / 10}% of your main goal. 
              Gentle rebalancing gets you back on track.
            </Text>
          </View>

          {/* Recovery Options - Streamlined */}
          <View style={[styles.optionsSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recovery Options</Text>
            
            {/* Recommended Options */}
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
                theme={theme}
                isRecommended={true}
              />
            ))}

            {/* Other Options */}
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
                theme={theme}
                isRecommended={false}
              />
            ))}
          </View>

          {/* AI Activity Boost Suggestions - Expandable */}
          {recoveryPlan.aiActivitySuggestions && recoveryPlan.aiActivitySuggestions.length > 0 && (
            <View style={[styles.activitySection, { backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity
                style={styles.activityHeader}
                onPress={() => setShowActivitySuggestions(!showActivitySuggestions)}
                activeOpacity={0.7}
              >
                <View style={styles.activityHeaderContent}>
                  <Ionicons 
                    name="fitness-outline" 
                    size={20} 
                    color={theme.colors.primary} 
                    style={styles.activityIcon}
                  />
                  <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                    Activity Boost Tips
                  </Text>
                  <Text style={[styles.activitySubtitle, { color: theme.colors.textSecondary }]}>
                    AI suggestions to help recovery
                  </Text>
                </View>
                <Ionicons
                  name={showActivitySuggestions ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {showActivitySuggestions && (
                <View style={styles.activityContent}>
                  {recoveryPlan.aiActivitySuggestions.map((suggestion) => (
                    <View 
                      key={suggestion.id} 
                      style={[styles.suggestionCard, { backgroundColor: theme.colors.card }]}
                    >
                      <View style={styles.suggestionHeader}>
                        <Text style={[styles.suggestionTitle, { color: theme.colors.text }]}>
                          {suggestion.title}
                        </Text>
                        <View style={[
                          styles.difficultyBadge,
                          { backgroundColor: suggestion.difficulty === 'easy' ? '#E8F5E8' : '#FFF3E0' }
                        ]}>
                          <Text style={[
                            styles.difficultyText,
                            { color: suggestion.difficulty === 'easy' ? '#2E7D32' : '#F57C00' }
                          ]}>
                            {suggestion.difficulty}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.suggestionDescription, { color: theme.colors.textSecondary }]}>
                        {suggestion.description}
                      </Text>
                      
                      {suggestion.personalizedReason && (
                        <Text style={[styles.personalizedReason, { color: theme.colors.primary }]}>
                          💡 {suggestion.personalizedReason}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Action Buttons - Following FAB Pattern */}
        <View style={[styles.actionBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity 
            style={[styles.dismissButton, { borderColor: theme.colors.border }]} 
            onPress={handleDismiss}
          >
            <Text style={[styles.dismissButtonText, { color: theme.colors.text }]}>
              I'll Handle This Myself
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.selectButton,
              { backgroundColor: selectedOptionId ? theme.colors.primary : theme.colors.textSecondary },
            ]}
            onPress={handleSelectOption}
            disabled={!selectedOptionId}
            activeOpacity={0.8}
          >
            <Text style={[styles.selectButtonText, { color: theme.colors.buttonText }]}>
              Start Recovery Plan
            </Text>
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
  theme: any;
  isRecommended: boolean;
}

const RebalancingOptionCard: React.FC<RebalancingOptionCardProps> = ({
  option,
  isSelected,
  isExpanded,
  onSelect,
  onToggleDetails,
  theme,
  isRecommended,
}) => {
  const getEffortLevelColor = (effortLevel: string) => {
    switch (effortLevel) {
      case 'minimal':
        return '#51CF66';
      case 'moderate':
        return '#FFD43B';
      case 'challenging':
        return '#FF6B6B';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return '#51CF66';
      case 'moderate':
        return '#FFD43B';
      case 'aggressive':
        return '#FF6B6B';
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        { 
          backgroundColor: theme.colors.card, 
          borderColor: isSelected ? theme.colors.primary : theme.colors.border 
        },
        isSelected && { borderWidth: 2 },
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.optionHeader}>
        <View style={styles.optionTitleRow}>
          <View style={[styles.optionRadio, { borderColor: theme.colors.border }]}>
            {isSelected && <View style={[styles.optionRadioSelected, { backgroundColor: theme.colors.primary }]} />}
          </View>
          <View style={styles.optionInfo}>
            <View style={styles.optionTitleWithBadge}>
              <Text style={[styles.optionName, { color: theme.colors.text }]}>{option.name}</Text>
              {isRecommended && (
                <View style={[styles.recommendedBadge, { backgroundColor: '#51CF66' }]}>
                  <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                </View>
              )}
            </View>
            <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
              {option.description}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onToggleDetails} style={styles.expandButton}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Quick Impact Preview - Streamlined */}
      <View style={styles.optionPreview}>
        <View style={styles.previewItem}>
          <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>Target:</Text>
          <Text style={[styles.previewValue, { color: theme.colors.text }]}>
            {Math.round(option.impact.newDailyTarget).toLocaleString()} cal
          </Text>
        </View>
        <View style={styles.previewItem}>
          <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>Effort:</Text>
          <Text style={[
            styles.previewValue,
            { color: getEffortLevelColor(option.impact.effortLevel) }
          ]}>
            {option.impact.effortLevel}
          </Text>
        </View>
        <View style={styles.previewItem}>
          <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>Risk:</Text>
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
        <View style={[styles.optionDetails, { backgroundColor: theme.colors.background }]}>
          <View style={styles.prosConsContainer}>
            <View style={styles.prosContainer}>
              <Text style={[styles.prosConsTitle, { color: theme.colors.text }]}>Pros:</Text>
              {option.pros.map((pro, index) => (
                <Text key={index} style={[styles.prosConsItem, { color: theme.colors.text }]}>
                  • {pro}
                </Text>
              ))}
            </View>
            
            {option.cons && option.cons.length > 0 && (
              <View style={styles.consContainer}>
                <Text style={[styles.prosConsTitle, { color: theme.colors.text }]}>Considerations:</Text>
                {option.cons.map((con, index) => (
                  <Text key={index} style={[styles.prosConsItem, { color: theme.colors.text }]}>
                    • {con}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Container and Layout
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Hero Section - Following WeeklyBankingScreen Pattern
  heroSection: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Positive Reframing Section
  reframeSection: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  reframeMessage: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 24,
  },
  refocusPoint: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  successReminder: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // Impact Analysis - Streamlined
  impactSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  impactCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  impactValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  impactSummary: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Recovery Options
  optionsSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  optionRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  expandButton: {
    padding: 8,
  },

  // Preview Section
  optionPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  previewItem: {
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Expanded Details
  optionDetails: {
    padding: 16,
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
    marginBottom: 8,
  },
  prosConsItem: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
    paddingLeft: 8,
  },

  // Badges
  recommendedBadge: {
    backgroundColor: '#51CF66',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recommendedBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Action Bar - Following FAB Pattern
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // AI Activity Suggestions Section
  activitySection: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  activityHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  activitySubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  activityContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  suggestionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  difficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  suggestionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  personalizedReason: {
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});

export default BingeRecoveryModal;