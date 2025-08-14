/**
 * Binge Recovery Calculator Types
 * 
 * Mathematical approach to overeating recovery that prevents emotional spirals
 * and provides concrete, actionable rebalancing strategies.
 */

export interface OvereatingEvent {
  id: string;
  date: string; // YYYY-MM-DD
  excessCalories: number; // Calories over target
  triggerType: 'mild' | 'moderate' | 'severe'; // Based on excess amount
  detectedAt: Date; // When the system detected this
  userAcknowledged: boolean; // Has user seen the recovery options?
}

export interface RecoveryPlan {
  id: string;
  overeatingEventId: string;
  strategy: RecoveryStrategy;
  impactAnalysis: ImpactAnalysis;
  rebalancingOptions: RebalancingOption[];
  createdAt: Date;
  selectedOption?: string; // ID of chosen rebalancing option
}

export type RecoveryStrategy = 
  | 'gentle-rebalancing'    // Spread over 5-7 days, minimal daily impact
  | 'moderate-correction'   // Spread over 3-5 days, moderate daily reduction
  | 'quick-recovery'       // 1-3 days, higher daily deficit (only for small overages)
  | 'maintenance-week';    // Take a maintenance week, extend timeline

export interface ImpactAnalysis {
  // Actual mathematical impact
  realImpact: {
    timelineDelayDays: number;      // "This adds 2.3 days to your goal"
    weeklyGoalImpact: number;       // "This is 15% of your weekly deficit"
    monthlyGoalImpact: number;      // "This is 3% of your monthly progress"
  };
  
  // Put things in perspective
  perspective: {
    equivalentWorkouts: number;     // "This equals 2.5 gym sessions worth of calories"
    daysToNullify: number;         // "Normal tracking for 3 days nullifies this"
    percentOfTotalJourney: number;  // "This is 0.8% of your total cut progress"
  };
  
  // Positive reframing
  reframe: {
    message: string;               // Custom message based on severity
    focusPoint: string;           // What to focus on instead of guilt
    successReminder?: string;     // Remind them of recent wins
  };
}

export interface RebalancingOption {
  id: string;
  name: string;                   // "Gentle 7-Day Rebalance"
  description: string;            // "Reduce by 71 calories/day for 7 days"
  
  // Strategy details
  durationDays: number;
  dailyAdjustment: number;        // Calories to reduce per day
  minSafetyCals: number;         // Ensures user doesn't go below 1200
  
  // Impact preview
  impact: {
    newDailyTarget: number;       // What their daily target becomes
    effortLevel: 'minimal' | 'moderate' | 'challenging';
    riskLevel: 'safe' | 'moderate' | 'aggressive';
  };
  
  // Messaging
  pros: string[];                // Why this option is good
  cons?: string[];               // Potential downsides
  recommendation?: 'recommended' | 'advanced' | 'not-recommended';
}

export interface RecoverySession {
  id: string;
  startDate: string;             // When recovery plan started
  endDate: string;               // When it completes
  originalPlan: RecoveryPlan;
  
  // Progress tracking
  progress: {
    daysCompleted: number;
    daysRemaining: number;
    adherenceRate: number;       // % of days they stuck to the plan
    adjustedTarget: number;      // Current daily target
  };
  
  // Status
  status: 'active' | 'completed' | 'abandoned' | 'modified';
  completionDate?: Date;
}

// For the CalorieStore
export interface RecoveryState {
  activeRecoverySession?: RecoverySession;
  recentOvereatingEvents: OvereatingEvent[];
  recoveryHistory: RecoveryPlan[];
  
  // Settings
  settings: {
    autoTriggerThreshold: number;     // Calories over target that triggers recovery mode
    enableRecoveryMode: boolean;      // User can disable this feature
    preferredStrategy: RecoveryStrategy;
    maxDailyReduction: number;       // Safety limit on daily deficit increases
  };
}

// Trigger thresholds based on severity
export const OVEREATING_THRESHOLDS = {
  mild: 200,      // 200-500 calories over
  moderate: 500,  // 500-1000 calories over  
  severe: 1000,   // 1000+ calories over
} as const;

// Recovery messaging templates
export const RECOVERY_MESSAGES = {
  mild: {
    title: "Minor Overage Detected",
    reframe: "This is completely normal and easily manageable.",
    focus: "One high day doesn't change your overall progress."
  },
  moderate: {
    title: "Overage Recovery Options",
    reframe: "This happens to everyone. Let's rebalance mathematically.",
    focus: "You have several great options to stay on track."
  },
  severe: {
    title: "Recovery Plan Available", 
    reframe: "Big days happen. The key is having a smart recovery strategy.",
    focus: "This doesn't undo your progress - let's adapt and continue."
  }
} as const;