# OSSA Brand Guide

**The OpenAPI for AI Agents**

---

**Version:** 1.0.0  
**Last Updated:** November 2025  
**License:** Creative Commons Attribution 4.0 International (CC BY 4.0)  
**Contact:** design@openstandardagents.org

---

## Table of Contents

1. [Brand Overview](#brand-overview)
2. [Logo Usage](#logo-usage)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Voice & Tone](#voice-and-tone)
6. [Visual Elements](#visual-elements)
7. [Application Examples](#application-examples)
8. [Quick Reference](#quick-reference)

---

# 1. Brand Overview

## Mission

**Make AI agents interoperable across all platforms and frameworks.**

OSSA (Open Standard for Scalable AI Agents) provides a vendor-neutral specification standard that enables AI agents to communicate and collaborate seamlessly, just as OpenAPI standardized REST APIs.

## Vision

**Become the OpenAPI for AI agents** - the universally adopted standard for defining, deploying, and connecting autonomous AI systems across any infrastructure, framework, or runtime.

## Positioning

OSSA is **NOT a framework** - it's a **specification standard** that defines the contract. Implementations provide the functionality.

| Component | Role | Comparable To |
|-----------|------|---------------|
| OSSA Specification | Standard definition | OpenAPI Specification |
| OSSA CLI | Validation & generation | OpenAPI Generator |
| Implementations | Runtime execution | API Gateways |

## Core Values

### 1. Open & Vendor-Neutral
- Community-driven governance
- Apache 2.0 license
- No vendor lock-in
- Transparent development

### 2. Interoperable
- Common language across all frameworks
- Runtime-independent
- Protocol-agnostic
- Framework-agnostic

### 3. Trustworthy
- Compliance-ready (SOC2, HIPAA, FedRAMP, GDPR)
- Security built-in
- Enterprise-grade
- Production-tested

### 4. Simple & Practical
- Clear, concise specification
- Production-ready implementations
- Comprehensive documentation
- Real-world examples

## Key Messages

### Primary Tagline
**"The OpenAPI for AI Agents"**

### For Enterprises
"Deploy anywhere, switch frameworks anytime, maintain compliance always. OSSA provides vendor-neutral agent definitions that work across AWS, GCP, Azure, and on-premise infrastructure."

### For Developers
"Write once, deploy anywhere. Define your agents in OSSA and run them on any framework - OpenAI, LangChain, AutoGen, CrewAI, or custom runtimes."

### For Framework Builders
"Build on an open standard. OSSA provides the specification layer, you provide the innovation. Join the ecosystem of interoperable agent frameworks."

## Target Audiences

1. **Enterprise Architects** - Need vendor-neutral, compliant solutions
2. **Platform Engineers** - Deploy and orchestrate agents at scale
3. **AI Developers** - Build portable, framework-independent agents
4. **Framework Builders** - Create OSSA-compliant runtimes
5. **Compliance Officers** - Ensure regulatory compliance

---

# 2. Logo Usage

## Primary Logo

The OSSA logo features a dynamic gradient representing interconnected AI agents working in harmony.

**File Location:** `/website/public/brand/ossa-logo.svg`

**Design Elements:**
- Gradient flow: Cyan Blue → Deep Purple → Light Purple
- Represents: Interoperability, flow, connection
- Style: Modern, technical, professional

## Logo Variations

### Full Color (Primary)
- **Use:** White or light backgrounds
- **Format:** SVG (preferred), PNG (fallback)
- **Colors:** Full gradient (#1CB9ED → #4A3ECD → #9060EA)

### Monochrome White
- **Use:** Dark backgrounds, overlays
- **Format:** SVG, PNG
- **Color:** #FFFFFF

### Monochrome Dark
- **Use:** Light backgrounds, print
- **Format:** SVG, PNG
- **Color:** #2D1B69 (Deep Purple)

### Grayscale
- **Use:** Print only, black & white materials
- **Format:** SVG, PNG
- **Color:** #374151 (Gray 700)

## Size Requirements

### Digital
- **Minimum:** 120px width
- **Recommended:** 180px width
- **Maximum:** No limit (vector scales)

### Print
- **Minimum:** 1 inch width
- **Recommended:** 1.5 inches width
- **High-res:** 300 DPI minimum

### Icon Sizes
- **Favicon:** 16×16px, 32×32px
- **App Icons:** 64×64px, 128×128px, 256×256px
- **Social Media:** 512×512px, 1024×1024px

## Clear Space

Maintain clear space equal to **0.5× the logo height** on all sides.

```
┌─────────────────────────┐
│                         │
│    ┌─────────────┐     │
│    │             │     │
│    │    OSSA     │     │ ← 0.5× height
│    │             │     │
│    └─────────────┘     │
│                         │
└─────────────────────────┘
```

## Incorrect Usage

❌ **Don't:**
- Change logo colors or gradient
- Distort, stretch, or skew
- Add drop shadows or effects
- Rotate or flip
- Place on busy backgrounds
- Use low-resolution versions
- Modify or redraw
- Combine with other logos

✅ **Do:**
- Use provided files
- Maintain aspect ratio
- Ensure sufficient contrast
- Follow size guidelines
- Respect clear space

## Background Guidelines

### Approved Backgrounds
✅ White (#FFFFFF)
✅ Light Gray (#F9FAFB, #F3F4F6)
✅ Light Blue (#EFF6FF)
✅ Deep Purple (#2D1B69)
✅ Black (#000000)

### Avoid
❌ Bright colors
❌ Busy patterns
❌ Low-contrast backgrounds
❌ Gradients (except approved)

**Accessibility Rule:** Maintain 4.5:1 minimum contrast ratio (WCAG AA)

---

# 3. Color Palette

## Primary Colors

### Deep Purple
- **Hex:** #4A3ECD
- **RGB:** 74, 62, 205
- **HSL:** 244°, 60%, 52%
- **Use:** Primary brand color, CTAs, headings

### Cyan Blue
- **Hex:** #1CB9ED
- **RGB:** 28, 185, 237
- **HSL:** 195°, 85%, 52%
- **Use:** Secondary actions, highlights, links

### Light Purple
- **Hex:** #9060EA
- **RGB:** 144, 96, 234
- **HSL:** 261°, 76%, 65%
- **Use:** Accents, gradients, hover states

## Semantic Colors

### Success
- **Green:** #10B981 (Emerald 500)
- **Use:** Success messages, confirmations

### Warning
- **Amber:** #F59E0B (Amber 500)
- **Use:** Warnings, cautions

### Error
- **Red:** #EF4444 (Red 500)
- **Use:** Errors, destructive actions

### Info
- **Blue:** #3B82F6 (Blue 500)
- **Use:** Information, tips

## Neutral Colors

### Gray Scale
- **Gray 50:** #F9FAFB (Backgrounds)
- **Gray 100:** #F3F4F6 (Subtle backgrounds)
- **Gray 200:** #E5E7EB (Borders)
- **Gray 300:** #D1D5DB (Disabled states)
- **Gray 400:** #9CA3AF (Placeholders)
- **Gray 500:** #6B7280 (Secondary text)
- **Gray 600:** #4B5563 (Body text)
- **Gray 700:** #374151 (Headings)
- **Gray 800:** #1F2937 (Dark text)
- **Gray 900:** #111827 (Darkest)

## Gradients

### Primary Gradient
```css
background: linear-gradient(135deg, #1CB9ED 0%, #4A3ECD 50%, #9060EA 100%);
```
**Use:** Hero sections, CTAs, highlights

### Subtle Gradient
```css
background: linear-gradient(135deg, #EFF6FF 0%, #F3F4F6 100%);
```
**Use:** Backgrounds, cards

## Accessibility

All color combinations meet **WCAG AA** standards (4.5:1 contrast ratio minimum).

**Preferred:** WCAG AAA (7:1 contrast ratio)

### Approved Combinations
✅ Deep Purple (#4A3ECD) on White (#FFFFFF) - 7.2:1
✅ Gray 700 (#374151) on White (#FFFFFF) - 10.8:1
✅ White (#FFFFFF) on Deep Purple (#4A3ECD) - 7.2:1
✅ Cyan Blue (#1CB9ED) on Gray 900 (#111827) - 5.1:1

---

# 4. Typography

## Font Families

### Primary: Inter
- **Type:** Sans-serif
- **Use:** Body text, UI, headings
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Source:** Google Fonts
- **License:** Open Font License

### Monospace: JetBrains Mono
- **Type:** Monospace
- **Use:** Code, technical content, CLI examples
- **Weights:** 400 (Regular), 500 (Medium), 700 (Bold)
- **Source:** JetBrains
- **License:** Open Font License

## Type Scale

### Desktop
| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| H1 | 48px | 700 | 1.2 | -0.02em |
| H2 | 36px | 700 | 1.3 | -0.01em |
| H3 | 30px | 600 | 1.4 | 0 |
| H4 | 24px | 600 | 1.4 | 0 |
| H5 | 20px | 600 | 1.5 | 0 |
| H6 | 18px | 600 | 1.5 | 0 |
| Body Large | 18px | 400 | 1.6 | 0 |
| Body | 16px | 400 | 1.6 | 0 |
| Body Small | 14px | 400 | 1.5 | 0 |
| Caption | 12px | 400 | 1.4 | 0.01em |
| Code | 14px | 400 | 1.6 | 0 |

### Mobile
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 36px | 700 | 1.2 |
| H2 | 30px | 700 | 1.3 |
| H3 | 24px | 600 | 1.4 |
| H4 | 20px | 600 | 1.4 |
| Body | 16px | 400 | 1.6 |

## Usage Guidelines

### Headings
- Use sentence case for H1-H3
- Use title case for H4-H6
- Limit to 60 characters per line
- Maintain hierarchy (don't skip levels)

### Body Text
- 16px minimum for body text
- 60-80 characters per line (optimal readability)
- 1.6 line height for body text
- Left-aligned (never justify)

### Code
- Use JetBrains Mono for all code
- 14px size for inline code
- Syntax highlighting for code blocks
- Dark theme: #1F2937 background

---

# 5. Voice & Tone

## Brand Voice

**Professional • Clear • Confident • Inclusive • Practical**

### Professional
- Technical accuracy
- Industry terminology
- Enterprise-grade language
- Authoritative but approachable

### Clear
- Simple, direct language
- Active voice
- Short sentences
- No jargon unless necessary

### Confident
- Definitive statements
- Strong verbs
- Avoid hedging ("might," "could," "maybe")
- Back claims with evidence

### Inclusive
- Gender-neutral language
- Avoid assumptions
- Consider global audience
- Accessible to all skill levels

### Practical
- Focus on real-world use cases
- Provide working examples
- Actionable guidance
- Production-ready solutions

## Tone Variations

### Documentation (Instructional)
**Tone:** Clear, direct, helpful

**Example:**
"Define your agent in OSSA format. The specification requires three fields: `id`, `name`, and `capabilities`. Here's a minimal example..."

### Marketing (Persuasive)
**Tone:** Confident, compelling, benefit-focused

**Example:**
"Stop vendor lock-in. OSSA lets you define agents once and deploy anywhere - AWS, GCP, Azure, or on-premise. Switch frameworks without rewriting code."

### Technical (Explanatory)
**Tone:** Precise, detailed, authoritative

**Example:**
"OSSA uses JSON Schema for validation. The specification defines a strict type system with support for capability versioning, transport metadata, and state management."

### Community (Conversational)
**Tone:** Friendly, collaborative, welcoming

**Example:**
"Welcome to OSSA! We're building the OpenAPI for AI agents, and we'd love your input. Check out the spec, try the examples, and let us know what you think."

## Writing Guidelines

### Do
✅ Use active voice: "OSSA defines agents" (not "Agents are defined by OSSA")
✅ Be specific: "Reduce deployment time by 60%" (not "significantly faster")
✅ Provide examples: Show, don't just tell
✅ Use parallel structure: "Deploy, monitor, scale" (consistent verb forms)
✅ Write for scanning: Use headings, bullets, short paragraphs

### Don't
❌ Use exclusive language: "obviously," "simply," "just," "clearly"
❌ Make unsubstantiated claims: "best," "fastest," "most popular"
❌ Use passive voice: "The agent was deployed" → "Deploy the agent"
❌ Overuse exclamation points: One per page maximum
❌ Use idioms or colloquialisms: May not translate globally

## Messaging Framework

### Value Proposition
"OSSA is the vendor-neutral specification standard for AI agents, enabling interoperability across frameworks, runtimes, and infrastructure."

### Elevator Pitch (30 seconds)
"Just as OpenAPI standardized REST APIs, OSSA standardizes AI agents. Define your agents once in OSSA format, then deploy them on any framework - OpenAI, LangChain, AutoGen, or custom runtimes. No vendor lock-in, full portability, enterprise-ready."

### Key Differentiators
1. **Specification, not framework** - Define the contract, not the implementation
2. **Vendor-neutral** - Community-driven, no single company control
3. **Production-ready** - Used in enterprise deployments today
4. **Compliance-first** - Built for SOC2, HIPAA, FedRAMP, GDPR

---

# 6. Visual Elements

## Spacing System

### Base Unit: 4px

| Token | Value | Use |
|-------|-------|-----|
| xs | 4px | Tight spacing |
| sm | 8px | Small gaps |
| md | 16px | Default spacing |
| lg | 24px | Section spacing |
| xl | 32px | Large gaps |
| 2xl | 48px | Major sections |
| 3xl | 64px | Hero spacing |

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| sm | 4px | Buttons, inputs |
| md | 8px | Cards, containers |
| lg | 12px | Large cards |
| xl | 16px | Hero elements |
| full | 9999px | Pills, avatars |

## Shadows

### Elevation System

```css
/* sm - Subtle lift */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* md - Cards */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* lg - Modals */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* xl - Popovers */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## Icons

### Style
- **Type:** Outline (2px stroke)
- **Size:** 16px, 20px, 24px
- **Library:** Heroicons v2
- **Color:** Inherit from parent

### Usage
- Use consistently throughout interface
- Pair with text labels when possible
- Maintain 1:1 aspect ratio
- Ensure 44×44px touch targets (mobile)

## Buttons

### Primary
```css
background: #4A3ECD;
color: #FFFFFF;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
```

### Secondary
```css
background: transparent;
color: #4A3ECD;
border: 2px solid #4A3ECD;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
```

### Sizes
- **Small:** 8px 16px, 14px text
- **Medium:** 12px 24px, 16px text
- **Large:** 16px 32px, 18px text

## Animations

### Transitions
```css
transition: all 0.2s ease-in-out;
```

### Hover States
- Buttons: Darken 10%
- Links: Underline
- Cards: Lift (shadow increase)

### Loading States
- Skeleton screens (preferred)
- Spinners (fallback)
- Progress bars (long operations)

---

# 7. Application Examples

## Website Header

```html
<header class="bg-white border-b border-gray-200">
  <div class="container mx-auto px-4 py-4 flex items-center justify-between">
    <img src="/brand/ossa-logo.svg" alt="OSSA" class="h-10">
    <nav class="flex gap-6">
      <a href="/docs" class="text-gray-700 hover:text-primary">Docs</a>
      <a href="/spec" class="text-gray-700 hover:text-primary">Specification</a>
      <a href="/ecosystem" class="text-gray-700 hover:text-primary">Ecosystem</a>
    </nav>
    <a href="/get-started" class="btn-primary">Get Started</a>
  </div>
</header>
```

## Hero Section

```html
<section class="bg-gradient-to-br from-secondary via-primary to-accent text-white py-20">
  <div class="container mx-auto px-4 text-center">
    <h1 class="text-5xl font-bold mb-4">The OpenAPI for AI Agents</h1>
    <p class="text-xl mb-8">Vendor-neutral specification for interoperable AI agents</p>
    <div class="flex gap-4 justify-center">
      <a href="/docs" class="btn-white">Read Docs</a>
      <a href="/spec" class="btn-outline-white">View Spec</a>
    </div>
  </div>
</section>
```

## Code Example

```yaml
# agent.ossa.yaml
ossaVersion: "0.2.6"

agent:
  id: my-agent
  name: My Agent
  version: "1.0.0"
  role: worker

  capabilities:
    - name: process_data
      description: Process incoming data
      input_schema:
        type: object
        properties:
          data: { type: string }
      output_schema:
        type: object
        properties:
          result: { type: string }
```

## Documentation Page

```markdown
# Getting Started

Install the OSSA CLI:

\`\`\`bash
npm install -g @bluefly/openstandardagents
\`\`\`

Create your first agent:

\`\`\`bash
ossa generate worker --name my-agent
\`\`\`

Validate the agent:

\`\`\`bash
ossa validate agent.ossa.yaml
\`\`\`
```

---

# 8. Quick Reference

## Brand Essentials

| Element | Value |
|---------|-------|
| **Name** | OSSA (Open Standard for Scalable AI Agents) |
| **Tagline** | "The OpenAPI for AI Agents" |
| **Domain** | openstandardagents.org |
| **License** | Apache 2.0 |
| **Primary Color** | #4A3ECD (Deep Purple) |
| **Secondary Color** | #1CB9ED (Cyan Blue) |
| **Font** | Inter (Sans-serif) |
| **Monospace** | JetBrains Mono |

## Dos and Don'ts

### ✅ Do
- Use approved color palette and gradients
- Follow typography hierarchy and sizing
- Respect logo clear space and minimum sizes
- Write in active voice with clear language
- Maintain WCAG AA accessibility (AAA preferred)
- Provide working code examples
- Use consistent spacing (4px base unit)
- Test on multiple devices and browsers

### ❌ Don't
- Modify logo colors or proportions
- Use colors outside approved palette
- Mix font families
- Use exclusive language ("obviously," "simply")
- Make unsubstantiated claims
- Violate accessibility guidelines
- Skip responsive design
- Use low-resolution assets

## File Locations

| Asset | Location |
|-------|----------|
| **Logo (SVG)** | `/website/public/brand/ossa-logo.svg` |
| **Colors (SCSS)** | `/website/styles/_variables.scss` |
| **Typography** | Google Fonts (Inter, JetBrains Mono) |
| **Icons** | Heroicons v2 |
| **Brand Guide** | `/docs/brand-guide/` |

## Contact & Support

**Questions:** design@openstandardagents.org  
**Documentation:** https://openstandardagents.org/brand  
**Issues:** https://github.com/blueflyio/openstandardagents/issues  
**Community:** https://discord.gg/ossa

---

## License & Trademark

**Brand Guide License:** Creative Commons Attribution 4.0 International (CC BY 4.0)

**Trademark:** "OSSA" and the OSSA logo are trademarks of the OSSA project. Use of these trademarks is subject to the OSSA Trademark Policy.

**Copyright:** © 2025 OSSA Project. All rights reserved.

---

**Version History:**
- **1.0.0** (November 2025) - Initial release

---

*This brand guide is a living document. For updates, visit https://openstandardagents.org/brand*
