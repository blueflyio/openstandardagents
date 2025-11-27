# OSSA Brand Identity Guide

**Version:** 1.0.0  
**Last Updated:** November 25, 2025  
**Status:** Official

## Brand Overview

OSSA (Open Standard for Scalable AI Agents) is a specification standard for AI agents—like OpenAPI for REST APIs. Our brand represents **openness, standardization, and technical excellence** in the AI agent ecosystem.

### Brand Personality

- **Technical** - Precise, reliable, engineering-focused
- **Open** - Transparent, collaborative, community-driven
- **Modern** - Forward-thinking, innovative, cutting-edge
- **Professional** - Enterprise-ready, production-grade, trustworthy

---

## Logo

### Primary Logo

**File:** `/website/public/brand/ossa-logo.svg`

The OSSA logo features an abstract, flowing design representing:
- **Interconnected agents** - The flowing curves
- **Data flow** - The gradient transitions
- **Scalability** - The expanding form

### Logo Variations

```
ossa-logo.svg          - Full color (primary)
ossa-logo-white.svg    - White (for dark backgrounds)
ossa-logo-black.svg    - Black (for light backgrounds)
ossa-logo-mono.svg     - Monochrome
```

### Clear Space

Maintain clear space around the logo equal to the height of the "O" in OSSA.

### Minimum Size

- **Digital:** 120px width
- **Print:** 1 inch width

### Don'ts

❌ Don't rotate the logo  
❌ Don't change the colors  
❌ Don't add effects (shadows, outlines)  
❌ Don't distort proportions  
❌ Don't place on busy backgrounds

---

## Color Palette

### Primary Colors

```css
/* Deep Purple - Primary Brand Color */
--ossa-purple-primary: #4A3ECD;
rgb(74, 62, 205)
Pantone: 2726 C

/* Vibrant Purple - Accent */
--ossa-purple-accent: #7452DE;
rgb(116, 82, 222)
Pantone: 2665 C

/* Light Purple - Highlights */
--ossa-purple-light: #9060EA;
rgb(144, 96, 234)
Pantone: 2655 C
```

### Secondary Colors

```css
/* Cyan Blue - Technology */
--ossa-cyan: #1ABCED;
rgb(26, 188, 237)
Pantone: 299 C

/* Tech Purple - Innovation */
--ossa-tech-purple: #654ED9;
rgb(101, 78, 217)
Pantone: 2665 C
```

### Neutral Colors

```css
/* Dark - Text & Backgrounds */
--ossa-dark: #1A1A2E;
--ossa-gray-900: #2D2D44;
--ossa-gray-800: #3F3F5A;

/* Mid - Borders & Dividers */
--ossa-gray-600: #6B6B8F;
--ossa-gray-500: #8E8EAD;
--ossa-gray-400: #B1B1C8;

/* Light - Backgrounds */
--ossa-gray-200: #E5E5F0;
--ossa-gray-100: #F5F5FA;
--ossa-white: #FFFFFF;
```

### Semantic Colors

```css
/* Success */
--ossa-success: #10B981;

/* Warning */
--ossa-warning: #F59E0B;

/* Error */
--ossa-error: #EF4444;

/* Info */
--ossa-info: #3B82F6;
```

### Gradients

```css
/* Primary Gradient - Hero sections */
background: linear-gradient(135deg, #4A3ECD 0%, #7452DE 100%);

/* Accent Gradient - CTAs */
background: linear-gradient(135deg, #1ABCED 0%, #654ED9 100%);

/* Subtle Gradient - Backgrounds */
background: linear-gradient(180deg, #F5F5FA 0%, #FFFFFF 100%);
```

---

## Typography

### Primary Typeface: Inter

**Usage:** Body text, UI elements, documentation

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Weights:**
- Regular (400) - Body text
- Medium (500) - Emphasis
- Semibold (600) - Subheadings
- Bold (700) - Headings

### Monospace: JetBrains Mono

**Usage:** Code, technical content, CLI examples

```css
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

### Type Scale

```css
/* Headings */
--text-6xl: 3.75rem;  /* 60px - Hero */
--text-5xl: 3rem;     /* 48px - Page Title */
--text-4xl: 2.25rem;  /* 36px - Section */
--text-3xl: 1.875rem; /* 30px - Subsection */
--text-2xl: 1.5rem;   /* 24px - Card Title */
--text-xl: 1.25rem;   /* 20px - Large */

/* Body */
--text-lg: 1.125rem;  /* 18px - Lead */
--text-base: 1rem;    /* 16px - Body */
--text-sm: 0.875rem;  /* 14px - Small */
--text-xs: 0.75rem;   /* 12px - Caption */
```

### Line Height

```css
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

---

## Spacing System

Based on 4px grid:

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

---

## UI Components

### Buttons

#### Primary Button
```css
background: linear-gradient(135deg, #4A3ECD 0%, #7452DE 100%);
color: #FFFFFF;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
transition: transform 0.2s, box-shadow 0.2s;

/* Hover */
transform: translateY(-2px);
box-shadow: 0 8px 16px rgba(74, 62, 205, 0.3);
```

#### Secondary Button
```css
background: transparent;
border: 2px solid #4A3ECD;
color: #4A3ECD;
padding: 10px 22px;
border-radius: 8px;
font-weight: 600;
```

#### Ghost Button
```css
background: transparent;
color: #4A3ECD;
padding: 12px 24px;
font-weight: 600;
```

### Cards

```css
background: #FFFFFF;
border: 1px solid #E5E5F0;
border-radius: 12px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
transition: box-shadow 0.3s, transform 0.3s;

/* Hover */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
transform: translateY(-4px);
```

### Code Blocks

```css
background: #1A1A2E;
color: #E5E5F0;
border-radius: 8px;
padding: 16px;
font-family: 'JetBrains Mono', monospace;
font-size: 14px;
line-height: 1.6;
overflow-x: auto;
```

### Badges

```css
/* Status Badge */
background: #10B981;
color: #FFFFFF;
padding: 4px 12px;
border-radius: 12px;
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.5px;
```

---

## Iconography

### Style Guidelines

- **Line weight:** 2px
- **Corner radius:** 2px
- **Grid:** 24x24px
- **Style:** Outlined, minimal
- **Color:** Match text color or use brand purple

### Icon Library

Use **Lucide Icons** or **Heroicons** for consistency.

### Custom Icons

When creating custom icons:
- Maintain 2px stroke weight
- Use rounded corners
- Keep simple and recognizable
- Test at small sizes (16px)

---

## Photography & Imagery

### Style

- **Technical** - Clean, modern, high-tech
- **Authentic** - Real developers, real code
- **Diverse** - Inclusive representation
- **Professional** - High quality, well-lit

### Subjects

✅ Developers coding  
✅ Terminal/CLI interfaces  
✅ Abstract tech patterns  
✅ Data visualizations  
✅ Team collaboration  

❌ Stock photo clichés  
❌ Overly staged scenes  
❌ Low-quality images  

### Filters & Treatment

- **Saturation:** Slightly desaturated
- **Contrast:** Medium-high
- **Overlay:** Optional purple gradient (10% opacity)

---

## Voice & Tone

### Voice Characteristics

**Technical but Accessible**
- Use precise terminology
- Explain complex concepts clearly
- Avoid unnecessary jargon

**Confident but Humble**
- State facts directly
- Acknowledge limitations
- Credit community contributions

**Professional but Friendly**
- Maintain formality in docs
- Be conversational in blog posts
- Use "we" for community, "you" for users

### Writing Style

#### Documentation
```
✅ "Configure the agent's LLM provider in spec.llm"
❌ "You might want to maybe configure the LLM"
```

#### Marketing
```
✅ "OSSA: The OpenAPI for AI Agents"
❌ "The Revolutionary AI Agent Standard!"
```

#### Error Messages
```
✅ "Validation failed: apiVersion must match pattern"
❌ "Oops! Something went wrong :("
```

---

## Code Examples

### Syntax Highlighting

Use **Dracula** or **Nord** theme for consistency.

```yaml
# OSSA Manifest Example
apiVersion: ossa/v0.2.6
kind: Agent
metadata:
  name: example-agent
  version: 1.0.0
spec:
  role: You are a helpful assistant
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
```

### Code Block Headers

```typescript
// src/agent.ts
import { OssaAgent } from '@bluefly/openstandardagents';
```

---

## Web Design Patterns

### Hero Section

```css
background: linear-gradient(135deg, #4A3ECD 0%, #1ABCED 100%);
color: #FFFFFF;
padding: 120px 0;
text-align: center;
```

### Feature Cards

```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 24px;
```

### Documentation Layout

```css
/* Sidebar */
width: 280px;
background: #F5F5FA;
border-right: 1px solid #E5E5F0;

/* Content */
max-width: 800px;
padding: 48px;
line-height: 1.7;
```

---

## Social Media

### Profile Images

- Use logo on brand purple background
- Maintain clear space
- Square format: 400x400px minimum

### Cover Images

- **Twitter:** 1500x500px
- **LinkedIn:** 1584x396px
- **GitHub:** 1280x640px

### Post Templates

#### Announcement
```
🚀 OSSA v0.2.6 Released

✨ New Features:
• Claude agent support
• Enhanced validation
• Zod integration

📖 Docs: openstandardagents.org
#OSSA #AIAgents #OpenSource
```

#### Tutorial
```
💡 Quick Tip: Claude Agents with OSSA

Define tools in your manifest:

[code screenshot]

Learn more: [link]
#OSSA #Claude #Tutorial
```

---

## File Naming Conventions

### Brand Assets

```
ossa-logo-primary.svg
ossa-logo-white.svg
ossa-logo-black.svg
ossa-icon-512.png
ossa-wordmark.svg
ossa-badge-compliant.svg
```

### Screenshots

```
ossa-screenshot-cli-validate.png
ossa-screenshot-website-home.png
ossa-diagram-architecture.svg
```

### Documentation Images

```
ossa-guide-[topic]-[number].png
ossa-example-[platform]-agent.yaml
```

---

## Accessibility

### Color Contrast

All text must meet WCAG AA standards:
- **Normal text:** 4.5:1 minimum
- **Large text:** 3:1 minimum
- **UI components:** 3:1 minimum

### Alt Text

```html
<!-- Logo -->
<img src="ossa-logo.svg" alt="OSSA - Open Standard for Scalable AI Agents logo">

<!-- Diagram -->
<img src="architecture.svg" alt="OSSA architecture diagram showing agent, runtime, and tools layers">
```

### Focus States

```css
:focus-visible {
  outline: 2px solid #4A3ECD;
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

## Brand Applications

### Website Header

```html
<header style="
  background: linear-gradient(90deg, #4A3ECD 0%, #1ABCED 100%);
  color: white;
  padding: 16px 0;
">
  <img src="/brand/ossa-logo-white.svg" alt="OSSA" height="40">
</header>
```

### Email Signature

```
[Name]
[Title]
OSSA - Open Standard for Scalable AI Agents
openstandardagents.org
```

### Conference Slides

- **Background:** White or light gray
- **Accent:** Brand purple gradient
- **Code:** Dark theme with syntax highlighting
- **Logo:** Top right corner

---

## Downloads

### Brand Asset Package

```
/website/public/brand/
├── logos/
│   ├── ossa-logo-primary.svg
│   ├── ossa-logo-white.svg
│   ├── ossa-logo-black.svg
│   └── ossa-icon-512.png
├── colors/
│   └── ossa-palette.ase
├── fonts/
│   ├── Inter/
│   └── JetBrainsMono/
└── templates/
    ├── slide-deck.pptx
    └── social-media.fig
```

---

## Contact

For brand guidelines questions or asset requests:

- **Email:** brand@openstandardagents.org
- **GitHub:** github.com/blueflyio/openstandardagents/issues
- **GitLab:** gitlab.com/blueflyio/openstandardagents/-/issues/44

---

## Version History

- **1.0.0** (Nov 25, 2025) - Initial brand guide
- Colors extracted from existing logo
- Typography system established
- Component library defined

---

## License

The OSSA brand assets are licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).

You may use the OSSA logo and brand assets to:
✅ Link to openstandardagents.org  
✅ Indicate OSSA compatibility  
✅ Discuss or write about OSSA  
✅ Create educational content  

You may not:
❌ Modify the logo  
❌ Use for commercial products without permission  
❌ Imply official endorsement  
❌ Create confusingly similar marks  
