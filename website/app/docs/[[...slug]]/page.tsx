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
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-secondary text-white py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex items-center mb-6">
              <svg className="w-12 h-12 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h1 className="text-5xl font-bold">OSSA Documentation</h1>
            </div>
            <p className="text-2xl text-white/90 max-w-3xl">
              Everything you need to build, deploy, and scale production-grade AI agents using the Open Standard for Scalable Agents.
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-12">
          {/* Quick Start Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 mb-12 border-2 border-blue-200 shadow-lg">
            <div className="flex items-start gap-6">
              <div className="bg-primary/10 rounded-xl p-4">
                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Get Started in 5 Minutes</h2>
                <p className="text-lg text-gray-700 mb-4">
                  Create your first AI agent with OSSA. No vendor lock-in, no proprietary formats—just open standards.
                </p>
                <div className="flex gap-4">
                  <a href="/docs/getting-started/5-minute-overview" className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                    Quick Start Guide →
                  </a>
                  <a href="/playground" className="bg-white border-2 border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                    Try Playground
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Documentation Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Getting Started */}
            <div className="card border-2 border-gray-300 hover:border-primary hover:shadow-xl transition-all">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 mb-4 border border-green-200">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Getting Started</h2>
              <p className="text-base text-gray-600 mb-6">Learn the basics and create your first agent</p>
              <ul className="space-y-3">
                <li>
                  <a href="/docs/getting-started/5-minute-overview" className="flex items-center text-primary hover:underline font-medium">
                    <span className="mr-2">→</span> 5-Minute Overview
                  </a>
                </li>
                <li>
                  <a href="/docs/getting-started/installation" className="flex items-center text-primary hover:underline font-medium">
                    <span className="mr-2">→</span> Installation Guide
                  </a>
                </li>
                <li>
                  <a href="/docs/getting-started/hello-world" className="flex items-center text-primary hover:underline font-medium">
                    <span className="mr-2">→</span> Hello World Tutorial
                  </a>
                </li>
                <li>
                  <a href="/docs/getting-started/first-agent" className="flex items-center text-primary hover:underline font-medium">
                    <span className="mr-2">→</span> First Agent Creation
                  </a>
                </li>
              </ul>
            </div>

            {/* Core Concepts */}
            <div className="card border-2 border-gray-300 hover:border-primary hover:shadow-xl transition-all">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 mb-4 border border-blue-200">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Core Concepts</h2>
              <p className="text-base text-gray-600 mb-6">Understand the fundamentals of OSSA</p>
              <ul className="space-y-3">
                <li>
                  <a href="/docs/core-concepts/manifest-structure" className="flex items-center text-primary hover:underline font-medium">
                    <span className="mr-2">→</span> Manifest Structure
                  </a>
                </li>
                <li>
                  <a href="/docs/core-concepts/autonomy-levels" className="flex items-center text-primary hover:underline font-medium">
                    <span className="mr-2">→</span> Autonomy Levels (L0-L4)
                  </a>
                </li>
                <li>
                  <a href="/docs/core-concepts/tools-capabilities" className="flex items-center text-primary hover:underline font-medium">
                    <span className="mr-2">→</span> Tools & Capabilities
                  </a>
                </li>
                <li>
                  <a href="/docs/core-concepts/llm-providers" className="flex items-center text-primary hover:underline font-medium">
                    <span className="mr-2">→</span> LLM Providers
                  </a>
                </li>
              </ul>
            </div>

            {/* Advanced Topics */}
            <div className="card border-2 border-gray-300 hover:border-primary hover:shadow-xl transition-all">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 mb-4 border border-purple-200">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Advanced Topics</h2>
              <p className="text-base text-gray-600 mb-6">Production deployment and optimization</p>
              <ul className="space-y-3">
                <li>
                  <a href="/docs/advanced/multi-agent-systems" className="flex items-center text-primary hover:underline font-medium">
                    <span className="mr-2">→</span> Multi-Agent Systems
                  </a>
                </li>
                <li>
                  <a href="/docs/advanced/security-best-practices" className="flex items-center text-primary hover:underline font-medium">
                    <span className="mr-2">→</span> Security Best Practices
                  </a>
                </li>
                <li>
                  <a href="/docs/advanced/monitoring-observability" className="flex items-center text-primary hover:underline font-medium">
                    <span className="mr-2">→</span> Monitoring & Observability
                  </a>
                </li>
                <li>
                  <a href="/docs/advanced/performance-optimization" className="flex items-center text-primary hover:underline font-medium">
                    <span className="mr-2">→</span> Performance Optimization
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* For Different Audiences */}
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Documentation for Different Audiences</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="card border-2 border-gray-300 hover:border-secondary hover:shadow-xl transition-all">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">For Developers</h3>
                  <p className="text-base text-gray-600 mb-4">API references, code examples, and integration guides for building with OSSA.</p>
                  <a href="/docs/for-audiences/developers" className="text-primary font-semibold hover:underline">Read Developer Docs →</a>
                </div>
              </div>
            </div>

            <div className="card border-2 border-gray-300 hover:border-secondary hover:shadow-xl transition-all">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">For Architects</h3>
                  <p className="text-base text-gray-600 mb-4">System design patterns, architecture decisions, and scalability considerations.</p>
                  <a href="/docs/for-audiences/architects" className="text-primary font-semibold hover:underline">Read Architecture Docs →</a>
                </div>
              </div>
            </div>

            <div className="card border-2 border-gray-300 hover:border-secondary hover:shadow-xl transition-all">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-lg p-3 border border-teal-200">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">For Enterprises</h3>
                  <p className="text-base text-gray-600 mb-4">Compliance, governance, security policies, and enterprise deployment strategies.</p>
                  <a href="/docs/for-audiences/enterprises" className="text-primary font-semibold hover:underline">Read Enterprise Docs →</a>
                </div>
              </div>
            </div>

            <div className="card border-2 border-gray-300 hover:border-secondary hover:shadow-xl transition-all">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">For Students & Researchers</h3>
                  <p className="text-base text-gray-600 mb-4">Academic research, experimentation guides, and educational resources.</p>
                  <a href="/docs/for-audiences/students-researchers" className="text-primary font-semibold hover:underline">Read Academic Docs →</a>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="card bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
                <svg className="w-7 h-7 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Examples & Templates
              </h3>
              <p className="text-base text-gray-700 mb-4">Real-world examples and production-ready templates</p>
              <ul className="space-y-2">
                <li><a href="/examples" className="text-primary hover:underline font-medium">→ Browse 58+ Examples</a></li>
                <li><a href="/docs/examples/migration-guides" className="text-primary hover:underline font-medium">→ Migration Guides</a></li>
                <li><a href="/playground" className="text-primary hover:underline font-medium">→ Interactive Playground</a></li>
              </ul>
            </div>

            <div className="card bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
                <svg className="w-7 h-7 mr-3 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schema Reference
              </h3>
              <p className="text-base text-gray-700 mb-4">Complete specification and field definitions</p>
              <ul className="space-y-2">
                <li><a href="/schema" className="text-primary hover:underline font-medium">→ Full Schema Reference</a></li>
                <li><a href="/specification" className="text-primary hover:underline font-medium">→ Technical Specification</a></li>
                <li><a href="https://github.com/BlueflyCollective/openstandardagents" className="text-primary hover:underline font-medium">→ GitHub Repository</a></li>
              </ul>
            </div>
          </div>

          {/* Community & Support */}
          <div className="card border-3 border-primary bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center">
              <svg className="w-9 h-9 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Community & Support
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-bold text-lg mb-2 text-gray-900">Get Help</h4>
                <ul className="space-y-2 text-base">
                  <li><a href="https://github.com/BlueflyCollective/openstandardagents/discussions" className="text-primary hover:underline">GitHub Discussions</a></li>
                  <li><a href="https://github.com/BlueflyCollective/openstandardagents/issues" className="text-primary hover:underline">Report Issues</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-gray-900">Contribute</h4>
                <ul className="space-y-2 text-base">
                  <li><a href="https://github.com/BlueflyCollective/openstandardagents" className="text-primary hover:underline">GitHub Repository</a></li>
                  <li><a href="/docs/contributing" className="text-primary hover:underline">Contributing Guide</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-gray-900">Stay Updated</h4>
                <ul className="space-y-2 text-base">
                  <li><a href="/blog" className="text-primary hover:underline">Blog & Updates</a></li>
                  <li><a href="/rss.xml" className="text-primary hover:underline">RSS Feed</a></li>
                </ul>
              </div>
            </div>
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

