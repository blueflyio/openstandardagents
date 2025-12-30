import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'API Documentation',
  description: 'OSSA API documentation and OpenAPI specifications',
};

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">API Documentation</h1>
      
      <div className="prose max-w-none">
        <p className="text-lg text-gray-700 mb-6">
          This page has been migrated from static HTML to Next.js. For API documentation,
          see the <Link href="/docs/openapi-extensions" className="text-blue-600 hover:underline">OpenAPI Extensions</Link> documentation.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700">
            <strong>Note:</strong> API documentation is now integrated into the main documentation.
            OpenAPI specifications are available in the <code className="bg-gray-100 px-2 py-1 rounded">/public/openapi/</code> directory.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Quick Links</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><Link href="/docs/openapi-extensions" className="text-blue-600 hover:underline">OpenAPI Extensions</Link></li>
          <li><Link href="/docs/openapi-integration/openapi-3.1-specification" className="text-blue-600 hover:underline">OpenAPI 3.1 Integration</Link></li>
          <li><Link href="/docs/cli-reference" className="text-blue-600 hover:underline">CLI Reference</Link></li>
        </ul>
      </div>
    </div>
  );
}
