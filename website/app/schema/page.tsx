import Link from 'next/link';
import { SchemaExplorer } from '@/components/schema/SchemaExplorer';
import { SchemaComponentsAccordion } from '@/components/schema/SchemaComponentsAccordion';
import { STABLE_VERSION, STABLE_VERSION_TAG, getSchemaPath } from '@/lib/version';
import { Logo } from '@/components/Logo';
import fs from 'fs';
import path from 'path';

// Try to load schema dynamically - fallback to stable version
function loadSchema(version: string = STABLE_VERSION): any {
  try {
    // Try to load from public/schemas first
    const publicSchemaPath = path.join(process.cwd(), 'public', 'schemas', `ossa-${version}.schema.json`);
    if (fs.existsSync(publicSchemaPath)) {
      return JSON.parse(fs.readFileSync(publicSchemaPath, 'utf8'));
    }
    
    // Fallback to spec directory
    const specSchemaPath = path.join(process.cwd(), '..', 'spec', `v${version}`, `ossa-${version}.schema.json`);
    if (fs.existsSync(specSchemaPath)) {
      return JSON.parse(fs.readFileSync(specSchemaPath, 'utf8'));
    }
    
    // Final fallback - try to require (for build time)
    try {
      return require(`../../public/schemas/ossa-${version}.schema.json`);
    } catch {
      // If all else fails, return null
      return null;
    }
  } catch (error) {
    console.error('Error loading schema:', error);
    return null;
  }
}

export default function SchemaPage() {
  const schema = loadSchema();

  if (!schema) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Schema Explorer</h1>
        <p className="text-lg text-gray-600">
          Schema file not found. Please ensure the OSSA schema is available.
        </p>
      </div>
    );
  }

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
          <h1 className="text-5xl font-bold mb-4">OSSA Schema Reference</h1>
          <p className="text-xl text-white/90 mb-2">
            Complete JSON Schema for defining portable, framework-agnostic AI agents
          </p>
          <p className="text-lg text-white/80">
            Version {STABLE_VERSION_TAG} • The OpenAPI for AI Agents
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Schema Architecture Diagram - MOVED TO TOP */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl p-8 mb-8">
            <div className="flex items-start mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4 text-gray-900">Why This Schema?</h2>
                <div className="space-y-4 text-lg text-gray-700">
                  <p>
                    <strong className="text-primary">The Problem:</strong> Every AI framework defines agents differently.
                    LangChain has "chains," CrewAI has "crews," OpenAI has "assistants," Anthropic has different tools.
                    This creates <span className="text-red-600 font-semibold">vendor lock-in</span> and makes it impossible to share agents between teams or frameworks.
                  </p>
                  <p>
                    <strong className="text-secondary">The Solution:</strong> OSSA provides a single, standard way to describe agents that works everywhere.
                    Like OpenAPI revolutionized REST APIs, OSSA revolutionizes AI agents.
                  </p>
                  <p>
                    <strong className="text-primary">The Result:</strong> Write your agent definition once, deploy it to any framework.
                    Switch providers without rewriting code. Share agents across organizations. True portability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Schema Architecture Diagram */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Schema Architecture</h2>
          </div>

          {/* Visual Structure Diagram with HTML/CSS */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-gray-300">
            <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">OSSA Agent Manifest Structure</h3>
            <p className="text-center text-gray-600 mb-8 text-base">
              Complete breakdown of all manifest components and their relationships
            </p>

            <div className="space-y-6">
              {/* Root */}
              <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-6 text-center shadow-md">
                <div className="font-bold text-2xl mb-2">OSSA Agent Manifest</div>
                <div className="text-base opacity-90">agent.yaml / agent.json</div>
              </div>

              {/* Top Level Fields */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-blue-50/50 border-2 border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-bold text-gray-900 mb-2 text-xl">apiVersion</div>
                  <div className="text-base text-gray-600 mb-3">Specifies the OSSA specification version</div>
                  <div className="text-lg text-gray-800 font-mono">ossa/v{STABLE_VERSION}</div>
                </div>
                <div className="bg-green-50/50 border-2 border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-bold text-gray-900 mb-2 text-xl">kind</div>
                  <div className="text-base text-gray-600 mb-3">Resource type identifier that specifies what type of OSSA resource this manifest defines.</div>
                  <div className="text-lg text-gray-800 font-mono mb-3">Agent</div>
                  <div className="text-sm text-gray-700 space-y-2 pt-3 border-t border-green-200">
                    <p><strong className="text-gray-900">Agent</strong> is the primary resource type in OSSA. An Agent represents an autonomous AI system that can:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                      <li>Process natural language instructions</li>
                      <li>Make decisions and take actions</li>
                      <li>Use tools and interact with external systems</li>
                      <li>Maintain context and state across interactions</li>
                    </ul>
                    <p className="text-gray-600">Think of an Agent as a reusable, portable definition of an AI assistant that can be deployed to any framework.</p>
                  </div>
                </div>
                <div className="bg-purple-50/50 border-2 border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-bold text-gray-900 mb-2 text-xl">metadata</div>
                  <div className="text-base text-gray-600 mb-3">Agent identification and labeling</div>
                  <div className="text-base text-gray-700 space-y-1.5 mt-3">
                    <div>• name - Unique agent identifier</div>
                    <div>• version - Agent version number</div>
                    <div>• description - Human-readable description</div>
                    <div>• labels - Key-value metadata tags</div>
                    <div>• annotations - Additional metadata</div>
                  </div>
                </div>
              </div>

              {/* Main Content: spec and extensions - STACKED */}
              <div className="space-y-6">
                {/* spec */}
                <div className="bg-gradient-to-br from-blue-50/30 to-indigo-50/30 border-2 border-blue-200 rounded-xl p-6 shadow-md">
                  <div className="font-bold text-primary text-2xl mb-3">spec</div>
                  <div className="text-base text-gray-700 mb-6">Core agent configuration including behavior, capabilities, and operational settings.</div>
                  <div className="space-y-3">
                    {/* role */}
                    <div className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <div className="font-bold text-gray-900 text-lg mb-2">role</div>
                      <div className="text-base text-gray-700 mb-3">Defines the agent's system prompt and identity. This is the core instruction that tells the agent who it is and how it should behave.</div>
                      <div className="text-sm text-gray-600 bg-gray-50 rounded p-3 font-mono border border-gray-200">
                        type: string (multi-line)
                      </div>
                    </div>

                    {/* llm */}
                    <div className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <div className="font-bold text-gray-900 text-lg mb-2">llm</div>
                      <div className="text-base text-gray-700 mb-4">Configuration for the Large Language Model that powers the agent's reasoning and responses.</div>
                      <div className="grid grid-cols-2 gap-3 text-base text-gray-700">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <strong className="text-gray-900">provider</strong>
                          <div className="text-sm text-gray-600 mt-1">openai | anthropic | azure</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <strong className="text-gray-900">model</strong>
                          <div className="text-sm text-gray-600 mt-1">gpt-4, claude-3, etc.</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <strong className="text-gray-900">temperature</strong>
                          <div className="text-sm text-gray-600 mt-1">0.0 - 2.0 (creativity level)</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <strong className="text-gray-900">max_tokens</strong>
                          <div className="text-sm text-gray-600 mt-1">Maximum response length</div>
                        </div>
                      </div>
                    </div>

                    {/* tools */}
                    <div className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <div className="font-bold text-gray-900 text-lg mb-2">tools</div>
                      <div className="text-base text-gray-700 mb-4">Capabilities the agent can use to interact with external systems and perform actions.</div>
                      <div className="text-base text-gray-700 space-y-2.5">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <strong className="text-gray-900">http</strong>
                          <div className="text-sm text-gray-600 mt-1">Make REST API calls to external services</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <strong className="text-gray-900">code</strong>
                          <div className="text-sm text-gray-600 mt-1">Execute Python, JavaScript, or Shell scripts</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <strong className="text-gray-900">database</strong>
                          <div className="text-sm text-gray-600 mt-1">Run SQL queries against databases</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <strong className="text-gray-900">file</strong>
                          <div className="text-sm text-gray-600 mt-1">Read and write file system operations</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <strong className="text-gray-900">search</strong>
                          <div className="text-sm text-gray-600 mt-1">Web search and vector similarity search</div>
                        </div>
                      </div>
                    </div>

                    {/* taxonomy */}
                    <div className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <div className="font-bold text-gray-900 text-lg mb-2">taxonomy</div>
                      <div className="text-base text-gray-700 mb-4">Categorization metadata for organizing and discovering agents across domains and use cases.</div>
                      <div className="grid grid-cols-2 gap-3 text-base">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <strong className="text-gray-900">domain</strong>
                          <div className="text-sm text-gray-600 mt-1">customer_service, engineering, etc.</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <strong className="text-gray-900">subdomain</strong>
                          <div className="text-sm text-gray-600 mt-1">technical_support, devops, etc.</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <strong className="text-gray-900">use_case</strong>
                          <div className="text-sm text-gray-600 mt-1">troubleshooting, automation</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <strong className="text-gray-900">industry</strong>
                          <div className="text-sm text-gray-600 mt-1">saas, healthcare, finance</div>
                        </div>
                      </div>
                    </div>

                    {/* autonomy */}
                    <div className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <div className="font-bold text-gray-900 text-lg mb-2">autonomy</div>
                      <div className="text-base text-gray-700 mb-4">Controls how independently the agent can operate, from fully manual (L0) to fully autonomous (L5).</div>
                      <div className="space-y-2.5 text-base">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <strong className="text-gray-900">level</strong>
                          <div className="text-sm text-gray-600 mt-1">L0 (no autonomy) → L5 (full autonomy)</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <strong className="text-gray-900">approval_required</strong>
                          <div className="text-sm text-gray-600 mt-1">List of actions that require human approval before execution</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <strong className="text-gray-900">human_in_loop</strong>
                          <div className="text-sm text-gray-600 mt-1">Notification and escalation settings for human oversight</div>
                        </div>
                      </div>
                    </div>

                    {/* observability */}
                    <div className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <div className="font-bold text-gray-900 text-lg mb-2">observability</div>
                      <div className="text-base text-gray-700 mb-4">Monitoring and debugging capabilities for tracking agent behavior and performance.</div>
                      <div className="grid grid-cols-3 gap-3 text-base">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
                          <div className="font-bold text-gray-900">logging</div>
                          <div className="text-sm text-gray-600 mt-1">Logs & audit trails</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
                          <div className="font-bold text-gray-900">metrics</div>
                          <div className="text-sm text-gray-600 mt-1">Performance data</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
                          <div className="font-bold text-gray-900">tracing</div>
                          <div className="text-sm text-gray-600 mt-1">Execution paths</div>
                        </div>
                      </div>
                    </div>

                    {/* constraints (additional) */}
                    <div className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <div className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
                        constraints
                        <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded font-normal">Optional</span>
                      </div>
                      <div className="text-base text-gray-700 mb-4">Resource limits and operational boundaries to ensure safe and controlled agent execution.</div>
                      <div className="grid grid-cols-2 gap-3 text-base">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <strong className="text-gray-900">cost</strong>
                          <div className="text-sm text-gray-600 mt-1">Budget and spending limits</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <strong className="text-gray-900">performance</strong>
                          <div className="text-sm text-gray-600 mt-1">Timeout and rate limiting</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <strong className="text-gray-900">resources</strong>
                          <div className="text-sm text-gray-600 mt-1">Memory and CPU constraints</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <strong className="text-gray-900">security</strong>
                          <div className="text-sm text-gray-600 mt-1">Access control and permissions</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* extensions */}
                <div className="bg-gradient-to-br from-purple-50/30 to-pink-50/30 border-2 border-purple-200 rounded-xl p-6 shadow-md">
                  <div className="font-bold text-secondary text-2xl mb-3">extensions</div>
                  <div className="text-base text-gray-700 mb-6">Optional framework-specific configurations that extend the core OSSA specification for platform-specific features.</div>
                  <div className="text-base text-gray-800 mb-6 font-semibold">Supported frameworks:</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <Logo domain="kagent.dev" name="kAgent" />
                    <Logo domain="langchain.com" name="LangChain" />
                    <Logo domain="crewai.com" name="CrewAI" />
                    <Logo domain="openai.com" name="OpenAI" />
                    <Logo domain="anthropic.com" name="Anthropic" />
                    <Logo domain="cursor.sh" name="Cursor" />
                    <Logo domain="langflow.com" name="Langflow" />
                    <Logo domain="microsoft.com" name="AutoGen" />
                    <Logo domain="vercel.com" name="Vercel AI" />
                    <Logo domain="llamaindex.ai" name="LlamaIndex" />
                    <Logo domain="langchain.com" name="LangGraph" />
                    <Logo domain="drupal.org" name="Drupal" />
                    <Logo domain="librechat.com" name="LibreChat" />
                    <Logo domain="modelcontextprotocol.io" name="MCP" />
                    <Logo domain="huggingface.co" name="Hugging Face" />
                    <Logo domain="google.com" name="Google" />
                    <Logo domain="aws.amazon.com" name="AWS" />
                    <Logo domain="azure.com" name="Azure" />
                    <Logo domain="github.com" name="GitHub" />
                    <Logo domain="docker.com" name="Docker" />
                    <Logo domain="kubernetes.io" name="Kubernetes" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Flow Diagram */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary to-primary rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-secondary">Data Flow: How OSSA Works</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Flow 1: Agent Definition to Execution */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold mb-4 text-primary">1. Definition → Execution</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs space-y-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">1</div>
                  <div>
                    <div className="font-semibold">Write agent.yaml</div>
                    <div className="text-gray-600">Define role, LLM, tools</div>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-primary h-4"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">2</div>
                  <div>
                    <div className="font-semibold">Validate schema</div>
                    <div className="text-gray-600">JSON Schema validation</div>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-secondary h-4"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">3</div>
                  <div>
                    <div className="font-semibold">Load into runtime</div>
                    <div className="text-gray-600">kAgent / LangChain / etc</div>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-primary h-4"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">4</div>
                  <div>
                    <div className="font-semibold">Execute agent</div>
                    <div className="text-gray-600">Run tasks, call LLM, use tools</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow 2: Cross-Framework Portability */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold mb-4 text-secondary">2. Cross-Framework Portability</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs space-y-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">A</div>
                  <div>
                    <div className="font-semibold">agent.yaml (OSSA)</div>
                    <div className="text-gray-600">Framework-agnostic definition</div>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-dashed border-primary h-4"></div>
                <div className="text-center text-gray-500 font-bold">↓ Export to ↓</div>
                <div className="ml-4 border-l-2 border-dashed border-primary h-4"></div>
                <div className="space-y-2">
                  <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-500">
                    <strong>LangChain</strong>: chains.json
                  </div>
                  <div className="bg-purple-50 p-2 rounded border-l-2 border-purple-500">
                    <strong>CrewAI</strong>: crew_config.yaml
                  </div>
                  <div className="bg-green-50 p-2 rounded border-l-2 border-green-500">
                    <strong>OpenAI</strong>: assistant_config.json
                  </div>
                  <div className="bg-orange-50 p-2 rounded border-l-2 border-orange-500">
                    <strong>Anthropic</strong>: claude_tools.json
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Data Flow Diagram - Clean HTML/CSS Version */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-gray-300">
            <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">Complete Agent Lifecycle</h3>
            <p className="text-center text-gray-600 mb-8 text-base">From development to deployment across any framework</p>

            <div className="space-y-6">
              {/* Step 1: Developer */}
              <div className="flex flex-col items-center">
                <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-md w-full max-w-md text-center">
                  <div className="text-lg font-bold mb-2 text-gray-900">Developer</div>
                  <div className="text-base text-gray-700">Writes OSSA Manifest</div>
                  <div className="text-sm mt-2 text-gray-600 font-mono">agent.yaml</div>
                </div>
                <div className="w-0.5 h-12 bg-gray-300"></div>
              </div>

              {/* Step 2: Validation */}
              <div className="flex flex-col items-center">
                <div className="grid md:grid-cols-2 gap-4 w-full max-w-4xl">
                  <div className="bg-gray-800 text-white rounded-xl p-6 shadow-lg">
                    <div className="text-lg font-bold mb-2">OSSA Schema Validator</div>
                    <div className="text-sm opacity-90">JSON Schema validation engine</div>
                  </div>
                  <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-md">
                    <div className="text-base font-bold text-gray-900 mb-3">Validation Checks:</div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>Required fields present</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>Correct types</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>Value constraints</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>Schema compliance</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-0.5 h-12 bg-gray-300"></div>
                <div className="bg-gray-800 text-white px-6 py-2 rounded-full font-bold shadow-md">
                  Valid Manifest
                </div>
                <div className="w-0.5 h-12 bg-gray-300"></div>
              </div>

              {/* Step 3: Framework Adapter Layer */}
              <div className="flex flex-col items-center">
                <div className="bg-gray-800 text-white rounded-xl p-6 shadow-lg w-full max-w-3xl text-center">
                  <div className="text-xl font-bold mb-2">Framework Adapter Layer</div>
                  <div className="text-base opacity-90">Converts OSSA → Framework-Specific Config</div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <div className="w-0.5 h-12 bg-gray-300"></div>
                  <div className="w-0.5 h-12 bg-gray-300"></div>
                  <div className="w-0.5 h-12 bg-gray-300"></div>
                  <div className="w-0.5 h-12 bg-gray-300"></div>
                </div>
              </div>

              {/* Step 4: Runtimes */}
              <div className="flex flex-col items-center">
                <div className="grid md:grid-cols-4 gap-4 w-full max-w-5xl">
                  <div className="bg-white border-2 border-gray-300 rounded-xl p-5 shadow-md text-center">
                    <div className="text-base font-bold mb-2 text-gray-900">kAgent</div>
                    <div className="text-xs text-gray-600">Runtime</div>
                  </div>
                  <div className="bg-white border-2 border-gray-300 rounded-xl p-5 shadow-md text-center">
                    <div className="text-base font-bold mb-2 text-gray-900">LangChain</div>
                    <div className="text-xs text-gray-600">Runtime</div>
                  </div>
                  <div className="bg-white border-2 border-gray-300 rounded-xl p-5 shadow-md text-center">
                    <div className="text-base font-bold mb-2 text-gray-900">CrewAI</div>
                    <div className="text-xs text-gray-600">Runtime</div>
                  </div>
                  <div className="bg-white border-2 border-gray-300 rounded-xl p-5 shadow-md text-center">
                    <div className="text-base font-bold mb-2 text-gray-900">OpenAI</div>
                    <div className="text-xs text-gray-600">Runtime</div>
                  </div>
                </div>
                <div className="flex justify-center mt-4 space-x-2">
                  <div className="w-0.5 h-12 bg-gray-300"></div>
                  <div className="w-0.5 h-12 bg-gray-300"></div>
                  <div className="w-0.5 h-12 bg-gray-300"></div>
                  <div className="w-0.5 h-12 bg-gray-300"></div>
                </div>
              </div>

              {/* Step 5: Agent Execution */}
              <div className="flex flex-col items-center">
                <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-md w-full max-w-2xl">
                  <div className="text-xl font-bold mb-4 text-center text-gray-900">Agent Execution</div>
                  <div className="grid grid-cols-3 gap-3 text-base">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <div className="font-bold mb-1 text-gray-900">LLM Calls</div>
                      <div className="text-sm text-gray-600">GPT-4, Claude, etc.</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <div className="font-bold mb-1 text-gray-900">Tool Usage</div>
                      <div className="text-sm text-gray-600">APIs, Code, DB</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <div className="font-bold mb-1 text-gray-900">Task Processing</div>
                      <div className="text-sm text-gray-600">Execute workflows</div>
                    </div>
                  </div>
                </div>
                <div className="w-0.5 h-12 bg-gray-300"></div>
              </div>

              {/* Step 6: Observability */}
              <div className="flex flex-col items-center">
                <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-md w-full max-w-2xl">
                  <div className="text-xl font-bold mb-4 text-center text-gray-900">Observability</div>
                  <div className="grid grid-cols-3 gap-3 text-base">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <div className="font-bold mb-1 text-gray-900">Logs</div>
                      <div className="text-sm text-gray-600">Debug & audit</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <div className="font-bold mb-1 text-gray-900">Metrics</div>
                      <div className="text-sm text-gray-600">Performance data</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <div className="font-bold mb-1 text-gray-900">Traces</div>
                      <div className="text-sm text-gray-600">Execution paths</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Components Breakdown */}
        <section className="mb-16">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Schema Components</h2>
          </div>

          <p className="text-lg text-gray-700 mb-8 max-w-4xl">
            The OSSA schema is organized into core components that define every aspect of an AI agent.
            Each component serves a specific purpose in creating portable, framework-agnostic agent definitions.
            Click on any component below to learn more about its structure, purpose, and usage.
          </p>

          <SchemaComponentsAccordion
            items={[
              {
                id: 'apiversion-kind',
                title: 'apiVersion & kind',
                borderColor: 'border-primary',
                content: (
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHAT:</p>
                      <p className="text-gray-700">Version identifier and resource type for the manifest.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHY:</p>
                      <p className="text-gray-700">Enables schema evolution while maintaining backward compatibility. Like Kubernetes resources or OpenAPI specs, agents can evolve without breaking existing definitions.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">EXAMPLE:</p>
                      <div className="bg-gray-900 rounded-lg p-4 mt-2">
                        <pre className="text-green-400 text-sm font-mono"><code>{`apiVersion: ossa/v${STABLE_VERSION}
kind: Agent`}</code></pre>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: 'metadata',
                title: 'metadata',
                borderColor: 'border-secondary',
                content: (
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHAT:</p>
                      <p className="text-gray-700">Identification and classification information: name, version, description, labels, annotations.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHY:</p>
                      <p className="text-gray-700">
                        <strong>Discovery:</strong> Find agents by name/labels in catalogs.<br/>
                        <strong>Versioning:</strong> Track changes over time.<br/>
                        <strong>Organization:</strong> Group agents by team, project, environment.<br/>
                        <strong>Documentation:</strong> Human-readable descriptions and URLs.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">EXAMPLE:</p>
                      <div className="bg-gray-900 rounded-lg p-4 mt-2">
                        <pre className="text-green-400 text-sm font-mono"><code>{`metadata:
  name: customer-support-agent
  version: 2.1.0
  description: Handles tier-1 support tickets with sentiment analysis
  labels:
    team: support
    environment: production
  annotations:
    docs: https://docs.example.com/agents/support
    owner: support-team@example.com`}</code></pre>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: 'spec-role',
                title: 'spec.role',
                borderColor: 'border-primary',
                content: (
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHAT:</p>
                      <p className="text-gray-700">The system prompt / role definition that guides the agent's behavior and personality.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHY:</p>
                      <p className="text-gray-700">
                        Defines <strong>who</strong> the agent is, <strong>what</strong> it can do, and <strong>how</strong> it should behave.
                        This is the agent's identity and primary instruction set that shapes all interactions.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">EXAMPLE:</p>
                      <div className="bg-gray-900 rounded-lg p-4 mt-2">
                        <pre className="text-green-400 text-sm font-mono"><code>{`spec:
  role: |
    You are a senior software architect specializing in distributed systems.
    Your role is to review code for scalability, security, and best practices.
    You provide constructive feedback with specific examples and recommendations.
    You communicate in a professional but friendly tone.`}</code></pre>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: 'spec-llm',
                title: 'spec.llm',
                borderColor: 'border-secondary',
                content: (
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHAT:</p>
                      <p className="text-gray-700">LLM provider configuration: model, temperature, max_tokens, top_p, and other parameters.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHY:</p>
                      <p className="text-gray-700">
                        <strong>Portability:</strong> Switch from OpenAI to Anthropic without changing agent logic.<br/>
                        <strong>Optimization:</strong> Tune temperature for creativity vs consistency.<br/>
                        <strong>Cost Control:</strong> Set token limits and choose appropriate model sizes.<br/>
                        <strong>Quality:</strong> Configure sampling parameters for best results.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">EXAMPLE:</p>
                      <div className="bg-gray-900 rounded-lg p-4 mt-2">
                        <pre className="text-green-400 text-sm font-mono"><code>{`spec:
  llm:
    provider: openai
    model: gpt-4-turbo
    temperature: 0.7
    max_tokens: 2000
    top_p: 0.9
    frequency_penalty: 0.0
    presence_penalty: 0.6`}</code></pre>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: 'spec-tools',
                title: 'spec.tools',
                borderColor: 'border-primary',
                content: (
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHAT:</p>
                      <p className="text-gray-700">Array of tools/functions the agent can call: HTTP APIs, code execution, database queries, file operations, etc.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHY:</p>
                      <p className="text-gray-700">
                        Agents need to <strong>take action</strong>, not just respond with text. Tools enable agents to:
                        interact with APIs, query databases, run code, search the web, manipulate files, and integrate with external systems.
                        Standardizing tool definitions ensures portability across frameworks.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">TYPES:</p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                        <li><strong>http:</strong> REST API calls</li>
                        <li><strong>code:</strong> Execute Python/JS/etc</li>
                        <li><strong>database:</strong> SQL queries</li>
                        <li><strong>file:</strong> Read/write files</li>
                        <li><strong>search:</strong> Web/vector search</li>
                        <li><strong>custom:</strong> Framework-specific tools</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">EXAMPLE:</p>
                      <div className="bg-gray-900 rounded-lg p-4 mt-2">
                        <pre className="text-green-400 text-sm font-mono"><code>{`spec:
  tools:
    - type: http
      name: search_issues
      endpoint: https://api.github.com/search/issues
      method: GET
      auth:
        type: bearer
        token: \${GITHUB_TOKEN}

    - type: code
      name: analyze_logs
      language: python
      allowed_libraries: [pandas, numpy]`}</code></pre>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: 'spec-taxonomy',
                title: 'spec.taxonomy',
                borderColor: 'border-secondary',
                content: (
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHAT:</p>
                      <p className="text-gray-700">Classification of agent purpose: domain, subdomain, use_case, and industry.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHY:</p>
                      <p className="text-gray-700">
                        <strong>Discoverability:</strong> Find agents for specific use cases in catalogs.<br/>
                        <strong>Organization:</strong> Group similar agents together.<br/>
                        <strong>Routing:</strong> Automatically route tasks to appropriate agents.<br/>
                        <strong>Analytics:</strong> Track agent usage by domain/industry.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">EXAMPLE:</p>
                      <div className="bg-gray-900 rounded-lg p-4 mt-2">
                        <pre className="text-green-400 text-sm font-mono"><code>{`spec:
  taxonomy:
    domain: customer_service
    subdomain: technical_support
    use_case: troubleshooting
    industry: saas
    tags: [support, automation, tier1]`}</code></pre>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: 'spec-autonomy',
                title: 'spec.autonomy',
                borderColor: 'border-primary',
                content: (
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHAT:</p>
                      <p className="text-gray-700">Defines how much independence the agent has: level (L0-L5), approval_required, human_in_loop settings.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHY:</p>
                      <p className="text-gray-700">
                        <strong>Safety:</strong> Prevent agents from taking destructive actions without oversight.<br/>
                        <strong>Compliance:</strong> Require approvals for regulated operations.<br/>
                        <strong>Trust:</strong> Gradually increase autonomy as agents prove reliable.<br/>
                        <strong>Audit:</strong> Track which actions required human approval.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">LEVELS:</p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                        <li><strong>L0:</strong> No autonomy (human controls everything)</li>
                        <li><strong>L1:</strong> Suggestions only (human approves all actions)</li>
                        <li><strong>L2:</strong> Conditional autonomy (human approves risky actions)</li>
                        <li><strong>L3:</strong> High autonomy (human approves critical actions)</li>
                        <li><strong>L4:</strong> Full autonomy (human notified of actions)</li>
                        <li><strong>L5:</strong> Complete autonomy (no human oversight)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">EXAMPLE:</p>
                      <div className="bg-gray-900 rounded-lg p-4 mt-2">
                        <pre className="text-green-400 text-sm font-mono"><code>{`spec:
  autonomy:
    level: L2
    approval_required:
      - delete_operations
      - financial_transactions
      - user_data_access
    human_in_loop:
      notification_channels: [slack, email]
      timeout_seconds: 300`}</code></pre>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: 'spec-observability',
                title: 'spec.observability',
                borderColor: 'border-secondary',
                content: (
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHAT:</p>
                      <p className="text-gray-700">Logging, metrics, and tracing configuration for monitoring agent behavior.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHY:</p>
                      <p className="text-gray-700">
                        <strong>Debugging:</strong> Understand what went wrong when agents fail.<br/>
                        <strong>Performance:</strong> Track response times, token usage, costs.<br/>
                        <strong>Quality:</strong> Monitor success rates and user satisfaction.<br/>
                        <strong>Compliance:</strong> Audit trails for regulated industries.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">EXAMPLE:</p>
                      <div className="bg-gray-900 rounded-lg p-4 mt-2">
                        <pre className="text-green-400 text-sm font-mono"><code>{`spec:
  observability:
    logging:
      level: info
      include_prompts: true
      include_responses: true
    metrics:
      enabled: true
      export_to: prometheus
    tracing:
      enabled: true
      provider: opentelemetry
      sample_rate: 1.0`}</code></pre>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: 'extensions',
                title: 'extensions',
                borderColor: 'border-primary',
                content: (
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHAT:</p>
                      <p className="text-gray-700">Framework-specific configuration blocks: kagent, buildkit, langchain, crewai, openai, anthropic, cursor, langflow, autogen, etc.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">WHY:</p>
                      <p className="text-gray-700">
                        While OSSA provides a <strong>common core</strong>, each framework has unique features. Extensions allow you to:
                        leverage framework-specific capabilities, maintain compatibility with existing code, and gradually migrate from proprietary formats.
                        <strong className="block mt-2">The core spec ensures portability. Extensions provide power.</strong>
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">EXAMPLE:</p>
                      <div className="bg-gray-900 rounded-lg p-4 mt-2">
                        <pre className="text-green-400 text-sm font-mono"><code>{`extensions:
  kagent:
    mesh_discovery: true
    routing_strategy: round_robin

  langchain:
    memory_type: conversation_buffer_window
    memory_window_size: 5

  openai_agents:
    code_interpreter: true
    file_search: true`}</code></pre>
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </section>

        {/* Interactive Schema Explorer */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Interactive Schema Explorer</h2>
          </div>
          <p className="text-lg text-gray-700 mb-6">
            Explore the complete JSON Schema interactively. Click on any property to see its type, description, and validation rules.
          </p>
          <SchemaExplorer schema={schema} />
        </section>

        {/* Next Steps */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Ready to Build Agents?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/playground" className="card-hover p-6 text-center border-l-4 border-primary hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-3">🎮</div>
                <h3 className="text-xl font-semibold text-primary mb-2">Try the Playground</h3>
                <p className="text-gray-700">Write and validate your first agent manifest</p>
              </Link>
              <Link href="/examples" className="card-hover p-6 text-center border-l-4 border-secondary hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-3">📚</div>
                <h3 className="text-xl font-semibold text-secondary mb-2">Browse Examples</h3>
                <p className="text-gray-700">See 58+ real-world agent definitions</p>
              </Link>
              <Link href="/docs" className="card-hover p-6 text-center border-l-4 border-primary hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-3">📖</div>
                <h3 className="text-xl font-semibold text-primary mb-2">Read the Docs</h3>
                <p className="text-gray-700">Comprehensive guides and tutorials</p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
