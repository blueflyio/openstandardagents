import Link from 'next/link';
import { SchemaExplorer } from '@/components/schema/SchemaExplorer';
import { STABLE_VERSION, STABLE_VERSION_TAG, getSchemaPath } from '@/lib/version';
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
                <div className="bg-blue-50 border-3 border-blue-400 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-bold text-blue-900 mb-3 text-xl">apiVersion</div>
                  <div className="text-base text-gray-700 font-mono">ossa/v{STABLE_VERSION}</div>
                </div>
                <div className="bg-green-50 border-3 border-green-400 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-bold text-green-900 mb-3 text-xl">kind</div>
                  <div className="text-base text-gray-700 font-mono">Agent</div>
                </div>
                <div className="bg-purple-50 border-3 border-purple-400 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-bold text-purple-900 mb-3 text-xl">metadata</div>
                  <div className="text-sm text-gray-700 space-y-2">
                    <div>• name</div>
                    <div>• version</div>
                    <div>• description</div>
                    <div>• labels</div>
                    <div>• annotations</div>
                  </div>
                </div>
              </div>

              {/* Main Content: spec and extensions - STACKED */}
              <div className="space-y-6">
                {/* spec */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-3 border-primary rounded-xl p-6 shadow-md">
                  <div className="font-bold text-primary text-2xl mb-5">spec</div>
                  <div className="space-y-3">
                    {/* role */}
                    <div className="bg-white rounded-lg p-4 border-2 border-primary/30 shadow-sm hover:shadow-md transition-all hover:border-primary/50">
                      <div className="font-semibold text-primary text-base mb-2 flex items-center">
                        <span className="mr-2">🎭</span> role
                      </div>
                      <div className="text-sm text-gray-700 mb-2">System prompt / identity</div>
                      <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 font-mono">
                        type: string (multi-line)
                      </div>
                    </div>

                    {/* llm */}
                    <div className="bg-white rounded-lg p-4 border-2 border-primary/30 shadow-sm hover:shadow-md transition-all hover:border-primary/50">
                      <div className="font-semibold text-primary text-base mb-3 flex items-center">
                        <span className="mr-2">🧠</span> llm
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                        <div className="bg-blue-50 rounded p-2">
                          <strong>provider</strong>: openai | anthropic | azure
                        </div>
                        <div className="bg-blue-50 rounded p-2">
                          <strong>model</strong>: gpt-4, claude-3, etc.
                        </div>
                        <div className="bg-blue-50 rounded p-2">
                          <strong>temperature</strong>: 0.0 - 2.0
                        </div>
                        <div className="bg-blue-50 rounded p-2">
                          <strong>max_tokens</strong>: integer
                        </div>
                      </div>
                    </div>

                    {/* tools */}
                    <div className="bg-white rounded-lg p-4 border-2 border-primary/30 shadow-sm hover:shadow-md transition-all hover:border-primary/50">
                      <div className="font-semibold text-primary text-base mb-3 flex items-center">
                        <span className="mr-2">🔧</span> tools
                      </div>
                      <div className="text-sm text-gray-700 space-y-2">
                        <div className="bg-purple-50 border border-purple-200 rounded p-2">
                          <strong>http</strong>: REST API calls
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                          <strong>code</strong>: Execute Python/JS/Shell
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <strong>database</strong>: SQL queries
                        </div>
                        <div className="bg-pink-50 border border-pink-200 rounded p-2">
                          <strong>file</strong>: Read/write operations
                        </div>
                        <div className="bg-cyan-50 border border-cyan-200 rounded p-2">
                          <strong>search</strong>: Web/vector search
                        </div>
                      </div>
                    </div>

                    {/* taxonomy */}
                    <div className="bg-white rounded-lg p-4 border-2 border-primary/30 shadow-sm hover:shadow-md transition-all hover:border-primary/50">
                      <div className="font-semibold text-primary text-base mb-3 flex items-center">
                        <span className="mr-2">🏷️</span> taxonomy
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-orange-50 rounded p-2">
                          <strong>domain</strong>: customer_service, engineering, etc.
                        </div>
                        <div className="bg-orange-50 rounded p-2">
                          <strong>subdomain</strong>: technical_support, devops, etc.
                        </div>
                        <div className="bg-orange-50 rounded p-2">
                          <strong>use_case</strong>: troubleshooting, automation
                        </div>
                        <div className="bg-orange-50 rounded p-2">
                          <strong>industry</strong>: saas, healthcare, finance
                        </div>
                      </div>
                    </div>

                    {/* autonomy */}
                    <div className="bg-white rounded-lg p-4 border-2 border-primary/30 shadow-sm hover:shadow-md transition-all hover:border-primary/50">
                      <div className="font-semibold text-primary text-base mb-3 flex items-center">
                        <span className="mr-2">🎯</span> autonomy
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="bg-red-50 border border-red-200 rounded p-2">
                          <strong>level</strong>: L0 (no autonomy) → L5 (full autonomy)
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <strong>approval_required</strong>: Actions needing approval
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                          <strong>human_in_loop</strong>: Notification settings
                        </div>
                      </div>
                    </div>

                    {/* observability */}
                    <div className="bg-white rounded-lg p-4 border-2 border-primary/30 shadow-sm hover:shadow-md transition-all hover:border-primary/50">
                      <div className="font-semibold text-primary text-base mb-3 flex items-center">
                        <span className="mr-2">📊</span> observability
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-indigo-50 rounded p-2 text-center">
                          <div className="font-bold">logging</div>
                          <div className="text-gray-600">Logs & audit</div>
                        </div>
                        <div className="bg-purple-50 rounded p-2 text-center">
                          <div className="font-bold">metrics</div>
                          <div className="text-gray-600">Performance</div>
                        </div>
                        <div className="bg-pink-50 rounded p-2 text-center">
                          <div className="font-bold">tracing</div>
                          <div className="text-gray-600">Execution paths</div>
                        </div>
                      </div>
                    </div>

                    {/* constraints (additional) */}
                    <div className="bg-white rounded-lg p-4 border-2 border-primary/30 shadow-sm hover:shadow-md transition-all hover:border-primary/50">
                      <div className="font-semibold text-primary text-base mb-3 flex items-center">
                        <span className="mr-2">⚠️</span> constraints
                        <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Optional</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-red-50 rounded p-2">
                          <strong>cost</strong>: Budget limits
                        </div>
                        <div className="bg-yellow-50 rounded p-2">
                          <strong>performance</strong>: Timeout, rate limits
                        </div>
                        <div className="bg-blue-50 rounded p-2">
                          <strong>resources</strong>: Memory, CPU caps
                        </div>
                        <div className="bg-green-50 rounded p-2">
                          <strong>security</strong>: Access controls
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* extensions */}
                <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-3 border-secondary rounded-xl p-6 shadow-md">
                  <div className="font-bold text-secondary text-2xl mb-4">extensions</div>
                  <div className="text-base text-gray-800 mb-4 font-semibold">Framework-specific configs:</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• kAgent</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• BuildKit</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• LangChain</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• CrewAI</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• OpenAI</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• Anthropic</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• Cursor</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• Langflow</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• AutoGen</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• Vercel AI</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• LlamaIndex</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• LangGraph</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• Drupal</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• LibreChat</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow">• MCP</div>
                    <div className="bg-white rounded-lg px-3 py-2.5 border-2 border-secondary/30 shadow-sm hover:shadow-md transition-shadow text-center col-span-2 font-semibold">+ 10 more frameworks</div>
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
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border-2 border-blue-300">
            <h3 className="text-2xl font-bold mb-8 text-center text-gray-900">Complete Agent Lifecycle</h3>

            <div className="space-y-6">
              {/* Step 1: Developer */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg w-full max-w-md text-center">
                  <div className="text-lg font-bold mb-2">👨‍💻 Developer</div>
                  <div className="text-base">Writes OSSA Manifest</div>
                  <div className="text-sm mt-2 opacity-90">agent.yaml</div>
                </div>
                <div className="w-1 h-12 bg-gradient-to-b from-purple-500 to-blue-500"></div>
              </div>

              {/* Step 2: Validation */}
              <div className="flex flex-col items-center">
                <div className="grid md:grid-cols-2 gap-4 w-full max-w-4xl">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                    <div className="text-lg font-bold mb-2">🔍 OSSA Schema Validator</div>
                    <div className="text-sm opacity-90">JSON Schema validation engine</div>
                  </div>
                  <div className="bg-white border-2 border-blue-400 rounded-xl p-6 shadow-md">
                    <div className="text-base font-bold text-blue-900 mb-3">Validation Checks:</div>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div>✓ Required fields present</div>
                      <div>✓ Correct types</div>
                      <div>✓ Value constraints</div>
                      <div>✓ Schema compliance</div>
                    </div>
                  </div>
                </div>
                <div className="w-1 h-12 bg-gradient-to-b from-blue-500 to-green-500"></div>
                <div className="bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-md">
                  ✓ Valid Manifest
                </div>
                <div className="w-1 h-12 bg-gradient-to-b from-green-500 to-orange-500"></div>
              </div>

              {/* Step 3: Framework Adapter Layer */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg w-full max-w-3xl text-center">
                  <div className="text-xl font-bold mb-2">⚙️ Framework Adapter Layer</div>
                  <div className="text-base opacity-90">Converts OSSA → Framework-Specific Config</div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <div className="w-1 h-12 bg-gradient-to-b from-orange-500 to-indigo-500"></div>
                  <div className="w-1 h-12 bg-gradient-to-b from-orange-500 to-purple-500"></div>
                  <div className="w-1 h-12 bg-gradient-to-b from-orange-500 to-pink-500"></div>
                  <div className="w-1 h-12 bg-gradient-to-b from-orange-500 to-cyan-500"></div>
                </div>
              </div>

              {/* Step 4: Runtimes */}
              <div className="flex flex-col items-center">
                <div className="grid md:grid-cols-4 gap-4 w-full max-w-5xl">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-5 shadow-lg text-center">
                    <div className="text-base font-bold mb-2">🚀 kAgent</div>
                    <div className="text-xs opacity-90">Runtime</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5 shadow-lg text-center">
                    <div className="text-base font-bold mb-2">🔗 LangChain</div>
                    <div className="text-xs opacity-90">Runtime</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl p-5 shadow-lg text-center">
                    <div className="text-base font-bold mb-2">👥 CrewAI</div>
                    <div className="text-xs opacity-90">Runtime</div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-xl p-5 shadow-lg text-center">
                    <div className="text-base font-bold mb-2">🤖 OpenAI</div>
                    <div className="text-xs opacity-90">Runtime</div>
                  </div>
                </div>
                <div className="flex justify-center mt-4 space-x-2">
                  <div className="w-1 h-12 bg-gradient-to-b from-indigo-500 to-teal-500"></div>
                  <div className="w-1 h-12 bg-gradient-to-b from-purple-500 to-teal-500"></div>
                  <div className="w-1 h-12 bg-gradient-to-b from-pink-500 to-teal-500"></div>
                  <div className="w-1 h-12 bg-gradient-to-b from-cyan-500 to-teal-500"></div>
                </div>
              </div>

              {/* Step 5: Agent Execution */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl p-6 shadow-lg w-full max-w-2xl">
                  <div className="text-xl font-bold mb-4 text-center">⚡ Agent Execution</div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                      <div className="font-bold mb-1">🧠 LLM Calls</div>
                      <div className="text-xs opacity-90">GPT-4, Claude, etc.</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                      <div className="font-bold mb-1">🔧 Tool Usage</div>
                      <div className="text-xs opacity-90">APIs, Code, DB</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                      <div className="font-bold mb-1">📋 Task Processing</div>
                      <div className="text-xs opacity-90">Execute workflows</div>
                    </div>
                  </div>
                </div>
                <div className="w-1 h-12 bg-gradient-to-b from-teal-500 to-amber-500"></div>
              </div>

              {/* Step 6: Observability */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl p-6 shadow-lg w-full max-w-2xl">
                  <div className="text-xl font-bold mb-4 text-center">📊 Observability</div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                      <div className="font-bold mb-1">📝 Logs</div>
                      <div className="text-xs opacity-90">Debug & audit</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                      <div className="font-bold mb-1">📈 Metrics</div>
                      <div className="text-xs opacity-90">Performance data</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                      <div className="font-bold mb-1">🔍 Traces</div>
                      <div className="text-xs opacity-90">Execution paths</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Components Breakdown */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-primary">Schema Components</h2>
          </div>

          <div className="grid gap-6">
            {/* apiVersion & kind */}
            <div className="card p-6 border-l-4 border-primary hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-2xl">🔖</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary mb-3">apiVersion & kind</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHAT:</p>
                      <p className="text-gray-700">Version identifier and resource type for the manifest.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHY:</p>
                      <p className="text-gray-700">Enables schema evolution while maintaining backward compatibility. Like Kubernetes resources or OpenAPI specs, agents can evolve without breaking existing definitions.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">EXAMPLE:</p>
                      <div className="bg-code-bg rounded-lg p-3 mt-2">
                        <pre className="text-code-text text-sm"><code>{`apiVersion: ossa/v${STABLE_VERSION}
kind: Agent`}</code></pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* metadata */}
            <div className="card p-6 border-l-4 border-secondary hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-secondary mb-3">metadata</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHAT:</p>
                      <p className="text-gray-700">Identification and classification information: name, version, description, labels, annotations.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHY:</p>
                      <p className="text-gray-700">
                        <strong>Discovery:</strong> Find agents by name/labels in catalogs.<br/>
                        <strong>Versioning:</strong> Track changes over time.<br/>
                        <strong>Organization:</strong> Group agents by team, project, environment.<br/>
                        <strong>Documentation:</strong> Human-readable descriptions and URLs.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">EXAMPLE:</p>
                      <div className="bg-code-bg rounded-lg p-3 mt-2">
                        <pre className="text-code-text text-sm"><code>{`metadata:
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
                </div>
              </div>
            </div>

            {/* spec.role */}
            <div className="card p-6 border-l-4 border-primary hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-2xl">🎭</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary mb-3">spec.role</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHAT:</p>
                      <p className="text-gray-700">The system prompt / role definition that guides the agent's behavior and personality.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHY:</p>
                      <p className="text-gray-700">
                        Defines <strong>who</strong> the agent is, <strong>what</strong> it can do, and <strong>how</strong> it should behave.
                        This is the agent's identity and primary instruction set that shapes all interactions.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">EXAMPLE:</p>
                      <div className="bg-code-bg rounded-lg p-3 mt-2">
                        <pre className="text-code-text text-sm"><code>{`spec:
  role: |
    You are a senior software architect specializing in distributed systems.
    Your role is to review code for scalability, security, and best practices.
    You provide constructive feedback with specific examples and recommendations.
    You communicate in a professional but friendly tone.`}</code></pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* spec.llm */}
            <div className="card p-6 border-l-4 border-secondary hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-2xl">🧠</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-secondary mb-3">spec.llm</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHAT:</p>
                      <p className="text-gray-700">LLM provider configuration: model, temperature, max_tokens, top_p, and other parameters.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHY:</p>
                      <p className="text-gray-700">
                        <strong>Portability:</strong> Switch from OpenAI to Anthropic without changing agent logic.<br/>
                        <strong>Optimization:</strong> Tune temperature for creativity vs consistency.<br/>
                        <strong>Cost Control:</strong> Set token limits and choose appropriate model sizes.<br/>
                        <strong>Quality:</strong> Configure sampling parameters for best results.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">EXAMPLE:</p>
                      <div className="bg-code-bg rounded-lg p-3 mt-2">
                        <pre className="text-code-text text-sm"><code>{`spec:
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
                </div>
              </div>
            </div>

            {/* spec.tools */}
            <div className="card p-6 border-l-4 border-primary hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-2xl">🔧</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary mb-3">spec.tools</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHAT:</p>
                      <p className="text-gray-700">Array of tools/functions the agent can call: HTTP APIs, code execution, database queries, file operations, etc.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHY:</p>
                      <p className="text-gray-700">
                        Agents need to <strong>take action</strong>, not just respond with text. Tools enable agents to:
                        interact with APIs, query databases, run code, search the web, manipulate files, and integrate with external systems.
                        Standardizing tool definitions ensures portability across frameworks.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">TYPES:</p>
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
                      <p className="font-semibold text-gray-900 mb-1">EXAMPLE:</p>
                      <div className="bg-code-bg rounded-lg p-3 mt-2">
                        <pre className="text-code-text text-sm"><code>{`spec:
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
                </div>
              </div>
            </div>

            {/* spec.taxonomy */}
            <div className="card p-6 border-l-4 border-secondary hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-2xl">🏷️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-secondary mb-3">spec.taxonomy</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHAT:</p>
                      <p className="text-gray-700">Classification of agent purpose: domain, subdomain, use_case, and industry.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHY:</p>
                      <p className="text-gray-700">
                        <strong>Discoverability:</strong> Find agents for specific use cases in catalogs.<br/>
                        <strong>Organization:</strong> Group similar agents together.<br/>
                        <strong>Routing:</strong> Automatically route tasks to appropriate agents.<br/>
                        <strong>Analytics:</strong> Track agent usage by domain/industry.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">EXAMPLE:</p>
                      <div className="bg-code-bg rounded-lg p-3 mt-2">
                        <pre className="text-code-text text-sm"><code>{`spec:
  taxonomy:
    domain: customer_service
    subdomain: technical_support
    use_case: troubleshooting
    industry: saas
    tags: [support, automation, tier1]`}</code></pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* spec.autonomy */}
            <div className="card p-6 border-l-4 border-primary hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary mb-3">spec.autonomy</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHAT:</p>
                      <p className="text-gray-700">Defines how much independence the agent has: level (L0-L5), approval_required, human_in_loop settings.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHY:</p>
                      <p className="text-gray-700">
                        <strong>Safety:</strong> Prevent agents from taking destructive actions without oversight.<br/>
                        <strong>Compliance:</strong> Require approvals for regulated operations.<br/>
                        <strong>Trust:</strong> Gradually increase autonomy as agents prove reliable.<br/>
                        <strong>Audit:</strong> Track which actions required human approval.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">LEVELS:</p>
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
                      <p className="font-semibold text-gray-900 mb-1">EXAMPLE:</p>
                      <div className="bg-code-bg rounded-lg p-3 mt-2">
                        <pre className="text-code-text text-sm"><code>{`spec:
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
                </div>
              </div>
            </div>

            {/* spec.observability */}
            <div className="card p-6 border-l-4 border-secondary hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-secondary mb-3">spec.observability</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHAT:</p>
                      <p className="text-gray-700">Logging, metrics, and tracing configuration for monitoring agent behavior.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHY:</p>
                      <p className="text-gray-700">
                        <strong>Debugging:</strong> Understand what went wrong when agents fail.<br/>
                        <strong>Performance:</strong> Track response times, token usage, costs.<br/>
                        <strong>Quality:</strong> Monitor success rates and user satisfaction.<br/>
                        <strong>Compliance:</strong> Audit trails for regulated industries.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">EXAMPLE:</p>
                      <div className="bg-code-bg rounded-lg p-3 mt-2">
                        <pre className="text-code-text text-sm"><code>{`spec:
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
                </div>
              </div>
            </div>

            {/* extensions */}
            <div className="card p-6 border-l-4 border-primary hover:shadow-xl transition-shadow">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-2xl">🔌</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary mb-3">extensions</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHAT:</p>
                      <p className="text-gray-700">Framework-specific configuration blocks: kagent, buildkit, langchain, crewai, openai, anthropic, cursor, langflow, autogen, etc.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WHY:</p>
                      <p className="text-gray-700">
                        While OSSA provides a <strong>common core</strong>, each framework has unique features. Extensions allow you to:
                        leverage framework-specific capabilities, maintain compatibility with existing code, and gradually migrate from proprietary formats.
                        <strong className="block mt-2">The core spec ensures portability. Extensions provide power.</strong>
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">SUPPORTED FRAMEWORKS (15+):</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-blue-50 p-2 rounded text-sm">• kAgent</div>
                        <div className="bg-purple-50 p-2 rounded text-sm">• LangChain</div>
                        <div className="bg-green-50 p-2 rounded text-sm">• CrewAI</div>
                        <div className="bg-orange-50 p-2 rounded text-sm">• OpenAI Agents</div>
                        <div className="bg-pink-50 p-2 rounded text-sm">• Anthropic Claude</div>
                        <div className="bg-yellow-50 p-2 rounded text-sm">• Cursor</div>
                        <div className="bg-red-50 p-2 rounded text-sm">• Langflow</div>
                        <div className="bg-indigo-50 p-2 rounded text-sm">• AutoGen</div>
                        <div className="bg-teal-50 p-2 rounded text-sm">• Vercel AI</div>
                        <div className="bg-cyan-50 p-2 rounded text-sm">• LlamaIndex</div>
                        <div className="bg-lime-50 p-2 rounded text-sm">• LangGraph</div>
                        <div className="bg-amber-50 p-2 rounded text-sm">• BuildKit</div>
                        <div className="bg-blue-100 p-2 rounded text-sm">• Drupal</div>
                        <div className="bg-purple-100 p-2 rounded text-sm">• LibreChat</div>
                        <div className="bg-green-100 p-2 rounded text-sm">• MCP</div>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">EXAMPLE:</p>
                      <div className="bg-code-bg rounded-lg p-3 mt-2">
                        <pre className="text-code-text text-sm"><code>{`extensions:
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
                </div>
              </div>
            </div>
          </div>
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
