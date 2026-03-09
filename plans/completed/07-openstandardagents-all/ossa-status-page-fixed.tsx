import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHero } from '@/components/sections/PageHero';
import { Section } from '@/components/sections/Section';
import { SectionHeader } from '@/components/sections/SectionHeader';
import { CTASection } from '@/components/sections/CTASection';
import { ScrollReveal } from '@/components/ScrollReveal';
import { OSSA_DISPLAY_VERSION_TAG } from '@/lib/version';

export const metadata: Metadata = {
  title: 'OSSA Project Status: Development Stage, Metrics, Feature Maturity',
  description: 'Transparent view of OSSA development — current version, honest feature maturity labels, real metrics, and timeline to v1.0. No vanity metrics, no hype.',
  keywords: [
    'OSSA project status',
    'OSSA development stage',
    'agent specification maturity',
    'OSSA version history',
    'OSSA feature status',
    'open source agent metrics',
    'OSSA alpha release',
    'agent standard timeline',
    'OSSA SDK status',
    'agent framework bridges',
    'OSSA npm package',
    'agent specification progress',
  ],
  openGraph: {
    title: 'OSSA Project Status — Transparent Development Progress',
    description: 'Honest feature maturity labels, real metrics, and timeline. No vanity metrics.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://openstandardagents.org/status',
  },
};

const features = [
  { label: 'Core Specification', desc: 'Agent manifests, capabilities, lifecycle management.', variant: 'success' as const, status: 'Stable', progress: 100 },
  { label: 'TypeScript SDK', desc: 'CLI tools, validation, type generation.', variant: 'success' as const, status: 'Stable', progress: 100 },
  { label: 'Python SDK', desc: 'Basic validation available, full SDK coming in v0.5.0.', variant: 'warning' as const, status: 'In Progress', progress: 45 },
  { label: 'Framework Bridges', desc: 'Export adapters for LangChain, CrewAI, and others. Working but evolving fast.', variant: 'warning' as const, status: 'In Progress', progress: 40 },
  { label: 'Enterprise Features', desc: 'Advanced governance, compliance frameworks (v0.5.0 — v0.6.0).', variant: 'default' as const, status: 'Planned', progress: 5 },
];

const timeline = [
  { version: 'v0.4.x', label: 'Current (Alpha)', active: true },
  { version: 'v0.5.0', label: 'Q3 2026 (Beta)', active: false },
  { version: 'v0.6.0', label: 'Q4 2026 (RC)', active: false },
  { version: 'v1.0.0', label: '2027 (Stable)', active: false },
];

const links = [
  { title: 'Package Downloads', desc: 'Check current download stats on npm:', href: 'https://www.npmjs.com/package/@bluefly/openstandardagents', cta: 'View npm stats', external: true },
  { title: 'GitLab Repository', desc: 'Check stars, forks, and contributors:', href: 'https://gitlab.com/blueflyio/ossa/openstandardagents', cta: 'View GitLab repo', external: true },
  { title: 'Community', desc: 'Join our Discord community:', href: 'https://discord.gg/ZZqad3v4', cta: 'Join Discord', external: true },
  { title: 'Documentation', desc: 'Comprehensive docs and examples:', href: '/docs', cta: 'Read documentation', external: false },
];

function badgeClass(variant: 'success' | 'warning' | 'default'): string {
  if (variant === 'success') return 'bg-green-100 text-green-800';
  if (variant === 'warning') return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-800';
}

export default function StatusPage() {
  return (
    <>
      <PageHero
        variant="light"
        compact
        title="Project"
        titleAccent="Status"
        subtitle="Transparent view of OSSA's current development stage, real metrics, and roadmap."
      />

      {/* Current Version */}
      <Section background="white">
        <ScrollReveal variant="scale">
          <div className="max-w-3xl mx-auto rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Current Version: {OSSA_DISPLAY_VERSION_TAG}</h2>
              <p className="text-lg text-gray-600 mb-4">
                Latest release available on npm
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="https://www.npmjs.com/package/@bluefly/openstandardagents"
                  className="text-primary hover:text-primary-700 font-medium transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on npm &rarr;
                </a>
                <a
                  href="https://gitlab.com/blueflyio/ossa/openstandardagents/-/tags"
                  className="text-primary hover:text-primary-700 font-medium transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Releases &rarr;
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* Development Stage */}
      <Section background="gray">
        <ScrollReveal>
          <SectionHeader
            title="Development Stage"
            subtitle="Alpha — Rapid Iteration"
          />
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 bg-white shadow p-6">
            <div className="pt-0">
              <p className="text-gray-700 mb-6">
                OSSA is in <strong>active alpha development</strong>. The specification is stable for core features,
                but we&apos;re rapidly adding new capabilities and refinements based on community feedback.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-3 text-gray-900">What This Means</h3>
                  <ul className="space-y-2">
                    {['Core specification is stable', 'New features added regularly', 'We avoid breaking changes between minor versions', 'Major versions ship with migration guides'].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3 text-gray-900">Timeline to v1.0</h3>
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent" />
                    {timeline.map((milestone) => (
                      <div key={milestone.version} className="relative mb-4 last:mb-0">
                        <div className={`absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 ${milestone.active ? 'bg-primary border-primary shadow-md shadow-primary/30' : 'bg-white border-gray-300'}`} />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{milestone.version}</span>
                          {milestone.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">Current</span>}
                        </div>
                        <span className="text-sm text-gray-600">{milestone.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* Real Metrics */}
      <Section background="white">
        <ScrollReveal>
          <SectionHeader
            title="Real Metrics"
            subtitle="We believe in transparency. Here are the actual metrics for the OSSA project."
          />
        </ScrollReveal>

        <div className="max-w-4xl mx-auto">
          <ScrollReveal stagger>
            <div className="grid md:grid-cols-2 gap-6">
              {links.map((link) => (
                <div key={link.title} className="reveal bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-primary/30 transition-all">
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{link.title}</h3>
                  <p className="text-gray-700 mb-3">{link.desc}</p>
                  {link.external ? (
                    <a
                      href={link.href}
                      className="text-primary hover:text-primary-700 font-medium transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.cta} &rarr;
                    </a>
                  ) : (
                    <Link href={link.href} className="text-primary hover:text-primary-700 font-medium transition-colors">
                      {link.cta} &rarr;
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </Section>

      {/* Feature Status */}
      <Section background="gray">
        <ScrollReveal>
          <SectionHeader
            title="Feature Status"
            subtitle="Honest assessment of current feature completeness"
          />
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 bg-white shadow p-6">
            <div className="pt-0">
              <div className="space-y-5">
                {features.map((feature) => {
                  return (
                    <div key={feature.label} className="p-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3 mb-2">
                        <span className={`mt-0.5 min-w-[100px] text-center text-xs px-2 py-0.5 rounded-full ${badgeClass(feature.variant)}`}>{feature.status}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{feature.label}</h3>
                          <p className="text-gray-700 text-sm">{feature.desc}</p>
                        </div>
                      </div>
                      <div className="ml-[112px]">
                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${feature.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* CTA */}
      <CTASection
        title="Want to See What's Next?"
        subtitle="Check out our public roadmap to see planned features, timelines, and how you can contribute."
        variant="gradient"
        actions={
          <>
            <Link href="/roadmap" className="inline-flex items-center px-8 py-4 bg-white text-primary font-semibold rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all">
              View Full Roadmap
            </Link>
            <a
              href="https://gitlab.com/blueflyio/openstandardagents/-/issues"
              className="inline-flex items-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Issues
            </a>
            <a
              href="https://discord.gg/ZZqad3v4"
              className="inline-flex items-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Discord
            </a>
          </>
        }
      />
    </>
  );
}
