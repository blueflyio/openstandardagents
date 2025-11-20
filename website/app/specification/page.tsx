import Link from 'next/link';
import type { Metadata } from 'next';
import { STABLE_VERSION_TAG, STABLE_VERSION } from '@/lib/version';

export const metadata: Metadata = {
  title: 'Specification - Open Standard Agents',
  description: 'The complete Open Standard Agents specification documentation.',
};

export default function SpecificationPage() {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-accent to-secondary text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">OSSA Specification</h1>
          <p className="text-xl text-white/90 mb-2">
            Complete technical specification for defining, validating, and deploying AI agents
          </p>
          <p className="text-lg text-white/80">
            Version {STABLE_VERSION_TAG} • The OpenAPI for AI Agents
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Current Version Highlighted Block */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2 text-primary">Current Version</h2>
                  <h3 className="text-2xl font-semibold mb-2 text-gray-900">{STABLE_VERSION_TAG}</h3>
                  <p className="text-gray-700">Latest stable release</p>
                </div>
                <Link href="/schema" className="btn-primary whitespace-nowrap">
                  View Schema
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t-2 border-blue-200">
                <div>
                  <h4 className="font-bold mb-2 text-gray-900">Release Date</h4>
                  <p className="text-gray-700 text-lg">November 2024</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-gray-900">Status</h4>
                  <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold border-2 border-green-300">
                    Stable
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Why This Specification? */}
          <section className="mb-16">
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl p-8">
              <div className="flex items-start mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4 text-gray-900">Why This Specification?</h2>
                  <div className="space-y-4 text-lg text-gray-700">
                    <p>
                      <strong className="text-primary">The Problem:</strong> Every AI framework defines agents differently.
                      LangChain has "chains," CrewAI has "crews," OpenAI has "assistants," Anthropic has different tools.
                      This creates <span className="text-red-600 font-semibold">vendor lock-in</span> and makes it impossible to share agents between teams or frameworks.
                    </p>
                    <p>
                      <strong className="text-secondary">The Solution:</strong> OSSA provides a single, standard way to describe agents that works everywhere.
                      Like OpenAPI revolutionized REST APIs, OSSA revolutionizes AI agents with a vendor-neutral specification.
                    </p>
                    <p>
                      <strong className="text-primary">The Result:</strong> Write your agent definition once, deploy it to any framework.
                      Switch providers without rewriting code. Share agents across organizations. True portability and interoperability.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-primary">Specification Structure</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <h3 className="text-xl font-bold mb-3 text-primary">1. Core Specification</h3>
                <p className="text-gray-700 mb-4">
                  The fundamental structure of an OSA agent manifest, including metadata, specification,
                  and extensions.
                </p>
                <Link href="/docs/getting-started/first-agent" className="text-primary hover:text-secondary font-semibold inline-flex items-center">
                  Read Core Specification →
                </Link>
              </div>

              <div className="bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <h3 className="text-xl font-bold mb-3 text-primary">2. Schema Reference</h3>
                <p className="text-gray-700 mb-4">
                  Complete JSON Schema definition with all properties, types, constraints, and validation rules.
                </p>
                <Link href="/schema" className="text-primary hover:text-secondary font-semibold inline-flex items-center">
                  Explore Schema →
                </Link>
              </div>

              <div className="bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <h3 className="text-xl font-bold mb-3 text-primary">3. Platform Extensions</h3>
                <p className="text-gray-700 mb-4">
                  Framework-specific extensions for Cursor, OpenAI, CrewAI, LangChain, Anthropic,
                  Langflow, AutoGen, and more.
                </p>
                <Link href="/docs/examples/migration-guides" className="text-primary hover:text-secondary font-semibold inline-flex items-center">
                  View Extensions →
                </Link>
              </div>

              <div className="bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <h3 className="text-xl font-bold mb-3 text-primary">4. Validation Rules</h3>
                <p className="text-gray-700 mb-4">
                  Comprehensive validation rules, error messages, and best practices for creating valid agent manifests.
                </p>
                <Link href="/playground" className="text-primary hover:text-secondary font-semibold inline-flex items-center">
                  Try Validation →
                </Link>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-primary">Key Concepts</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold mb-3 text-primary">Agent Manifest</h3>
                <p className="text-gray-700 mb-4">
                  A YAML or JSON file that describes an AI agent, including its role, LLM configuration,
                  tools, and deployment requirements.
                </p>
                <div className="bg-gray-900 rounded-lg p-4 mt-3 border-2 border-gray-700">
                  <pre className="text-green-400 text-sm overflow-x-auto font-mono">
                    <code>{`apiVersion: ossa/v${STABLE_VERSION}
kind: Agent
metadata:
  name: my-agent
spec:
  role: You are a helpful assistant
  llm:
    provider: openai
    model: gpt-4`}</code>
                  </pre>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold mb-3 text-primary">Schema Validation</h3>
                <p className="text-gray-700">
                  Every agent manifest must conform to the OSA JSON Schema. Validation ensures correctness,
                  completeness, and compatibility before deployment.
                </p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold mb-3 text-primary">Platform Extensions</h3>
                <p className="text-gray-700">
                  Framework-specific extensions allow agents to leverage platform-specific features while
                  maintaining core OSA compatibility.
                </p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold mb-3 text-primary">Export/Import</h3>
                <p className="text-gray-700">
                  Convert OSA manifests to framework-specific formats (export) or import existing agents
                  into OSA format for standardization.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-primary">Version History</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-primary rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{STABLE_VERSION_TAG}</h3>
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold border-2 border-green-300">
                    Current
                  </span>
                </div>
                <p className="text-gray-700 mb-2 font-medium">November 2024</p>
                <p className="text-gray-700">
                  Enhanced platform extensions, improved validation, and expanded tool support.
                </p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">v0.2.2</h3>
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                    Previous
                  </span>
                </div>
                <p className="text-gray-700 mb-2">October 2024</p>
                <p className="text-gray-700">
                  Initial platform extensions and improved schema structure.
                </p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">v0.1.9</h3>
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                    Legacy
                  </span>
                </div>
                <p className="text-gray-700 mb-2">September 2024</p>
                <p className="text-gray-700">
                  Initial release with basic agent definition structure.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-primary">Resources</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/schema" className="bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <h3 className="text-xl font-bold mb-2 text-primary">Interactive Schema Explorer</h3>
                <p className="text-gray-700">Explore the complete JSON Schema interactively.</p>
              </Link>
              <Link href="/playground" className="bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <h3 className="text-xl font-bold mb-2 text-primary">Validation Playground</h3>
                <p className="text-gray-700">Test and validate your agent manifests in real-time.</p>
              </Link>
              <Link href="/examples" className="bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <h3 className="text-xl font-bold mb-2 text-primary">Examples Gallery</h3>
                <p className="text-gray-700">Browse real-world examples and use cases.</p>
              </Link>
              <Link href="/docs" className="bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <h3 className="text-xl font-bold mb-2 text-primary">Full Documentation</h3>
                <p className="text-gray-700">Comprehensive guides and tutorials.</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

