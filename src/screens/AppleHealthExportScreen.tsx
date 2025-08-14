import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput
} from 'react-native';
import { AppleHealthExportService, HealthReport } from '../services/AppleHealthExportService';
import HealthDataVisualization from '../components/HealthDataVisualization';
import { format, subDays, subWeeks, subMonths, parseISO } from 'date-fns';

interface AppleHealthExportScreenProps {
  navigation: any;
}

export const AppleHealthExportScreen: React.FC<AppleHealthExportScreenProps> = ({ navigation }) => {
  const [exportService] = useState(() => new AppleHealthExportService());
  const [isExporting, setIsExporting] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<HealthReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<HealthReport | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      const [weekly, monthly] = await Promise.all([
        exportService.generateWeeklyReport(),
        exportService.generateMonthlyReport()
      ]);
      setWeeklyReport(weekly);
      setMonthlyReport(monthly);
    } catch (error) {
      console.error('Failed to load reports:', error);
      Alert.alert('Error', 'Failed to generate reports. Please try again.');
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleExportFormat = async (format: 'csv' | 'xml' | 'json', dateRange: 'week' | 'month' | 'custom') => {
    setIsExporting(true);
    try {
      let filePath: string;
      let successMessage: string;

      switch (format) {
        case 'csv':
          filePath = await exportService.exportToCSV();
          successMessage = 'CSV export completed successfully!';
          break;
        case 'xml':
          filePath = await exportService.exportToAppleHealthXML();
          successMessage = 'Apple Health XML export completed successfully!';
          break;
        case 'json':
          const endDate = new Date();
          const startDate = dateRange === 'week' ? subWeeks(endDate, 1) : 
                           dateRange === 'month' ? subMonths(endDate, 1) : subDays(endDate, 90);
          filePath = await exportService.exportComprehensiveData(startDate, endDate);
          successMessage = 'Comprehensive JSON export completed successfully!';
          break;
        default:
          throw new Error('Invalid export format');
      }

      Alert.alert(
        'Export Complete',
        `${successMessage}\n\nFile saved to: ${filePath}`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSpecializedExport = async (type: 'nutrition' | 'workouts') => {
    setIsExporting(true);
    try {
      const endDate = new Date();
      const startDate = subMonths(endDate, 1); // Last month
      
      let filePath: string;
      if (type === 'nutrition') {
        filePath = await exportService.exportNutritionData(startDate, endDate);
      } else {
        filePath = await exportService.exportWorkoutData(startDate, endDate);
      }

      Alert.alert(
        'Export Complete',
        `${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully!\n\nFile saved to: ${filePath}`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error(`${type} export failed:`, error);
      Alert.alert('Export Failed', (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWithProvider = async () => {
    if (!emailAddress.trim()) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setIsExporting(true);
    setShowEmailModal(false);
    
    try {
      await exportService.shareWithHealthProvider(emailAddress);
      Alert.alert(
        'Shared Successfully',
        `Health report has been prepared for sharing with ${emailAddress}`
      );
      setEmailAddress('');
    } catch (error) {
      console.error('Sharing failed:', error);
      Alert.alert('Sharing Failed', (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const formatReportSummary = (report: HealthReport | null) => {
    if (!report) return 'No data available';
    
    const { workoutSummary, nutritionSummary, progressTowards } = report;
    return `${workoutSummary.totalWorkouts} workouts • ${Math.round(nutritionSummary.averageDailyCalories)} avg calories • ${Math.round(progressTowards.overallProgress)}% goal progress`;
  };

  if (Platform.OS !== 'ios') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Apple Health Export</Text>
          <Text style={styles.subtitle}>
            Apple Health data export is only available on iOS devices.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Health Data Export</Text>
          <Text style={styles.subtitle}>
            Export your combined Apple Health and nutrition data
          </Text>
        </View>

        {/* Reports Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Recent Reports</Text>
          
          {isLoadingReports ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Generating reports...</Text>
            </View>
          ) : (
            <>
              <View style={styles.reportCard}>
                <Text style={styles.reportTitle}>This Week</Text>
                <Text style={styles.reportSummary}>{formatReportSummary(weeklyReport)}</Text>
                <Text style={styles.reportPeriod}>
                  {weeklyReport ? `${format(weeklyReport.period.start, 'MMM dd')} - ${format(weeklyReport.period.end, 'MMM dd')}` : ''}
                </Text>
              </View>

              <View style={styles.reportCard}>
                <Text style={styles.reportTitle}>This Month</Text>
                <Text style={styles.reportSummary}>{formatReportSummary(monthlyReport)}</Text>
                <Text style={styles.reportPeriod}>
                  {monthlyReport ? `${format(monthlyReport.period.start, 'MMM dd')} - ${format(monthlyReport.period.end, 'MMM dd')}` : ''}
                </Text>
              </View>

              <TouchableOpacity style={styles.refreshButton} onPress={loadReports}>
                <Text style={styles.refreshButtonText}>🔄 Refresh Reports</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Data Visualization */}
        {weeklyReport && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Data Visualization</Text>
            <HealthDataVisualization 
              report={weeklyReport} 
              onExportRequest={() => handleExportFormat('json', 'week')} 
            />
          </View>
        )}

        {/* Export Formats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📁 Export Formats</Text>
          
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => handleExportFormat('csv', 'month')}
            disabled={isExporting}
          >
            <View style={styles.exportButtonContent}>
              <Text style={styles.exportButtonTitle}>📈 CSV Export</Text>
              <Text style={styles.exportButtonSubtitle}>
                Spreadsheet-compatible format for analysis
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => handleExportFormat('xml', 'month')}
            disabled={isExporting}
          >
            <View style={styles.exportButtonContent}>
              <Text style={styles.exportButtonTitle}>🍎 Apple Health XML</Text>
              <Text style={styles.exportButtonSubtitle}>
                Compatible with Apple Health app imports
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => handleExportFormat('json', 'month')}
            disabled={isExporting}
          >
            <View style={styles.exportButtonContent}>
              <Text style={styles.exportButtonTitle}>⚡ Comprehensive JSON</Text>
              <Text style={styles.exportButtonSubtitle}>
                Complete data export with all metadata
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Specialized Exports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Specialized Exports</Text>
          
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => handleSpecializedExport('nutrition')}
            disabled={isExporting}
          >
            <View style={styles.exportButtonContent}>
              <Text style={styles.exportButtonTitle}>🥗 Nutrition Data Only</Text>
              <Text style={styles.exportButtonSubtitle}>
                Daily calories, meals, and nutrition goals
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => handleSpecializedExport('workouts')}
            disabled={isExporting}
          >
            <View style={styles.exportButtonContent}>
              <Text style={styles.exportButtonTitle}>💪 Workout Data Only</Text>
              <Text style={styles.exportButtonSubtitle}>
                Apple Watch workouts and exercise sessions
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Healthcare Provider Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👩‍⚕️ Healthcare Provider Sharing</Text>
          
          <TouchableOpacity 
            style={[styles.exportButton, styles.shareButton]}
            onPress={() => setShowEmailModal(true)}
            disabled={isExporting}
          >
            <View style={styles.exportButtonContent}>
              <Text style={styles.exportButtonTitle}>📧 Share with Provider</Text>
              <Text style={styles.exportButtonSubtitle}>
                Send comprehensive report via email
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacySection}>
          <Text style={styles.privacyTitle}>🔒 Privacy & Security</Text>
          <Text style={styles.privacyText}>
            All health data exports are processed locally on your device. No data is sent to external servers unless you explicitly choose to share via email.
          </Text>
          <Text style={styles.privacyText}>
            Exported files contain sensitive health information. Please handle with appropriate care and share only with trusted healthcare providers.
          </Text>
        </View>

        {/* Loading Overlay */}
        {isExporting && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingTitle}>Exporting Data...</Text>
              <Text style={styles.loadingSubtitle}>
                Processing your health and nutrition data
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Email Modal */}
      <Modal
        visible={showEmailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share with Healthcare Provider</Text>
            <Text style={styles.modalSubtitle}>
              Enter your healthcare provider's email address to share your health report.
            </Text>
            
            <TextInput
              style={styles.emailInput}
              placeholder="doctor@example.com"
              value={emailAddress}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowEmailModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.shareModalButton]} 
                onPress={handleShareWithProvider}
              >
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24,
  },
  section: {
    margin: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  reportCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  reportSummary: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  reportPeriod: {
    fontSize: 12,
    color: '#6c757d',
  },
  refreshButton: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  exportButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shareButton: {
    backgroundColor: '#007AFF',
  },
  exportButtonContent: {
    flex: 1,
  },
  exportButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  exportButtonSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  privacySection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    marginBottom: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    margin: 20,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e9ecef',
    marginRight: 8,
  },
  shareModalButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  shareButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default AppleHealthExportScreen;
