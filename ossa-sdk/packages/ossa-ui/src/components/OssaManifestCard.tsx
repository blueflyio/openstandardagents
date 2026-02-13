interface OssaManifestCardProps {
  manifest: Record<string, unknown>;
  className?: string;
}

/** Compact manifest summary card */
export function OssaManifestCard({ manifest, className = '' }: OssaManifestCardProps) {
  const metadata = manifest.metadata as Record<string, unknown> | undefined;
  const spec = manifest.spec as Record<string, unknown> | undefined;
  const llm = spec?.llm as Record<string, unknown> | undefined;
  const tools = spec?.tools as { name: string }[] | undefined;
  const name = String(metadata?.name ?? 'Unnamed Agent');
  const kind = String(manifest.kind ?? 'Agent');
  const role = spec?.role ? String(spec.role) : null;
  const provider = llm?.provider ? String(llm.provider) : null;
  const model = llm?.model ? String(llm.model) : null;
  const apiVer = manifest.apiVersion ? String(manifest.apiVersion) : null;

  return (
    <div
      className={className}
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '400px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ fontWeight: 700, fontSize: '16px' }}>{name}</div>
        <span style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '99px',
          background: '#3b82f620',
          color: '#3b82f6',
          fontWeight: 600,
        }}>
          {kind}
        </span>
      </div>
      {role && (
        <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>{role}</div>
      )}
      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', opacity: 0.6 }}>
        {provider && <span>LLM: {provider}/{model}</span>}
        {tools && <span>{tools.length} tool(s)</span>}
        {apiVer && <span>{apiVer}</span>}
      </div>
    </div>
  );
}
