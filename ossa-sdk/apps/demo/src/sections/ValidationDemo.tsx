import { useState } from 'react';
import { ValidationEngine } from '@bluefly/ossa-engine';
import { DEMO_SCHEMA } from '../schema.js';

const EXAMPLES = {
  valid: `apiVersion: ossa/v0.4
kind: Agent
metadata:
  name: my-agent
spec:
  role: assistant
  llm:
    provider: anthropic
    model: claude-sonnet-4-5-20250929`,
  invalidKind: `apiVersion: ossa/v0.4
kind: InvalidKind
metadata:
  name: bad-agent`,
  missingMetadata: `apiVersion: ossa/v0.4
kind: Agent`,
  json: JSON.stringify(
    { apiVersion: 'ossa/v0.4', kind: 'Agent', metadata: { name: 'json-agent' } },
    null,
    2,
  ),
};

export function ValidationDemo() {
  const [engine] = useState(() => new ValidationEngine());
  const [input, setInput] = useState(EXAMPLES.valid);
  const [result, setResult] = useState<{ valid: boolean; errors: string[]; format: string } | null>(null);

  const handleValidate = async () => {
    const r = await engine.validateString(input, DEMO_SCHEMA);
    setResult({
      valid: r.valid,
      errors: r.errors.map((e) => `[${e.severity}] ${e.path}: ${e.message}`),
      format: input.trim().startsWith('{') ? 'JSON' : 'YAML',
    });
  };

  return (
    <section>
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>ValidationEngine</h2>
      <p style={{ opacity: 0.6, fontSize: '13px', marginBottom: '16px' }}>
        AJV-powered validation with semantic checks. Supports both YAML and JSON input.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {Object.entries(EXAMPLES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => { setInput(val); setResult(null); }}
            style={{
              padding: '4px 12px',
              background: '#1a1a2e',
              color: '#999',
              border: '1px solid #333',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'inherit',
            }}
          >
            {key}
          </button>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{
          width: '100%',
          height: '200px',
          padding: '12px',
          background: '#111',
          color: '#e5e5e5',
          border: '1px solid #333',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          resize: 'vertical',
          marginBottom: '8px',
        }}
      />

      <button
        onClick={handleValidate}
        style={{
          padding: '8px 20px',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '13px',
        }}
      >
        Validate
      </button>

      {result && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: result.valid ? '#052e16' : '#2d0a0a',
            border: `1px solid ${result.valid ? '#16a34a' : '#dc2626'}`,
            borderRadius: '8px',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
            {result.valid ? 'Valid' : 'Invalid'} ({result.format})
          </div>
          {result.errors.length > 0 && (
            <ul style={{ paddingLeft: '16px', fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              {result.errors.map((e, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
