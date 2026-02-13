import { useState } from 'react';
import { EngineDemo } from './sections/EngineDemo.js';
import { BuilderDemo } from './sections/BuilderDemo.js';
import { ValidationDemo } from './sections/ValidationDemo.js';
import { ExportDemo } from './sections/ExportDemo.js';
import { UIComponentsDemo } from './sections/UIComponentsDemo.js';

const TABS = ['Engine', 'Builder', 'Validation', 'Export', 'UI Components'] as const;
type Tab = (typeof TABS)[number];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Engine');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
          OSSA SDK Demo
        </h1>
        <p style={{ opacity: 0.6, fontSize: '14px' }}>
          Schema-driven agent builder kit — engine, react hooks, and drop-in UI components
        </p>
      </header>

      <nav style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #333' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab ? '#1a1a2e' : 'transparent',
              color: activeTab === tab ? '#60a5fa' : '#999',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #60a5fa' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main>
        {activeTab === 'Engine' && <EngineDemo />}
        {activeTab === 'Builder' && <BuilderDemo />}
        {activeTab === 'Validation' && <ValidationDemo />}
        {activeTab === 'Export' && <ExportDemo />}
        {activeTab === 'UI Components' && <UIComponentsDemo />}
      </main>
    </div>
  );
}
