import type { Metadata } from 'next';
import { OSSA_DISPLAY_VERSION } from '@/lib/version';

export const metadata: Metadata = {
  title: 'Brand Guide - OSSA',
  description: 'Official brand guidelines for the Open Standard for Scalable AI Agents (OSSA). The OpenAPI for AI Agents.',
};

// Get current month/year for dynamic date display
const currentDate = new Date();
const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export default function BrandPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-br from-secondary via-primary to-accent text-white py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-4">OSSA Brand Guide</h1>
          <p className="text-xl text-white/90">
            Official brand guidelines for the Open Standard for Scalable AI Agents
          </p>
          <p className="text-sm text-white/70 mt-4">Version {OSSA_DISPLAY_VERSION} | Last Updated: {monthYear}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Quick Reference */}
        <section className="mb-16 bg-gradient-to-r from-primary/5 to-transparent p-8 rounded-lg border-l-4 border-primary">
          <h2 className="text-3xl font-bold text-primary mb-6">Brand at a Glance</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-2">Identity</h3>
              <p><strong>Name:</strong> OSSA (Open Standard for Scalable AI Agents)</p>
              <p><strong>Tagline:</strong> &quot;The OpenAPI for AI Agents&quot;</p>
              <p><strong>Domain:</strong> <a href="https://openstandardagents.org" className="text-primary hover:underline">openstandardagents.org</a></p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Colors</h3>
              <div className="flex gap-2 mb-2">
                <div className="w-12 h-12 rounded" style={{backgroundColor: '#4A3ECD'}} title="Primary: Deep Purple"></div>
                <div className="w-12 h-12 rounded" style={{backgroundColor: '#1CB9ED'}} title="Secondary: Cyan Blue"></div>
                <div className="w-12 h-12 rounded" style={{backgroundColor: '#9060EA'}} title="Accent: Light Purple"></div>
              </div>
              <p className="text-sm text-gray-600">Primary: #4A3ECD | Secondary: #1CB9ED | Accent: #9060EA</p>
            </div>
          </div>
        </section>

        {/* Sections */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-primary mb-8">Brand Guide Sections</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Brand Overview', desc: 'Mission, vision, values, positioning', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
              { title: 'Logo Usage', desc: 'Logo variants, sizing, usage rules', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { title: 'Color Palette', desc: 'Brand colors, semantic colors, gradients', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
              { title: 'Typography', desc: 'Font families, type scale, usage guidelines', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { title: 'Voice & Tone', desc: 'Writing style, tone variations, messaging', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
              { title: 'Visual Elements', desc: 'Icons, buttons, spacing, animations', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
            ].map((section, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-6 hover:border-primary transition-colors">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary via-primary to-accent rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{section.title}</h3>
                    <p className="text-gray-600">{section.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Downloads */}
        <section className="mb-16 bg-gray-50 p-8 rounded-lg">
          <h2 className="text-3xl font-bold text-primary mb-6">Download Assets</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <a href="/brand/OSSA-Brand-Guide.html" target="_blank" className="block p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-primary transition-colors">
              <svg className="w-12 h-12 text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="font-bold mb-2">Brand Guide</h3>
              <p className="text-sm text-gray-600">Complete brand guidelines</p>
            </a>
            <a href="/brand/ossa-logo.svg" download className="block p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-primary transition-colors">
              <svg className="w-12 h-12 text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <h3 className="font-bold mb-2">Logo SVG</h3>
              <p className="text-sm text-gray-600">Vector logo file</p>
            </a>
            <a href="https://github.com/blueflyio/openstandardagents/tree/main/docs/brand-guide" target="_blank" rel="noopener noreferrer" className="block p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-primary transition-colors">
              <svg className="w-12 h-12 text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h3 className="font-bold mb-2">Source Files</h3>
              <p className="text-sm text-gray-600">GitHub repository</p>
            </a>
          </div>
        </section>

        {/* Core Principles */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-primary mb-6">Core Principles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Open & Vendor-Neutral', desc: 'Community-driven, no vendor lock-in' },
              { title: 'Interoperable', desc: 'Common language across all frameworks' },
              { title: 'Trustworthy', desc: 'Compliance-ready, enterprise-grade' },
              { title: 'Simple & Practical', desc: 'Clear specification, production-ready' },
            ].map((principle, i) => (
              <div key={i} className="flex items-start p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border-l-4 border-primary">
                <svg className="w-6 h-6 text-primary mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-bold mb-1">{principle.title}</h3>
                  <p className="text-gray-600">{principle.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Dos and Don'ts */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-primary mb-6">Quick Reference</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-green-600">✅ Do</h3>
              <ul className="space-y-2">
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span> Use approved color palette</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span> Follow typography hierarchy</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span> Respect logo clear space</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span> Write in active voice</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span> Maintain WCAG AA accessibility</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-red-600">❌ Don't</h3>
              <ul className="space-y-2">
                <li className="flex items-start"><span className="text-red-600 mr-2">•</span> Modify logo colors or proportions</li>
                <li className="flex items-start"><span className="text-red-600 mr-2">•</span> Use colors outside approved palette</li>
                <li className="flex items-start"><span className="text-red-600 mr-2">•</span> Mix font families</li>
                <li className="flex items-start"><span className="text-red-600 mr-2">•</span> Use exclusive language</li>
                <li className="flex items-start"><span className="text-red-600 mr-2">•</span> Violate accessibility guidelines</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gradient-to-r from-primary/5 to-transparent p-8 rounded-lg border-l-4 border-primary">
          <h2 className="text-2xl font-bold text-primary mb-4">Questions or Need Assets?</h2>
          <p className="text-gray-700 mb-4">
            For questions about brand usage or to request additional assets, please contact us.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:design@openstandardagents.org" className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Design Team
            </a>
            <a href="https://github.com/blueflyio/openstandardagents/issues" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Report Issue
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
