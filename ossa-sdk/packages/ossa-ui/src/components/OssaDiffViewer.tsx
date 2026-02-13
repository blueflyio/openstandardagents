import { useMemo } from 'react';
import { DiffEngine, type DiffEntry } from '@bluefly/ossa-engine';

interface OssaDiffViewerProps {
  oldManifest: Record<string, unknown>;
  newManifest: Record<string, unknown>;
  className?: string;
}

/** Side-by-side manifest diff viewer */
export function OssaDiffViewer({ oldManifest, newManifest, className = '' }: OssaDiffViewerProps) {
  const differ = useMemo(() => new DiffEngine(), []);
  const result = useMemo(() => differ.diff(oldManifest, newManifest), [differ, oldManifest, newManifest]);

  const colors: Record<string, string> = {
    added: '#22c55e',
    removed: '#ef4444',
    changed: '#f59e0b',
    unchanged: '#64748b',
  };

  return (
    <div className={className} style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontWeight: 600, marginBottom: '12px' }}>
        {result.summary}
      </div>
      <div style={{ borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {result.entries.filter((e) => e.op !== 'unchanged').map((entry, i) => (
          <div
            key={i}
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #f1f5f9',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '4px',
              background: `${colors[entry.op]}20`,
              color: colors[entry.op],
              fontWeight: 600,
              minWidth: '60px',
              textAlign: 'center',
            }}>
              {entry.op}
            </span>
            <code style={{ fontWeight: 500 }}>{entry.path}</code>
            {entry.op === 'changed' && (
              <span style={{ opacity: 0.6 }}>
                {JSON.stringify(entry.oldValue)} → {JSON.stringify(entry.newValue)}
              </span>
            )}
            {entry.op === 'added' && (
              <span style={{ color: colors.added }}>{JSON.stringify(entry.newValue)}</span>
            )}
            {entry.op === 'removed' && (
              <span style={{ color: colors.removed, textDecoration: 'line-through' }}>{JSON.stringify(entry.oldValue)}</span>
            )}
          </div>
        ))}
        {!result.hasChanges && (
          <div style={{ padding: '16px', textAlign: 'center', opacity: 0.5 }}>No differences</div>
        )}
      </div>
    </div>
  );
}
