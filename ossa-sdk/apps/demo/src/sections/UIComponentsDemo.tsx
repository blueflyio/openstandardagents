import { OssaManifestCard } from '@bluefly/ossa-ui';

const SAMPLE_MANIFESTS = [
  {
    apiVersion: 'ossa/v0.4',
    kind: 'Agent',
    metadata: { name: 'code-reviewer', version: '1.0.0' },
    spec: {
      role: 'code-reviewer',
      llm: { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
      tools: [{ name: 'gitlab-api', type: 'mcp' }],
    },
  },
  {
    apiVersion: 'ossa/v0.4',
    kind: 'Task',
    metadata: { name: 'daily-report', version: '0.5.0' },
    spec: {
      role: 'report-generator',
      llm: { provider: 'openai', model: 'gpt-4o' },
      tools: [
        { name: 'data-api', type: 'api' },
        { name: 'email-sender', type: 'builtin' },
      ],
    },
  },
  {
    apiVersion: 'ossa/v0.4',
    kind: 'Workflow',
    metadata: { name: 'ci-pipeline', version: '2.0.0' },
    spec: {
      role: 'pipeline-orchestrator',
      llm: { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
    },
  },
];

export function UIComponentsDemo() {
  // The OssaPlayground, OssaValidator, OssaSchemaExplorer etc. require
  // the engine to be passed or schema prop. For this demo we show:
  // 1) OssaManifestCard (simplest drop-in)
  // 2) Info about other available components

  return (
    <section>
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>UI Components</h2>
      <p style={{ opacity: 0.6, fontSize: '13px', marginBottom: '16px' }}>
        Drop-in styled components from <code>@bluefly/ossa-ui</code>. Each wraps the headless hooks
        from <code>@bluefly/ossa-react</code>.
      </p>

      <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>OssaManifestCard</h3>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {SAMPLE_MANIFESTS.map((m) => (
          <OssaManifestCard key={String((m.metadata as Record<string, unknown>).name)} manifest={m} />
        ))}
      </div>

      <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Available Components</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {[
          { name: 'OssaPlayground', desc: 'Full playground with editor, validation panel, and export tab.' },
          { name: 'OssaValidator', desc: 'Paste YAML/JSON and get instant validation results.' },
          { name: 'OssaSchemaExplorer', desc: 'Interactive schema browser with wizard steps and field details.' },
          { name: 'OssaDiffViewer', desc: 'Side-by-side manifest diff with color-coded changes.' },
          { name: 'OssaManifestCard', desc: 'Compact agent summary card (shown above).' },
        ].map((c) => (
          <div
            key={c.name}
            style={{
              padding: '12px',
              background: '#111',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
          >
            <code style={{ color: '#60a5fa', fontSize: '13px' }}>&lt;{c.name} /&gt;</code>
            <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>{c.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px', padding: '16px', background: '#111', borderRadius: '8px', border: '1px solid #333' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Usage</h3>
        <pre style={{ fontSize: '12px', color: '#60a5fa' }}>
{`import { OssaPlayground } from '@bluefly/ossa-ui';

// Drop into any page — 1 line:
<OssaPlayground schema={ossaSchema} />`}
        </pre>
      </div>
    </section>
  );
}
