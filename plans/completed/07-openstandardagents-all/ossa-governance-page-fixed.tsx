import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/sections/PageHero';
import { Section } from '@/components/sections/Section';
import { CTASection } from '@/components/sections/CTASection';
export const metadata: Metadata = {
  title: 'Governance - OSSA',
  description: 'OSSA governance structure, Technical Steering Committee, working groups, and RFC process.',
  alternates: { canonical: 'https://openstandardagents.org/governance' },
};

export default function GovernancePage() {
  return (
    <>
      <PageHero
        title="OSSA Governance"
        subtitle="Open, transparent governance ensuring OSSA remains a truly community-owned standard."
        variant="light"
        compact
        badges={
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">In Development</span>
        }
      />

      <Section background="white" narrow>
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-8">
            Open Standard for Software Agents (OSSA) is governed by a Technical Steering Committee (TSC)
            and community working groups following an open, transparent process.
          </p>

          <div className="not-prose mb-10 border border-amber-200 bg-amber-50 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-1">In development</h3>
            <p className="text-amber-800">
              OSSA governance is being developed with community input. We&apos;re working on formalizing
              the decision-making process to ensure OSSA remains truly community-owned. Details will
              be published here as they&apos;re finalized.
            </p>
          </div>

          <h2 className="not-prose text-3xl font-bold mt-12 mb-4 text-gray-900">Get Involved</h2>
          <p className="text-gray-700 mb-6">
            Governance details are being finalized. For now, you can:
          </p>
          <ul className="not-prose space-y-3 text-gray-700 mb-8">
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              Join discussions on <a href="https://discord.gg/ZZqad3v4" className="text-primary hover:underline font-medium">Discord</a>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              Contribute via <a href="https://gitlab.com/blueflyio/openstandardagents" className="text-primary hover:underline font-medium">GitLab</a>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              Review the <Link href="/specification" className="text-primary hover:underline font-medium">specification</Link>
            </li>
          </ul>

          <div className="not-prose border border-primary/30 bg-primary/5 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-1">Coming Soon</h3>
            <p className="text-gray-700">
              Full governance documentation will be published here once the TSC structure is finalized.
              This ensures OSSA remains a truly community-owned standard.
            </p>
          </div>
        </div>
      </Section>

      <CTASection
        title="Help Shape Governance"
        subtitle="Your voice matters. Join the conversation about how OSSA should be governed."
        variant="primary-light"
        actions={
          <>
            <a href="https://discord.gg/ZZqad3v4" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors">
              Join Discord
            </a>
            <a href="https://gitlab.com/blueflyio/openstandardagents" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors">
              Contribute on GitLab
            </a>
          </>
        }
      />
    </>
  );
}
