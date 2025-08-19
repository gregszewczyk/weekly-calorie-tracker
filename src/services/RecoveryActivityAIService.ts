/**
 * AI Recovery Activity Suggestion Service
 * 
 * Generates personalized activity suggestions to help users recover from overeating events.
 * Focuses on additional movement rather than restrictive language.
 */

import { ActivityBoostSuggestion, OvereatingEvent } from '../types/RecoveryTypes';
import { WeeklyCalorieGoal } from '../types/CalorieTypes';
import { AthleteProfile, TrainingSession } from '../types/AthleteTypes';
import { WorkoutSession } from '../types/ActivityTypes';
import { API_CONFIG, getAPIKey } from '../config/apiConfig';

export interface RecoveryActivityRequest {
  overeatingEvent: OvereatingEvent;
  weeklyGoal: WeeklyCalorieGoal;
  athleteProfile?: AthleteProfile;
  recentTrainingSessions: TrainingSession[];
  excessCalories: number; // How many calories over target
  userWeight: number; // For calorie burn calculations
}

export class RecoveryActivityAIService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = API_CONFIG.endpoints.PERPLEXITY.BASE_URL;
    this.apiKey = getAPIKey('perplexity');
  }

  /**
   * Generate AI-powered activity suggestions for recovery
   */
  async generateActivitySuggestions(request: RecoveryActivityRequest): Promise<ActivityBoostSuggestion[]> {
    try {
      console.log('🏃 [RecoveryActivityAI] Generating activity suggestions for', request.excessCalories, 'excess calories');
      
      const prompt = this.buildActivityPrompt(request);
      const response = await this.callPerplexityAPI(prompt);
      
      if (!response) {
        console.log('❌ [RecoveryActivityAI] No response from AI');
        return [];
      }

      const suggestions = this.parseActivitySuggestions(response, request);
      console.log('✅ [RecoveryActivityAI] Generated', suggestions.length, 'activity suggestions');
      
      return suggestions;
    } catch (error) {
      console.error('❌ [RecoveryActivityAI] Error generating suggestions:', error);
      return [];
    }
  }

  /**
   * Build the AI prompt for activity suggestions
   */
  private buildActivityPrompt(request: RecoveryActivityRequest): string {
    const { overeatingEvent, athleteProfile, recentTrainingSessions, excessCalories, userWeight } = request;

    // Analyze user's current activities
    const userActivities = this.analyzeUserActivities(recentTrainingSessions, athleteProfile);
    const targetCalorieBurn = Math.min(excessCalories * 0.3, 300); // Target 30% of excess, max 300 cal

    return `
**TASK:** Generate 2-3 personalized activity suggestions to help someone who consumed ${excessCalories} extra calories today. Focus on ADDING movement, not punishment.

**USER PROFILE:**
- Weight: ${userWeight}kg
- Current activities: ${userActivities.activities.join(', ') || 'Unknown activities (provide generic suggestions)'}
- Typical session duration: ${userActivities.typicalDuration || 'Unknown'}
- Fitness level: ${userActivities.fitnessLevel || 'Unknown'}

**GUIDELINES:**
1. **Positive framing**: Present as "extra movement opportunities" not "burning off calories"
2. **Achievable**: Base suggestions on what they already do + realistic additions
3. **Variety**: Mix low-intensity options (walks) with activities they enjoy
4. **Flexible timing**: "this week" or "next few days" - not rigid daily requirements
5. **Target ~${Math.round(targetCalorieBurn)} calories of additional activity** (don't mention this number)

**FORMAT YOUR RESPONSE EXACTLY AS:**

SUGGESTION 1:
Title: [Short catchy title]
Description: [What to do and when - be specific about duration/frequency]
Activity Type: [walking/cycling/swimming/etc]
Duration: [e.g., "30 minutes"]
Frequency: [e.g., "3 times this week"]
Difficulty: [easy/moderate]
Personalized Reason: [Why this works for them based on their activities]

SUGGESTION 2:
[Same format]

SUGGESTION 3:
[Same format]

**EXAMPLES OF GOOD SUGGESTIONS:**
- "Add a 20-minute walk after dinner 3 times this week"
- "Extend your next 2 runs by 10 extra minutes"
- "Try 2 short bike rides (25 minutes each) this weekend"

Keep it encouraging and action-oriented. No mention of calories, guilt, or "burning off" food.`;
  }

  /**
   * Analyze user's recent activities to personalize suggestions
   */
  private analyzeUserActivities(sessions: TrainingSession[], athleteProfile?: AthleteProfile) {
    const activities = new Set<string>();
    let totalDuration = 0;
    let sessionCount = 0;

    // Extract activities from recent sessions
    sessions.forEach(session => {
      if (session.sport) {
        activities.add(session.sport);
        totalDuration += session.duration || 0;
        sessionCount++;
      }
    });

    // Add athlete profile activities if available
    if (athleteProfile) {
      activities.add(athleteProfile.trainingProfile.primarySport);
      athleteProfile.trainingProfile.secondarySports?.forEach(sport => activities.add(sport));
    }

    const typicalDuration = sessionCount > 0 ? Math.round(totalDuration / sessionCount) : null;
    
    return {
      activities: Array.from(activities),
      typicalDuration: typicalDuration ? `${typicalDuration} minutes` : null,
      fitnessLevel: athleteProfile?.trainingProfile.currentFitnessLevel || null,
      sessionCount
    };
  }

  /**
   * Parse AI response into structured activity suggestions
   */
  private parseActivitySuggestions(response: string, request: RecoveryActivityRequest): ActivityBoostSuggestion[] {
    const suggestions: ActivityBoostSuggestion[] = [];
    
    // Split response by "SUGGESTION" markers
    const suggestionBlocks = response.split(/SUGGESTION \d+:/i).slice(1);
    
    suggestionBlocks.forEach((block, index) => {
      const suggestion = this.parseSuggestionBlock(block.trim(), index + 1, request.userWeight);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });

    return suggestions;
  }

  /**
   * Parse individual suggestion block
   */
  private parseSuggestionBlock(block: string, index: number, userWeight: number): ActivityBoostSuggestion | null {
    try {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      
      let title = '';
      let description = '';
      let activityType = '';
      let duration = '';
      let frequency = '';
      let difficulty: 'easy' | 'moderate' = 'easy';
      let personalizedReason = '';

      lines.forEach(line => {
        if (line.startsWith('Title:')) {
          title = line.replace('Title:', '').trim();
        } else if (line.startsWith('Description:')) {
          description = line.replace('Description:', '').trim();
        } else if (line.startsWith('Activity Type:')) {
          activityType = line.replace('Activity Type:', '').trim();
        } else if (line.startsWith('Duration:')) {
          duration = line.replace('Duration:', '').trim();
        } else if (line.startsWith('Frequency:')) {
          frequency = line.replace('Frequency:', '').trim();
        } else if (line.startsWith('Difficulty:')) {
          const diff = line.replace('Difficulty:', '').trim().toLowerCase();
          difficulty = diff === 'moderate' ? 'moderate' : 'easy';
        } else if (line.startsWith('Personalized Reason:')) {
          personalizedReason = line.replace('Personalized Reason:', '').trim();
        }
      });

      // Calculate estimated calorie burn based on activity type and duration
      const estimatedCalorieBurn = this.estimateCalorieBurn(activityType, duration, userWeight);

      if (title && description && activityType) {
        return {
          id: `recovery-activity-${Date.now()}-${index}`,
          title,
          description,
          activityType,
          estimatedCalorieBurn,
          duration,
          frequency,
          difficulty,
          personalizedReason: personalizedReason || undefined
        };
      }

      return null;
    } catch (error) {
      console.error('❌ [RecoveryActivityAI] Error parsing suggestion block:', error);
      return null;
    }
  }

  /**
   * Estimate calorie burn for activity suggestions
   */
  private estimateCalorieBurn(activityType: string, duration: string, userWeight: number): number {
    // Extract minutes from duration string
    const durationMatch = duration.match(/(\d+)/);
    const minutes = durationMatch ? parseInt(durationMatch[1]) : 30;

    // MET values for common activities
    const metValues: Record<string, number> = {
      'walking': 3.5,
      'running': 8.0,
      'cycling': 6.0,
      'swimming': 7.0,
      'strength-training': 6.0,
      'yoga': 3.0,
      'dancing': 5.0,
      'hiking': 6.0,
      'climbing': 8.0,
      'basketball': 8.0,
      'tennis': 7.0,
      'soccer': 8.0,
      'default': 4.0
    };

    const met = metValues[activityType.toLowerCase()] || metValues['default'];
    
    // Calorie burn = MET × weight(kg) × time(hours)
    const hours = minutes / 60;
    const calories = met * userWeight * hours;
    
    return Math.round(calories);
  }

  /**
   * Direct API call to Perplexity
   */
  private async callPerplexityAPI(prompt: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        console.error('❌ [RecoveryActivityAI] API request failed:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }

      console.error('❌ [RecoveryActivityAI] No choices in API response');
      return null;
    } catch (error) {
      console.error('❌ [RecoveryActivityAI] API call failed:', error);
      return null;
    }
  }
}