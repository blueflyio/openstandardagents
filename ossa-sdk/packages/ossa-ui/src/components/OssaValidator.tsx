import { useState, useCallback } from 'react';
import type { ValidationResult } from '@bluefly/ossa-engine';
import { useOssaEngine } from '@bluefly/ossa-react';

interface OssaValidatorProps {
  schema: object;
  className?: string;
}

/** Paste YAML/JSON, get instant validation results */
export function OssaValidator({ schema, className = '' }: OssaValidatorProps) {
  const engine = useOssaEngine(schema);
  const [content, setContent] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = useCallback(async () => {
    if (!content.trim()) return;
    const r = await engine.validate(content);
    setResult(r);
  }, [engine, content]);

  return (
    <div className={className} style={{ fontFamily: 'system-ui, sans-serif' }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste your OSSA manifest (YAML or JSON)..."
        style={{
          width: '100%',
          minHeight: '200px',
          fontFamily: 'monospace',
          fontSize: '13px',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      />
      <button
        onClick={handleValidate}
        style={{
          marginTop: '8px',
          padding: '8px 16px',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Validate
      </button>
      {result && (
        <div style={{ marginTop: '12px' }}>
          <div style={{
            padding: '8px 12px',
            borderRadius: '6px',
            background: result.valid ? '#22c55e20' : '#ef444420',
            color: result.valid ? '#22c55e' : '#ef4444',
            fontWeight: 600,
          }}>
            {result.valid ? 'Valid manifest' : `${result.errors.length} error(s)`}
          </div>
          {result.errors.map((e, i) => (
            <div key={i} style={{ padding: '4px 0', fontSize: '13px', color: '#ef4444' }}>
              <code>{e.path}</code>: {e.message}
            </div>
          ))}
          {result.warnings.map((w, i) => (
            <div key={i} style={{ padding: '4px 0', fontSize: '13px', color: '#f59e0b' }}>
              <code>{w.path}</code>: {w.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
