import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - Open Standard Agents Initiative',
  description: 'Learn about the Open Standard Agents Initiative - the vendor-neutral specification for AI agent orchestration.',
};

export default function AboutPage(): JSX.Element {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">About Open Standard Agents</h1>
        
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-4 text-primary">The Initiative</h2>
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

        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-4 text-primary">Our Mission</h2>
          <p className="text-lg text-gray-700 mb-4">
            To create a vendor-neutral, open specification that enables:
          </p>
          <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 mb-4">
            <li>Interoperability between different AI agent frameworks and runtimes</li>
            <li>Portability of agent definitions across teams and organizations</li>
            <li>Standardization of agent metadata, tools, and capabilities</li>
            <li>Validation and verification of agent definitions before deployment</li>
            <li>Tooling and ecosystem development around agent specifications</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-4 text-primary">What We Are</h2>
          <div className="card p-6 mb-4">
            <h3 className="text-xl font-semibold mb-2 text-primary">✅ A Specification</h3>
            <p className="text-gray-700">
              OSA defines a standard format for describing AI agents, their capabilities, tools, and deployment requirements.
            </p>
          </div>
          <div className="card p-6 mb-4">
            <h3 className="text-xl font-semibold mb-2 text-primary">✅ Open Source</h3>
            <p className="text-gray-700">
              Licensed under Apache 2.0. Free to use, modify, and distribute. Community-driven development.
            </p>
          </div>
          <div className="card p-6 mb-4">
            <h3 className="text-xl font-semibold mb-2 text-primary">✅ Vendor-Neutral</h3>
            <p className="text-gray-700">
              No single vendor controls the specification. Governed by the community and technical steering committee.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-4 text-primary">What We Are NOT</h2>
          <div className="card p-6 mb-4 bg-gray-50">
            <h3 className="text-xl font-semibold mb-2 text-gray-700">❌ A Framework</h3>
            <p className="text-gray-700">
              OSA does not implement agents. It defines the specification that frameworks follow.
            </p>
          </div>
          <div className="card p-6 mb-4 bg-gray-50">
            <h3 className="text-xl font-semibold mb-2 text-gray-700">❌ A Runtime</h3>
            <p className="text-gray-700">
              OSA does not execute agents. It describes agents that runtimes can execute.
            </p>
          </div>
          <div className="card p-6 mb-4 bg-gray-50">
            <h3 className="text-xl font-semibold mb-2 text-gray-700">❌ Proprietary</h3>
            <p className="text-gray-700">
              OSA is not owned by any single company. It's maintained by the open source community.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-4 text-primary">Governance</h2>
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

        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-4 text-primary">Get Involved</h2>
          <p className="text-lg text-gray-700 mb-6">
            Join the Open Standard Agents community and help shape the future of agent interoperability:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="https://gitlab.bluefly.io/llm/openstandardagents" target="_blank" rel="noopener noreferrer" className="card-hover p-6">
              <h3 className="text-xl font-semibold mb-2 text-primary">Contribute Code</h3>
              <p className="text-gray-700">Submit pull requests, report issues, and help improve the specification.</p>
            </Link>
            <Link href="/docs" className="card-hover p-6">
              <h3 className="text-xl font-semibold mb-2 text-primary">Improve Documentation</h3>
              <p className="text-gray-700">Help make OSA more accessible with better docs and examples.</p>
            </Link>
            <Link href="/examples" className="card-hover p-6">
              <h3 className="text-xl font-semibold mb-2 text-primary">Share Examples</h3>
              <p className="text-gray-700">Contribute real-world examples and use cases.</p>
            </Link>
            <Link href="https://gitlab.bluefly.io/llm/openstandardagents/-/issues" target="_blank" rel="noopener noreferrer" className="card-hover p-6">
              <h3 className="text-xl font-semibold mb-2 text-primary">Provide Feedback</h3>
              <p className="text-gray-700">Share your experience and help prioritize features.</p>
            </Link>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-4 text-primary">License</h2>
          <p className="text-lg text-gray-700 mb-4">
            The Open Standard Agents Specification is licensed under the{' '}
            <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Apache License 2.0
            </a>.
          </p>
          <p className="text-lg text-gray-700">
            This means you are free to use, modify, and distribute OSA in your projects,
            both open source and commercial, without restrictions.
          </p>
        </section>
      </div>
    </div>
  );
}

