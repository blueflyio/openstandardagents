import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Open Standard Agents - Industry Standard for Agent Orchestration',
  description: 'The vendor-neutral specification for multi-agent systems. Write once, deploy anywhere. Zero vendor lock-in.',
};

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0066CC] via-[#00B8D4] to-[#0066CC] text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <img
              src="/assets/brand/ossa-logo.svg"
              alt="OSSA Logo"
              className="w-16 h-16"
            />
          </div>
          <h1 className="text-6xl font-bold mb-6">Open Standard Agents</h1>
          <p className="text-2xl text-white/90 mb-4 max-w-3xl mx-auto">
            The OpenAPI for AI Agents
          </p>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            A vendor-neutral specification for multi-agent systems. Write once, deploy anywhere. Zero vendor lock-in.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/docs/getting-started"
              className="bg-white text-[#0066CC] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/playground"
              className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors"
            >
              Try Playground
            </Link>
            <Link
              href="/specification"
              className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors"
            >
              View Specification
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0066CC] to-[#00B8D4] rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Framework-Agnostic</h3>
            <p className="text-gray-600">
              Works with any LLM framework or SDK. No vendor lock-in.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0066CC] to-[#00B8D4] rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Portable</h3>
            <p className="text-gray-600">
              Move agents between teams, organizations, and infrastructures seamlessly.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0066CC] to-[#00B8D4] rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Validatable</h3>
            <p className="text-gray-600">
              JSON Schema validation ensures correctness before deployment.
            </p>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-gray-50 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Quick Start</h2>
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <code className="text-green-400">npm install -g @bluefly/openstandardagents</code>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <code className="text-green-400">ossa generate chat --name "My First Agent"</code>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Documentation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs/getting-started" className="text-[#0066CC] hover:underline">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-[#0066CC] hover:underline">
                  Full Documentation
                </Link>
              </li>
              <li>
                <Link href="/schema" className="text-[#0066CC] hover:underline">
                  Schema Reference
                </Link>
              </li>
              <li>
                <Link href="/examples" className="text-[#0066CC] hover:underline">
                  Examples
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/playground" className="text-[#0066CC] hover:underline">
                  Playground
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-[#0066CC] hover:underline">
                  Blog
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/blueflyio/openstandardagents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0066CC] hover:underline"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/@bluefly/openstandardagents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0066CC] hover:underline"
                >
                  npm Package
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

