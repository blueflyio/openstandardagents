'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { STABLE_VERSION, STABLE_VERSION_TAG } from '@/lib/version';
import { validateManifest, ValidationResult } from '@/lib/validate';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-400 text-sm">Loading editor...</p>
      </div>
    </div>
  ),
});

// Available schema versions for validation
const SCHEMA_VERSIONS = [
  { value: STABLE_VERSION, label: `v${STABLE_VERSION} (Latest Stable)` },
  { value: '0.2.9', label: 'v0.2.9' },
  { value: '0.2.8', label: 'v0.2.8' },
];

// Example manifest interface
interface Example {
  name: string;
  path: string;
  content: string;
  category: string;
}

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
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('simple');
  const [selectedVersion, setSelectedVersion] = useState(SCHEMA_VERSIONS[0].value);
  const [autoValidate, setAutoValidate] = useState(true);
  const [examples, setExamples] = useState<Example[]>([]);
  const [showExamples, setShowExamples] = useState(false);
  const [format, setFormat] = useState<'yaml' | 'json'>('yaml');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load examples on mount
  useEffect(() => {
    const loadExamples = async () => {
      try {
        const res = await fetch('/examples.json');
        const data = await res.json();
        if (Array.isArray(data)) {
          setExamples(data);
        }
      } catch {
        // Failed to load examples - use empty array
      }
    };
    loadExamples();
  }, []);

  const handleValidate = useCallback(async (silent = false): Promise<void> => {
    if (!silent) setIsValidating(true);
    try {
      const result = await validateManifest(code, { version: selectedVersion });
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: [
          {
            path: '',
            message: error instanceof Error ? error.message : 'Validation error',
          },
        ],
        warnings: []
      });
    } finally {
      if (!silent) setIsValidating(false);
    }
  }, [code, selectedVersion]);

  // Debounced auto-validation
  useEffect(() => {
    if (!autoValidate) return;

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      handleValidate(true);
    }, 800);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [code, autoValidate, selectedVersion, handleValidate]);


  const handleEditorChange = (value: string | undefined): void => {
    setCode(value || '');
    if (!autoValidate) {
      setValidationResult(null);
    }
  };

  const downloadManifest = async () => {
    const ext = format === 'json' ? 'json' : 'yaml';
    let content = code;

    // Convert to JSON if needed
    if (format === 'json' && !code.trim().startsWith('{')) {
      try {
        const yamlModule = await import('yaml');
        const yaml = yamlModule.default || yamlModule;
        const parsed = yaml.parse(code);
        content = JSON.stringify(parsed, null, 2);
      } catch {
        // Keep original if conversion fails
      }
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    // Show brief feedback
    const btn = document.getElementById('copy-btn');
    if (btn) {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1500);
    }
  };

  const loadTemplate = (template: keyof typeof templates) => {
    setCode(templates[template]);
    setActiveTemplate(template);
    setValidationResult(null);
    setShowExamples(false);
  };

  const loadExample = (example: Example) => {
    setCode(example.content);
    setActiveTemplate('');
    setShowExamples(false);
    setValidationResult(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);
      setActiveTemplate('');
      setValidationResult(null);
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertFormat = async () => {
    try {
      if (format === 'yaml') {
        // Convert YAML to JSON
        const yamlModule = await import('yaml');
        const yaml = yamlModule.default || yamlModule;
        const parsed = yaml.parse(code);
        setCode(JSON.stringify(parsed, null, 2));
        setFormat('json');
      } else {
        // Convert JSON to YAML
        const yamlModule = await import('yaml');
        const yaml = yamlModule.default || yamlModule;
        const parsed = JSON.parse(code);
        setCode(yaml.stringify(parsed));
        setFormat('yaml');
      }
    } catch (error) {
      alert(`Conversion failed: ${error instanceof Error ? error.message : 'Invalid format'}`);
    }
  };

  // Get line number from JSON path
  const getLineFromPath = (path: string): number | null => {
    if (!path || path === '/') return null;
    const lines = code.split('\n');
    const searchKey = path.split('/').pop();
    if (!searchKey) return null;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`${searchKey}:`)) {
        return i + 1;
      }
    }
    return null;
  };

  // Group examples by category
  const examplesByCategory = examples.reduce((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = [];
    acc[ex.category].push(ex);
    return acc;
  }, {} as Record<string, Example[]>);

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-secondary via-primary to-accent text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-2">OSSA Playground</h1>
          <p className="text-lg text-white/90">
            Write, validate, and test Open Standard Agents manifests with real-time schema validation
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">

        {/* Main Controls */}
        <div className="mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Validate Button */}
              <button
                onClick={() => handleValidate(false)}
                disabled={isValidating}
                className="bg-gradient-to-r from-secondary via-primary to-accent text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Validating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Validate
                  </>
                )}
              </button>

              {/* Version Selector */}
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium bg-white hover:border-primary/50 transition-all"
              >
                {SCHEMA_VERSIONS.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>

              {/* Auto-validate Toggle */}
              <label className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary/50 transition-all">
                <input
                  type="checkbox"
                  checked={autoValidate}
                  onChange={(e) => setAutoValidate(e.target.checked)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-sm font-medium">Auto-validate</span>
              </label>

              {/* Format Toggle */}
              <button
                onClick={convertFormat}
                className="border-2 border-gray-300 bg-white text-gray-700 px-3 py-2 rounded-lg font-medium hover:border-primary/50 hover:bg-gray-50 transition-all text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                {format === 'yaml' ? 'YAML → JSON' : 'JSON → YAML'}
              </button>
            </div>

            <div className="flex gap-2 items-center">
              {/* File Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".yaml,.yml,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-gray-300 bg-white text-gray-700 px-3 py-2 rounded-lg font-medium hover:border-primary/50 hover:bg-gray-50 transition-all text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </button>

              {/* Download */}
              <button
                onClick={downloadManifest}
                className="border-2 border-primary text-primary px-3 py-2 rounded-lg font-medium hover:bg-primary hover:text-white transition-all text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>

              {/* Copy */}
              <button
                id="copy-btn"
                onClick={copyToClipboard}
                className="border-2 border-secondary text-secondary px-3 py-2 rounded-lg font-medium hover:bg-secondary hover:text-white transition-all text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              <strong>{code.split('\n').length}</strong> lines
            </span>
            <span className="text-sm text-gray-600">
              <strong>{code.length}</strong> chars
            </span>
            <span className="text-sm text-gray-600">
              Format: <strong>{format.toUpperCase()}</strong>
            </span>
            {validationResult && (
              <span className={`text-sm font-medium ${validationResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                {validationResult.valid ? '✓ Valid' : `✗ ${validationResult.errors.length} error${validationResult.errors.length !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        </div>

        {/* Templates & Examples Row */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Quick Start</h2>
            <button
              onClick={() => setShowExamples(!showExamples)}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                showExamples
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showExamples ? 'Hide Examples' : `Browse ${examples.length} Examples`}
            </button>
          </div>

          {/* Templates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { key: 'simple', name: 'Simple Agent', desc: 'Basic structure' },
              { key: 'withTools', name: 'With Tools', desc: 'HTTP integration' },
              { key: 'autonomous', name: 'Autonomous', desc: 'Autonomy controls' },
              { key: 'fullStack', name: 'Full Stack', desc: 'Production ready' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => loadTemplate(t.key as keyof typeof templates)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  activeTemplate === t.key
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-gray-500">{t.desc}</div>
              </button>
            ))}
          </div>

          {/* Examples Browser */}
          {showExamples && examples.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 max-h-64 overflow-y-auto">
              <div className="grid gap-4">
                {Object.entries(examplesByCategory).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">{category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {items.slice(0, 10).map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => loadExample(ex)}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:border-primary hover:text-primary transition-all"
                        >
                          {ex.name.replace(/\.(yaml|yml|json)$/, '')}
                        </button>
                      ))}
                      {items.length > 10 && (
                        <span className="px-2 py-1 text-xs text-gray-400">+{items.length - 10} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Editor & Results */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Editor</h2>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded font-medium">{format.toUpperCase()}</span>
            </div>
            <div style={{ height: '550px' }}>
              <MonacoEditor
                height="550px"
                defaultLanguage="yaml"
                language={format}
                value={code}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  renderWhitespace: 'selection',
                }}
              />
            </div>
          </div>

          {/* Validation Results */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Validation Results</h2>
              {validationResult?.schemaVersion && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                  Schema v{validationResult.schemaVersion}
                </span>
              )}
            </div>

            <div className="p-4" style={{ height: '510px', overflowY: 'auto' }}>
              {validationResult === null ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4 text-gray-300">⌘</div>
                    <p className="text-gray-500 text-lg mb-2">Ready to validate</p>
                    <p className="text-gray-400 text-sm">
                      {autoValidate ? 'Start typing to see results' : 'Click "Validate" to check your manifest'}
                    </p>
                  </div>
                </div>
              ) : validationResult.valid ? (
                <div className="space-y-4">
                  {/* Success Header */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-900">Valid Manifest</div>
                        <p className="text-sm text-green-700">
                          Conforms to OSSA {STABLE_VERSION_TAG} specification
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checks */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-sm font-semibold text-gray-700 mb-3">Validation Checks</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        'Required fields present',
                        'Correct data types',
                        'Valid enum values',
                        'Schema compliance',
                      ].map((check, i) => (
                        <div key={i} className="flex items-center gap-2 text-gray-700">
                          <span className="text-green-500">✓</span>
                          {check}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warnings */}
                  {validationResult.warnings && validationResult.warnings.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="text-sm font-semibold text-amber-800 mb-2">
                        ⚠️ Recommendations ({validationResult.warnings.length})
                      </div>
                      <div className="space-y-2">
                        {validationResult.warnings.map((warning, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-amber-500 mt-0.5">⚠</span>
                            <div>
                              {warning.path && warning.path !== '/' && (
                                <code className="text-amber-700 bg-amber-100 px-1 rounded text-xs mr-1">
                                  {warning.path}
                                </code>
                              )}
                              <span className="text-gray-700">{warning.message}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ready message */}
                  <div className="text-center py-4 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Ready for deployment with kAgent, LangChain, CrewAI, and more
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Error Header */}
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-900">Validation Failed</div>
                        <p className="text-sm text-red-700">
                          {validationResult.errors.length} error{validationResult.errors.length !== 1 ? 's' : ''} found
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error List */}
                  <div className="space-y-2">
                    {validationResult.errors.map((error, i) => {
                      const lineNum = getLineFromPath(error.path);
                      return (
                        <div key={i} className="bg-white border border-red-200 rounded-lg p-3 hover:border-red-300 transition-all">
                          <div className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">✗</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {error.path && error.path !== '/' && (
                                  <code className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded text-xs font-mono">
                                    {error.path}
                                  </code>
                                )}
                                {lineNum && (
                                  <span className="text-xs text-gray-400">Line {lineNum}</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-800 mt-1">{error.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Warnings (even on error) */}
                  {validationResult.warnings && validationResult.warnings.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="text-xs font-semibold text-amber-700 mb-1">
                        Also: {validationResult.warnings.length} recommendation{validationResult.warnings.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Link href="/schema" className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-primary/50 hover:shadow-md transition-all group">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Schema Reference</h3>
            <p className="text-sm text-gray-600 mt-1">Complete field documentation</p>
          </Link>
          <Link href="/examples" className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-primary/50 hover:shadow-md transition-all group">
            <div className="text-2xl mb-2">📚</div>
            <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Browse Examples</h3>
            <p className="text-sm text-gray-600 mt-1">{examples.length}+ real-world manifests</p>
          </Link>
          <Link href="/docs" className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-primary/50 hover:shadow-md transition-all group">
            <div className="text-2xl mb-2">📖</div>
            <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Documentation</h3>
            <p className="text-sm text-gray-600 mt-1">Guides and tutorials</p>
          </Link>
        </div>
      </div>
    </>
  );
}
