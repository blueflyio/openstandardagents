import Link from 'next/link';
import type { Metadata } from 'next';
import { STABLE_VERSION_TAG, STABLE_VERSION } from '@/lib/version';

export const metadata: Metadata = {
  title: 'Specification - Open Standard Agents',
  description: 'The complete Open Standard Agents specification documentation.',
};

export default function SpecificationPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">Open Standard Agents Specification</h1>
        <p className="text-xl text-gray-600 mb-12">
          The complete technical specification for defining, validating, and deploying AI agents.
        </p>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 text-primary">Current Version</h2>
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-semibold mb-2">{STABLE_VERSION_TAG}</h3>
                <p className="text-gray-700">Latest stable release</p>
              </div>
              <Link href="/schema" className="btn-primary">
                View Schema
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="font-semibold mb-2">Release Date</h4>
                <p className="text-gray-700">November 2024</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <span className="inline-block px-3 py-1 bg-success/20 text-success rounded-full text-sm font-medium">
                  Stable
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 text-primary">Specification Structure</h2>
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-3 text-primary">1. Core Specification</h3>
              <p className="text-gray-700 mb-4">
                The fundamental structure of an OSA agent manifest, including metadata, specification,
                and extensions.
              </p>
              <Link href="/docs/getting-started/first-agent" className="text-primary hover:underline">
                Read Core Specification →
              </Link>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-3 text-primary">2. Schema Reference</h3>
              <p className="text-gray-700 mb-4">
                Complete JSON Schema definition with all properties, types, constraints, and validation rules.
              </p>
              <Link href="/schema" className="text-primary hover:underline">
                Explore Schema →
              </Link>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-3 text-primary">3. Platform Extensions</h3>
              <p className="text-gray-700 mb-4">
                Framework-specific extensions for Cursor, OpenAI, CrewAI, LangChain, Anthropic,
                Langflow, AutoGen, and more.
              </p>
              <Link href="/docs/examples/migration-guides" className="text-primary hover:underline">
                View Extensions →
              </Link>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-3 text-primary">4. Validation Rules</h3>
              <p className="text-gray-700 mb-4">
                Comprehensive validation rules, error messages, and best practices for creating valid agent manifests.
              </p>
              <Link href="/playground" className="text-primary hover:underline">
                Try Validation →
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 text-primary">Key Concepts</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-primary">Agent Manifest</h3>
              <p className="text-gray-700 mb-2">
                A YAML or JSON file that describes an AI agent, including its role, LLM configuration,
                tools, and deployment requirements.
              </p>
              <div className="bg-code-bg rounded-lg p-4 mt-3">
                <pre className="text-code-text text-sm overflow-x-auto">
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

            <div>
              <h3 className="text-xl font-semibold mb-2 text-primary">Schema Validation</h3>
              <p className="text-gray-700">
                Every agent manifest must conform to the OSA JSON Schema. Validation ensures correctness,
                completeness, and compatibility before deployment.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-primary">Platform Extensions</h3>
              <p className="text-gray-700">
                Framework-specific extensions allow agents to leverage platform-specific features while
                maintaining core OSA compatibility.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-primary">Export/Import</h3>
              <p className="text-gray-700">
                Convert OSA manifests to framework-specific formats (export) or import existing agents
                into OSA format for standardization.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 text-primary">Version History</h2>
          <div className="space-y-4">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold">v0.2.3</h3>
                <span className="px-3 py-1 bg-success/20 text-success rounded-full text-sm font-medium">
                  Current
                </span>
              </div>
              <p className="text-gray-700 mb-2">November 2024</p>
              <p className="text-gray-700">
                Enhanced platform extensions, improved validation, and expanded tool support.
              </p>
            </div>

            <div className="card p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold">v0.2.2</h3>
                <span className="px-3 py-1 bg-gray-500/20 text-gray-700 rounded-full text-sm font-medium">
                  Previous
                </span>
              </div>
              <p className="text-gray-700 mb-2">October 2024</p>
              <p className="text-gray-700">
                Initial platform extensions and improved schema structure.
              </p>
            </div>

            <div className="card p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold">v0.1.9</h3>
                <span className="px-3 py-1 bg-gray-500/20 text-gray-700 rounded-full text-sm font-medium">
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
          <h2 className="text-3xl font-semibold mb-6 text-primary">Resources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/schema" className="card-hover p-6">
              <h3 className="text-xl font-semibold mb-2 text-primary">Interactive Schema Explorer</h3>
              <p className="text-gray-700">Explore the complete JSON Schema interactively.</p>
            </Link>
            <Link href="/playground" className="card-hover p-6">
              <h3 className="text-xl font-semibold mb-2 text-primary">Validation Playground</h3>
              <p className="text-gray-700">Test and validate your agent manifests in real-time.</p>
            </Link>
            <Link href="/examples" className="card-hover p-6">
              <h3 className="text-xl font-semibold mb-2 text-primary">Examples Gallery</h3>
              <p className="text-gray-700">Browse real-world examples and use cases.</p>
            </Link>
            <Link href="/docs" className="card-hover p-6">
              <h3 className="text-xl font-semibold mb-2 text-primary">Full Documentation</h3>
              <p className="text-gray-700">Comprehensive guides and tutorials.</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

