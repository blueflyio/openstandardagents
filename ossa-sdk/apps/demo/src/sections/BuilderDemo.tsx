import { useState } from 'react';
import { ManifestBuilder } from '@bluefly/ossa-engine';

export function BuilderDemo() {
  const [output, setOutput] = useState('');

  const handleBuild = () => {
    const manifest = new ManifestBuilder()
      .apiVersion('ossa/v0.4')
      .kind('Agent')
      .metadata({ name: 'demo-agent', version: '1.0.0' })
      .spec((s) =>
        s
          .role('code-reviewer')
          .llm({ provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' })
          .addTool({ name: 'gitlab-api', type: 'mcp' })
          .addTool({ name: 'file-reader', type: 'builtin' })
          .safety({ humanInTheLoop: true })
          .autonomy({ level: 'supervised' }),
      )
      .build();

    setOutput(JSON.stringify(manifest, null, 2));
  };

  const handleMutate = () => {
    const original = { apiVersion: 'ossa/v0.3', kind: 'Agent', metadata: { name: 'old-agent' } };
    const builder = ManifestBuilder.from(original);
    builder.apiVersion('ossa/v0.4');
    builder.set('metadata.name', 'migrated-agent');
    builder.set('metadata.version', '2.0.0');
    const result = builder.build();
    setOutput(
      JSON.stringify({ original, migrated: result }, null, 2),
    );
  };

  return (
    <section>
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>ManifestBuilder</h2>
      <p style={{ opacity: 0.6, fontSize: '13px', marginBottom: '16px' }}>
        Fluent API for building OSSA manifests programmatically. Immutable — original manifests are
        never mutated.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={handleBuild} style={btnStyle}>
          Build from scratch
        </button>
        <button onClick={handleMutate} style={btnStyle}>
          Migrate existing
        </button>
      </div>

      {output && (
        <pre
          style={{
            padding: '16px',
            background: '#111',
            border: '1px solid #333',
            borderRadius: '8px',
            fontSize: '11px',
            overflow: 'auto',
            maxHeight: '500px',
          }}
        >
          {output}
        </pre>
      )}
    </section>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '8px 20px',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '13px',
};
