import Link from 'next/link';
import type { Metadata } from 'next';
import { Logo } from '@/components/Logo';
import { STABLE_VERSION_TAG } from '@/lib/version';

export const metadata: Metadata = {
  title: 'Open Standard Agents - Industry Standard for Agent Orchestration',
  description: 'The vendor-neutral specification for multi-agent systems. Write once, deploy anywhere. Zero vendor lock-in.',
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-24 px-4">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="mb-8 flex flex-col items-center">
            <img src="/assets/brand/ossa-logo.svg" alt="OSSA Logo" className="h-24 w-24 mb-6 animate-pulse" />
            <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
              <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                The OpenAPI for AI Agents
              </span>
              <span className="inline-block px-4 py-2 bg-white/30 backdrop-blur-sm rounded-full text-sm font-semibold border border-white/40">
                Latest: {STABLE_VERSION_TAG}
              </span>
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Open Standard for <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent animate-pulse">Scalable Agents</span>
          </h1>
          <p className="text-3xl md:text-4xl mb-6 font-light">
            The Interoperability Layer Your Agents Are Missing
          </p>
          <p className="text-xl md:text-2xl mb-4 text-gray-200 max-w-4xl mx-auto">
            A vendor-neutral, open specification for defining, deploying, and managing AI agents.
          </p>
          <p className="text-lg mb-8 text-white max-w-4xl mx-auto">
            Just as OpenAPI standardizes REST APIs, Open Standard Agents standardizes agent interoperability
            across frameworks, runtimes, and organizations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="#get-started" className="btn-primary text-lg px-8 py-4 border-2 border-transparent hover:border-white transition-all">
              Get Started
            </Link>
            <Link href="https://github.com/blueflyio/openstandardagents" className="btn-outline border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </Link>
            <Link href="/schema/" className="btn-outline border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4">
              View Schema
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Vendor-Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Framework-Agnostic</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>JSON Schema Validated</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why OSSA - The Problem Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Why Does This Matter?</h2>
          </div>
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              In the world of AI agents, <strong className="text-gray-900">everyone calls an agent something different</strong>.
              LangChain has &quot;chains,&quot; CrewAI has &quot;crews,&quot; OpenAI has &quot;assistants,&quot; Anthropic has Claude with &quot;tools.&quot;
              Every framework invents its own terminology, its own configuration format, its own orchestration model.
            </p>
            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              This fragmentation creates <strong className="text-red-600">vendor lock-in</strong>, makes agents impossible
              to share between teams, and forces developers to rewrite everything when switching frameworks. Want to move
              your LangChain agent to CrewAI? Complete rewrite. Need to deploy the same agent logic across multiple
              frameworks? Maintain separate implementations.
            </p>
            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              Imagine if every API framework required its own documentation format—that was the world before OpenAPI.
              Every API provider wrote docs differently, integration was chaos, and tooling couldn&apos;t be shared.
              <strong className="text-gray-900"> OpenAPI solved this by creating one standard that every API could follow</strong>.
            </p>
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-blue-200">
              <p className="text-2xl text-gray-900 font-bold mb-4">
                OSSA solves this for AI agents.
              </p>
              <p className="text-xl text-gray-700">
                <strong>One standard. Any framework. True portability.</strong> Define your agent once in OSSA format,
                then deploy it with LangChain, CrewAI, Anthropic, OpenAI, or any other framework. Just like OpenAPI
                unified REST APIs, OSSA unifies AI agents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What is OSSA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">What is Open Standard Agents?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Open Standard Agents (OSSA) is an open, vendor-neutral specification for defining AI agents,
              similar to how OpenAPI standardizes REST APIs. It enables interoperability across frameworks,
              runtimes, and organizations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="card-hover p-8">
              <h3 className="text-2xl font-semibold mb-4 text-primary">Specification Standard</h3>
              <p className="text-gray-700 mb-4">
                OSSA is <strong>NOT a framework</strong> - it&apos;s a specification that defines the contract
                for agent definition, deployment, and management.
              </p>
              <p className="text-gray-700">
                Just like OpenAPI doesn&apos;t implement APIs, OSSA doesn&apos;t implement agents.
                It provides the standard that implementations follow.
              </p>
            </div>
            <div className="card-hover p-8">
              <h3 className="text-2xl font-semibold mb-4 text-primary">Framework-Agnostic</h3>
              <p className="text-gray-700 mb-4">
                Works seamlessly with any LLM framework or SDK - LangChain, Anthropic, OpenAI,
                CrewAI, Langflow, AutoGen, and more.
              </p>
              <p className="text-gray-700">
                Deploy to Kubernetes, Docker, serverless, or on-premise. OSSA is infrastructure-agnostic.
              </p>
            </div>
            <div className="card-hover p-8">
              <h3 className="text-2xl font-semibold mb-4 text-primary">Vendor-Neutral</h3>
              <p className="text-gray-700 mb-4">
                No vendor lock-in. Write once, deploy anywhere. Move agents between teams,
                organizations, and infrastructures without rewriting code.
              </p>
              <p className="text-gray-700">
                Maintained by the open source community, ensuring long-term viability and innovation.
              </p>
            </div>
          </div>

          {/* OpenAPI Comparison */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 md:p-12 mt-16 border-2 border-blue-100 shadow-xl">
            <div className="text-center mb-12">
              <h3 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                The OpenAPI for Agents
              </h3>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              <div className="bg-white rounded-lg p-6 border-2 border-blue-100 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <h4 className="text-xl font-bold mb-5 text-primary pb-3 border-b-2 border-blue-100">OpenAPI for REST APIs</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Standardizes REST API contracts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Enables API interoperability</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Vendor-neutral specification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">JSON Schema validation</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6 border-2 border-blue-100 shadow-md hover:shadow-xl hover:border-secondary transition-all duration-300">
                <h4 className="text-xl font-bold mb-5 text-secondary pb-3 border-b-2 border-cyan-100">OSSA for AI Agents</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Standardizes AI agent contracts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Enables agent interoperability</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Vendor-neutral specification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">JSON Schema validation</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6 border-2 border-blue-100 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <h4 className="text-xl font-bold mb-5 text-primary pb-3 border-b-2 border-blue-100">OpenAPI Integration</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Seamless OpenAPI compatibility</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Import existing OpenAPI specs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Export agents as OpenAPI</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Unified API and agent standards</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6 border-2 border-blue-100 shadow-md hover:shadow-xl hover:border-secondary transition-all duration-300">
                <h4 className="text-xl font-bold mb-5 text-secondary pb-3 border-b-2 border-cyan-100">API-to-Agent Bridge</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Connect REST APIs to agents</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Use OpenAPI as agent tools</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Automatic API discovery</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Bidirectional integration</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section id="get-started" className="py-20 px-4 bg-gray-50 scroll-mt-20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6">Get Started in Minutes</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Install the CLI, create your first agent, and start building with Open Standard Agents.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <div className="card p-8">
              <h3 className="text-2xl font-semibold mb-4 text-primary">1. Install CLI</h3>
              <div className="bg-code-bg rounded-lg p-4 mb-4">
                <pre className="text-code-text text-sm overflow-x-auto">
                  <code>npm install -g @bluefly/openstandardagents</code>
                </pre>
              </div>
            </div>
            <div className="card p-8">
              <h3 className="text-2xl font-semibold mb-4 text-primary">2. Create Agent</h3>
              <div className="bg-code-bg rounded-lg p-4 mb-4">
                <pre className="text-code-text text-sm overflow-x-auto">
                  <code>{`osa init my-agent
cd my-agent`}</code>
                </pre>
              </div>
            </div>
            <div className="card p-8">
              <h3 className="text-2xl font-semibold mb-4 text-primary">3. Validate</h3>
              <div className="bg-code-bg rounded-lg p-4 mb-4">
                <pre className="text-code-text text-sm overflow-x-auto">
                  <code>osa validate my-agent.ossa.yaml</code>
                </pre>
              </div>
            </div>
            <div className="card p-8">
              <h3 className="text-2xl font-semibold mb-4 text-primary">4. Export</h3>
              <div className="bg-code-bg rounded-lg p-4 mb-4">
                <pre className="text-code-text text-sm overflow-x-auto">
                  <code>{`osa export --to cursor
osa export --to langchain`}</code>
                </pre>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/docs/getting-started/5-minute-overview/" className="btn-primary text-lg px-8 py-4">
              Read Full Getting Started Guide
            </Link>
          </div>
        </div>
      </section>

      {/* Integrations & Adoption Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Works With Your Favorite Tools</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              OSSA integrates seamlessly with leading AI frameworks, platforms, and tools.
              Build once, deploy anywhere.
            </p>
          </div>

          {/* Logos Grid - Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center mb-8">
            <Logo domain="openai.com" name="OpenAI" />
            <Logo domain="anthropic.com" name="Anthropic" />
            <Logo domain="deepmind.google" name="Gemini" />
            <Logo domain="microsoft.com" name="Microsoft" />
            <Logo domain="langchain.com" name="LangChain" />
            <Logo domain="huggingface.co" name="Hugging Face" />
          </div>

          {/* Logos Grid - Row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center mb-12">
            <Logo domain="kagent.dev" name="kAgent" />
            <Logo domain="crewai.com" name="CrewAI" />
            <Logo domain="langflow.com" name="Langflow" />
            <Logo domain="llamaindex.ai" name="LlamaIndex" />
            <Logo domain="langchain.com" name="LangGraph" />
            <Logo domain="modelcontextprotocol.io" name="MCP" />
            <Logo domain="drupal.org" name="Drupal" />
            <Logo domain="librechat.com" name="LibreChat" />
            <Logo domain="docker.com" name="Docker" />
            <Logo domain="kubernetes.io" name="Kubernetes" />
            <Logo domain="aws.amazon.com" name="AWS" />
            <Logo domain="github.com" name="GitHub" />
          </div>

          <div className="text-center">
            <p className="text-lg text-gray-600 mb-6">
              And many more frameworks, platforms, and tools...
            </p>
            <Link href="/docs/ecosystem/framework-support/" className="btn-primary">
              View All Integrations
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Why Open Standard Agents?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build agent-based systems with confidence, knowing your agents will work across
              frameworks, teams, and infrastructures.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card-hover p-6 text-center">
              <h3 className="text-xl font-semibold mb-3">Framework-Agnostic</h3>
              <p className="text-gray-700">
                Works with LangChain, Anthropic, OpenAI, CrewAI, Langflow, AutoGen, and more.
                No vendor lock-in.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Portable</h3>
              <p className="text-gray-700">
                Move agents between teams, organizations, and infrastructures without rewriting code.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Validatable</h3>
              <p className="text-gray-700">
                JSON Schema validation ensures correctness before deployment. Catch errors early.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Well-Documented</h3>
              <p className="text-gray-700">
                Comprehensive documentation, examples, and tooling. Built for developers, by developers.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Open Source</h3>
              <p className="text-gray-700">
                Apache 2.0 licensed. Community-driven. Transparent development process.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Fast Integration</h3>
              <p className="text-gray-700">
                Export to any framework format. Import existing agents. Seamless migration paths.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Secure by Design</h3>
              <p className="text-gray-700">
                Built-in security patterns, authentication, and compliance features.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Observable</h3>
              <p className="text-gray-700">
                Built-in observability, logging, and monitoring. Track agent performance and behavior.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-gray-200">
            Join the community and start building with Open Standard Agents today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/examples/" className="btn-secondary">
              View Examples
            </Link>
            <Link href="https://github.com/blueflyio/openstandardagents/issues" className="btn-outline border-white text-white hover:bg-white hover:text-primary" target="_blank" rel="noopener noreferrer">
              Report Issues
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
