import { useState } from 'react';
import type { FieldDescriptor } from '@bluefly/ossa-engine';
import { useOssaEngine } from '@bluefly/ossa-react';

interface OssaSchemaExplorerProps {
  schema: object;
  className?: string;
}

/** Interactive schema browser — explore all OSSA fields, types, constraints */
export function OssaSchemaExplorer({ schema, className = '' }: OssaSchemaExplorerProps) {
  const engine = useOssaEngine(schema);
  const steps = engine.getWizardSteps();
  const [expandedStep, setExpandedStep] = useState<string | null>(steps[0]?.id ?? null);

  return (
    <div className={className} style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
        OSSA Schema Explorer — v{engine.getSchemaVersion()}
      </div>
      {steps.map((step) => (
        <div key={step.id} style={{ marginBottom: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <button
            onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '12px 16px',
              background: expandedStep === step.id ? '#3b82f610' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {step.title}
            {step.description && <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: '8px' }}>{step.description}</span>}
          </button>
          {expandedStep === step.id && (
            <div style={{ padding: '0 16px 12px' }}>
              {step.fields.length === 0 ? (
                <div style={{ fontSize: '13px', opacity: 0.5 }}>No fields discovered</div>
              ) : (
                step.fields.map((field) => <FieldRow key={field.path} field={field} />)
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FieldRow({ field }: { field: FieldDescriptor }) {
  return (
    <div style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <code style={{ fontWeight: 600 }}>{field.path.split('.').pop()}</code>
        <span style={{
          fontSize: '11px',
          padding: '1px 6px',
          borderRadius: '4px',
          background: '#e2e8f0',
          fontWeight: 500,
        }}>
          {field.type}
        </span>
        {field.required && (
          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>required</span>
        )}
      </div>
      {field.description && <div style={{ opacity: 0.7, fontSize: '12px', marginTop: '2px' }}>{field.description}</div>}
      {field.values && <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>Values: {field.values.join(', ')}</div>}
      {field.default !== undefined && <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>Default: {String(field.default)}</div>}
    </div>
  );
}
