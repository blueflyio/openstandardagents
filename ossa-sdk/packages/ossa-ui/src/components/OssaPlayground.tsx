import { useState, useCallback } from 'react';
import type { OssaEngine, ExportTarget, ValidationResult, ExportResult } from '@bluefly/ossa-engine';
import { useOssaEngine } from '@bluefly/ossa-react';

interface OssaPlaygroundProps {
  schema: object;
  theme?: 'light' | 'dark';
  defaultTemplate?: string;
  showExport?: boolean;
  showValidation?: boolean;
  className?: string;
}

type Tab = 'editor' | 'validation' | 'export';

const DEFAULT_MANIFEST = `apiVersion: ossa/v0.4
kind: Agent
metadata:
  name: my-agent
  version: "1.0.0"
spec:
  description: "A production-ready AI agent"
  role: code-reviewer
  llm:
    provider: anthropic
    model: claude-sonnet-4-5-20250929
    temperature: 0.7
  tools:
    - name: gitlab-api
      type: mcp
    - name: semgrep
      type: builtin
  safety:
    contentFiltering: true
    humanInTheLoop: true
  autonomy:
    level: supervised
`;

/** Full playground widget — drop-in replacement for the website's InteractivePlayground */
export function OssaPlayground({
  schema,
  theme = 'light',
  showExport = true,
  showValidation = true,
  className = '',
}: OssaPlaygroundProps) {
  const engine = useOssaEngine(schema);
  const [content, setContent] = useState(DEFAULT_MANIFEST);
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportTarget, setExportTarget] = useState<ExportTarget>('docker');
  const [isValidating, setIsValidating] = useState(false);

  const isDark = theme === 'dark';
  const bg = isDark ? '#1a1b26' : '#ffffff';
  const fg = isDark ? '#c0caf5' : '#1e293b';
  const border = isDark ? '#414868' : '#e2e8f0';
  const accent = '#3b82f6';

  const handleValidate = useCallback(async () => {
    setIsValidating(true);
    const result = await engine.validate(content);
    setValidation(result);
    setIsValidating(false);
    setActiveTab('validation');
  }, [engine, content]);

  const handleExport = useCallback(() => {
    const parseResult = engine.validate(content).then((vr) => {
      if (vr.parsedManifest) {
        const result = engine.export(vr.parsedManifest, exportTarget);
        setExportResult(result);
        setActiveTab('export');
      }
    });
  }, [engine, content, exportTarget]);

  return (
    <div className={className} style={{ background: bg, color: fg, border: `1px solid ${border}`, borderRadius: '12px', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, padding: '0 16px' }}>
        {(['editor', ...(showValidation ? ['validation'] : []), ...(showExport ? ['export'] : [])] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${accent}` : '2px solid transparent',
              color: activeTab === tab ? accent : fg,
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: '14px',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Editor tab */}
      {activeTab === 'editor' && (
        <div style={{ padding: '16px' }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '300px',
              background: isDark ? '#24283b' : '#f8fafc',
              color: fg,
              border: `1px solid ${border}`,
              borderRadius: '8px',
              padding: '12px',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              resize: 'vertical',
            }}
            spellCheck={false}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={handleValidate}
              disabled={isValidating}
              style={{
                padding: '8px 16px',
                background: accent,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </button>
            {showExport && (
              <>
                <select
                  value={exportTarget}
                  onChange={(e) => setExportTarget(e.target.value as ExportTarget)}
                  style={{
                    padding: '8px 12px',
                    background: isDark ? '#24283b' : '#f8fafc',
                    color: fg,
                    border: `1px solid ${border}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  {engine.getExportTargets().map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  onClick={handleExport}
                  style={{
                    padding: '8px 16px',
                    background: isDark ? '#414868' : '#e2e8f0',
                    color: fg,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Export
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Validation tab */}
      {activeTab === 'validation' && validation && (
        <div style={{ padding: '16px' }}>
          <div style={{
            padding: '12px 16px',
            background: validation.valid ? '#22c55e20' : '#ef444420',
            borderRadius: '8px',
            marginBottom: '12px',
            fontWeight: 600,
            color: validation.valid ? '#22c55e' : '#ef4444',
          }}>
            {validation.valid ? 'Valid' : `${validation.errors.length} error(s)`}
            {validation.warnings.length > 0 && ` | ${validation.warnings.length} warning(s)`}
          </div>
          {[...validation.errors, ...validation.warnings].map((issue, i) => (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                marginBottom: '4px',
                borderRadius: '4px',
                fontSize: '13px',
                background: issue.severity === 'error' ? '#ef444410' : '#f59e0b10',
                borderLeft: `3px solid ${issue.severity === 'error' ? '#ef4444' : '#f59e0b'}`,
              }}
            >
              <code style={{ fontSize: '12px', opacity: 0.7 }}>{issue.path}</code>
              <div>{issue.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* Export tab */}
      {activeTab === 'export' && exportResult && (
        <div style={{ padding: '16px' }}>
          <div style={{ fontWeight: 600, marginBottom: '12px' }}>
            Generated {exportResult.files.length} files for {exportResult.target}
          </div>
          {exportResult.files.map((file) => (
            <details key={file.path} style={{ marginBottom: '8px' }}>
              <summary style={{ cursor: 'pointer', padding: '8px 0', fontSize: '14px', fontWeight: 500 }}>
                {file.path}
              </summary>
              <pre style={{
                background: isDark ? '#24283b' : '#f8fafc',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '300px',
              }}>
                {file.content}
              </pre>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
