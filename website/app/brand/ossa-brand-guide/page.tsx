import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'OSSA Brand Guide',
  description: 'OSSA brand guidelines and assets',
};

export default function BrandGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">OSSA Brand Guide</h1>
      
      <div className="prose max-w-none">
        <p className="text-lg text-gray-700 mb-6">
          This page has been migrated from static HTML to Next.js. Brand assets are available
          in the <Link href="/brand" className="text-blue-600 hover:underline">brand section</Link>.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700">
            <strong>Note:</strong> Brand assets and guidelines are now managed in the Next.js site.
            Visit the <Link href="/brand" className="font-semibold hover:underline">brand page</Link> for assets.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Quick Links</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><Link href="/brand" className="text-blue-600 hover:underline">Brand Assets</Link></li>
          <li><Link href="/docs" className="text-blue-600 hover:underline">Documentation</Link></li>
        </ul>
      </div>
    </div>
  );
}
