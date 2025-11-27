# OSSA Visual Identity System

## Logo Concept

### Design Direction
**Concept**: Interconnected nodes representing agent collaboration and standards-based interoperability

**Visual Elements:**
- Geometric, technical aesthetic (appeals to developers)
- Clean, professional (appeals to enterprise)
- Modular/connectable (represents portability)
- Open/transparent (represents open standard)

### Logo Variants Needed

1. **Primary Horizontal**
   - Full wordmark + icon
   - Use: Website header, documentation, presentations
   - Minimum width: 120px

2. **Stacked Vertical**
   - Icon above wordmark
   - Use: Narrow spaces, mobile, social media
   - Minimum width: 80px

3. **Icon Only**
   - Standalone mark
   - Use: Favicon, app icons, small spaces
   - Sizes: 16px, 32px, 64px, 128px, 256px, 512px

4. **Monochrome**
   - Black on white
   - White on black
   - Use: Print, single-color applications

### Clear Space
- Minimum clear space: Height of "O" in OSSA on all sides
- Never place logo on busy backgrounds without sufficient contrast

## Color System

### Brand Colors

#### Primary: OSSA Purple
```scss
$ossa-primary: #4A3ECD;
$ossa-primary-50: #F5F3FF;
$ossa-primary-100: #EDE9FE;
$ossa-primary-200: #DDD6FE;
$ossa-primary-300: #C4B5FD;
$ossa-primary-400: #A78BFA;
$ossa-primary-500: #8B5CF6;
$ossa-primary-600: #4A3ECD;  // Brand primary
$ossa-primary-700: #6D28D9;
$ossa-primary-800: #5B21B6;
$ossa-primary-900: #4C1D95;
```

#### Secondary: OSSA Cyan
```scss
$ossa-secondary: #1CB9ED;
$ossa-secondary-50: #ECFEFF;
$ossa-secondary-100: #CFFAFE;
$ossa-secondary-200: #A5F3FC;
$ossa-secondary-300: #67E8F9;
$ossa-secondary-400: #22D3EE;
$ossa-secondary-500: #1CB9ED;  // Brand secondary
$ossa-secondary-600: #0891B2;
$ossa-secondary-700: #0E7490;
$ossa-secondary-800: #155E75;
$ossa-secondary-900: #164E63;
```

#### Accent: OSSA Violet
```scss
$ossa-accent: #9060EA;
$ossa-accent-50: #FAF5FF;
$ossa-accent-100: #F3E8FF;
$ossa-accent-200: #E9D5FF;
$ossa-accent-300: #D8B4FE;
$ossa-accent-400: #C084FC;
$ossa-accent-500: #9060EA;  // Brand accent
$ossa-accent-600: #9333EA;
$ossa-accent-700: #7E22CE;
$ossa-accent-800: #6B21A8;
$ossa-accent-900: #581C87;
```

### Semantic Colors

#### Success
```scss
$ossa-success: #10B981;
$ossa-success-light: #D1FAE5;
$ossa-success-dark: #065F46;
```

#### Warning
```scss
$ossa-warning: #F59E0B;
$ossa-warning-light: #FEF3C7;
$ossa-warning-dark: #92400E;
```

#### Error
```scss
$ossa-error: #EF4444;
$ossa-error-light: #FEE2E2;
$ossa-error-dark: #991B1B;
```

#### Info
```scss
$ossa-info: #3B82F6;
$ossa-info-light: #DBEAFE;
$ossa-info-dark: #1E3A8A;
```

### Neutral Palette

```scss
$ossa-gray-50: #F9FAFB;
$ossa-gray-100: #F3F4F6;
$ossa-gray-200: #E5E7EB;
$ossa-gray-300: #D1D5DB;
$ossa-gray-400: #9CA3AF;
$ossa-gray-500: #6B7280;
$ossa-gray-600: #4B5563;
$ossa-gray-700: #374151;
$ossa-gray-800: #1F2937;
$ossa-gray-900: #111827;
```

### Gradient System

```scss
// Brand gradient (primary to accent)
$gradient-brand: linear-gradient(135deg, #4A3ECD 0%, #9060EA 100%);

// Hero gradient (primary to secondary)
$gradient-hero: linear-gradient(135deg, #4A3ECD 0%, #1CB9ED 100%);

// Button gradient
$gradient-button: linear-gradient(135deg, #8B5CF6 0%, #4A3ECD 100%);
```

## Typography System

### Font Stack

```scss
// Primary: Inter (sans-serif)
$font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

// Code: JetBrains Mono
$font-code: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

### Type Scale

```scss
// Display
$text-display: 72px;
$text-display-weight: 800;
$text-display-line-height: 1.1;

// Headings
$text-h1: 56px;
$text-h1-weight: 700;
$text-h1-line-height: 1.2;

$text-h2: 40px;
$text-h2-weight: 700;
$text-h2-line-height: 1.3;

$text-h3: 32px;
$text-h3-weight: 600;
$text-h3-line-height: 1.4;

$text-h4: 24px;
$text-h4-weight: 600;
$text-h4-line-height: 1.5;

$text-h5: 20px;
$text-h5-weight: 600;
$text-h5-line-height: 1.5;

$text-h6: 18px;
$text-h6-weight: 600;
$text-h6-line-height: 1.5;

// Body
$text-body: 16px;
$text-body-weight: 400;
$text-body-line-height: 1.6;

$text-small: 14px;
$text-small-weight: 400;
$text-small-line-height: 1.5;

$text-tiny: 12px;
$text-tiny-weight: 400;
$text-tiny-line-height: 1.4;
```

## Icon System

### Style Guidelines
- **Library**: Heroicons (outline and solid variants)
- **Style**: Geometric, 2px stroke weight
- **Sizes**: 16px, 20px, 24px, 32px
- **Colors**: Use brand colors or neutrals

### Common Icons
- Agent: Network/nodes icon
- Standard: Document/specification icon
- Portable: Arrows/transfer icon
- Compliance: Shield/checkmark icon
- Open: Unlock/open book icon

## Spacing System

```scss
$space-1: 4px;
$space-2: 8px;
$space-3: 12px;
$space-4: 16px;
$space-5: 20px;
$space-6: 24px;
$space-8: 32px;
$space-10: 40px;
$space-12: 48px;
$space-16: 64px;
$space-20: 80px;
$space-24: 96px;
```

## Usage Guidelines

### Logo Usage

**Do:**
- Use official logo files only
- Maintain minimum clear space
- Use on high-contrast backgrounds
- Scale proportionally

**Don't:**
- Distort or rotate logo
- Change colors (except approved variants)
- Add effects (shadows, outlines, glows)
- Place on busy backgrounds without contrast

### Color Usage

**Primary Color (#4A3ECD):**
- Primary CTAs
- Links
- Key UI elements
- Brand moments

**Secondary Color (#1CB9ED):**
- Secondary CTAs
- Highlights
- Accents
- Interactive states

**Accent Color (#9060EA):**
- Tertiary elements
- Decorative accents
- Gradients
- Special features

### Typography Usage

**Display:**
- Hero headlines only
- Maximum impact moments
- Use sparingly

**H1-H2:**
- Page titles
- Section headers
- Major content divisions

**H3-H6:**
- Subsections
- Card titles
- Component headers

**Body:**
- All paragraph text
- Default text size
- Maximum readability

## File Deliverables

### Logo Files
```
assets/brand/logo/
├── ossa-logo-horizontal.svg
├── ossa-logo-horizontal.png (multiple sizes)
├── ossa-logo-stacked.svg
├── ossa-logo-stacked.png (multiple sizes)
├── ossa-icon.svg
├── ossa-icon.png (16, 32, 64, 128, 256, 512)
├── ossa-logo-black.svg
├── ossa-logo-white.svg
└── favicon/
    ├── favicon.ico
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── apple-touch-icon.png (180x180)
    └── android-chrome-192x192.png
```

### Design Tokens
```
website/src/styles/
├── tokens.scss          # All variables
├── colors.scss          # Color system
├── typography.scss      # Type scale
└── spacing.scss         # Spacing system
```

## Next Steps

1. **Logo Design**: Create actual logo based on concept direction
2. **Export Assets**: Generate all required file formats
3. **Implement Tokens**: Add SCSS variables to codebase
4. **Documentation**: Create usage examples
5. **Review**: Get stakeholder approval

## Tools Needed

- **Design**: Figma or Adobe Illustrator
- **Export**: SVG optimization (SVGO)
- **Favicon**: Real Favicon Generator
- **Testing**: Check contrast ratios (WCAG AA minimum)
