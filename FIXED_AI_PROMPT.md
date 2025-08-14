# Fixed AI Prompt for Nutrition Plan Generation

## Current Issues with Existing Prompt:
1. We're calculating and providing calorie targets TO the AI (lines 428-435)
2. We're telling AI exactly what calories to recommend (lines 459, 464, 469) 
3. AI should be calculating these based on user's data, not us

## New Prompt Structure:

```javascript
return `NUTRITION EXPERT: Analyze the complete user profile below and determine if their goal is achievable within the specified timeframe. Provide structured recommendations ONLY - no thinking process, no explanations.

${athleteInfo}

${goalInfo}

${trainingInfo}

${garminInfo}
${appleHealthInfo}
${historicalInfo}

Periodization Phase: ${periodizationPhase || 'base-building'}
Preference Level: ${preferenceLevel}

CRITICAL SAFETY RULES:
- All recommendations must be above safe minimum (1200 kcal/day for females, 1500 kcal/day for males)
- Determine appropriate protein intake based on user's sport and goals
- Determine safe maximum deficit based on user's profile and goals

TASK: 
1. Analyze if user's goal is achievable within their specified timeframe
2. If YES: Provide 3 approaches (conservative/standard/aggressive) for their actual goal
3. If NO: Suggest what IS achievable in timeframe + provide 3 approaches for that realistic goal

USER'S SELECTED BASELINE:
- TDEE: ${selectedTDEEValue} kcal/day (from ${tdeeMethodName.toUpperCase()} method)
- Current Body Fat: ${athleteProfile.physicalStats.bodyFatPercentage || 'Unknown'}%
- Timeline: ${currentGoal.targetDate ? 'Target date: ' + currentGoal.targetDate : 'Open-ended goal'}
- Goals: ${currentGoal.targetGoals?.performance?.targetMetrics?.map(m => `${m.metricName}: ${m.value} ${m.unit}`).join(', ') || 'Goals not specified - determine appropriate targets based on user profile'}

REQUIRED OUTPUT FORMAT:

**GOAL ANALYSIS:**
[State if user's goal is achievable in timeframe - YES/NO and brief reason]

**RECOMMENDED APPROACHES:**

### CONSERVATIVE APPROACH: X kcal/day (X% deficit from ${selectedTDEEValue} TDEE)
- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
- Training days: +Xg carbs, Rest days: -Xg carbs
- Weekly deficit: X kcal, Estimated timeline: X weeks

### STANDARD APPROACH: X kcal/day (X% deficit from ${selectedTDEEValue} TDEE) ★ RECOMMENDED
- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
- Training days: +Xg carbs, Rest days: -Xg carbs
- Weekly deficit: X kcal, Estimated timeline: X weeks

### AGGRESSIVE APPROACH: X kcal/day (X% deficit from ${selectedTDEEValue} TDEE)
- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
- Training days: +Xg carbs, Rest days: -Xg carbs
- Weekly deficit: X kcal, Estimated timeline: X weeks

**${athleteProfile.trainingProfile.primarySport.toUpperCase()} SPECIFICS:**
Pre-workout: Xg carbs + Xg protein. Post-workout: Xg carbs + Xg protein. Hydration: X liters/day.

**SUPPLEMENTS:** 
Creatine: Xg/day, Protein powder: as needed, Others: [specific recommendations]

**MONITORING:** 
Track: weight, performance metrics, energy levels. Adjust if weekly weight loss >X% or <X%.

Base all calculations on user's selected TDEE of ${selectedTDEEValue} kcal/day. Calculate appropriate deficits for their specific goals and timeline.`;
```

## Key Changes:
1. **Removed our calorie calculations** - AI now calculates all values
2. **Added goal feasibility analysis** - AI determines if goal is achievable in timeframe  
3. **AI calculates deficits from user's selected TDEE** - not hardcoded percentages
4. **Clear instruction format** - AI knows exactly what to analyze and output
5. **Uses actual user goal data** - real body fat targets, timeline, performance goals
6. **No thinking tags** - structured output only

## This should fix:
- AI fabricating data (3392 weekly deficit)
- Wrong calorie parsing (970, 1370, 570)
- Using ranges instead of user's actual targets ("10-12%" vs "10%")
- Incomplete responses with thinking process