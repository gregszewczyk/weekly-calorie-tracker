# AI Issues to Fix

## Issue 1: Performance Goals Not Mentioned in AI Response
- **Problem**: AI only considers mode and date, ignoring actual performance goals
- **Root Cause**: Performance goals likely not being sent properly in prompt
- **Expected**: AI should consider Half Marathon: 120 minutes, Body Fat: 10% goals

## Issue 2: Parsing Extracting Wrong Calorie Values  
- **Problem**: App shows 1284 kcal but AI said 2257 kcal for aggressive approach
- **Root Cause**: Circular calculation logic in parsing:
  1. AI says: 2257 kcal/day ✅
  2. Code calculates deficit: `(2257 - 3230) * 7 = -6811` weekly 
  3. `generateRecommendation()` recalculates: `3230 + (-6811/7) = 1284` ❌
- **Fix**: Use AI's calorie values directly, don't recalculate

## Issue 3: Poor Approach Differentiation
- **Problem**: App only shows "-0.xkg" weight loss
- **Missing**: What each approach actually achieves:
  - Conservative: X% body fat in Y weeks
  - Standard: X% body fat in Y weeks  
  - Aggressive: X% body fat in Y weeks
- **Fix**: Parse and display AI's outcome predictions for each approach

## Implementation Plan
1. Fix performance goals in AI prompt
2. Fix parsing to use AI calorie values directly
3. Parse AI's outcome predictions (body fat %, timeline) for each approach
4. Update UI to show meaningful approach differences