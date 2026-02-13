import { useState } from 'react';
import { ExportEngine } from '@bluefly/ossa-engine';
import type { ExportResult, ExportTarget } from '@bluefly/ossa-engine';

const MANIFEST = {
  apiVersion: 'ossa/v0.4',
  kind: 'Agent',
  metadata: { name: 'demo-agent', version: '1.0.0' },
  spec: {
    role: 'code-reviewer',
    llm: { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
    tools: [
      { name: 'gitlab-api', type: 'mcp' },
      { name: 'file-reader', type: 'builtin' },
    ],
  },
};

export function ExportDemo() {
  const [exporter] = useState(() => new ExportEngine());
  const [selectedTarget, setSelectedTarget] = useState<ExportTarget>('docker');
  const [result, setResult] = useState<ExportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const targets = exporter.getTargets();

  const handleExport = () => {
    const r = exporter.export(MANIFEST, selectedTarget);
    setResult(r);
    setSelectedFile(r.files[0]?.path ?? null);
  };

  const activeFile = result?.files.find((f) => f.path === selectedFile);

  return (
    <section>
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>ExportEngine</h2>
      <p style={{ opacity: 0.6, fontSize: '13px', marginBottom: '16px' }}>
        Client-side export to {targets.length}+ platforms. No server needed — instant results.
      </p>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <select
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value as ExportTarget)}
          style={{
            padding: '8px 12px',
            background: '#111',
            color: '#e5e5e5',
            border: '1px solid #333',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          {targets.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={handleExport}
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
          Export
        </button>
      </div>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '12px' }}>
          <div
            style={{
              background: '#111',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '8px',
              maxHeight: '400px',
              overflow: 'auto',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.5, marginBottom: '8px', padding: '4px' }}>
              {result.files.length} files — {result.target}
            </div>
            {result.files.map((f) => (
              <button
                key={f.path}
                onClick={() => setSelectedFile(f.path)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '4px 8px',
                  background: f.path === selectedFile ? '#1a1a2e' : 'transparent',
                  color: f.path === selectedFile ? '#60a5fa' : '#999',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  marginBottom: '2px',
                }}
              >
                {f.path}
              </button>
            ))}
          </div>

          <pre
            style={{
              padding: '12px',
              background: '#111',
              border: '1px solid #333',
              borderRadius: '8px',
              fontSize: '11px',
              overflow: 'auto',
              maxHeight: '400px',
              margin: 0,
            }}
          >
            {activeFile?.content ?? 'Select a file'}
          </pre>
        </div>
      )}
    </section>
  );
}
