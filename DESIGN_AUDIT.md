# UI/Styling Audit (Initial Pass)

This document captures the current styling / UX issues and improvement opportunities for reference.

## 1. Consistency & Theming
- Ad-hoc hex colors scattered (#333, #666, #999, #3498db, #51CF66, #FF6B6B, #f8f9fa) instead of semantic tokens.
- Components not using existing ThemeContext; hard-coded surface/background/text colors.
- No dark theme adaptations for most components (e.g., `CalorieBankCard`).
- Inline status color logic duplicated (progress, badges, warnings) instead of centralized mapping.

## 2. Typography
- Many discrete font sizes (11,12,13,14,20,22,28) without a defined scale.
- Mixed weight usage ("600" vs "bold").
- No reusable `<AppText>` abstraction for variant-based styles.

## 3. Spacing & Layout
- Magic numbers (4,6,8,12,14,16,20,24) across files; no spacing tokens.
- Repeated padding / margin patterns not abstracted.
- Large monolithic screens (e.g. `NutritionRecommendationScreen` > 1000 lines) mixing data + view logic.

## 4. Components & Reuse
- Repeated patterns: cards, progress bars, stat rows, badges, section headers—all custom each time.
- No unified Button/Badge/Progress components → inconsistent visuals & behavior.
- Macro distribution & progress bars lack animation abstractions.

## 5. Accessibility
- Color contrast risk (#999 on white for body/caption text).
- Emoji-only status indicators without accessible labels.
- Missing `accessibilityRole`, `accessibilityLabel`, and test IDs.
- No handling for reduced motion preferences.

## 6. Visual Feedback & Motion
- Progress width updates snap (no easing / animation).
- Card selection (e.g., plan selection) lacks haptic or animated feedback.
- Loading states limited to single spinner—no skeleton placeholders.

## 7. Data Visualization
- Macro bars rely solely on color (no patterns/icons) → color-blindness risk.
- No timeline / phase visualization for goal progression.

## 8. Architecture / Separation
- Screens implement complex layout + state + formatting in one file (e.g., `NutritionRecommendationScreen`).
- Formatting helpers (number/percent/time) duplicated inline.

## 9. Performance
- Large renders with no memoization or virtualization for potentially growing sections.
- Animated values not extracted to Reanimated/Animated for smoother transitions.

## 10. Design System Gaps
- No design tokens directory (colors, spacing, typography, elevation, radius, z-index).
- Shadow / elevation declarations repeated per component.
- No variant system for cards (elevated / outlined / subtle).

## 11. Internationalization & Formatting
- Numeric formatting done manually (`Math.round(num).toLocaleString()`) scattered; no central util.
- Units embedded inside labels rather than structured (future localization risk).

## 12. Safety & Health Context Presentation
- Static calorie safety thresholds in prompt—UI does not reflect dynamic health constraints or rationale.

## 13. Naming & Semantics
- Inconsistent style key naming: `metricItem`, `detailItem`, `macroItem` with overlapping semantics.
- Mixed casing in comments and emojis in logs (fine for dev, not for prod telemetry).

## 14. Future-Proofing / Extensibility
- No dark-high-contrast or AMOLED theme variant.
- No design lint rules to enforce token usage.

---

# Recommended Roadmap

## Phase 1 (Foundation)
1. Introduce design tokens (`src/theme/tokens/*`): colors, spacing, typography, radius, elevation.
2. Create primitive components: `Card`, `AppText`, `Badge`, `ProgressBar`, `Skeleton`, `Stat`, `MacroBar`.
3. Refactor `CalorieBankCard` to use tokens + theme (see V2 prototype).

## Phase 2 (Experience)
4. Add animated transitions (Reanimated) for progress and selection.
5. Implement accessible labels & color-blind friendly patterns.
6. Introduce skeleton loading states where AI/network latency occurs.
7. Add haptic feedback (plan selection, save actions).

## Phase 3 (Visualization & Personalization)
8. Build timeline/phase visual for goal progression.
9. Add adaptive accent extraction (system / sport-based theming).
10. Macro radial or segmented ring alternative.

## Phase 4 (Governance & Quality)
11. Add ESLint rules to forbid raw hex values outside tokens.
12. Add Storybook / component gallery (optional) for visual regression.
13. Add unit tests for style utils (e.g. color selection based on status).

---

# Quick Wins Identified
- Centralize number formatting util (`formatNumber`, `formatKcal`, `formatPercent`).
- Replace repeated shadow definitions with token (`elevation.sm|md|lg`).
- Add `<AccessibleStatus icon label status />` wrapper around status + emoji.
- Convert plan selection cards to share a single `<ApproachCard variant>`.

---

# Prototype Reference
See `src/components/CalorieBankCardV2.tsx` for a themed redesign prototype to compare with current implementation.

---

(Keep this file updated as refactors progress.)
