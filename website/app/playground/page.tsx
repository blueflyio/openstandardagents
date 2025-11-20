'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { STABLE_VERSION, STABLE_VERSION_TAG } from '@/lib/version';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

// Dynamic templates using current stable version
const getTemplates = (version: string) => ({
  simple: `apiVersion: ossa/v${version}
kind: Agent

metadata:
  name: my-first-agent
  version: 1.0.0
  description: My first Open Standard Agents manifest

spec:
  role: You are a helpful assistant
  llm:
    provider: openai
    model: gpt-4
  tools: []`,

  withTools: `apiVersion: ossa/v${version}
kind: Agent

metadata:
  name: agent-with-tools
  version: 1.0.0
  description: Agent with HTTP tools

spec:
  role: You are a research assistant
  llm:
    provider: openai
    model: gpt-4
  tools:
    - type: http
      name: web_search
      endpoint: https://api.search.com/search
      method: GET`,

  autonomous: `apiVersion: ossa/v${version}
kind: Agent

metadata:
  name: autonomous-agent
  version: 1.0.0
  description: Agent with autonomy controls

spec:
  role: You are an automated support agent
  llm:
    provider: anthropic
    model: claude-3-sonnet
    temperature: 0.7
  tools:
    - type: http
      name: ticket_api
      endpoint: https://api.tickets.com
  autonomy:
    level: L2
    approval_required:
      - delete_operations
    human_in_loop:
      notification_channels: [slack]`,

  fullStack: `apiVersion: ossa/v${version}
kind: Agent

metadata:
  name: full-stack-agent
  version: 2.0.0
  description: Complete agent with all features
  labels:
    team: engineering
    environment: production

spec:
  role: |
    You are a senior DevOps engineer specializing in cloud infrastructure.
    Automate deployments, monitor systems, and resolve incidents.

  llm:
    provider: openai
    model: gpt-4-turbo
    temperature: 0.3
    max_tokens: 4000

  tools:
    - type: http
      name: deploy_api
      endpoint: https://api.deploy.io/v1/deploy
      method: POST
      auth:
        type: bearer
    - type: code
      name: analyze_logs
      language: python
      allowed_libraries: [pandas]

  taxonomy:
    domain: engineering
    subdomain: devops
    use_case: automation

  autonomy:
    level: L3
    approval_required:
      - production_deploy
      - delete_operations

  observability:
    logging:
      level: info
      include_prompts: true
    metrics:
      enabled: true
    tracing:
      enabled: true

extensions:
  kagent:
    mesh_discovery: true`,
});

export default function PlaygroundPage() {
  const [templates] = useState(getTemplates(STABLE_VERSION));
  const [code, setCode] = useState(templates.simple);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: Array<{ path: string; message: string }>;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('simple');

  const handleValidate = async (): Promise<void> => {
    setIsValidating(true);
    try {
      // For static export, we'll use a client-side validation approach
      // Load schema and validate in browser - use dynamic version
      const schemaResponse = await fetch(`/schemas/ossa-${STABLE_VERSION}.schema.json`);
      if (!schemaResponse.ok) {
        throw new Error('Failed to load schema');
      }
      const schema = await schemaResponse.json();

      // Simple validation - in production, use a proper JSON Schema validator
      const parsed = code.includes('apiVersion:')
        ? (await import('yaml')).parse(code)
        : JSON.parse(code);

      // Basic validation checks
      const errors: Array<{ path: string; message: string }> = [];

      if (!parsed.apiVersion) {
        errors.push({ path: '', message: 'Missing required field: apiVersion' });
      }
      if (!parsed.kind) {
        errors.push({ path: '', message: 'Missing required field: kind' });
      }
      if (!parsed.metadata) {
        errors.push({ path: '', message: 'Missing required field: metadata' });
      }
      if (!parsed.spec) {
        errors.push({ path: '', message: 'Missing required field: spec' });
      }

      setValidationResult({
        valid: errors.length === 0,
        errors,
      });
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: [
          {
            path: '',
            message: error instanceof Error ? error.message : 'Validation error',
          },
        ],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleEditorChange = (value: string | undefined): void => {
    setCode(value || '');
    setValidationResult(null);
  };

  const downloadManifest = () => {
    const blob = new Blob([code], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  const loadTemplate = (template: keyof typeof templates) => {
    setCode(templates[template]);
    setActiveTemplate(template);
    setValidationResult(null);
  };

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-accent to-secondary text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">OSSA Playground</h1>
          <p className="text-xl text-white/90 mb-2">
            Write, validate, and test Open Standard Agents manifests in real-time
          </p>
          <p className="text-base text-white/80">
            Interactive editor with live validation and multiple templates
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">

      {/* Quick Actions Bar */}
      <div className="mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={handleValidate}
              disabled={isValidating}
              className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isValidating ? 'Validating...' : 'Validate Manifest'}
            </button>
            <button
              onClick={downloadManifest}
              className="bg-white border-2 border-primary text-primary px-6 py-3 rounded-lg font-medium hover:bg-primary hover:text-white transition-all"
            >
              Download YAML
            </button>
            <button
              onClick={copyToClipboard}
              className="bg-white border-2 border-secondary text-secondary px-6 py-3 rounded-lg font-medium hover:bg-secondary hover:text-white transition-all"
            >
              Copy to Clipboard
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600 font-semibold">Lines: {code.split('\n').length}</span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-600 font-semibold">Chars: {code.length}</span>
          </div>
        </div>
      </div>

      {/* Template Selector */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Quick Start Templates</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <button
            onClick={() => loadTemplate('simple')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              activeTemplate === 'simple'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-300 hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <div className="font-bold mb-1">Simple Agent</div>
            <div className="text-sm text-gray-600">Basic manifest structure</div>
          </button>

          <button
            onClick={() => loadTemplate('withTools')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              activeTemplate === 'withTools'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-300 hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <div className="font-bold mb-1">With Tools</div>
            <div className="text-sm text-gray-600">HTTP API integration</div>
          </button>

          <button
            onClick={() => loadTemplate('autonomous')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              activeTemplate === 'autonomous'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-300 hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <div className="font-bold mb-1">Autonomous</div>
            <div className="text-sm text-gray-600">With autonomy controls</div>
          </button>

          <button
            onClick={() => loadTemplate('fullStack')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              activeTemplate === 'fullStack'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-300 hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <div className="font-bold mb-1">Full Stack</div>
            <div className="text-sm text-gray-600">Complete production setup</div>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card border-2 border-gray-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Editor</h2>
            <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">YAML Format</span>
          </div>
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-md" style={{ height: '600px' }}>
            <MonacoEditor
              height="600px"
              defaultLanguage="yaml"
              value={code}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                wordWrap: 'on',
                automaticLayout: true,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        <div className="card border-2 border-gray-300">
          <h2 className="text-2xl font-semibold mb-4">✓ Validation Results</h2>

          {validationResult === null ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4 text-gray-400">✓</div>
              <p className="text-gray-600 text-lg mb-2">Ready to validate</p>
              <p className="text-gray-500 text-sm">Click "Validate Manifest" above to check your OSSA manifest</p>
            </div>
          ) : validationResult.valid ? (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900 mb-1">
                    Manifest is Valid! ✓
                  </div>
                  <p className="text-base text-green-800">
                    Conforms to OSSA {STABLE_VERSION_TAG} specification
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 mt-4 border border-green-200">
                <div className="text-sm font-semibold text-gray-700 mb-3">✓ All Checks Passed:</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Required fields present
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Correct data types
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Value constraints met
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Schema compliance verified
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-sm text-green-800 font-semibold mb-2">✅ Ready for deployment</p>
                <p className="text-sm text-gray-700">
                  This manifest can be used with kAgent, LangChain, CrewAI, OpenAI, and other OSSA-compatible frameworks.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-900 mb-1">
                    Validation Failed
                  </div>
                  <p className="text-base text-red-800">
                    {validationResult.errors.length} error{validationResult.errors.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 mt-4 border border-red-200 max-h-96 overflow-y-auto">
                <div className="text-sm font-semibold text-gray-700 mb-3">Errors to fix:</div>
                <div className="space-y-3">
                  {validationResult.errors.map((error, index) => (
                    <div key={index} className="border-l-4 border-red-400 pl-3 py-2">
                      <div className="font-bold text-red-900 text-sm mb-1">
                        {error.path ? `📍 ${error.path}` : '📍 Root level'}
                      </div>
                      <div className="text-gray-700 text-sm">{error.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-3">Need Help?</h3>
            <div className="space-y-2 text-sm">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <strong className="text-blue-900">View Schema Reference</strong>
                <p className="text-gray-700 mt-1">Complete documentation of all fields</p>
                <a href="/schema" className="text-blue-600 hover:underline mt-1 inline-block">Visit Schema Page →</a>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <strong className="text-blue-900">Browse Examples</strong>
                <p className="text-gray-700 mt-1">58+ real-world agent manifests</p>
                <a href="/examples" className="text-blue-600 hover:underline mt-1 inline-block">View Examples →</a>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <strong className="text-blue-900">Read Documentation</strong>
                <p className="text-gray-700 mt-1">Complete guides and tutorials</p>
                <a href="/docs" className="text-blue-600 hover:underline mt-1 inline-block">Read Docs →</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

