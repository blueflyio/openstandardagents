import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'OSSA Agent Specification',
  description: 'Complete OSSA agent specification documentation',
};

export default function AgentsSpecPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">OSSA Agent Specification</h1>
      
      <div className="prose max-w-none">
        <p className="text-lg text-gray-700 mb-6">
          This page provides the complete OSSA agent specification. For the most up-to-date
          information, see the <Link href="/docs/specification" className="text-blue-600 hover:underline">main specification page</Link>.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700">
            <strong>Note:</strong> This content has been migrated from static HTML to Next.js.
            For the complete specification, visit the <Link href="/docs/specification" className="font-semibold hover:underline">specification documentation</Link>.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Quick Links</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><Link href="/docs/specification" className="text-blue-600 hover:underline">Complete Specification</Link></li>
          <li><Link href="/docs/schema-reference" className="text-blue-600 hover:underline">Schema Reference</Link></li>
          <li><Link href="/docs/getting-started/first-agent" className="text-blue-600 hover:underline">First Agent Guide</Link></li>
        </ul>
      </div>
    </div>
  );
}
