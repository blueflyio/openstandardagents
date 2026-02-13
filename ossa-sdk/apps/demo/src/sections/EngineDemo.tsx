import { useState } from 'react';
import { OssaEngine } from '@bluefly/ossa-engine';
import { DEMO_SCHEMA } from '../schema.js';

const SAMPLE_YAML = `apiVersion: ossa/v0.4
kind: Agent
metadata:
  name: code-reviewer
  version: "1.0.0"
spec:
  role: code-reviewer
  llm:
    provider: anthropic
    model: claude-sonnet-4-5-20250929
  tools:
    - name: gitlab-api
      type: mcp`;

export function EngineDemo() {
  const [engine] = useState(() => new OssaEngine(DEMO_SCHEMA));
  const [yaml, setYaml] = useState(SAMPLE_YAML);
  const [result, setResult] = useState<{ valid: boolean; errors: string[] } | null>(null);

  const handleValidate = async () => {
    const r = await engine.validate(yaml);
    setResult({ valid: r.valid, errors: r.errors.map((e) => e.message) });
  };

  return (
    <section>
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>OssaEngine</h2>
      <p style={{ opacity: 0.6, fontSize: '13px', marginBottom: '16px' }}>
        Core engine: schema version {engine.getSchemaVersion()}, validates YAML/JSON manifests against
        the OSSA schema.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            YAML Manifest
          </label>
          <textarea
            value={yaml}
            onChange={(e) => setYaml(e.target.value)}
            style={{
              width: '100%',
              height: '300px',
              padding: '12px',
              background: '#111',
              color: '#e5e5e5',
              border: '1px solid #333',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
              resize: 'vertical',
            }}
          />
          <button
            onClick={handleValidate}
            style={{
              marginTop: '8px',
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
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            Result
          </label>
          {result && (
            <div
              style={{
                padding: '12px',
                background: result.valid ? '#052e16' : '#2d0a0a',
                border: `1px solid ${result.valid ? '#16a34a' : '#dc2626'}`,
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '8px' }}>
                {result.valid ? 'Valid' : 'Invalid'}
              </div>
              {result.errors.length > 0 && (
                <ul style={{ paddingLeft: '16px', fontSize: '12px', opacity: 0.8 }}>
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Schema Info
            </label>
            <pre
              style={{
                padding: '12px',
                background: '#111',
                border: '1px solid #333',
                borderRadius: '8px',
                fontSize: '11px',
                overflow: 'auto',
              }}
            >
              {JSON.stringify(
                {
                  version: engine.getSchemaVersion(),
                  exportTargets: engine.getExportTargets().slice(0, 6),
                  wizardSteps: engine.getWizardSteps().map((s) => s.id),
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
