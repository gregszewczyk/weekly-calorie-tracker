export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  preferences: UserPreferences;
  goals: FitnessGoals;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface UserPreferences {
  weekStartDay: 'monday' | 'sunday';
  units: 'metric' | 'imperial';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  dailyReminders: boolean;
  mealLogging: boolean;
  weeklyReview: boolean;
  goalAchievements: boolean;
  reminderTime: string; // HH:MM format
}

export interface PrivacySettings {
  shareProgress: boolean;
  anonymousAnalytics: boolean;
  healthDataSharing: boolean;
}

export interface FitnessGoals {
  primaryGoal: 'weight-loss' | 'weight-gain' | 'maintenance';
  performanceMode: boolean;
  weeklyWeightChangeTarget: number; // kg per week (negative for loss)
  activityLevel: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'extremely-active';
  trainingDaysPerWeek: number;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  firstLaunch: boolean;
  onboardingCompleted: boolean;
  version: string;
}