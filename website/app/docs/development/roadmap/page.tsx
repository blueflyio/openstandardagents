import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'OSSA Development Roadmap',
  description: 'OSSA development roadmap and future plans',
};

export default function RoadmapPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">OSSA Development Roadmap</h1>
      
      <div className="prose max-w-none">
        <p className="text-lg text-gray-700 mb-6">
          This page has been migrated from static HTML to Next.js. For the latest roadmap information,
          see the <Link href="https://gitlab.com/blueflyio/openstandardagents/-/milestones" className="text-blue-600 hover:underline">GitLab milestones</Link>.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700">
            <strong>Note:</strong> Roadmap information is now managed in GitLab. All planning,
            milestones, and releases are tracked there.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Quick Links</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><Link href="https://gitlab.com/blueflyio/openstandardagents/-/milestones" className="text-blue-600 hover:underline">GitLab Milestones</Link></li>
          <li><Link href="https://gitlab.com/blueflyio/openstandardagents/-/releases" className="text-blue-600 hover:underline">Releases</Link></li>
          <li><Link href="/docs/specification" className="text-blue-600 hover:underline">Current Specification</Link></li>
        </ul>
      </div>
    </div>
  );
}
