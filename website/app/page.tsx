import Link from 'next/link';

export default function HomePage(): JSX.Element {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-24 px-4">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              The OpenAPI for AI Agents
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Open Standard Agents
          </h1>
          <p className="text-3xl md:text-4xl mb-6 font-light">
            Industry Standard for Agent Orchestration
          </p>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-4xl mx-auto">
            A vendor-neutral, open specification for defining, deploying, and managing AI agents.
            Just as OpenAPI standardizes REST APIs, Open Standard Agents standardizes agent interoperability
            across frameworks, runtimes, and organizations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/docs/getting-started/installation" className="btn-primary text-lg px-8 py-4">
              Get Started
            </Link>
            <Link href="/playground" className="btn-outline border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4">
              Try Playground
            </Link>
            <Link href="/schema" className="btn-outline border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4">
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

      {/* What is OSSA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">What is Open Standard Agents?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Open Standard Agents (OSA) is an open, vendor-neutral specification for defining AI agents,
              similar to how OpenAPI standardizes REST APIs. It enables interoperability across frameworks,
              runtimes, and organizations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="card-hover p-8">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">Specification Standard</h3>
              <p className="text-gray-700 mb-4">
                OSA is <strong>NOT a framework</strong> - it's a specification that defines the contract
                for agent definition, deployment, and management.
              </p>
              <p className="text-gray-700">
                Just like OpenAPI doesn't implement APIs, OSA doesn't implement agents.
                It provides the standard that implementations follow.
              </p>
            </div>
            <div className="card-hover p-8">
              <div className="text-5xl mb-4">🔌</div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">Framework-Agnostic</h3>
              <p className="text-gray-700 mb-4">
                Works seamlessly with any LLM framework or SDK - LangChain, Anthropic, OpenAI,
                CrewAI, Langflow, AutoGen, and more.
              </p>
              <p className="text-gray-700">
                Deploy to Kubernetes, Docker, serverless, or on-premise. OSA is infrastructure-agnostic.
              </p>
            </div>
            <div className="card-hover p-8">
              <div className="text-5xl mb-4">🌐</div>
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
          <div className="bg-gray-50 rounded-xl p-8 md:p-12 mt-16">
            <h3 className="text-3xl font-bold text-center mb-8">The OpenAPI for Agents</h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div>
                <h4 className="text-xl font-semibold mb-4 text-primary">OpenAPI for REST APIs</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Standardizes REST API contracts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Enables API interoperability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Vendor-neutral specification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>JSON Schema validation</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-4 text-primary">OSA for AI Agents</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Standardizes AI agent contracts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Enables agent interoperability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Vendor-neutral specification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>JSON Schema validation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-20 px-4 bg-gray-50">
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
                  <code>npm install -g @openstandardagents/cli</code>
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
            <Link href="/docs/getting-started/installation" className="btn-primary text-lg px-8 py-4">
              Read Full Installation Guide
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
              <div className="text-5xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-3">Framework-Agnostic</h3>
              <p className="text-gray-700">
                Works with LangChain, Anthropic, OpenAI, CrewAI, Langflow, AutoGen, and more.
                No vendor lock-in.
              </p>
            </div>
            <div className="card-hover p-6 text-center">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-3">Portable</h3>
              <p className="text-gray-700">
                Move agents between teams, organizations, and infrastructures without rewriting code.
              </p>
            </div>
            <div className="card-hover p-6 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-3">Validatable</h3>
              <p className="text-gray-700">
                JSON Schema validation ensures correctness before deployment. Catch errors early.
              </p>
            </div>
            <div className="card-hover p-6 text-center">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-3">Well-Documented</h3>
              <p className="text-gray-700">
                Comprehensive documentation, examples, and tooling. Built for developers, by developers.
              </p>
            </div>
            <div className="card-hover p-6 text-center">
              <div className="text-5xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold mb-3">Open Source</h3>
              <p className="text-gray-700">
                Apache 2.0 licensed. Community-driven. Transparent development process.
              </p>
            </div>
            <div className="card-hover p-6 text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3">Fast Integration</h3>
              <p className="text-gray-700">
                Export to any framework format. Import existing agents. Seamless migration paths.
              </p>
            </div>
            <div className="card-hover p-6 text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-3">Secure by Design</h3>
              <p className="text-gray-700">
                Built-in security patterns, authentication, and compliance features.
              </p>
            </div>
            <div className="card-hover p-6 text-center">
              <div className="text-5xl mb-4">📊</div>
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
            <Link href="/playground" className="btn-secondary bg-white text-primary hover:bg-gray-100">
              Try the Playground
            </Link>
            <Link href="/examples" className="btn-outline border-white text-white hover:bg-white hover:text-primary">
              View Examples
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

