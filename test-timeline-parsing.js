/**
 * Test timeline parsing from actual AI response
 */

// Mock the exact response we got to test parsing
const mockAIResponse = `Here are three nutrition approaches (Conservative, Standard, Aggressive) tailored for your profile and goal to reduce body fat from 16% to under 10% by October 12, 2025, while maintaining running performance for the Manchester half marathon. Your current stats: 33-year-old male, 177 cm, 90 kg, 16% BF, training 15h/week (10h strength + 5h running), enhanced TDEE 1282 active calories/day, aiming for a weekly deficit of 3500 kcal.

---

### 1. Conservative Approach

- Daily Calories: ~2,500 kcal  
- Weekly Weight Loss Rate: ~0.3 kg/week (approx. 0.7 lbs/week)  
- Timeline Assessment:  
  - At 0.3 kg/week, ~18 weeks (~4.5 months) needed  
  - Completion date: ~Late December 2025 (slightly beyond race date)  

---

### 2. Standard Approach

- Daily Calories: ~2,300 kcal  
- Weekly Weight Loss Rate: ~0.5 kg/week (approx. 1.1 lbs/week)  
- Timeline Assessment:  
  - At 0.5 kg/week, ~11 weeks (~2.5 months) needed  
  - Completion date: Late October 2025 (just after race day)  

---

### 3. Aggressive Approach

- Daily Calories: ~2,000 kcal  
- Weekly Weight Loss Rate: ~0.75–1.0 kg/week (1.6–2.2 lbs/week)  
- Timeline Assessment:  
  - At 0.8 kg/week, ~7 weeks (~1.5 months) needed  
  - Completion date: Early September 2025 (well before race date)`;

// Test the parsing patterns we just updated
function testTimelineParsing() {
  console.log('🧪 Testing timeline parsing...\n');
  
  // The patterns we updated in PerplexityService.ts
  const timelinePatterns = [
    // Look for weeks mentioned in timeline assessment sections
    { name: 'conservative', regex: /conservative\s+approach[\s\S]*?~(\d+)\s*weeks?/i },
    { name: 'standard', regex: /standard\s+approach[\s\S]*?~(\d+)\s*weeks?/i },
    { name: 'aggressive', regex: /aggressive\s+approach[\s\S]*?~(\d+)\s*weeks?/i },
  ];
  
  const timelineMatches = {};
  for (const pattern of timelinePatterns) {
    const match = mockAIResponse.match(pattern.regex);
    if (match && !timelineMatches[pattern.name]) {
      timelineMatches[pattern.name] = match[1];
      console.log(`✅ Found ${pattern.name}: ${match[1]} weeks`);
    } else {
      console.log(`❌ No match for ${pattern.name}`);
    }
  }
  
  console.log('\n📊 Timeline matches:', timelineMatches);
  
  // Test if we can extract different timelines
  if (timelineMatches.conservative && timelineMatches.standard && timelineMatches.aggressive) {
    const conservativeWeeks = parseInt(timelineMatches.conservative);
    const standardWeeks = parseInt(timelineMatches.standard);
    const aggressiveWeeks = parseInt(timelineMatches.aggressive);
    
    console.log('\n🎯 Timeline comparison:');
    console.log(`Conservative: ${conservativeWeeks} weeks`);
    console.log(`Standard: ${standardWeeks} weeks`);
    console.log(`Aggressive: ${aggressiveWeeks} weeks`);
    
    if (conservativeWeeks > standardWeeks && standardWeeks > aggressiveWeeks) {
      console.log('✅ Timelines are correctly ordered (Conservative > Standard > Aggressive)');
    } else {
      console.log('❌ Timelines are not properly ordered');
    }
  } else {
    console.log('❌ Could not extract all three timelines');
  }
}

testTimelineParsing();