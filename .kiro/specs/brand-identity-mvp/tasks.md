# Implementation Plan: Brand Identity MVP

- [-] 1. Enhance Button Component System
  - Review existing Button component implementation
  - Ensure all 6 variants are properly styled (primary, secondary, outline, ghost, danger, success)
  - Add loading state with spinner animation
  - Improve focus ring visibility for WCAG 2.1 AA compliance
  - Add icon positioning support (left/right)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Write property test for Button accessibility
  - **Property 1: Button accessibility**
  - **Validates: Requirements 1.3**

- [ ] 1.2 Write unit tests for Button variants and states
  - Test all 6 variants render correctly
  - Test loading state displays spinner
  - Test icon positioning (left/right)
  - _Requirements: 1.1, 1.4, 1.5_

- [ ] 2. Create CodeBlock Component with Copy Functionality
  - Create new CodeBlock component in `website/components/ui/CodeBlock.tsx`
  - Implement syntax highlighting using existing library
  - Add copy button in top-right corner with Lucide React icon
  - Implement Clipboard API integration
  - Add tooltip on hover ("Copy code")
  - Add success feedback (checkmark icon for 2 seconds)
  - Ensure proper scrolling for long code blocks
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 2.1 Write property test for copy button feedback
  - **Property 2: Copy button feedback**
  - **Validates: Requirements 3.2, 3.4**

- [ ] 2.2 Write unit tests for CodeBlock component
  - Test copy button functionality (mocked Clipboard API)
  - Test tooltip display on hover
  - Test success feedback timing
  - Test error handling for unsupported browsers
  - _Requirements: 3.2, 3.3, 3.4_

- [ ] 3. Implement Navigation Active States
- [ ] 3.1 Enhance Header component with active states
  - Update `website/components/layout/Header.tsx`
  - Add active state detection using Next.js `usePathname()` hook
  - Apply distinct styling to active navigation items
  - Ensure hover states are distinct from active states
  - Ensure keyboard focus visibility
  - _Requirements: 2.1, 2.3, 2.4_

- [ ] 3.2 Enhance Sidebar component with active states
  - Update `website/components/layout/Sidebar.tsx`
  - Add active state detection for current doc page
  - Highlight active section in sidebar
  - Implement smooth scroll to active item on page load
  - _Requirements: 2.2_

- [ ] 3.3 Write property test for navigation active state uniqueness
  - **Property 3: Navigation active state uniqueness**
  - **Validates: Requirements 2.1**

- [ ] 3.4 Write property test for active state persistence
  - **Property 5: Active state persistence**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 3.5 Write unit tests for active state logic
  - Test pathname matching logic
  - Test active state styling application
  - Test edge cases (root path, nested paths)
  - _Requirements: 2.1, 2.2_

- [ ] 4. Enhance Mobile Navigation UX
  - Update `website/components/layout/MobileNav.tsx`
  - Add smooth open/close animations using Tailwind transitions
  - Implement body scroll lock when menu is open
  - Add close on navigation functionality
  - Add overlay click to dismiss
  - Add active state indicators in mobile menu
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4.1 Write property test for mobile menu body scroll lock
  - **Property 4: Mobile menu body scroll lock**
  - **Validates: Requirements 5.2**

- [ ] 4.2 Write unit tests for mobile navigation
  - Test menu open/close state management
  - Test body scroll lock application/removal
  - Test close on navigation
  - Test overlay dismiss functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 5. Update Homepage with Enterprise Messaging
- [ ] 5.1 Enhance HeroSection component
  - Update `website/components/home/HeroSection.tsx`
  - Update messaging to emphasize vendor-neutrality, compliance-ready, enterprise-grade
  - Highlight key benefits: portability, compliance, governance, multi-runtime
  - Ensure mobile responsiveness
  - _Requirements: 4.1, 4.5_

- [ ] 5.2 Create ComparisonMatrix component
  - Create new component at `website/components/home/ComparisonMatrix.tsx`
  - Implement desktop table layout with all columns
  - Implement mobile-friendly accordion or card layout
  - Add visual indicators (checkmarks, X marks) using Lucide React icons
  - Ensure responsive design with proper breakpoints
  - _Requirements: 4.2, 4.4_

- [ ] 5.3 Enhance WhyItMatters component
  - Update `website/components/home/WhyItMatters.tsx`
  - Use Card components for each benefit
  - Improve visual hierarchy with proper heading levels
  - Add icons for each benefit using Lucide React
  - Ensure proper spacing and contrast
  - _Requirements: 4.3_

- [ ] 5.4 Update homepage page component
  - Update `website/app/page.tsx`
  - Integrate enhanced HeroSection
  - Add ComparisonMatrix component
  - Integrate enhanced WhyItMatters component
  - Ensure proper section spacing and layout
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 5.5 Write unit tests for homepage components
  - Test HeroSection renders with correct messaging
  - Test ComparisonMatrix renders all features
  - Test WhyItMatters renders all benefits
  - Test mobile responsive layouts
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Ensure Accessibility Compliance
- [ ] 6.1 Audit and fix keyboard navigation
  - Test all interactive elements with keyboard only
  - Ensure visible focus indicators on all elements
  - Verify focus order is logical
  - Add focus-visible styles where missing
  - _Requirements: 6.1_

- [ ] 6.2 Audit and fix ARIA labels
  - Add ARIA labels to all interactive components
  - Ensure screen reader compatibility
  - Test with VoiceOver (macOS) or NVDA (Windows)
  - _Requirements: 6.2_

- [ ] 6.3 Verify contrast ratios
  - Check all text on colored backgrounds
  - Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
  - Fix any contrast issues found
  - _Requirements: 6.3_

- [ ] 6.4 Add alt text to images
  - Audit all images on homepage and navigation
  - Add descriptive alt text where missing
  - Ensure decorative images have empty alt attributes
  - _Requirements: 6.5_

- [ ] 6.5 Write property test for contrast ratio compliance
  - **Property 6: Contrast ratio compliance**
  - **Validates: Requirements 6.3**

- [ ] 6.6 Write property test for ARIA label presence
  - **Property 7: ARIA label presence**
  - **Validates: Requirements 6.2**

- [ ] 6.7 Write integration tests for accessibility
  - Test keyboard navigation flow
  - Test screen reader announcements (mocked)
  - Test focus management
  - _Requirements: 6.1, 6.2_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Manual Testing and Polish
  - Test on iOS Safari and Android Chrome
  - Test with keyboard only (no mouse)
  - Test with screen reader
  - Test in different viewport sizes (mobile, tablet, desktop)
  - Test with reduced motion preferences
  - Fix any issues found during manual testing
  - _Requirements: All_

- [ ] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
