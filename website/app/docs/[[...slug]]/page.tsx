import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { MarkdownContent } from '@/components/docs/MarkdownContent';

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

const docsDirectory = path.join(process.cwd(), '../../.gitlab/wiki-content');

function getDocContent(slug: string[]): { content: string; metadata: any } | null {
  const filePath = path.join(docsDirectory, ...slug, 'index.md');
  const altPath = path.join(docsDirectory, ...slug.slice(0, -1), `${slug[slug.length - 1]}.md`);

  let fullPath = filePath;
  if (!fs.existsSync(fullPath)) {
    fullPath = altPath;
  }

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    content,
    metadata: {
      title: data.title || slug[slug.length - 1],
      description: data.description,
    },
  };
}

function getAllDocPaths(): string[][] {
  const paths: string[][] = [];

  function traverseDir(dir: string, currentPath: string[] = []): void {
    if (!fs.existsSync(dir)) {
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        traverseDir(path.join(dir, entry.name), [...currentPath, entry.name]);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const slug = entry.name.replace(/\.md$/, '');
        if (slug !== 'index') {
          paths.push([...currentPath, slug]);
        } else if (currentPath.length > 0) {
          paths.push(currentPath);
        }
      }
    }
  }

  traverseDir(docsDirectory);
  return paths;
}

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  const paths = getAllDocPaths();
  // Return root docs page as undefined slug, plus all other paths
  return [{ slug: undefined }, ...paths.map((slug) => ({
    slug,
  }))];
}

export default async function DocsPage({ params }: PageProps): Promise<JSX.Element> {
  const { slug: slugParam } = await params;
  const slug = slugParam || [];
  
  // Handle root /docs route
  if (slug.length === 0) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Documentation</h1>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="card-hover">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Getting Started</h2>
            <ul className="space-y-2">
              <li><a href="/docs/getting-started/5-minute-overview" className="text-primary hover:underline">5-Minute Overview</a></li>
              <li><a href="/docs/getting-started/installation" className="text-primary hover:underline">Installation Guide</a></li>
              <li><a href="/docs/getting-started/hello-world" className="text-primary hover:underline">Hello World Tutorial</a></li>
              <li><a href="/docs/getting-started/first-agent" className="text-primary hover:underline">First Agent Creation</a></li>
            </ul>
          </div>
          <div className="card-hover">
            <h2 className="text-2xl font-semibold mb-4 text-primary">For Audiences</h2>
            <ul className="space-y-2">
              <li><a href="/docs/for-audiences/developers" className="text-primary hover:underline">For Developers</a></li>
              <li><a href="/docs/for-audiences/architects" className="text-primary hover:underline">For Architects</a></li>
              <li><a href="/docs/for-audiences/enterprises" className="text-primary hover:underline">For Enterprises</a></li>
              <li><a href="/docs/for-audiences/students-researchers" className="text-primary hover:underline">For Students & Researchers</a></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  const doc = getDocContent(slug);

  if (!doc) {
    notFound();
  }

  return (
    <div className="flex min-h-screen">
      <DocsSidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
          <article className="prose prose-lg max-w-none">
            <h1>{doc.metadata.title}</h1>
            {doc.metadata.description && (
              <p className="text-xl text-gray-600">{doc.metadata.description}</p>
            )}
            <div className="mt-8">
              <MarkdownContent content={doc.content} />
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}

