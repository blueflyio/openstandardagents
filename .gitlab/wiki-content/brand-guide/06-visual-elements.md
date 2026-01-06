<!--
OSSA Brand Guide: 06-visual-elements.md
Purpose: Brand guidelines for OSSA visual identity and messaging
Audience: Designers, marketers, and contributors
Educational Focus: Maintain consistent OSSA brand across ecosystem
-->
# OSSA Visual Elements

> Version 1.0.0 | Last Updated: November 2025

## Gradients

### Brand Gradient (Primary)
```css
background: linear-gradient(135deg, #1CB9ED 0%, #1CB9ED 40%, #4A3ECD 70%, #9060EA 100%);
```
**Usage:** Headers, hero sections, primary emphasis

### Hero Gradient
```css
background: linear-gradient(135deg, #1CB9ED 0%, #1CB9ED 35%, #4A3ECD 65%, #9060EA 100%);
```

### Button Gradient
```css
background: linear-gradient(135deg, #1CB9ED 0%, #1CB9ED 45%, #4A3ECD 75%, #9060EA 100%);
```

## Icons

**Style:** Outline/Stroke icons (Heroicons style)
**Stroke Width:** 1.5px (default), 2px (emphasis)
**Sizes:** 16px, 20px, 24px, 32px, 48px, 64px
**Library:** Heroicons or Lucide React

**Usage:**
- Navigation: 24px
- Actions: 20px
- Status: 24px
- External links: 16px

## Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.04);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.12);
--shadow-brand: 0 8px 16px rgba(74, 62, 205, 0.3);
```

## Border Radius

```css
--radius-sm: 4px;    /* Badges */
--radius-md: 8px;    /* Buttons, inputs */
--radius-lg: 12px;   /* Cards */
--radius-xl: 16px;   /* Modals */
--radius-2xl: 24px;  /* Hero elements */
--radius-full: 9999px; /* Avatars, pills */
```

## Spacing

**Base Grid:** 4px

```css
--space-1: 4px    --space-6: 24px
--space-2: 8px    --space-8: 32px
--space-3: 12px   --space-10: 40px
--space-4: 16px   --space-12: 48px
--space-5: 20px   --space-16: 64px
```

## Buttons

### Primary Button
- Background: Primary-500 or Gradient
- Text: White
- Padding: 12px 24px
- Border Radius: 8px
- Hover: Primary-600 + shadow-lg + translateY(-1px)
- Focus: Ring (3px, Primary-300)

### Secondary Button
- Background: Secondary-500
- Text: White
- Hover: Secondary-600

### Outline Button
- Border: 2px Primary-500
- Text: Primary-500
- Hover: Background Primary-500, text white

### Ghost Button
- Text: Primary-500
- Hover: Background Primary-50

## Cards

**Default Card:**
- Background: White
- Border: 1px Gray-200
- Border Radius: 12px
- Padding: 24px
- Shadow: shadow-sm

**Interactive Card (Hover):**
- Border: Primary
- Shadow: shadow-xl
- Transform: translateY(-4px)

**Featured Card:**
- Background: Gradient (subtle, low opacity)
- Border: 2px Primary-200

## Badges

**Style:**
- Padding: 4px 12px
- Border Radius: 9999px
- Font Size: 12px
- Font Weight: 600
- Text Transform: Uppercase
- Letter Spacing: 0.05em

**Variants:** Primary, Success, Warning, Error, Neutral

## Animations

**Timing:**
- Fast: 150ms ease (hover, color changes)
- Base: 200ms ease (default)
- Slow: 300ms ease (page transitions, modals)

**Respect:** `prefers-reduced-motion`

## Accessibility

✅ Contrast: WCAG AA minimum (4.5:1 text, 3:1 UI)
✅ Focus: Visible 3px rings, 3:1 contrast
✅ Touch Targets: 44×44px minimum (48×48px preferred)
✅ Alt Text: All logos and images
