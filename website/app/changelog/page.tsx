import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { STABLE_VERSION, STABLE_VERSION_TAG } from '@/lib/version';

export const metadata: Metadata = {
  title: 'Changelog - OSSA Release History',
  description: 'View the complete release history for Open Standard Agents (OSSA). Track new features, improvements, and breaking changes across versions.',
};

interface ReleaseHighlight {
  category: string;
  color: string;
  items: string[];
}

interface Release {
  version: string;
  name: string;
  date: string;
  highlights: ReleaseHighlight[];
  links: {
    npm?: string;
    github?: string;
  };
}

const releases: Release[] = [
  {
    version: STABLE_VERSION,
    name: 'Foundation Release',
    date: 'December 5, 2025',
    highlights: [
      {
        category: 'Enterprise Security & Compliance',
        color: 'green',
        items: [
          'Formal security model with authentication, authorization, secrets management, and sandboxing',
          'Conformance testing with three tiers: Basic, Standard, Enterprise',
          'FedRAMP, SOC2, HIPAA compliance profile support',
          'Critical YAML deserialization vulnerability patched (CWE-502)',
        ],
      },
      {
        category: 'Multi-Agent Orchestration',
        color: 'blue',
        items: [
          'A2A Protocol for agent-to-agent communication with message envelopes',
          'Formal capability URI scheme with registry format',
          'Identity tracking: instance IDs, session IDs, interaction IDs',
        ],
      },
      {
        category: 'Observability & Monitoring',
        color: 'purple',
        items: [
          'OpenTelemetry semantic conventions for agent tracing',
          'Reasoning strategies: ReAct, Chain of Thought, Tree of Thought',
          'Versioned prompt template management',
        ],
      },
      {
        category: 'Developer Experience',
        color: 'orange',
        items: [
          'Comprehensive agent manifest specification documentation',
          'agents.md extension for OpenAI integration',
          'llms.txt support for LLM-friendly documentation',
          'Enhanced CLI validation with conformance testing',
        ],
      },
    ],
    links: {
      npm: `https://www.npmjs.com/package/@bluefly/openstandardagents/v/${STABLE_VERSION}`,
      github: 'https://github.com/blueflyio/openstandardagents',
    },
  },
  {
    version: '0.2.8',
    name: 'Developer Experience Release',
    date: 'December 1, 2025',
    highlights: [
      {
        category: 'Schema Improvements',
        color: 'blue',
        items: [
          'Enhanced JSON Schema with better validation',
          'Improved error messages for schema violations',
          'New optional fields for advanced configurations',
        ],
      },
      {
        category: 'CLI Enhancements',
        color: 'green',
        items: [
          'Faster validation performance',
          'Better output formatting',
          'New export formats support',
        ],
      },
    ],
    links: {
      npm: 'https://www.npmjs.com/package/@bluefly/openstandardagents/v/0.2.8',
      github: 'https://github.com/blueflyio/openstandardagents',
    },
  },
  {
    version: '0.2.7',
    name: 'Stability Release',
    date: 'November 25, 2025',
    highlights: [
      {
        category: 'Bug Fixes',
        color: 'red',
        items: [
          'Fixed schema validation edge cases',
          'Resolved CLI compatibility issues',
          'Improved error handling',
        ],
      },
    ],
    links: {
      npm: 'https://www.npmjs.com/package/@bluefly/openstandardagents/v/0.2.7',
    },
  },
];

function getColorClasses(color: string) {
  const colors: Record<string, { border: string; text: string; bg: string }> = {
    green: { border: 'border-l-green-500', text: 'text-green-700', bg: 'bg-green-50' },
    blue: { border: 'border-l-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
    purple: { border: 'border-l-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
    orange: { border: 'border-l-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
    red: { border: 'border-l-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  };
  return colors[color] || colors.blue;
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary via-primary to-accent text-white py-16 px-4">
        <div className="container mx-auto max-w-[1440px] px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Changelog</h1>
          <p className="text-xl text-gray-200">
            Track the evolution of Open Standard Agents. See what&apos;s new, improved, and fixed in each release.
          </p>
        </div>
      </section>

      {/* Releases */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-[1440px] px-4">
          {releases.map((release, index) => (
            <div key={release.version} className={`mb-12 ${index > 0 ? 'pt-12 border-t border-gray-200' : ''}`}>
              {/* Release Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-gray-900">v{release.version}</h2>
                    {index === 0 && (
                      <span className="px-3 py-1 bg-primary text-white text-sm font-bold rounded-full">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-xl text-gray-600">{release.name}</p>
                  <p className="text-gray-500">{release.date}</p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                  {release.links.npm && (
                    <Link
                      href={release.links.npm}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      npm
                    </Link>
                  )}
                  {release.links.github && (
                    <Link
                      href={release.links.github}
                      className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </Link>
                  )}
                </div>
              </div>

              {/* Release Highlights */}
              <div className="grid md:grid-cols-2 gap-4">
                {release.highlights.map((highlight) => {
                  const colors = getColorClasses(highlight.color);
                  return (
                    <Card
                      key={highlight.category}
                      variant="default"
                      padding="md"
                      elevation={1}
                      className={`border-l-4 ${colors.border}`}
                    >
                      <CardHeader>
                        <CardTitle className={`text-base ${colors.text}`}>{highlight.category}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-gray-700 text-sm">
                          {highlight.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <svg
                                className={`w-4 h-4 ${colors.text} mt-0.5 flex-shrink-0`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Older Releases Link */}
          <div className="text-center pt-8 border-t border-gray-200">
            <p className="text-gray-600 mb-4">Looking for older releases?</p>
            <Link
              href="https://github.com/blueflyio/openstandardagents/releases"
              className="btn-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View All Releases on GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-primary text-white">
        <div className="container mx-auto max-w-[1440px] px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-200 mb-6">
            Install the latest version and start building with Open Standard Agents today.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
            <code className="text-lg">npm install -g @bluefly/openstandardagents</code>
          </div>
        </div>
      </section>
    </div>
  );
}
