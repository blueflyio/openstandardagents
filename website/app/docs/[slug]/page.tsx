import { readFileSync } from 'fs';
import { join } from 'path';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

export default function DocPage({ params }: { params: { slug: string } }) {
  const docsDir = join(process.cwd(), 'content', 'docs');
  const docFiles: Record<string, string> = {
    'migration-v0.3.2-to-v0.3.3': 'migration-v0.3.2-to-v0.3.3.md',
    'skills-extension': 'skills-extension.md',
  };

  const filename = docFiles[params.slug];
  if (!filename) {
    notFound();
  }

  try {
    const filePath = join(docsDir, filename);
    const content = readFileSync(filePath, 'utf-8');
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Home
          </Link>
          <article className="bg-white rounded-lg shadow-lg p-8 prose prose-lg max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading doc:', error);
    notFound();
  }
}
