'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { STABLE_VERSION_TAG, STABLE_VERSION } from '@/lib/version';
import releaseHighlights from '@/lib/release-highlights.json';

// Color mapping for dynamic styling
const colorMap: Record<string, { border: string; text: string; icon: string }> = {
  green: { border: 'border-l-green-500', text: 'text-green-700', icon: 'text-green-500' },
  blue: { border: 'border-l-blue-500', text: 'text-blue-700', icon: 'text-blue-500' },
  purple: { border: 'border-l-purple-500', text: 'text-purple-700', icon: 'text-purple-500' },
  orange: { border: 'border-l-orange-500', text: 'text-orange-700', icon: 'text-orange-500' },
  teal: { border: 'border-l-teal-500', text: 'text-teal-700', icon: 'text-teal-500' },
  indigo: { border: 'border-l-indigo-500', text: 'text-indigo-700', icon: 'text-indigo-500' },
  red: { border: 'border-l-red-500', text: 'text-red-700', icon: 'text-red-500' },
};

// Check icon SVG
const CheckIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

// Clean bullet text by removing markdown code formatting
function cleanBulletText(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '$1') // Remove inline code backticks
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
    .replace(/^\s*[-*]\s*/, ''); // Remove list markers
}

export function WhatsNewSection() {
  const highlights = releaseHighlights.homepage || [];
  const overview = releaseHighlights.overview || 'The latest OSSA release brings enterprise-grade specifications for production multi-agent systems.';

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      <div className="container mx-auto max-w-[1440px]">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-sm font-bold mb-4">
            New Release
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">What&apos;s New in {STABLE_VERSION_TAG}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {overview}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {highlights.map((highlight, index) => {
            const colors = colorMap[highlight.color] || colorMap.blue;

            return (
              <Card
                key={index}
                variant="default"
                padding="lg"
                elevation={2}
                hover
                className={`border-l-4 ${colors.border}`}
              >
                <CardHeader>
                  <CardTitle className={`text-lg ${colors.text}`}>{highlight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    {highlight.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="flex items-start gap-2">
                        <CheckIcon className={`w-4 h-4 ${colors.icon} mt-0.5 flex-shrink-0`} />
                        <span>{cleanBulletText(bullet)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Link href="/changelog" className="btn-primary mr-4">
            View Full Changelog
          </Link>
          <Link
            href={`https://www.npmjs.com/package/@bluefly/openstandardagents/v/${STABLE_VERSION}`}
            className="btn-outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            npm {STABLE_VERSION_TAG}
          </Link>
        </div>
      </div>
    </section>
  );
}
