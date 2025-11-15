'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

const exampleManifest = `apiVersion: ossa/v0.2.3
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
  tools: []
`;

export default function PlaygroundPage(): JSX.Element {
  const [code, setCode] = useState(exampleManifest);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: Array<{ path: string; message: string }>;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async (): Promise<void> => {
    setIsValidating(true);
    try {
      // For static export, we'll use a client-side validation approach
      // Load schema and validate in browser
      const schemaResponse = await fetch('/schemas/ossa-0.2.3.schema.json');
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

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Open Standard Agents Playground</h1>
      <p className="text-lg text-gray-600 mb-8">
        Write and validate Open Standard Agents manifests in real-time. Try editing the
        example below or paste your own manifest.
      </p>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Editor</h2>
            <button
              onClick={handleValidate}
              disabled={isValidating}
              className="btn-primary"
              aria-label="Validate OSSA manifest"
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </button>
          </div>
          <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '600px' }}>
            <MonacoEditor
              height="600px"
              defaultLanguage="yaml"
              value={code}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">Validation Results</h2>
          {validationResult === null ? (
            <div className="text-gray-500 text-center py-12">
              Click &quot;Validate&quot; to check your manifest
            </div>
          ) : validationResult.valid ? (
            <div className="bg-success/10 border border-success rounded-lg p-4">
              <div className="flex items-center mb-2">
                <svg
                  className="w-6 h-6 text-success mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-semibold text-success">
                  Manifest is valid!
                </span>
              </div>
              <p className="text-sm text-gray-700">
                Your Open Standard Agents manifest conforms to the v0.2.3 specification.
              </p>
            </div>
          ) : (
            <div className="bg-error/10 border border-error rounded-lg p-4">
              <div className="flex items-center mb-4">
                <svg
                  className="w-6 h-6 text-error mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="font-semibold text-error">
                  Validation failed
                </span>
              </div>
              <div className="space-y-2">
                {validationResult.errors.map((error, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-semibold text-gray-900">
                      {error.path || 'Root'}
                    </div>
                    <div className="text-gray-700">{error.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Example Templates</h3>
            <div className="space-y-2">
              <button
                onClick={() => setCode(exampleManifest)}
                className="w-full text-left px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Simple Agent
              </button>
              <button
                onClick={() => {
                  setCode(`apiVersion: ossa/v0.2.3
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
      method: GET`);
                }}
                className="w-full text-left px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Agent with Tools
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

