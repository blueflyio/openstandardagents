import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - Open Standard Agents Initiative',
  description: 'Learn about the Open Standard Agents Initiative - the vendor-neutral specification for AI agent orchestration.',
};

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-secondary via-primary to-accent text-white py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">About Open Standard Agents</h1>
          <p className="text-xl text-white/90">
            Building the future of agent interoperability through open standards
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <section className="mb-16">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary via-primary to-accent rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-primary">The Initiative</h2>
            </div>
          <p className="text-lg text-gray-700 mb-4">
            The <strong>Open Standard Agents Initiative</strong> provides an open source, technical community
            within which industry participants can easily contribute to building a vendor-neutral, portable,
            and open specification for providing technical metadata for AI agents - the &quot;Open Standard Agents Specification&quot; (OSA).
          </p>
          <p className="text-lg text-gray-700 mb-4">
            Just as the <a href="https://www.openapis.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAPI Initiative</a> standardized REST APIs,
            the Open Standard Agents Initiative standardizes AI agent definitions, enabling interoperability
            across frameworks, runtimes, and organizations.
          </p>
        </section>

        <section className="mb-16">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary via-primary to-accent rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Our Mission</h2>
          </div>
          <p className="text-lg text-gray-700 mb-4">
            To create a vendor-neutral, open specification that enables:
          </p>
          <div className="grid gap-4 mt-6">
            <div className="flex items-start bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg border-l-4 border-primary">
              <svg className="w-6 h-6 text-primary mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-lg text-gray-700">Interoperability between different AI agent frameworks and runtimes</span>
            </div>
            <div className="flex items-start bg-gradient-to-r from-secondary/5 to-transparent p-4 rounded-lg border-l-4 border-secondary">
              <svg className="w-6 h-6 text-secondary mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-lg text-gray-700">Portability of agent definitions across teams and organizations</span>
            </div>
            <div className="flex items-start bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg border-l-4 border-primary">
              <svg className="w-6 h-6 text-primary mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-lg text-gray-700">Standardization of agent metadata, tools, and capabilities</span>
            </div>
            <div className="flex items-start bg-gradient-to-r from-secondary/5 to-transparent p-4 rounded-lg border-l-4 border-secondary">
              <svg className="w-6 h-6 text-secondary mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg text-gray-700">Validation and verification of agent definitions before deployment</span>
            </div>
            <div className="flex items-start bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg border-l-4 border-primary">
              <svg className="w-6 h-6 text-primary mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span className="text-lg text-gray-700">Tooling and ecosystem development around agent specifications</span>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary via-primary to-accent rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">What We Are</h2>
          </div>
          <div className="card p-6 mb-4 border-l-4 border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-primary">A Specification</h3>
                <p className="text-gray-700">
                  OSA defines a standard format for describing AI agents, their capabilities, tools, and deployment requirements.
                </p>
              </div>
            </div>
          </div>
          <div className="card p-6 mb-4 border-l-4 border-secondary hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-secondary">Open Source</h3>
                <p className="text-gray-700">
                  Licensed under Apache 2.0. Free to use, modify, and distribute. Community-driven development.
                </p>
              </div>
            </div>
          </div>
          <div className="card p-6 mb-4 border-l-4 border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-primary">Vendor-Neutral</h3>
                <p className="text-gray-700">
                  No single vendor controls the specification. Governed by the community and technical steering committee.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-700">What We Are NOT</h2>
          </div>
          <div className="card p-6 mb-4 bg-gray-50 border-l-4 border-gray-400 hover:shadow-lg transition-shadow">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-2xl">❌</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-700">A Framework</h3>
                <p className="text-gray-700">
                  OSA does not implement agents. It defines the specification that frameworks follow.
                </p>
              </div>
            </div>
          </div>
          <div className="card p-6 mb-4 bg-gray-50 border-l-4 border-gray-400 hover:shadow-lg transition-shadow">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-2xl">❌</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-700">A Runtime</h3>
                <p className="text-gray-700">
                  OSA does not execute agents. It describes agents that runtimes can execute.
                </p>
              </div>
            </div>
          </div>
          <div className="card p-6 mb-4 bg-gray-50 border-l-4 border-gray-400 hover:shadow-lg transition-shadow">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-2xl">❌</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-700">Proprietary</h3>
                <p className="text-gray-700">
                  OSA is not owned by any single company. It's maintained by the open source community.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary via-primary to-accent rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Governance</h2>
          </div>
          <p className="text-lg text-gray-700 mb-4">
            The Open Standard Agents Initiative follows an open governance model:
          </p>
          <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 mb-4">
            <li><strong>Technical Steering Committee:</strong> Guides technical direction and specification evolution</li>
            <li><strong>Working Groups:</strong> Focus on specific areas (schema, tooling, frameworks, etc.)</li>
            <li><strong>Community Contributors:</strong> Anyone can contribute via pull requests and discussions</li>
            <li><strong>Specification Process:</strong> Open RFC process for proposing changes and new features</li>
          </ul>
        </section>

        <section className="mb-16">
          <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 rounded-2xl p-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary via-primary to-accent rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-primary">Get Involved</h2>
            </div>
            <p className="text-lg text-gray-700 mb-6">
              Join the Open Standard Agents community and help shape the future of agent interoperability:
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="https://github.com/blueflyio/openstandardagents" target="_blank" rel="noopener noreferrer" className="card-hover p-6 border-l-4 border-primary group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-primary mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <h3 className="text-xl font-semibold text-primary">Contribute Code</h3>
              </div>
              <p className="text-gray-700">Submit pull requests, report issues, and help improve the specification.</p>
            </Link>
            <Link href="/docs" className="card-hover p-6 border-l-4 border-secondary group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-secondary mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-xl font-semibold text-secondary">Improve Documentation</h3>
              </div>
              <p className="text-gray-700">Help make OSA more accessible with better docs and examples.</p>
            </Link>
            <Link href="/examples" className="card-hover p-6 border-l-4 border-primary group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-primary mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-xl font-semibold text-primary">Share Examples</h3>
              </div>
              <p className="text-gray-700">Contribute real-world examples and use cases.</p>
            </Link>
            <Link href="https://github.com/blueflyio/openstandardagents/issues" target="_blank" rel="noopener noreferrer" className="card-hover p-6 border-l-4 border-secondary group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-secondary mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <h3 className="text-xl font-semibold text-secondary">Provide Feedback</h3>
              </div>
              <p className="text-gray-700">Share your experience and help prioritize features.</p>
            </Link>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-gradient-to-r from-secondary via-primary to-accent text-white rounded-2xl p-8">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h2 className="text-3xl font-bold">License</h2>
            </div>
            <p className="text-lg text-white/90 mb-4">
              The Open Standard Agents Specification is licensed under the{' '}
              <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer" className="text-white font-semibold hover:underline">
                Apache License 2.0
              </a>.
            </p>
            <p className="text-lg text-white/90">
              This means you are free to use, modify, and distribute OSA in your projects,
              both open source and commercial, without restrictions.
            </p>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}

