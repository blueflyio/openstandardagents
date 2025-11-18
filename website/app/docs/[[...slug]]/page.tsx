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

const docsDirectory = path.join(process.cwd(), 'content/wiki');

function getDocContent(slug: string[]): { content: string; metadata: any } | null {
  // Convert URL slug to PascalCase (e.g., getting-started -> Getting-Started)
  const slugPath = slug.map(s =>
    s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-')
  );

  // Try different path patterns for wiki structure
  const possiblePaths = [
    // Direct file: For-Audiences/Developers.md
    path.join(docsDirectory, ...slugPath) + '.md',
    // Nested index: Getting-Started/Installation/index.md
    path.join(docsDirectory, ...slugPath, 'index.md'),
    // README: Migration-Guides/README.md
    path.join(docsDirectory, ...slugPath, 'README.md'),
    // Lowercase fallback: getting-started.md
    path.join(docsDirectory, ...slug) + '.md',
  ];

  let fullPath = null;
  for (const tryPath of possiblePaths) {
    if (fs.existsSync(tryPath)) {
      fullPath = tryPath;
      break;
    }
  }

  if (!fullPath) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Extract title from frontmatter or generate from slug
  const title = data.title || slug[slug.length - 1]
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    content,
    metadata: {
      title,
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
      <div className="min-h-screen">
        {/* Hero Section with Gradient */}
        <div className="bg-gradient-to-br from-primary via-blue-600 to-secondary text-white py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-5xl font-bold mb-6">OSSA Documentation</h1>
            <p className="text-xl opacity-90 max-w-3xl">
              Complete guides and reference documentation for building, deploying, and managing AI agents with the Open Standard for AI Agents (OSSA).
            </p>
          </div>
        </div>

        {/* Quick Start Banner */}
        <div className="bg-blue-50 border-l-4 border-primary py-6 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">New to OSSA?</h3>
                <p className="mt-2 text-gray-700">
                  Start with our <a href="/docs/getting-started/5-minute-overview" className="text-primary hover:underline font-medium">5-Minute Overview</a>, then try the <a href="/docs/getting-started/hello-world" className="text-primary hover:underline font-medium">Hello World</a> tutorial to get hands-on.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto max-w-6xl px-4 py-16">
          {/* Primary Documentation Sections */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">Core Documentation</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Getting Started */}
              <div className="glass-card p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-primary mb-4">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Getting Started</h3>
                <p className="text-gray-600 mb-4">Everything you need to start building with OSSA</p>
                <ul className="space-y-2">
                  <li><a href="/docs/getting-started/5-minute-overview" className="text-primary hover:underline">5-Minute Overview</a></li>
                  <li><a href="/docs/getting-started/hello-world" className="text-primary hover:underline">Hello World</a></li>
                  <li><a href="/docs/getting-started/first-agent" className="text-primary hover:underline">Your First Agent</a></li>
                  <li><a href="/docs/examples" className="text-primary hover:underline">Examples</a></li>
                </ul>
              </div>

              {/* Migration Guides */}
              <div className="glass-card p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-secondary mb-4">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Migration Guides</h3>
                <p className="text-gray-600 mb-4">Migrate from other frameworks to OSSA</p>
                <ul className="space-y-2">
                  <li><a href="/docs/migration-guides/langchain-to-ossa" className="text-primary hover:underline">From LangChain</a></li>
                  <li><a href="/docs/migration-guides/anthropic-mcp-to-ossa" className="text-primary hover:underline">From Anthropic MCP</a></li>
                  <li><a href="/docs/migration-guides/openai-to-ossa" className="text-primary hover:underline">From OpenAI</a></li>
                  <li><a href="/docs/migration-guides/crewai-to-ossa" className="text-primary hover:underline">From CrewAI</a></li>
                </ul>
              </div>

              {/* Reference */}
              <div className="glass-card p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-primary mb-4">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Reference</h3>
                <p className="text-gray-600 mb-4">Complete API and specification references</p>
                <ul className="space-y-2">
                  <li><a href="/docs/openapi-extensions" className="text-primary hover:underline">OpenAPI Extensions</a></li>
                  <li><a href="/docs/quick-reference" className="text-primary hover:underline">Quick Reference</a></li>
                  <li><a href="/docs/changelog" className="text-primary hover:underline">Changelog</a></li>
                  <li><a href="/docs/contributing" className="text-primary hover:underline">Contributing</a></li>
                </ul>
              </div>
            </div>
          </section>

          {/* Audience-Specific Guides */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">For Your Role</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <a href="/docs/for-audiences/developers" className="glass-card p-6 rounded-lg shadow hover:shadow-lg transition-all duration-300 block">
                <h3 className="text-lg font-semibold mb-2 text-primary">Developers</h3>
                <p className="text-gray-600 text-sm">Build and integrate OSSA agents into your applications</p>
              </a>
              <a href="/docs/for-audiences/architects" className="glass-card p-6 rounded-lg shadow hover:shadow-lg transition-all duration-300 block">
                <h3 className="text-lg font-semibold mb-2 text-primary">Architects</h3>
                <p className="text-gray-600 text-sm">Design scalable agent architectures and systems</p>
              </a>
              <a href="/docs/for-audiences/enterprises" className="glass-card p-6 rounded-lg shadow hover:shadow-lg transition-all duration-300 block">
                <h3 className="text-lg font-semibold mb-2 text-primary">Enterprises</h3>
                <p className="text-gray-600 text-sm">Enterprise deployment, compliance, and governance</p>
              </a>
              <a href="/docs/for-audiences/students-researchers" className="glass-card p-6 rounded-lg shadow hover:shadow-lg transition-all duration-300 block">
                <h3 className="text-lg font-semibold mb-2 text-primary">Students & Researchers</h3>
                <p className="text-gray-600 text-sm">Academic research and educational resources</p>
              </a>
            </div>
          </section>


          {/* Community & Support */}
          <section>
            <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-8 shadow-xl">
              <h2 className="text-2xl font-bold mb-4">Community & Support</h2>
              <p className="mb-6">Join the OSSA community and get help when you need it</p>
              <div className="grid md:grid-cols-3 gap-6">
                <a href="https://gitlab.bluefly.io/llm/ossa/-/issues" className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all">
                  <h3 className="font-semibold mb-2">Issues & Bugs</h3>
                  <p className="text-sm opacity-90">Report issues on GitLab</p>
                </a>
                <a href="/docs/contributing" className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all">
                  <h3 className="font-semibold mb-2">Contributing</h3>
                  <p className="text-sm opacity-90">Help improve OSSA</p>
                </a>
                <a href="https://gitlab.bluefly.io/llm/ossa/-/wikis/home" className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all">
                  <h3 className="font-semibold mb-2">Wiki</h3>
                  <p className="text-sm opacity-90">Community wiki and guides</p>
                </a>
              </div>
            </div>
          </section>
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

