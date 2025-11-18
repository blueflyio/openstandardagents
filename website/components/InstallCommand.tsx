'use client';

import { useState } from 'react';

export function InstallCommand() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const steps = [
    {
      title: '1. Install',
      command: 'npm install -g @openstandardagents/cli',
    },
    {
      title: '2. Create',
      command: 'osa init my-agent',
    },
    {
      title: '3. Validate',
      command: 'osa validate my-agent.ossa.yaml',
    },
    {
      title: '4. Export',
      command: 'osa export --to langchain',
    },
  ];

  const copyToClipboard = async (command: string, index: number) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-8 shadow-xl">
      <div className="container mx-auto max-w-6xl">
        <h3 className="text-2xl font-bold mb-2">Get Started in Minutes</h3>
        <p className="text-lg mb-6 opacity-90">
          Install the CLI, create your first agent, and start building with OSSA
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {steps.map((step, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-sm">{step.title}</h4>
              <div className="bg-black/30 rounded p-2 flex items-start justify-between gap-2">
                <code className="text-xs font-mono text-white flex-1 break-all">
                  {step.command}
                </code>
                <button
                  onClick={() => copyToClipboard(step.command, index)}
                  className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="Copy command"
                >
                  {copiedIndex === index ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <a href="/docs/getting-started/5-minute-overview" className="text-white hover:underline flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quick Start Guide
          </a>
          <a href="/examples" className="text-white hover:underline flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            View Examples
          </a>
          <a href="/docs" className="text-white hover:underline flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Full Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
