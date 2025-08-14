# AI Nutrition Plan Generation - User Stories

## Epic: Goal Validation & Nutrition Plan Creation

### Story: AI-Powered Nutrition Planning
**As a user who has completed onboarding setup, I want the AI to analyze my complete profile and provide realistic nutrition approaches so I can choose how to achieve my goals**

**Acceptance Criteria:**
- [ ] Send complete user profile data to AI (no hardcoded calorie values)
- [ ] Include user's selected TDEE, actual goals, timeline, training data, body composition targets
- [ ] AI analyzes if user's goal is achievable within specified timeframe
- [ ] If goal IS achievable: AI provides 3 approaches (conservative/standard/aggressive) with daily calories and macros for user's actual goal
- [ ] If goal is NOT achievable: AI suggests what CAN be done in timeframe + provides 3 approaches for the realistic modified goal
- [ ] Each approach includes: daily calories, protein/carbs/fat grams, training day carb adjustments
- [ ] User selects one approach to complete onboarding process
- [ ] No coaching advice at this stage - just nutrition plan options

**Implementation Notes:**
- File: `src/services/PerplexityService.ts`
- Remove ALL hardcoded calorie values (2300, 2100, 1900) from AI prompt
- Send user's actual data: selectedTDEE, targetGoals.bodyComposition, targetGoals.performance, timeline
- AI calculates all calorie recommendations based on user's actual TDEE and goals
- Update response parsing to extract 3 nutrition approaches with macros from AI response
- This completes onboarding flow - future coaching features come separately

**Current Issues to Fix:**
- AI prompt contains hardcoded calorie targets instead of letting AI calculate from user data
- Response parsing extracting wrong calorie values (970, 1370, 570 kcal) - likely due to hardcoded prompt confusion
- AI fabricating weekly deficit goals (3392 kcal) not present in user's actual goal configuration
- AI not using user's actual timeline or body fat targets (shows "10-12%" instead of user's "10%")
- AI showing thinking process instead of structured recommendations

**Success Criteria:**
- AI receives only user's real profile data with no hardcoded assumptions
- AI provides 3 realistic nutrition approaches based on user's selected TDEE and actual goals
- Each approach has safe, achievable daily calorie targets appropriate for user (>1500 kcal for 88kg active male)
- Response parsing correctly extracts calorie and macro values from AI recommendations
- User can select their preferred approach and complete onboarding with chosen nutrition plan

**Technical Tasks:**
1. Remove hardcoded calorie values from AI prompt in `buildPrompt()` method
2. Ensure prompt sends only user's actual goal data (body fat target, timeline, selected TDEE)
3. Update AI prompt to request structured nutrition plan recommendations without coaching advice
4. Fix response parsing in `parseAIRecommendations()` to handle dynamic calorie values
5. Test that AI provides realistic calorie targets based on user's actual TDEE and goals