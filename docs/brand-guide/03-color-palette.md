# OSSA Color Palette

> Version 1.0.0 | Last Updated: November 2025

## Primary Brand Colors

### Deep Purple (Primary)
**Base:** `#4A3ECD`
**Usage:** Primary actions, branding, emphasis
**Scale:** 50-950 (see full guide)

### Cyan Blue (Secondary)  
**Base:** `#1CB9ED`
**Usage:** Secondary actions, accents, gradients
**Scale:** 50-950

### Light Purple (Accent)
**Base:** `#9060EA`  
**Usage:** Decorative accents, gradient endpoints
**Scale:** 50-950

### Dark Purple (Depth)
**Base:** `#2D1B69`
**Usage:** Dark backgrounds, dark mode, contrast
**Scale:** 50-950

## Semantic Colors

- **Success:** `#10B981` (Green)
- **Warning:** `#F59E0B` (Amber)
- **Error:** `#EF4444` (Red)
- **Info:** `#06B6D4` (Cyan)

## Neutrals (Grays)

**Scale:** `#F9FAFB` (50) to `#111827` (900)

**Common Uses:**
- Primary text: Gray-700 (#374151) or Gray-900
- Secondary text: Gray-600 (#4B5563)
- Borders: Gray-200 (#E5E7EB) or Gray-300
- Backgrounds: White, Gray-50, Gray-100

## Gradients

### Brand Gradient
```css
background: linear-gradient(135deg, #1CB9ED 0%, #1CB9ED 40%, #4A3ECD 70%, #9060EA 100%);
```

### Hero Gradient
```css
background: linear-gradient(135deg, #1CB9ED 0%, #1CB9ED 35%, #4A3ECD 65%, #9060EA 100%);
```

## Accessibility

All combinations meet WCAG AA minimum (AAA preferred):
- Normal text: 4.5:1 minimum (7:1 target)
- Large text: 3:1 minimum (4.5:1 target)
- UI components: 3:1 minimum

**White text on:**
- Primary-500+: ✅ AAA (7.5:1)
- Secondary-600+: ✅ AA (4.7:1)
- Dark Purple-700+: ✅ AAA (10:1+)

**Black text on:**
- Gray-50 to Gray-300: ✅ AAA (8:1+)
- Primary-50 to Primary-400: ✅ AAA (7:1+)
