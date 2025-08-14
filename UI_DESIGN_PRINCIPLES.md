# UI Design Principles - Weekly Calorie Tracker

This document outlines the established design principles for the Weekly Calorie Tracker app to ensure consistency across all UI components and screens.

## 🎯 **Overall Design Philosophy**

**Modern Fitness App Aesthetic** - Clean, professional, data-focused design similar to top-tier fitness apps like MyFitnessPal, Lose It, and Apple Health.

---

## 🎨 **Visual Design Principles**

### **1. No Emojis Policy**
- **Rule**: Never use emojis in UI components unless explicitly requested
- **Rationale**: Maintains professional, modern appearance
- **Alternative**: Use Ionicons for all visual elements

### **2. Card-Based Layout**
- **Design**: Content organized in clean cards with consistent styling
- **Card Properties**:
  ```
  backgroundColor: theme.colors.surface
  borderRadius: 16
  padding: 20
  marginBottom: 16
  shadowColor: '#000'
  shadowOffset: { width: 0, height: 2 }
  shadowOpacity: 0.1
  shadowRadius: 4
  elevation: 3
  ```

### **3. Typography Hierarchy**
- **Primary Headers**: fontSize: 18, fontWeight: '700'
- **Section Labels**: fontSize: 14, fontWeight: '500', color: textSecondary
- **Values/Numbers**: fontSize: 24-28, fontWeight: '700', color: primary
- **Body Text**: fontSize: 14, fontWeight: '400'
- **Subtext**: fontSize: 12, color: textSecondary

---

## 📐 **Layout Principles**

### **1. Streamlined Data Presentation**
- **Avoid**: Multiple separate cards for related information
- **Prefer**: Combined sections with clear visual hierarchy
- **Example**: Today vs Future comparison in side-by-side cards

### **2. Space Efficiency**
- **No Circular Progress Rings**: They take too much screen space
- **Use**: Linear progress bars with gradients
- **Height**: 8px for progress bars with 4px border radius

### **3. Floating Action Button (FAB)**
- **Position**: Bottom-right corner (24px from edges)
- **Size**: 56x56px circular
- **Shadow**: Prominent elevation (shadowOpacity: 0.3, elevation: 8)
- **Icon**: Simple "+" for primary actions

---

## 🎯 **Content Organization**

### **1. Hero Section Pattern**
- **Structure**: Phase/context header + main metric + progress bar + status message
- **Purpose**: Primary information at top with clear visual hierarchy
- **Example**: "Week 2 • Cutting Phase" + progress + "Strong pacing" message

### **2. Comparison Cards**
- **Layout**: Side-by-side cards for related metrics
- **Structure**: Label (small caps) + Value (large) + Subtext + Details
- **Use Case**: Today vs Future planning, Current vs Target

### **3. Timeline Visualization**
- **Style**: Horizontal dots/indicators instead of complex charts
- **States**: Filled (●) for completed, empty (○) for future
- **Position**: Below main content for context

---

## 🎨 **Color Usage**

### **1. Status Colors**
- **Success/On-track**: '#51CF66' (green)
- **Error/Over-budget**: '#FF6B6B' (red)  
- **Warning/Under-budget**: '#FFD43B' (yellow)
- **Primary**: theme.colors.primary (blue)

### **2. Background Hierarchy**
- **Main Background**: theme.colors.background
- **Card Background**: theme.colors.surface
- **Nested Cards**: theme.colors.card (slightly different shade)

### **3. Text Colors**
- **Primary Text**: theme.colors.text
- **Secondary Text**: theme.colors.textSecondary
- **Values/Metrics**: theme.colors.primary for emphasis

---

## 📱 **Interactive Elements**

### **1. Buttons**
- **Primary Actions**: FAB with prominent shadow
- **Secondary Actions**: Small icon buttons in headers
- **Info Actions**: Small info icons (16px) with subtle styling

### **2. Touch Feedback**
- **activeOpacity**: 0.8 for all touchable elements
- **hitSlop**: { top: 10, bottom: 10, left: 10, right: 10 } for small icons

### **3. Modal Design**
- **Background**: Semi-transparent overlay
- **Content**: Card-style with rounded corners
- **Header**: Title + close button (X icon)

---

## 📊 **Data Visualization**

### **1. Progress Indicators**
- **Style**: Linear bars, not circular rings
- **Height**: 8px with 4px border radius
- **Colors**: Dynamic based on status (green/red/yellow)

### **2. Metric Display**
- **Large Numbers**: 24-28px, bold, with proper formatting (commas)
- **Units**: Smaller text below or beside main number
- **Context**: Always provide context ("remaining", "per day", etc.)

### **3. Status Messaging**
- **Tone**: Motivational and factual ("Strong pacing", "Over budget by X")
- **Placement**: Below main metrics as summary
- **Style**: 14px, centered, secondary text color

---

## 🔄 **Navigation Patterns**

### **1. Screen Headers**
- **Structure**: Title + action buttons (theme toggle, settings, etc.)
- **Alignment**: Title left, actions right
- **Buttons**: 24px icons with 8px padding

### **2. Primary Actions**
- **Method**: FAB for main actions (logging, adding)
- **Position**: Bottom-right, always accessible
- **Icon**: Simple, recognizable (+ for add actions)

---

## ♿ **Accessibility Guidelines**

### **1. Touch Targets**
- **Minimum Size**: 44x44px for all interactive elements
- **Hit Areas**: Use hitSlop for small icons
- **Spacing**: Adequate spacing between touch targets

### **2. Text Contrast**
- **Follow**: Theme system for proper contrast ratios
- **Test**: Both light and dark mode compatibility

### **3. Screen Reader Support**
- **Labels**: Provide accessibilityLabel for icon-only buttons
- **Context**: Ensure all data has proper semantic meaning

---

## 🏗️ **Implementation Standards**

### **1. Theme Integration**
- **Always Use**: theme.colors.* for all colors
- **Support**: Both light and dark modes
- **Consistency**: Never hardcode colors except for status indicators

### **2. Responsive Design**
- **Flexible**: Use flex layouts, avoid fixed widths
- **Adaptable**: Content should work on different screen sizes
- **Safe Areas**: Respect device safe areas and notches

### **3. Component Reusability**
- **Modular**: Create reusable components for common patterns
- **Consistent**: Same component should look identical across screens
- **Props**: Use props for variations, not separate components

---

## ❌ **Anti-Patterns (What to Avoid)**

1. **Heavy Card Layouts** - Too many separate cards create clutter
2. **Circular Progress Rings** - Waste screen space
3. **Emoji Usage** - Unprofessional appearance
4. **Inconsistent Spacing** - Use consistent margins/padding
5. **Complex Charts** - Keep data visualization simple and clear
6. **Long Button Text** - Use icons and concise labels
7. **Cluttered Headers** - Limit header actions to essential functions

---

## ✅ **Success Patterns**

1. **Hero + Comparison Layout** - Clear information hierarchy
2. **FAB for Primary Actions** - Always accessible, clean
3. **Side-by-side Cards** - Efficient space usage for comparisons
4. **Linear Progress Indicators** - Clear, space-efficient
5. **Contextual Status Messages** - Motivational and informative
6. **Theme-based Colors** - Consistent across light/dark modes

---

*This document should be referenced for all future UI changes to maintain consistency and quality in the app's design.*