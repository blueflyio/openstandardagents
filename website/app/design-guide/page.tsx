import Link from 'next/link';
import { Logo } from '@/components/Logo';

export const metadata = {
  title: 'OSSA Design Guide',
  description: 'Complete design system and component guidelines for building OSSA pages',
};

export default function DesignGuidePage() {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-accent to-secondary text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">OSSA Design Guide</h1>
          <p className="text-xl text-white/90 mb-2">
            Complete design system for building consistent OSSA pages
          </p>
          <p className="text-lg text-white/80">
            Brand guidelines, components, colors, typography, and patterns
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Brand Identity */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Brand Identity</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Logo</h3>
              <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center mb-4">
                <img src="/assets/brand/ossa-logo.svg" alt="OSSA Logo" className="h-32 w-32" />
              </div>
              <p className="text-gray-700 mb-4">
                The OSSA logo represents the hub-and-spoke architecture of agent orchestration.
                The central hub (primary blue) connects to agent nodes (secondary cyan).
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Usage:</strong> Always maintain clear space around the logo (minimum 20% of logo height)</p>
                <p><strong>Minimum size:</strong> 40px × 40px for digital use</p>
                <p><strong>Do not:</strong> Rotate, distort, or recolor the logo</p>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Tagline</h3>
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-6 mb-4">
                <p className="text-2xl font-bold text-primary mb-2">"The OpenAPI for AI Agents"</p>
                <p className="text-gray-700">
                  This tagline should appear prominently on the homepage and in key marketing materials.
                  It communicates OSSA's purpose: standardizing agent definitions just as OpenAPI standardized REST APIs.
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Usage:</strong> Homepage hero, marketing pages, documentation headers</p>
                <p><strong>Variations:</strong> Can be shortened to "The OpenAPI for Agents" in tight spaces</p>
              </div>
            </div>
          </div>
        </section>

        {/* Color System */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Color System</h2>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Primary Brand Colors</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="card">
                <div className="h-32 bg-primary rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Primary</span>
                </div>
                <h4 className="font-bold mb-2">Primary Blue</h4>
                <p className="text-sm text-gray-600 mb-2"><strong>Hex:</strong> #0066CC</p>
                <p className="text-sm text-gray-600 mb-2"><strong>RGB:</strong> 0, 102, 204</p>
                <p className="text-sm text-gray-700">
                  Represents the OSSA hub/standard. Use for primary actions, links, and key UI elements.
                </p>
              </div>

              <div className="card">
                <div className="h-32 bg-secondary rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Secondary</span>
                </div>
                <h4 className="font-bold mb-2">Secondary Cyan</h4>
                <p className="text-sm text-gray-600 mb-2"><strong>Hex:</strong> #00B8D4</p>
                <p className="text-sm text-gray-600 mb-2"><strong>RGB:</strong> 0, 184, 212</p>
                <p className="text-sm text-gray-700">
                  Represents agent nodes. Use for secondary actions, accents, and complementary elements.
                </p>
              </div>

              <div className="card">
                <div className="h-32 bg-gradient-to-br from-primary to-secondary rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Gradient</span>
                </div>
                <h4 className="font-bold mb-2">Brand Gradient</h4>
                <p className="text-sm text-gray-600 mb-2"><strong>From:</strong> #0066CC</p>
                <p className="text-sm text-gray-600 mb-2"><strong>To:</strong> #00B8D4</p>
                <p className="text-sm text-gray-700">
                  Use for hero sections, backgrounds, and prominent visual elements.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Semantic Colors</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="card">
                <div className="h-24 bg-success rounded-lg mb-3"></div>
                <h4 className="font-bold mb-1">Success</h4>
                <p className="text-sm text-gray-600">#10b981 (muted)</p>
                <p className="text-xs text-gray-500 mt-1">Use: <code className="bg-gray-100 px-1 rounded">bg-success</code> or <code className="bg-gray-100 px-1 rounded">text-success</code></p>
              </div>
              <div className="card">
                <div className="h-24 bg-warning rounded-lg mb-3"></div>
                <h4 className="font-bold mb-1">Warning</h4>
                <p className="text-sm text-gray-600">#f59e0b (muted)</p>
                <p className="text-xs text-gray-500 mt-1">Use: <code className="bg-gray-100 px-1 rounded">bg-warning</code> or <code className="bg-gray-100 px-1 rounded">text-warning</code></p>
              </div>
              <div className="card">
                <div className="h-24 bg-error rounded-lg mb-3"></div>
                <h4 className="font-bold mb-1">Error</h4>
                <p className="text-sm text-gray-600">#ef4444 (muted)</p>
                <p className="text-xs text-gray-500 mt-1">Use: <code className="bg-gray-100 px-1 rounded">bg-error</code> or <code className="bg-gray-100 px-1 rounded">text-error</code></p>
              </div>
              <div className="card">
                <div className="h-24 bg-info rounded-lg mb-3"></div>
                <h4 className="font-bold mb-1">Info</h4>
                <p className="text-sm text-gray-600">#06b6d4 (muted)</p>
                <p className="text-xs text-gray-500 mt-1">Use: <code className="bg-gray-100 px-1 rounded">bg-info</code> or <code className="bg-gray-100 px-1 rounded">text-info</code></p>
              </div>
            </div>
          </div>

          <div className="card bg-gray-50">
            <h4 className="font-bold mb-3 text-gray-900">Color Usage Guidelines</h4>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Primary (#0066CC):</strong> Main CTAs, links, headings, borders for primary sections</li>
              <li><strong>Secondary (#00B8D4):</strong> Secondary CTAs, accents, complementary borders, highlights</li>
              <li><strong>Gradients:</strong> Hero sections, card backgrounds (use subtle opacity: /10, /20, /30)</li>
              <li><strong>Neutral Grays:</strong> Body text (gray-700), borders (gray-300), backgrounds (gray-50, gray-100)</li>
              <li><strong>Semantic Colors:</strong> Use muted semantic colors (success, warning, error, info) for status indicators. All defined in <code className="bg-gray-200 px-1 rounded">styles/_variables.scss</code>.</li>
              <li><strong>Centralized System:</strong> All colors are defined in <code className="bg-gray-200 px-1 rounded">styles/_variables.scss</code> as SCSS variables. Update colors in ONE place! The SCSS variables are compiled to CSS variables and exposed via Tailwind classes.</li>
              <li><strong>Usage:</strong> Use <code className="bg-gray-200 px-1 rounded">bg-success</code>, <code className="bg-gray-200 px-1 rounded">bg-warning</code>, <code className="bg-gray-200 px-1 rounded">bg-error</code>, <code className="bg-gray-200 px-1 rounded">bg-info</code> for backgrounds, or with opacity like <code className="bg-gray-200 px-1 rounded">bg-success/20</code></li>
              <li><strong>Update Colors:</strong> Edit <code className="bg-gray-200 px-1 rounded">styles/_variables.scss</code> to change any color. Restart dev server after changes.</li>
              <li><strong>Avoid:</strong> Random color assignments. Use brand colors or semantic colors with purpose.</li>
            </ul>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Typography</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Font Families</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">Body & Headings</p>
                  <p className="text-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    Inter, system-ui, -apple-system, sans-serif
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Used for all body text, headings, and UI elements. Clean, modern, highly readable.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Code & Monospace</p>
                  <p className="text-lg font-mono">
                    JetBrains Mono, Menlo, Monaco, Courier New, monospace
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Used for code blocks, inline code, and technical content.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Type Scale</h3>
              <div className="space-y-3">
                <div>
                  <h1 className="text-5xl font-bold text-gray-900 mb-1">Heading 1</h1>
                  <p className="text-sm text-gray-600">text-5xl (3rem) - Hero titles</p>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">Heading 2</h2>
                  <p className="text-sm text-gray-600">text-3xl (1.875rem) - Section titles</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Heading 3</h3>
                  <p className="text-sm text-gray-600">text-2xl (1.5rem) - Subsection titles</p>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">Heading 4</h4>
                  <p className="text-sm text-gray-600">text-xl (1.25rem) - Card titles</p>
                </div>
                <div>
                  <p className="text-base text-gray-700 mb-1">Body Text</p>
                  <p className="text-sm text-gray-600">text-base (1rem) - Default body</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-1">Small Text</p>
                  <p className="text-xs text-gray-600">text-sm (0.875rem) - Captions, metadata</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Components */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Components</h2>
          </div>

          <div className="space-y-8">
            {/* Buttons */}
            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Buttons</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <button className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
                    Primary Button
                  </button>
                  <button className="bg-secondary text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
                    Secondary Button
                  </button>
                  <button className="border-2 border-primary text-primary px-6 py-3 rounded-lg font-medium hover:bg-primary hover:text-white transition-colors">
                    Outline Button
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Usage:</strong> Primary buttons for main actions, secondary for alternative actions, outline for less prominent actions.
                    Always use brand colors (primary/secondary) or semantic colors (success/warning/error).
                  </p>
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Cards</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
                  <h4 className="font-bold mb-2">Standard Card</h4>
                  <p className="text-sm text-gray-600">Default card style</p>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg shadow-md p-6 border-2 border-primary">
                  <h4 className="font-bold mb-2 text-primary">Highlighted Card</h4>
                  <p className="text-sm text-gray-600">For important content</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary hover:shadow-lg transition-shadow">
                  <h4 className="font-bold mb-2">Interactive Card</h4>
                  <p className="text-sm text-gray-600">With hover effect</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Usage:</strong> Use standard cards for content sections. Use highlighted cards for featured/important content.
                  Use colored left borders (border-l-4) to indicate category or importance.
                </p>
              </div>
            </div>

            {/* Hero Sections */}
            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Hero Sections</h3>
              <div className="bg-gradient-to-br from-primary via-[#0099E6] to-secondary text-white rounded-lg p-8 mb-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-bold mb-2">Hero Section Title</h2>
                  <p className="text-lg text-white/90">Hero section description text</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Usage:</strong> All major pages should start with a hero section using the brand gradient.
                  Include an icon badge, title, and descriptive text. Use white text on gradient backgrounds.
                </p>
              </div>
            </div>

            {/* Accordions */}
            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Accordions</h3>
              <div className="space-y-2">
                <div className="bg-white rounded-lg border-l-4 border-primary shadow-md">
                  <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50">
                    <h4 className="font-bold text-gray-900">Accordion Item (Open)</h4>
                    <svg className="w-5 h-5 text-gray-600 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="pt-4 text-gray-700">
                      Accordion content goes here. Use for collapsible sections with related content.
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border-l-4 border-secondary shadow-md">
                  <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50">
                    <h4 className="font-bold text-gray-900">Accordion Item (Closed)</h4>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-700">
                  <strong>Usage:</strong> Use accordions for organizing long-form content. Alternate between primary and secondary border colors.
                  First item should be open by default.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Layout Patterns */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Layout Patterns</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Page Structure</h3>
              <div className="space-y-3 text-gray-700">
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold">1. Hero Section</p>
                  <p className="text-sm text-gray-600">Gradient background, icon, title, description</p>
                </div>
                <div className="border-l-4 border-secondary pl-4">
                  <p className="font-semibold">2. Content Sections</p>
                  <p className="text-sm text-gray-600">Cards, grids, accordions, content blocks</p>
                </div>
                <div className="border-l-4 border-gray-300 pl-4">
                  <p className="font-semibold">3. Call-to-Action</p>
                  <p className="text-sm text-gray-600">Links to playground, examples, docs</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Section Headers</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-primary">Section Title</h3>
                </div>
                <p className="text-sm text-gray-600">
                  All major sections should have an icon badge (gradient background) and colored heading.
                  Use primary color for main sections, secondary for subsections.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Best Practices</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card border-l-4 border-green-500">
              <h3 className="text-lg font-bold mb-3 text-gray-900">✅ Do</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Use brand colors (primary/secondary) consistently</li>
                <li>• Start pages with gradient hero sections</li>
                <li>• Use cards for content organization</li>
                <li>• Include icon badges with section headers</li>
                <li>• Use accordions for long-form content</li>
                <li>• Maintain consistent spacing (gap-4, gap-6, gap-8)</li>
                <li>• Use semantic colors for status indicators</li>
                <li>• Keep text readable (gray-700 for body, gray-900 for headings)</li>
              </ul>
            </div>

            <div className="card border-l-4 border-red-500">
              <h3 className="text-lg font-bold mb-3 text-gray-900">❌ Don't</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Use random colors without purpose</li>
                <li>• Mix too many colors in one section</li>
                <li>• Use emojis in component titles (icons only)</li>
                <li>• Create pages without hero sections</li>
                <li>• Use inconsistent spacing</li>
                <li>• Overuse gradients (use subtle opacity)</li>
                <li>• Use colors that clash with brand colors</li>
                <li>• Make text too small (minimum text-base for body)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Code Examples</h2>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Hero Section Template</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
              {`<div className="bg-gradient-to-br from-primary via-accent to-secondary text-white py-16 px-4">
  <div className="container mx-auto max-w-6xl text-center">
    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* Icon */}
      </svg>
    </div>
    <h1 className="text-5xl font-bold mb-4">Page Title</h1>
    <p className="text-xl text-white/90 mb-2">Description</p>
  </div>
</div>`}
            </pre>
          </div>
        </section>

        {/* Resources */}
        <section className="mb-8">
          <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Additional Resources</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-gray-900">Component Files</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• <code className="bg-gray-200 px-2 py-1 rounded">components/layout/Header.tsx</code></li>
                  <li>• <code className="bg-gray-200 px-2 py-1 rounded">components/layout/Footer.tsx</code></li>
                  <li>• <code className="bg-gray-200 px-2 py-1 rounded">components/Logo.tsx</code></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-gray-900">Reference Pages</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• <Link href="/schema" className="text-primary hover:underline">Schema Page</Link></li>
                  <li>• <Link href="/specification" className="text-primary hover:underline">Specification Page</Link></li>
                  <li>• <Link href="/docs" className="text-primary hover:underline">Docs Page</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

