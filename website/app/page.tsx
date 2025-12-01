import Link from 'next/link';
import type { Metadata } from 'next';
import { Logo } from '@/components/Logo';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { OSSA_DISPLAY_VERSION_TAG } from '@/lib/version';

export const metadata: Metadata = {
  title: 'Open Standard Agents - Industry Standard for Agent Orchestration',
  description: 'The vendor-neutral specification for multi-agent systems. Write once, deploy anywhere. Zero vendor lock-in.',
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary via-primary to-accent text-white py-24 px-4">
        <div className="container mx-auto max-w-[1440px] text-center">
          <div className="mb-6 flex flex-col items-center">
            <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
              The OpenAPI for AI Agents ({OSSA_DISPLAY_VERSION_TAG})
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Open Standard for AI Agents
          </h1>
          <p className="text-2xl md:text-3xl lg:text-4xl mb-6 font-bold">
            Vendor-neutral, compliance-ready, enterprise-grade
          </p>
          <div className="max-w-4xl mx-auto mb-8 space-y-3">
            <p className="text-lg md:text-xl text-gray-100 flex items-center justify-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Switch between AI providers without code changes
            </p>
            <p className="text-lg md:text-xl text-gray-100 flex items-center justify-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Built-in compliance and security frameworks
            </p>
            <p className="text-lg md:text-xl text-gray-100 flex items-center justify-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Standardized agent lifecycle and governance
            </p>
            <p className="text-lg md:text-xl text-gray-100 flex items-center justify-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Multi-runtime support (Node.js, Python, more)
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="#get-started" className="text-lg px-8 py-4 bg-[#3224c9] text-white font-bold rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all border-2 border-white hover:bg-white hover:text-[#3224c9]">
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
              <span className="font-bold">Vendor-Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">Framework-Agnostic</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">JSON Schema Validated</span>
            </div>
          </div>
        </div>
      </section>

      {/* What is OSSA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-[1440px]">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">What is Open Standard Agents?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Open Standard Agents (OSSA) is an open, vendor-neutral specification for defining AI agents,
              similar to how OpenAPI standardizes REST APIs. It enables interoperability across frameworks,
              runtimes, and organizations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card variant="default" padding="lg" elevation={1} hover>
              <CardHeader>
                <CardTitle className="text-primary">Specification Standard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  OSSA is <strong>NOT a framework</strong> - it&apos;s a specification that defines the contract
                  for agent definition, deployment, and management.
                </p>
                <p className="text-gray-700">
                  Just like OpenAPI doesn&apos;t implement APIs, OSSA doesn&apos;t implement agents.
                  It provides the standard that implementations follow.
                </p>
              </CardContent>
            </Card>
            <Card variant="default" padding="lg" elevation={1} hover>
              <CardHeader>
                <CardTitle className="text-primary">Framework-Agnostic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Works seamlessly with any LLM framework or SDK - LangChain, Anthropic, OpenAI,
                  CrewAI, Langflow, AutoGen, and more.
                </p>
                <p className="text-gray-700">
                  Deploy to Kubernetes, Docker, serverless, or on-premise. OSSA is infrastructure-agnostic.
                </p>
              </CardContent>
            </Card>
            <Card variant="default" padding="lg" elevation={1} hover>
              <CardHeader>
                <CardTitle className="text-primary">Vendor-Neutral</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  No vendor lock-in. Write once, deploy anywhere. Move agents between teams,
                  organizations, and infrastructures without rewriting code.
                </p>
                <p className="text-gray-700">
                  Maintained by the open source community, ensuring long-term viability and innovation.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* OpenAPI Comparison */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 md:p-12 mt-16 border-2 border-blue-100 shadow-xl">
            <div className="text-center mb-12">
              <h3 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                The OpenAPI for Agents
              </h3>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1440px] mx-auto">
              <Card variant="default" padding="md" elevation={2} hover className="border-2 border-blue-100">
                <h4 className="text-xl font-bold mb-5 text-primary pb-3 border-b-2 border-blue-100">OpenAPI for REST</h4>
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
              </Card>
              <Card variant="default" padding="md" elevation={2} hover className="border-2 border-blue-100">
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
              </Card>
              <Card variant="default" padding="md" elevation={2} hover className="border-2 border-blue-100">
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
              </Card>
              <Card variant="default" padding="md" elevation={2} hover className="border-2 border-blue-100">
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
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why OSSA - The Problem Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Why Does This Matter?</h2>
            <p className="text-xl text-gray-600">Leading with portability, regulatory compliance, and vendor independence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card variant="default" padding="lg" elevation={1}>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Portability: Avoid Vendor Lock-in</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Switch between AI providers (OpenAI, Anthropic, Azure) without rewriting code. Define your agent once in OSSA format,
                deploy anywhere. No more complete rewrites when changing frameworks.
              </p>
            </Card>
            <Card variant="default" padding="lg" elevation={1}>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Regulatory Compliance: Built-in Frameworks</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Meet SOC2, FedRAMP, HIPAA, and GDPR requirements with standardized security models, audit trails,
                and data boundary controls. Compliance-ready from day one.
              </p>
            </Card>
            <Card variant="default" padding="lg" elevation={1}>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Vendor Independence: True Interoperability</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Community-driven standard, not controlled by any single company. Works with LangChain, CrewAI, AutoGen,
                and any framework. Your agents, your choice.
              </p>
            </Card>
          </div>
          <Card variant="featured" padding="lg" elevation={3}>
            <p className="text-2xl text-gray-900 font-bold mb-4">
              OSSA solves this for AI agents.
            </p>
            <p className="text-xl text-gray-700">
              <strong>One standard. Any framework. True portability.</strong> Define your agent once in OSSA format,
              then deploy it with LangChain, CrewAI, Anthropic, OpenAI, or any other framework. Just like OpenAPI
              unified REST APIs, OSSA unifies AI agents.
            </p>
          </Card>
        </div>
      </section>

      {/* Quick Start Section */}
      <section id="get-started" className="py-20 px-4 bg-gray-50 scroll-mt-20">
        <div className="container mx-auto max-w-[1440px]">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary via-primary to-accent rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-5xl font-bold text-primary">Get Started in Minutes</h2>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Install the CLI, create your first agent, and start building with Open Standard Agents.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <Card variant="default" padding="lg" elevation={2}>
              <CardHeader>
                <CardTitle className="text-primary">1. Install CLI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-code-bg rounded-lg p-3 sm:p-4 overflow-x-auto">
                  <pre className="text-code-text text-xs sm:text-sm whitespace-pre-wrap break-all sm:break-normal sm:whitespace-pre">
                    <code>npm install -g @bluefly/openstandardagents</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
            <Card variant="default" padding="lg" elevation={2}>
              <CardHeader>
                <CardTitle className="text-primary">2. Create Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-code-bg rounded-lg p-3 sm:p-4 overflow-x-auto">
                  <pre className="text-code-text text-xs sm:text-sm whitespace-pre-wrap break-all sm:break-normal sm:whitespace-pre">
                    <code>{`osa init my-agent
cd my-agent`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
            <Card variant="default" padding="lg" elevation={2}>
              <CardHeader>
                <CardTitle className="text-primary">3. Validate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-code-bg rounded-lg p-3 sm:p-4 overflow-x-auto">
                  <pre className="text-code-text text-xs sm:text-sm whitespace-pre-wrap break-all sm:break-normal sm:whitespace-pre">
                    <code>osa validate my-agent.ossa.yaml</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
            <Card variant="default" padding="lg" elevation={2}>
              <CardHeader>
                <CardTitle className="text-primary">4. Export</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-code-bg rounded-lg p-3 sm:p-4 overflow-x-auto">
                  <pre className="text-code-text text-xs sm:text-sm whitespace-pre-wrap break-all sm:break-normal sm:whitespace-pre">
                    <code>{`osa export --to cursor
osa export --to langchain`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link href="/docs/getting-started/5-minute-overview/" className="btn-primary text-lg px-8 py-4">
              Read Full Getting Started Guide
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Matrix Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto max-w-[1440px]">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How OSSA Compares</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              OSSA is a specification standard, not a framework. See how it enables true interoperability.
            </p>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-primary to-secondary text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold">Feature</th>
                  <th className="px-6 py-4 text-center font-bold">OSSA</th>
                  <th className="px-6 py-4 text-center font-bold">LangChain</th>
                  <th className="px-6 py-4 text-center font-bold">AutoGen</th>
                  <th className="px-6 py-4 text-center font-bold">MCP</th>
                  <th className="px-6 py-4 text-center font-bold">Semantic Kernel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Vendor Neutral<br/><span className="text-sm font-normal text-gray-600">Not controlled by any single company</span></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                </tr>
                <tr className="hover:bg-gray-50 bg-blue-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Formal Standard<br/><span className="text-sm font-normal text-gray-600">JSON Schema validated specification</span></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Multi-runtime<br/><span className="text-sm font-normal text-gray-600">Works across Node.js, Python, and more</span></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                </tr>
                <tr className="hover:bg-gray-50 bg-blue-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Enterprise Governance<br/><span className="text-sm font-normal text-gray-600">Built-in audit trails and policy controls</span></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Compliance Ready<br/><span className="text-sm font-normal text-gray-600">SOC2, FedRAMP, HIPAA, GDPR frameworks</span></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></td>
                </tr>
                <tr className="hover:bg-gray-50 bg-blue-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Open Source<br/><span className="text-sm font-normal text-gray-600">Community-driven development</span></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                  <td className="px-6 py-4 text-center"><svg className="w-6 h-6 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            <Card variant="featured" padding="lg" elevation={2}>
              <h3 className="text-xl font-bold mb-4 text-primary">OSSA</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Vendor Neutral</span><span className="text-xl">✅</span></div>
                <div className="flex justify-between"><span>Formal Standard</span><span className="text-xl">✅</span></div>
                <div className="flex justify-between"><span>Multi-runtime</span><span className="text-xl">✅</span></div>
                <div className="flex justify-between"><span>Enterprise Governance</span><span className="text-xl">✅</span></div>
                <div className="flex justify-between"><span>Compliance Ready</span><span className="text-xl">✅</span></div>
                <div className="flex justify-between"><span>Open Source</span><span className="text-xl">✅</span></div>
              </div>
            </Card>
            <Card variant="default" padding="md" elevation={1}>
              <h3 className="text-lg font-bold mb-3">LangChain / AutoGen / Semantic Kernel</h3>
              <p className="text-sm text-gray-600">Framework-specific implementations. Open source but vendor-controlled.</p>
            </Card>
            <Card variant="default" padding="md" elevation={1}>
              <h3 className="text-lg font-bold mb-3">MCP (Model Context Protocol)</h3>
              <p className="text-sm text-gray-600">Formal standard with multi-runtime support. Focused on context, not full agent lifecycle.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Integrations & Adoption Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-[1440px]">
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
        <div className="container mx-auto max-w-[1440px]">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Why Open Standard Agents?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build agent-based systems with confidence, knowing your agents will work across
              frameworks, teams, and infrastructures.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card variant="default" padding="md" elevation={1} hover className="text-center">
              <CardHeader>
                <CardTitle className="text-xl">Framework-Agnostic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Works with LangChain, Anthropic, OpenAI, CrewAI, Langflow, AutoGen, and more.
                  No vendor lock-in.
                </p>
              </CardContent>
            </Card>
            <Card variant="default" padding="md" elevation={1} hover className="text-center">
              <CardHeader>
                <CardTitle className="text-xl">Portable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Move agents between teams, organizations, and infrastructures without rewriting code.
                </p>
              </CardContent>
            </Card>
            <Card variant="default" padding="md" elevation={1} hover className="text-center">
              <CardHeader>
                <CardTitle className="text-xl">Validatable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  JSON Schema validation ensures correctness before deployment. Catch errors early.
                </p>
              </CardContent>
            </Card>
            <Card variant="default" padding="md" elevation={1} hover className="text-center">
              <CardHeader>
                <CardTitle className="text-xl">Well-Documented</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Comprehensive documentation, examples, and tooling. Built for developers, by developers.
                </p>
              </CardContent>
            </Card>
            <Card variant="default" padding="md" elevation={1} hover className="text-center">
              <CardHeader>
                <CardTitle className="text-xl">Open Source</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Apache 2.0 licensed. Community-driven. Transparent development process.
                </p>
              </CardContent>
            </Card>
            <Card variant="default" padding="md" elevation={1} hover className="text-center">
              <CardHeader>
                <CardTitle className="text-xl">Fast Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Export to any framework format. Import existing agents. Seamless migration paths.
                </p>
              </CardContent>
            </Card>
            <Card variant="default" padding="md" elevation={1} hover className="text-center">
              <CardHeader>
                <CardTitle className="text-xl">Secure by Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Built-in security patterns, authentication, and compliance features.
                </p>
              </CardContent>
            </Card>
            <Card variant="default" padding="md" elevation={1} hover className="text-center">
              <CardHeader>
                <CardTitle className="text-xl">Observable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Built-in observability, logging, and monitoring. Track agent performance and behavior.
                </p>
              </CardContent>
            </Card>
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
