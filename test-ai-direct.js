// Direct API test to see AI response without going through TypeScript imports
const fetch = require('node-fetch');

const API_KEY = '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';
const API_URL = 'https://api.perplexity.ai/chat/completions';

function calculateEstimatedCompletionDate(weeksString, targetDate) {
  if (!weeksString) return '';
  
  const today = new Date();
  let estimatedWeeks;
  
  // Handle ranges like "8-10" or "8–10" - take the middle value
  if (weeksString.includes('-') || weeksString.includes('–')) {
    const [start, end] = weeksString.split(/[-–]/).map(n => parseInt(n.trim()));
    estimatedWeeks = Math.round((start + end) / 2);
  } else {
    estimatedWeeks = parseInt(weeksString);
  }
  
  if (isNaN(estimatedWeeks) || estimatedWeeks <= 0) return '';
  
  // Calculate estimated completion date
  const estimatedDate = new Date(today);
  estimatedDate.setDate(today.getDate() + (estimatedWeeks * 7));
  
  const formattedEstimated = estimatedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  }).replace(/\//g, '.');

  // If we have a target date, compare them
  if (targetDate) {
    const target = new Date(targetDate);
    const formattedTarget = target.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '.');

    const timeDiff = estimatedDate.getTime() - target.getTime();
    const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));
    
    if (Math.abs(daysDiff) <= 7) {
      return `Est: ${formattedEstimated} (on target)`;
    } else if (daysDiff < 0) {
      return `Est: ${formattedEstimated} (${Math.abs(daysDiff)}d early)`;
    } else {
      return `Est: ${formattedEstimated} (${daysDiff}d late)`;
    }
  }
  
  return `Est: ${formattedEstimated} (~${estimatedWeeks}w)`;
}

// Build the prompt manually to test the new format
const athleteInfo = `
Athlete Profile:
- Age: 33
- Weight: 88kg
- Height: 177cm
- Gender: male
- Body Fat: 15%
- Primary Sport: strength-training
- Training Experience: intermediate
- Fitness Level: intermediate
- Weekly Training Hours: 14
- Sessions Per Week: 10`;

const goalInfo = `
Current Goal:
- Mode: cut
- Timeline: Target date: 2025-10-12`;

const trainingInfo = 'No recent training data available';

const garminInfo = 'No Garmin data available';
const appleHealthInfo = 'No Apple Health data available';

const historicalInfo = `
SELECTED TDEE ANALYSIS (CRITICAL - BASE ALL CALCULATIONS ON THIS):
- Selected TDEE (ENHANCED): 3230 kcal/day
- This includes ALL daily movement (walking, activities, structured workouts)
- Data Source: Real Garmin device data with 10% conservative adjustment
- Confidence Level: HIGH (based on actual device measurements)

GOAL DETAILS:
- Mode: cut
- Performance Mode: YES - prioritize training performance
- Timeline: Target date: 2025-10-12

USER'S TARGET OUTCOME:
- Target Outcome: Get to 10% body fat while training for sub-2h half marathon
- Performance Goals: Half Marathon Time: 120 minutes, Body Fat: 10 %
- Body Composition Goals: Current: 15% → Target: 10%
- Weight Goals: None specified`;

const prompt = `NUTRITION EXPERT: You MUST provide ONLY the structured format below. Do NOT show any thinking process, analysis, or explanations. Just fill in the exact template with calculated values.

${athleteInfo}

${goalInfo}

${trainingInfo}

${garminInfo}
${appleHealthInfo}
${historicalInfo}

Periodization Phase: base-building
Preference Level: advanced

CRITICAL SAFETY RULES:
- All recommendations must be above safe minimum (1200 kcal/day for females, 1500 kcal/day for males)
- Determine appropriate protein intake based on user's sport and goals
- Determine safe maximum deficit based on user's profile and goals

TASK: 
1. Analyze if user's goal is achievable within their specified timeframe
2. If YES: Provide 3 approaches (conservative/standard/aggressive) for their actual goal
3. If NO: Suggest what IS achievable in timeframe + provide 3 approaches for that realistic goal

USER'S SELECTED BASELINE:
- TDEE: 3230 kcal/day (from ENHANCED method)
- Current Body Fat: 15%
- Timeline: Target date: 2025-10-12
- Goals: Half Marathon Time: 120 minutes, Body Fat: 10 %

REQUIRED OUTPUT FORMAT:

**GOAL ANALYSIS:**
[State if user's goal is achievable in timeframe - YES/NO and brief reason]

**RECOMMENDED APPROACHES:**

### CONSERVATIVE APPROACH: X kcal/day (X% deficit from 3230 TDEE)
- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
- Training days: +Xg carbs, Rest days: -Xg carbs
- Weekly deficit: X kcal, Estimated timeline: X weeks

### STANDARD APPROACH: X kcal/day (X% deficit from 3230 TDEE) ★ RECOMMENDED
- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
- Training days: +Xg carbs, Rest days: -Xg carbs
- Weekly deficit: X kcal, Estimated timeline: X weeks

### AGGRESSIVE APPROACH: X kcal/day (X% deficit from 3230 TDEE)
- Protein: Xg (X.Xg/kg), Carbs: Xg (X.Xg/kg), Fats: Xg (X%)
- Training days: +Xg carbs, Rest days: -Xg carbs
- Weekly deficit: X kcal, Estimated timeline: X weeks

**STRENGTH-TRAINING SPECIFICS:**
Pre-workout: Xg carbs + Xg protein. Post-workout: Xg carbs + Xg protein. Hydration: X liters/day.

**SUPPLEMENTS:** 
Creatine: Xg/day, Protein powder: as needed, Others: [specific recommendations]

**MONITORING:** 
Track: weight, performance metrics, energy levels. Adjust if weekly weight loss >X% or <X%.

Base all calculations on user's selected TDEE of 3230 kcal/day. Calculate appropriate deficits for their specific goals and timeline.`;

async function testAPI() {
  console.log('🧪 Testing AI Nutrition API directly...');
  console.log('📝 Prompt length:', prompt.length, 'characters');
  
  try {
    console.log('\n🚀 Calling Perplexity API...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition expert. You MUST respond with ONLY the requested structured format. Never show thinking, analysis, or explanations. Just provide the exact format requested with calculated values.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0,
        top_p: 0.8,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message.content || '';
    
    console.log('\n✅ AI Response Received!');
    console.log('📄 Full Response:');
    console.log('=' .repeat(80));
    console.log(aiResponse);
    console.log('=' .repeat(80));
    
    // Test our parsing patterns
    console.log('\n🔍 Testing Parsing Patterns...');
    const cleanContent = aiResponse.replace(/<think>.*?<\/think>/gs, '');
    
    const patterns = [
      { name: 'conservative', regex: /#{2,}\s*conservative\s+approach[:\-\s]*([\d,]+)\s*kcal\/day/i },
      { name: 'standard', regex: /#{2,}\s*standard\s+approach[:\-\s]*([\d,]+)\s*kcal\/day/i },
      { name: 'aggressive', regex: /#{2,}\s*aggressive\s+approach[:\-\s]*([\d,]+)\s*kcal\/day/i },
    ];
    
    const timelinePatterns = [
      { name: 'conservative', regex: /conservative\s+approach[\s\S]*?Estimated timeline:\s*~?(\d+(?:[–\-]\d+)?)\s*weeks?/i },
      { name: 'standard', regex: /standard\s+approach[\s\S]*?Estimated timeline:\s*~?(\d+(?:[–\-]\d+)?)\s*weeks?/i },
      { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?Estimated timeline:\s*~?(\d+(?:[–\-]\d+)?)\s*weeks?/i },
    ];
    
    const matches = {};
    for (const pattern of patterns) {
      const match = cleanContent.match(pattern.regex);
      if (match && !matches[pattern.name]) {
        matches[pattern.name] = match[1].replace(/,/g, '');
      }
    }
    
    // Parse timeline matches
    const timelineMatches = {};
    for (const pattern of timelinePatterns) {
      const match = cleanContent.match(pattern.regex);
      if (match && !timelineMatches[pattern.name]) {
        timelineMatches[pattern.name] = match[1];
      }
    }
    
    console.log('🎯 Extracted Calorie Values:', matches);
    console.log('📅 Extracted Timeline Values:', timelineMatches);
    
    // Test estimated completion date calculation
    const targetDate = '2025-10-12'; // User's target date
    console.log('\n📅 Testing Timeline Calculations:');
    Object.entries(timelineMatches).forEach(([level, weeksStr]) => {
      const estimated = calculateEstimatedCompletionDate(weeksStr, targetDate);
      console.log(`${level.toUpperCase()}: ${estimated} (from ${weeksStr} weeks)`);
    });
    
    // Check if values are realistic
    Object.entries(matches).forEach(([level, calories]) => {
      const cals = parseInt(calories);
      if (cals < 1500) {
        console.log(`⚠️  ${level.toUpperCase()}: ${cals} kcal - TOO LOW!`);
      } else if (cals > 4000) {
        console.log(`⚠️  ${level.toUpperCase()}: ${cals} kcal - TOO HIGH!`);
      } else {
        console.log(`✅ ${level.toUpperCase()}: ${cals} kcal - Reasonable`);
      }
    });
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

testAPI();