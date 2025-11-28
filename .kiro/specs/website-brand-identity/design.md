# Design Document: OSSA Website Design System Audit & Enhancement

## Overview

This design document presents a comprehensive audit of the Open Standard Agents website from the perspective of a Principal Creative Director. The audit evaluates brand integrity, visual systems, component architecture, accessibility, and user experience quality across all pages and touchpoints.

**Current State:** The website demonstrates solid technical implementation with Next.js, Tailwind CSS, and SCSS variables. However, significant opportunities exist to elevate the design to match the premium positioning of an industry standard specification.

**Target State:** A cohesive, accessible, performant design system that projects authority, clarity, and professionalism while maintaining the technical excellence of the underlying codebase.

## Architecture

### Design System Structure

```
Design System
├── Tokens (SCSS Variables)
│   ├── Colors (Brand, Semantic, Neutral)
│   ├── Typography (Families, Sizes, Weights)
│   ├── Spacing (Scale, Rhythm)
│   └── Effects (Shadows, Gradients, Transitions)
├── Atoms
│   ├── Button (Primary, Secondary, Outline, Ghost)
│   ├── Badge (Status, Category, Version)
│   ├── Icon (System, Brand, Social)
│   └── Input (Text, Select, Checkbox, Radio)
├── Molecules
│   ├── Card (Default, Hover, Featured)
│   ├── Navigation Item (Link, Dropdown, Active)
│   ├── Logo Grid Item
│   └── Code Block (Inline, Block, Syntax)
├── Organisms
│   ├── Header (Desktop, Mobile)
│   ├── Footer (Multi-column)
│   ├── Hero Section (Gradient, CTA)
│   └── Documentation Sidebar
└── Templates
    ├── Homepage
    ├── Documentation Page
    ├── Playground
    └── About/Static Pages
```

### Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + SCSS Modules
- **Typography:** Inter (UI), JetBrains Mono (Code)
- **Icons:** Inline SVG (Heroicons style)
- **State Management:** React Hooks
- **Code Editor:** Monaco Editor (Playground)

## Components and Interfaces

### 1. Design Tokens (SCSS Variables)

**Current Implementation:**
```scss
// Brand Colors
$ossa-primary: #4A3ECD;
$ossa-secondary: #1CB9ED;
$ossa-accent: #9060EA;

// Semantic Colors
$ossa-success: #10b981;
$ossa-warning: #f59e0b;
$ossa-error: #ef4444;
$ossa-info: #06b6d4;
```

**Issues Identified:**
- ✅ **GOOD:** Centralized color system in SCSS
- ⚠️ **CONCERN:** Gradients are hardcoded in multiple places instead of using variables
- ⚠️ **CONCERN:** No dark mode tokens defined
- ⚠️ **CONCERN:** Semantic colors lack sufficient tint/shade variations

**Recommendations:**
1. Extend color palette with tints (50-900 scale) for each brand color
2. Create gradient tokens as CSS custom properties for runtime flexibility
3. Define dark mode color mappings
4. Add focus ring colors for accessibility

### 2. Typography System

**Current Implementation:**
- **Font Family:** Inter (sans-serif), JetBrains Mono (monospace)
- **Sizes:** Tailwind default scale (text-sm, text-base, text-lg, etc.)
- **Line Heights:** Inconsistent across components

**Issues Identified:**
- ❌ **CRITICAL:** No defined type scale for headings (H1-H6)
- ❌ **CRITICAL:** Inconsistent line-height values (some 1.2, some 1.5, some default)
- ⚠️ **CONCERN:** Font sizes in hero are too large on mobile (text-6xl/7xl)
- ⚠️ **CONCERN:** No defined font-weight scale beyond default Tailwind

**Recommendations:**

```typescript
// Proposed Typography Scale
const typography = {
  display: {
    fontSize: '4.5rem', // 72px
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: '-0.02em'
  },
  h1: {
    fontSize: '3.5rem', // 56px
    lineHeight: 1.2,
    fontWeight: 700,
    letterSpacing: '-0.01em'
  },
  h2: {
    fontSize: '2.5rem', // 40px
    lineHeight: 1.3,
    fontWeight: 700
  },
  h3: {
    fontSize: '2rem', // 32px
    lineHeight: 1.4,
    fontWeight: 600
  },
  h4: {
    fontSize: '1.5rem', // 24px
    lineHeight: 1.5,
    fontWeight: 600
  },
  h5: {
    fontSize: '1.25rem', // 20px
    lineHeight: 1.5,
    fontWeight: 600
  },
  h6: {
    fontSize: '1.125rem', // 18px
    lineHeight: 1.5,
    fontWeight: 600
  },
  body: {
    fontSize: '1rem', // 16px
    lineHeight: 1.6,
    fontWeight: 400
  },
  small: {
    fontSize: '0.875rem', // 14px
    lineHeight: 1.5,
    fontWeight: 400
  }
};
```

### 3. Button Component System

**Current Implementation:**
```scss
.btn-primary {
  @apply bg-primary text-white px-6 py-3 rounded-lg font-medium 
         hover:opacity-90 transition-opacity;
}
```

**Issues Identified:**
- ⚠️ **CONCERN:** Only opacity change on hover (lacks depth/elevation)
- ⚠️ **CONCERN:** No disabled state styling
- ⚠️ **CONCERN:** No loading state
- ⚠️ **CONCERN:** Focus states rely on browser defaults

**Recommended Button System:**

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

// Variants
const buttonVariants = {
  primary: {
    base: 'bg-gradient-to-r from-secondary via-primary to-accent text-white',
    hover: 'hover:shadow-lg hover:scale-105',
    focus: 'focus:ring-4 focus:ring-primary/30',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed'
  },
  secondary: {
    base: 'bg-secondary text-white',
    hover: 'hover:bg-secondary/90 hover:shadow-md',
    focus: 'focus:ring-4 focus:ring-secondary/30'
  },
  outline: {
    base: 'border-2 border-primary text-primary bg-transparent',
    hover: 'hover:bg-primary hover:text-white',
    focus: 'focus:ring-4 focus:ring-primary/30'
  },
  ghost: {
    base: 'text-primary bg-transparent',
    hover: 'hover:bg-primary/10',
    focus: 'focus:ring-4 focus:ring-primary/20'
  }
};

// Sizes
const buttonSizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
};
```

### 4. Card Component System

**Current Implementation:**
```scss
.card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-300;
}

.card-hover {
  @apply card hover:shadow-lg transition-shadow;
}
```

**Issues Identified:**
- ✅ **GOOD:** Basic card structure exists
- ⚠️ **CONCERN:** Border color (gray-300) is too prominent
- ⚠️ **CONCERN:** No elevation system (only shadow-md and shadow-lg)
- ⚠️ **CONCERN:** No card variants (default, featured, interactive)

**Recommended Card System:**

```typescript
interface CardProps {
  variant: 'default' | 'featured' | 'interactive' | 'ghost';
  padding: 'sm' | 'md' | 'lg';
  elevation: 0 | 1 | 2 | 3;
  hover?: boolean;
}

const cardVariants = {
  default: {
    base: 'bg-white border border-gray-200 rounded-xl',
    hover: 'hover:shadow-lg hover:-translate-y-1'
  },
  featured: {
    base: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-primary/20 rounded-xl',
    hover: 'hover:border-primary/40 hover:shadow-xl'
  },
  interactive: {
    base: 'bg-white border-2 border-gray-200 rounded-xl cursor-pointer',
    hover: 'hover:border-primary hover:shadow-xl hover:-translate-y-1'
  },
  ghost: {
    base: 'bg-transparent border-none',
    hover: 'hover:bg-gray-50'
  }
};

const elevations = {
  0: 'shadow-none',
  1: 'shadow-sm',
  2: 'shadow-md',
  3: 'shadow-lg'
};
```

### 5. Navigation System

**Current Implementation:**
- Desktop: Horizontal nav with text links
- Mobile: Hamburger menu with slide-down
- Active states: Not clearly defined

**Issues Identified:**
- ❌ **CRITICAL:** No visual indicator for current page
- ⚠️ **CONCERN:** Mobile menu lacks smooth animation
- ⚠️ **CONCERN:** Hover states are subtle (only color change)
- ⚠️ **CONCERN:** No keyboard navigation indicators

**Recommended Navigation System:**

```typescript
interface NavItemProps {
  label: string;
  href: string;
  active?: boolean;
  icon?: ReactNode;
  badge?: string;
}

const navItemStyles = {
  base: 'relative px-4 py-2 text-gray-700 font-medium transition-all duration-200',
  hover: 'hover:text-primary hover:bg-primary/5 rounded-lg',
  active: 'text-primary bg-primary/10 rounded-lg',
  focus: 'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
  // Active indicator (underline or dot)
  indicator: 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
};
```

## Data Models

### Design Token Schema

```typescript
interface DesignTokens {
  colors: {
    brand: {
      primary: ColorScale;
      secondary: ColorScale;
      accent: ColorScale;
    };
    semantic: {
      success: ColorScale;
      warning: ColorScale;
      error: ColorScale;
      info: ColorScale;
    };
    neutral: {
      white: string;
      gray: ColorScale;
      black: string;
    };
  };
  typography: {
    fontFamilies: {
      sans: string;
      mono: string;
    };
    fontSizes: Record<string, string>;
    fontWeights: Record<string, number>;
    lineHeights: Record<string, number>;
    letterSpacing: Record<string, string>;
  };
  spacing: {
    scale: Record<number, string>;
    containerMaxWidths: Record<string, string>;
  };
  effects: {
    shadows: Record<string, string>;
    gradients: Record<string, string>;
    transitions: Record<string, string>;
    borderRadius: Record<string, string>;
  };
}

interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // Base color
  600: string;
  700: string;
  800: string;
  900: string;
}
```

## Critical Issues Audit

### 🔴 CRITICAL ISSUES (Must Fix Immediately)

#### 1. **Inconsistent Gradient Usage**
- **Location:** Homepage hero, section backgrounds, buttons
- **Issue:** Gradients are hardcoded with different color stops across components
- **Impact:** Brand inconsistency, maintenance nightmare
- **Fix:** Centralize gradients in CSS custom properties

```scss
// _variables.scss - ADD THESE
:root {
  --gradient-brand: linear-gradient(135deg, #{$ossa-secondary} 0%, #{$ossa-primary} 70%, #{$ossa-accent} 100%);
  --gradient-hero: linear-gradient(135deg, #{$ossa-secondary} 0%, #{$ossa-primary} 65%, #{$ossa-accent} 100%);
  --gradient-button: linear-gradient(to right, #{$ossa-secondary}, #{$ossa-primary}, #{$ossa-accent});
}
```

#### 2. **Typography Hierarchy Breakdown**
- **Location:** All pages
- **Issue:** No consistent heading scale, line-heights vary wildly
- **Impact:** Poor scannability, unprofessional appearance
- **Fix:** Implement type scale system (see Typography System above)

#### 3. **Accessibility Violations**
- **Location:** Interactive elements, forms, images
- **Issues:**
  - Focus indicators barely visible
  - Some images lack alt text
  - Color contrast issues on gradient backgrounds
  - Touch targets below 44x44px on mobile
- **Impact:** WCAG 2.1 AA non-compliance, legal risk, poor UX
- **Fix:** Implement comprehensive accessibility audit and fixes

#### 4. **Mobile Navigation UX**
- **Location:** Header component
- **Issue:** Hamburger menu lacks smooth transitions, no close button inside menu
- **Impact:** Poor mobile experience
- **Fix:** Add Framer Motion animations, improve mobile menu UX

#### 5. **Logo Integration Inconsistency**
- **Location:** Partner logos section (homepage)
- **Issue:** Using external favicon services with inconsistent sizing and quality
- **Impact:** Unprofessional appearance, slow loading
- **Fix:** Use local SVG assets with consistent sizing

### ⚠️ HIGH PRIORITY ISSUES

#### 6. **Card Component Variations**
- **Issue:** Only two card styles (card, card-hover) insufficient for diverse content
- **Fix:** Implement full card system with variants

#### 7. **Button States Incomplete**
- **Issue:** No disabled, loading, or icon button variants
- **Fix:** Extend button component with all states

#### 8. **Spacing Inconsistency**
- **Issue:** Section padding varies (py-12, py-16, py-20, py-24) without clear pattern
- **Fix:** Define spacing rhythm system

#### 9. **Code Block Styling**
- **Issue:** Code blocks lack copy buttons, line numbers, and proper syntax highlighting
- **Fix:** Enhance code block component

#### 10. **Form Components Missing**
- **Issue:** No standardized form inputs, labels, error states
- **Fix:** Build form component library

### 💡 MEDIUM PRIORITY IMPROVEMENTS

#### 11. **Micro-interactions**
- Add subtle animations on scroll (fade-in, slide-up)
- Improve hover states with scale transforms
- Add loading skeletons for async content

#### 12. **Dark Mode Support**
- Define dark mode color tokens
- Implement theme toggle
- Test all components in dark mode

#### 13. **Performance Optimization**
- Lazy load images below fold
- Code-split large components
- Optimize font loading

#### 14. **Content Density**
- Some sections feel cramped (tight spacing)
- Others feel sparse (excessive whitespace)
- Establish consistent density patterns

#### 15. **Visual Anchors**
- Add more icons to guide scanning
- Use color-coded sections for different content types
- Implement breadcrumbs for deep pages

## Page-by-Page Audit

### Homepage (/)

**Strengths:**
- ✅ Clear value proposition above fold
- ✅ Gradient hero is visually striking
- ✅ Good use of social proof (GitHub stars, framework logos)
- ✅ Logical content flow

**Issues:**
- ❌ Hero text too large on mobile (text-6xl/7xl)
- ❌ "Why Does This Matter?" section has poor contrast (amber background)
- ⚠️ Logo grid uses external services (slow, inconsistent)
- ⚠️ Feature cards lack visual hierarchy
- ⚠️ CTA buttons need more prominence

**Recommendations:**
1. Reduce hero font size on mobile (text-4xl max)
2. Improve "Why" section with better background (white or light blue)
3. Replace logo grid with local SVG assets
4. Add icons to feature cards
5. Make primary CTA more prominent (larger, animated)

### Documentation Pages (/docs)

**Strengths:**
- ✅ Clean layout with sidebar navigation
- ✅ Good use of code blocks
- ✅ Breadcrumbs for navigation

**Issues:**
- ❌ Sidebar lacks visual hierarchy (all items same weight)
- ❌ Code blocks lack copy buttons
- ⚠️ No table of contents for long pages
- ⚠️ Links not clearly distinguished from body text
- ⚠️ No "Edit on GitHub" link

**Recommendations:**
1. Add visual hierarchy to sidebar (icons, indentation, active states)
2. Implement copy buttons for code blocks
3. Add floating table of contents for long pages
4. Style links with underline or color
5. Add "Edit on GitHub" footer to each page

### Playground (/playground)

**Strengths:**
- ✅ Monaco editor integration
- ✅ Template switcher
- ✅ Validation feedback

**Issues:**
- ❌ Validation results lack visual polish
- ⚠️ Template buttons need active state indicator
- ⚠️ No keyboard shortcuts displayed
- ⚠️ Error messages could be more actionable

**Recommendations:**
1. Redesign validation results with better success/error states
2. Add clear active state to template buttons
3. Display keyboard shortcuts (Cmd+S to validate, etc.)
4. Improve error messages with suggestions

### About Page (/about)

**Strengths:**
- ✅ Clear mission statement
- ✅ Good use of icons
- ✅ Logical content structure

**Issues:**
- ⚠️ Cards feel repetitive (same style throughout)
- ⚠️ Could use more visual variety
- ⚠️ "Get Involved" section could be more prominent

**Recommendations:**
1. Vary card styles (featured, default, ghost)
2. Add illustrations or diagrams
3. Make "Get Involved" a prominent CTA section

## Error Handling

### Current State
- Basic 404 page exists
- No error boundaries for runtime errors
- No loading states for async operations

### Recommended Error Handling Strategy

```typescript
// Error Boundary Component
interface ErrorBoundaryProps {
  fallback: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// Loading States
interface LoadingState {
  type: 'skeleton' | 'spinner' | 'progress';
  message?: string;
}

// Error Messages
interface ErrorMessage {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

## Testing Strategy

### Visual Regression Testing
- **Tool:** Percy or Chromatic
- **Coverage:** All component variants, all pages
- **Frequency:** On every PR

### Accessibility Testing
- **Tool:** axe-core, WAVE
- **Coverage:** All interactive components, all pages
- **Frequency:** On every PR
- **Manual:** Keyboard navigation, screen reader testing

### Performance Testing
- **Tool:** Lighthouse CI
- **Metrics:** Performance > 90, Accessibility > 95, Best Practices > 90, SEO > 95
- **Frequency:** On every deploy

### Cross-browser Testing
- **Browsers:** Chrome, Firefox, Safari, Edge
- **Devices:** Desktop (1920x1080, 1366x768), Tablet (768x1024), Mobile (375x667, 414x896)
- **Frequency:** Before major releases

### Component Testing
- **Tool:** Storybook + Chromatic
- **Coverage:** All atoms, molecules, organisms
- **Frequency:** Continuous

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. ✅ Audit complete (this document)
2. Extend SCSS variables with full color scales
3. Define typography system
4. Create design token documentation
5. Set up Storybook for component development

### Phase 2: Core Components (Week 3-4)
1. Build Button component system
2. Build Card component system
3. Build Form components (Input, Select, Checkbox, Radio)
4. Build Badge and Tag components
5. Build Icon system

### Phase 3: Layout & Navigation (Week 5-6)
1. Refactor Header with active states
2. Improve mobile navigation
3. Refactor Footer
4. Build Breadcrumb component
5. Build Table of Contents component

### Phase 4: Page Enhancements (Week 7-8)
1. Homepage improvements
2. Documentation page improvements
3. Playground enhancements
4. About page improvements
5. Add loading states and error boundaries

### Phase 5: Polish & Optimization (Week 9-10)
1. Micro-interactions and animations
2. Accessibility audit and fixes
3. Performance optimization
4. Cross-browser testing
5. Visual regression testing setup

### Phase 6: Documentation & Handoff (Week 11-12)
1. Design system documentation
2. Component usage guidelines
3. Accessibility guidelines
4. Performance guidelines
5. Maintenance playbook

## Success Metrics

### Quantitative Metrics
- **Lighthouse Performance:** > 90
- **Lighthouse Accessibility:** > 95
- **Lighthouse Best Practices:** > 90
- **Lighthouse SEO:** > 95
- **Core Web Vitals:**
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
- **WCAG 2.1 AA Compliance:** 100%

### Qualitative Metrics
- **Brand Consistency:** All pages use centralized design tokens
- **Component Reusability:** 80%+ of UI built from shared components
- **Developer Experience:** New pages can be built in < 1 day
- **User Feedback:** Positive sentiment on design and usability

## Conclusion

The OSSA website has a solid technical foundation but requires significant design system work to match the premium positioning of an industry standard. The primary issues are:

1. **Inconsistent visual language** (gradients, typography, spacing)
2. **Incomplete component library** (missing states, variants)
3. **Accessibility gaps** (focus states, contrast, touch targets)
4. **Mobile experience** (navigation, typography, spacing)

By implementing the recommendations in this document, the website will achieve:
- **Professional polish** befitting an industry standard
- **Accessibility compliance** (WCAG 2.1 AA)
- **Maintainability** through a robust design system
- **Performance** (Lighthouse scores > 90)
- **Scalability** for future growth

The proposed 12-week implementation roadmap provides a clear path forward, with measurable success metrics at each phase.
# Design Document: Brand Identity MVP for v0.2.6 Release

## Overview

This design document outlines the technical approach for completing the Brand Identity MVP (Issue #44) for the OSSA v0.2.6 release. The implementation focuses on six critical areas: Button component completion, navigation active states, CodeBlock interactivity, homepage enterprise messaging, mobile navigation UX, and accessibility compliance.

The design leverages the existing Next.js 14 (App Router) architecture, React 18, TypeScript, and Tailwind CSS infrastructure already in place.

## Architecture

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18 with TypeScript
- **Styling**: Tailwind CSS + SCSS modules
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useEffect)
- **Clipboard API**: Native browser Clipboard API

### Component Architecture

```
website/
├── components/
│   ├── ui/
│   │   ├── Button.tsx (existing - enhance)
│   │   ├── Card.tsx (existing)
│   │   ├── Badge.tsx (existing)
│   │   └── CodeBlock.tsx (new)
│   ├── layout/
│   │   ├── Header.tsx (existing - enhance)
│   │   ├── MobileNav.tsx (existing - enhance)
│   │   └── Sidebar.tsx (existing - enhance)
│   └── home/
│       ├── HeroSection.tsx (existing - enhance)
│       ├── ComparisonMatrix.tsx (new)
│       └── WhyItMatters.tsx (existing - enhance)
├── app/
│   ├── page.tsx (homepage - enhance)
│   └── docs/
│       └── [...slug]/page.tsx (docs pages)
└── styles/
    └── _variables.scss (existing design tokens)
```

## Components and Interfaces

### 1. Button Component Enhancement

**File**: `website/components/ui/Button.tsx`

**Current State**: Basic Button component exists with variants

**Enhancements Needed**:

- Ensure all 6 variants are properly styled (primary, secondary, outline, ghost, danger, success)
- Add loading state with spinner
- Improve focus ring visibility for WCAG compliance
- Add icon positioning support (left/right)

**Interface**:

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}
```

### 2. CodeBlock Component (New)

**File**: `website/components/ui/CodeBlock.tsx`

**Purpose**: Display code examples with syntax highlighting and copy functionality

**Interface**:

```typescript
interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}
```

**Features**:

- Syntax highlighting using existing highlighting library
- Copy button in top-right corner
- Tooltip on hover ("Copy code")
- Success feedback (checkmark icon for 2 seconds)
- Proper scrolling for long code blocks

### 3. Header Component Enhancement

**File**: `website/components/layout/Header.tsx`

**Current State**: Basic header with navigation links

**Enhancements Needed**:

- Add active state detection using Next.js `usePathname()` hook
- Apply distinct styling to active navigation items
- Maintain hover states distinct from active states
- Ensure keyboard focus visibility

**Active State Logic**:

```typescript
const pathname = usePathname();
const isActive = (path: string) => {
  if (path === '/') return pathname === '/';
  return pathname.startsWith(path);
};
```

### 4. Mobile Navigation Enhancement

**File**: `website/components/layout/MobileNav.tsx`

**Current State**: Basic mobile menu

**Enhancements Needed**:

- Smooth open/close animations using Tailwind transitions
- Body scroll lock when menu is open
- Close on navigation
- Overlay click to dismiss
- Active state indicators in mobile menu

**State Management**:

```typescript
const [isOpen, setIsOpen] = useState(false);

useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
  return () => {
    document.body.style.overflow = 'unset';
  };
}, [isOpen]);
```

### 5. Sidebar Navigation Enhancement

**File**: `website/components/layout/Sidebar.tsx`

**Current State**: Documentation sidebar exists

**Enhancements Needed**:

- Add active state detection for current doc page
- Highlight active section
- Smooth scroll to active item on page load

### 6. Homepage Components

#### HeroSection Enhancement

**File**: `website/components/home/HeroSection.tsx`

**Enhancements**:

- Update messaging to emphasize: vendor-neutrality, compliance-ready, enterprise-grade
- Highlight key benefits: portability, compliance, governance, multi-runtime
- Ensure mobile responsiveness

#### ComparisonMatrix (New)

**File**: `website/components/home/ComparisonMatrix.tsx`

**Purpose**: Display comparison table of OSSA vs alternatives

**Interface**:

```typescript
interface ComparisonData {
  feature: string;
  ossa: string | boolean;
  langchain: string | boolean;
  autogen: string | boolean;
  mcp: string | boolean;
  semanticKernel: string | boolean;
}
```

**Features**:

- Desktop: Full table with all columns
- Mobile: Accordion or card-based layout
- Visual indicators (checkmarks, X marks)
- Responsive design

#### WhyItMatters Enhancement

**File**: `website/components/home/WhyItMatters.tsx`

**Enhancements**:

- Use Card components for each benefit
- Improve visual hierarchy
- Add icons for each benefit
- Ensure proper spacing and contrast

## Data Models

### Navigation Item

```typescript
interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}
```

### Comparison Feature

```typescript
interface ComparisonFeature {
  feature: string;
  description?: string;
  ossa: ComparisonValue;
  competitors: {
    [key: string]: ComparisonValue;
  };
}

type ComparisonValue =
  | boolean
  | string
  | {
      value: string;
      note?: string;
    };
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Button accessibility

_For any_ Button component rendered, it should have a visible focus ring that meets WCAG 2.1 AA contrast requirements when focused via keyboard navigation
**Validates: Requirements 1.3**

### Property 2: Copy button feedback

_For any_ CodeBlock component, clicking the copy button should copy the code to clipboard and display success feedback (checkmark) for exactly 2 seconds before reverting
**Validates: Requirements 3.2, 3.4**

### Property 3: Navigation active state uniqueness

_For any_ page in the website, exactly one navigation item in the header should have the active state styling applied
**Validates: Requirements 2.1**

### Property 4: Mobile menu body scroll lock

_For any_ state where the mobile menu is open, the body element should have `overflow: hidden` applied, and when closed, it should be removed
**Validates: Requirements 5.2**

### Property 5: Active state persistence

_For any_ navigation component (header, sidebar, mobile menu), the active state should persist across re-renders and match the current URL path
**Validates: Requirements 2.1, 2.2**

### Property 6: Contrast ratio compliance

_For any_ text displayed on colored backgrounds, the contrast ratio should meet or exceed WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
**Validates: Requirements 6.3**

### Property 7: ARIA label presence

_For any_ interactive component (Button, CodeBlock copy button, navigation items), proper ARIA labels should be present for screen reader accessibility
**Validates: Requirements 6.2**

## Error Handling

### Clipboard API Errors

- **Scenario**: Clipboard API not supported or permission denied
- **Handling**: Display fallback message "Please copy manually" and log error
- **User Feedback**: Toast notification with error message

### Navigation State Errors

- **Scenario**: Invalid pathname or route not found
- **Handling**: Default to no active state, log warning
- **User Feedback**: No visual error (graceful degradation)

### Component Render Errors

- **Scenario**: Component fails to render due to missing props or data
- **Handling**: Error boundary catches and displays fallback UI
- **User Feedback**: Generic error message with retry option

## Testing Strategy

### Unit Tests

- Button component variants and states
- CodeBlock copy functionality (mocked Clipboard API)
- Active state detection logic
- Mobile menu state management
- Contrast ratio calculations

### Property-Based Tests

- **Library**: fast-check (TypeScript property-based testing)
- **Configuration**: Minimum 100 iterations per property
- **Coverage**: All 7 correctness properties listed above

### Integration Tests

- Navigation flow (click navigation → page loads → active state updates)
- Mobile menu interaction (open → navigate → close)
- CodeBlock copy flow (click → copy → feedback → reset)

### Accessibility Tests

- Keyboard navigation through all interactive elements
- Screen reader compatibility (ARIA labels)
- Focus indicator visibility
- Contrast ratio verification using automated tools

### Manual Testing Checklist

- Test on mobile devices (iOS Safari, Android Chrome)
- Test with keyboard only (no mouse)
- Test with screen reader (VoiceOver, NVDA)
- Test in different viewport sizes
- Test with reduced motion preferences

## Implementation Notes

### Design Tokens Usage

All components must use existing SCSS variables from `website/styles/_variables.scss`:

- Colors: `$primary-*`, `$secondary-*`, `$accent-*`
- Typography: `$font-display`, `$font-heading`, `$font-body`, `$font-mono`
- Spacing: Tailwind spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96)
- Transitions: `transition-all duration-300 ease-in-out`

### Accessibility Requirements

- All interactive elements must have minimum 44x44px touch target
- Focus indicators must be visible with 3:1 contrast against background
- All images must have descriptive alt text
- All buttons must have accessible names (text or aria-label)
- Color must not be the only means of conveying information

### Performance Considerations

- Code syntax highlighting should be lazy-loaded
- Mobile menu animations should use CSS transforms (GPU-accelerated)
- Comparison matrix should use CSS Grid for optimal layout performance
- Images should use Next.js Image component with proper sizing

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
- Mobile browsers (iOS Safari 14+, Chrome Android)
- Graceful degradation for older browsers
