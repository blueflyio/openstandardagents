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
