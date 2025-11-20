import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { MarkdownContent } from '@/components/docs/MarkdownContent';
import Link from 'next/link';

// GitHub API utilities
const GITHUB_OWNER = 'blueflyio';
const GITHUB_REPO = 'openstandardagents';
const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubRepoInfo {
  stars: number;
  forks: number;
  openIssues: number;
  openPullRequests: number;
  description: string;
  language: string | null;
  updatedAt: string;
  watchers: number;
}

async function fetchRepoInfo(): Promise<GitHubRepoInfo | null> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    // Fetch repository info
    const repoResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
      {
        headers,
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!repoResponse.ok) {
      return null;
    }

    const repoData = await repoResponse.json();

    // Fetch issues and pull requests separately to get accurate counts
    // Use search API for accurate counts without pagination
    const [issuesSearchResponse, prsResponse] = await Promise.all([
      fetch(
        `${GITHUB_API_BASE}/search/issues?q=repo:${GITHUB_OWNER}/${GITHUB_REPO}+type:issue+state:open&per_page=1`,
        {
          headers,
          next: { revalidate: 300 },
        }
      ),
      fetch(
        `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?state=open&per_page=1`,
        {
          headers,
          next: { revalidate: 300 },
        }
      ),
    ]);

    let openIssues = 0;
    let openPullRequests = 0;

    if (issuesSearchResponse.ok) {
      const issuesData = await issuesSearchResponse.json();
      openIssues = issuesData.total_count || 0;
    }

    if (prsResponse.ok) {
      try {
        const prsLink = prsResponse.headers.get('link');
        if (prsLink && prsLink.includes('rel="last"')) {
          // Parse pagination to get total count
          const lastMatch = prsLink.match(/<[^>]+page=(\d+)[^>]*>; rel="last"/);
          if (lastMatch) {
            const lastPageNum = parseInt(lastMatch[1]);
            const lastPageResponse = await fetch(
              `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?state=open&per_page=100&page=${lastPageNum}`,
              { headers, next: { revalidate: 300 } }
            );
            if (lastPageResponse.ok) {
              const lastPageData = await lastPageResponse.json();
              openPullRequests = (lastPageNum - 1) * 100 + lastPageData.length;
            }
          }
        } else {
          const prsData = await prsResponse.json();
          openPullRequests = Array.isArray(prsData) ? prsData.length : 0;
        }
      } catch (error) {
        console.error('Error parsing PRs response:', error);
        openPullRequests = 0;
      }
    }

    return {
      stars: repoData?.stargazers_count || 0,
      forks: repoData?.forks_count || 0,
      openIssues: openIssues || 0,
      openPullRequests: openPullRequests || 0,
      description: repoData?.description || '',
      language: repoData?.language || null,
      updatedAt: repoData?.updated_at || '',
      watchers: repoData?.watchers_count || 0,
    };
  } catch (error) {
    console.error('Error fetching GitHub repo info:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

const docsDirectory = path.join(process.cwd(), 'content/docs');

function getDocContent(slug: string[]): { content: string; metadata: any } | null {
  // Convert URL slug to PascalCase for legacy wiki files
  const slugPath = slug.map(s =>
    s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-')
  );

  // Try different path patterns - lowercase first (new convention), then PascalCase (legacy)
  const possiblePaths = [
    // Lowercase paths (current convention) - try index.md first for directories
    path.join(docsDirectory, ...slug, 'index.md'),
    path.join(docsDirectory, ...slug, 'readme.md'),
    path.join(docsDirectory, ...slug) + '.md',
    // PascalCase paths (legacy wiki structure)
    path.join(docsDirectory, ...slugPath, 'index.md'),
    path.join(docsDirectory, ...slugPath, 'README.md'),
    path.join(docsDirectory, ...slugPath) + '.md',
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
    try {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory does not exist: ${dir}`);
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden files and directories
      if (entry.name.startsWith('.')) {
        continue;
      }

      if (entry.isDirectory()) {
        traverseDir(path.join(dir, entry.name), [...currentPath, entry.name]);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const slug = entry.name.replace(/\.md$/, '');
        if (slug !== 'index' && slug !== 'README' && slug !== 'readme') {
          paths.push([...currentPath, slug]);
        } else if (currentPath.length > 0) {
          paths.push(currentPath);
        }
      }
    }
    } catch (error) {
      console.error(`Error traversing directory ${dir}:`, error);
    }
  }

  try {
  traverseDir(docsDirectory);
  } catch (error) {
    console.error(`Error getting doc paths from ${docsDirectory}:`, error);
  }

  return paths;
}

export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string[] }> {
  try {
    if (!fs.existsSync(docsDirectory)) {
      console.warn(`Docs directory not found: ${docsDirectory}`);
      return [{ slug: [] }];
    }

  const paths = getAllDocPaths();
    const result = [
    { slug: [] },
      ...paths.map(slugParts => ({
        slug: slugParts.map(p => String(p).toLowerCase())
    }))
  ];

    return result;
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [{ slug: [] }];
  }
}

export default async function DocsPage({ params }: PageProps) {
  const { slug: slugParam } = await params;
  const slug = slugParam || [];
  
  // Fetch GitHub repo info for root docs page (with error handling)
  let repoInfo = null;
  if (slug.length === 0) {
    try {
      repoInfo = await fetchRepoInfo();
    } catch (error) {
      console.error('Failed to fetch GitHub repo info:', error);
      // Continue without repo info rather than crashing
    }
  }

  // Handle root /docs route - CLEAN, PROFESSIONAL DESIGN
  if (slug.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary via-accent to-secondary text-white py-16 px-4">
          <div className="container mx-auto max-w-6xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold mb-4">Documentation</h1>
            <p className="text-xl text-white/90 mb-2">
              Complete guides for building portable, framework-agnostic AI agents
            </p>
            <p className="text-lg text-white/80 mb-6">
              Learn OSSA • Build Agents • Deploy Anywhere
            </p>
            {repoInfo && (
              <div className="flex items-center justify-center gap-6 text-white/90">
                <a
                  href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{repoInfo.stars.toLocaleString()}</span>
                  <span className="text-white/70">stars</span>
                </a>
                <a
                  href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/forks`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="font-semibold">{repoInfo.forks.toLocaleString()}</span>
                  <span className="text-white/70">forks</span>
                </a>
                <a
                  href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M2.5 12a9.5 9.5 0 1119 0 9.5 9.5 0 01-19 0zM12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM12 8a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1zm0 6a1 1 0 011 1v.5a1 1 0 11-2 0V15a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{repoInfo.openIssues}</span>
                  <span className="text-white/70">issues</span>
                </a>
                <a
                  href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M2.5 12a9.5 9.5 0 1119 0 9.5 9.5 0 01-19 0zM12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM12 8a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1zm0 6a1 1 0 011 1v.5a1 1 0 11-2 0V15a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{repoInfo.openPullRequests}</span>
                  <span className="text-white/70">PRs</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto max-w-6xl px-4 py-12">

          {/* Featured Quick Start */}
          <section className="mb-16">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-lg">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Quick Start</h3>
                  <p className="text-lg text-gray-700 mb-4">
                    New to OSSA? Start with the 5-minute overview, then build your first agent in minutes.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link href="/docs/getting-started/5-minute-overview" className="btn-primary">
                      5-Minute Overview →
                    </Link>
                    <Link href="/docs/getting-started/hello-world" className="btn-outline">
                      Hello World →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Documentation - Blog Style Teasers */}
          <section className="mb-16">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-primary">Core Documentation</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">

              {/* Getting Started - Blog Teaser */}
              <Link href="/docs/getting-started/5-minute-overview" className="group bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Getting Started</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Learn the fundamentals of OSSA and build your first agent in minutes.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="text-gray-700 flex items-center">
                    <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    5-Minute Overview
                  </li>
                  <li className="text-gray-700 flex items-center">
                    <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Hello World
                  </li>
                  <li className="text-gray-700 flex items-center">
                    <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Your First Agent
                  </li>
                </ul>
              </Link>

              {/* API Reference - Blog Teaser */}
              <Link href="/schema" className="group bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">API Reference</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Complete schema reference, OpenAPI extensions, and quick reference guides.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="text-gray-700 flex items-center">
                    <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Schema Reference
                  </li>
                  <li className="text-gray-700 flex items-center">
                    <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    OpenAPI Extensions
                  </li>
                  <li className="text-gray-700 flex items-center">
                    <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Quick Reference
                  </li>
                </ul>
              </Link>

              {/* Migration Guides - Blog Teaser */}
              <Link href="/docs/migration-guides/langchain-to-ossa" className="group bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Migration Guides</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Migrate your existing agents from popular frameworks to OSSA.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="text-gray-700 flex items-center">
                    <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    From LangChain
                  </li>
                  <li className="text-gray-700 flex items-center">
                    <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    From Anthropic MCP
                  </li>
                  <li className="text-gray-700 flex items-center">
                    <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    From OpenAI
                  </li>
                </ul>
              </Link>

            </div>
          </section>

          {/* By Role - Blog Style Cards */}
          <section className="mb-16">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-primary">By Role</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <Link href="/docs/for-audiences/developers" className="group bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Developers</h3>
                <p className="text-sm text-gray-600">Build agents with code</p>
              </Link>
              <Link href="/docs/for-audiences/architects" className="group bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Architects</h3>
                <p className="text-sm text-gray-600">Design systems</p>
              </Link>
              <Link href="/docs/for-audiences/enterprises" className="group bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Enterprises</h3>
                <p className="text-sm text-gray-600">Deploy at scale</p>
              </Link>
              <Link href="/docs/for-audiences/students-researchers" className="group bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Researchers</h3>
                <p className="text-sm text-gray-600">Academic resources</p>
              </Link>
            </div>
          </section>

          {/* GitHub Repository Info */}
          {repoInfo && (
            <section className="mb-16">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        <a
                          href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          {GITHUB_OWNER}/{GITHUB_REPO}
                        </a>
                      </h3>
                      {repoInfo.description && (
                        <p className="text-gray-600">{repoInfo.description}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary whitespace-nowrap"
                  >
                    View on GitHub
                  </Link>
                </div>
                <div className="grid md:grid-cols-5 gap-4 pt-6 border-t-2 border-gray-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{repoInfo.stars.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Stars</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{repoInfo.forks.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Forks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{repoInfo.openIssues}</div>
                    <div className="text-sm text-gray-600">Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{repoInfo.openPullRequests}</div>
                    <div className="text-sm text-gray-600">Pull Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{repoInfo.language || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Language</div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Resources & Tools */}
          <section className="border-t-2 border-gray-200 pt-12">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-primary">Resources & Tools</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Community</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="https://github.com/blueflyio/openstandardagents/issues" className="text-primary hover:text-secondary font-medium flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Issues & Bugs
                    </a>
                  </li>
                  <li>
                    <Link href="/docs/contributing" className="text-primary hover:text-secondary font-medium flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Contributing
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Resources</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/docs/changelog" className="text-primary hover:text-secondary font-medium flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Changelog
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-primary hover:text-secondary font-medium flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tools</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/playground" className="text-primary hover:text-secondary font-medium flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Playground
                    </Link>
                  </li>
                  <li>
                    <Link href="/schema" className="text-primary hover:text-secondary font-medium flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Schema Explorer
                    </Link>
                  </li>
                </ul>
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

  // Special handling for schema-reference page
  const isSchemaReference = slug.length === 1 && slug[0] === 'schema-reference';

  if (isSchemaReference) {
    return (
      <>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary via-accent to-secondary text-white py-16 px-4">
          <div className="container mx-auto max-w-6xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold mb-4">Schema Reference</h1>
            <p className="text-xl text-white/90 mb-2">
              Complete reference documentation for the OSSA Agent Manifest Schema
            </p>
            <p className="text-lg text-white/80">
              Framework-agnostic • Portable • Validated
            </p>
          </div>
        </div>

        <div className="flex min-h-screen">
          <DocsSidebar />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 container mx-auto max-w-6xl px-4 py-12">
              {/* Quick Links Section */}
              <section className="mb-12">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Link href="/schema" className="group bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Interactive Schema Explorer</h3>
                    <p className="text-gray-600 text-sm">Explore the JSON schema interactively with live examples</p>
                  </Link>
                  <Link href="/playground" className="group bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Validate Your Agent</h3>
                    <p className="text-gray-600 text-sm">Test and validate your agent manifest in real-time</p>
                  </Link>
                  <Link href="/docs/openapi-extensions" className="group bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">OpenAPI Extensions</h3>
                    <p className="text-gray-600 text-sm">Learn how OSSA extends OpenAPI for agent definitions</p>
                  </Link>
                </div>
              </section>

              {/* Schema Components Grid */}
              <section className="mb-12">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-primary">Schema Components</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                    <h3 className="text-xl font-bold mb-3 text-primary">Core Objects</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <Link href="/docs/schema-reference/ossa-manifest" className="hover:text-primary">OSSA Manifest</Link>
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <Link href="/docs/schema-reference/agent-spec" className="hover:text-primary">Agent Spec</Link>
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <Link href="/docs/schema-reference/llm-config" className="hover:text-primary">LLM Configuration</Link>
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <Link href="/docs/schema-reference/tools" className="hover:text-primary">Tools</Link>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white border-2 border-blue-100 rounded-xl p-6 shadow-md hover:shadow-xl hover:border-primary transition-all duration-300">
                    <h3 className="text-xl font-bold mb-3 text-primary">Configuration Objects</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <Link href="/docs/schema-reference/taxonomy" className="hover:text-primary">Taxonomy</Link>
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <Link href="/docs/schema-reference/autonomy" className="hover:text-primary">Autonomy</Link>
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <Link href="/docs/schema-reference/constraints" className="hover:text-primary">Constraints</Link>
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <Link href="/docs/schema-reference/observability" className="hover:text-primary">Observability</Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Main Content */}
              <article className="prose prose-lg max-w-none">
                <div className="mt-8">
                  <MarkdownContent content={doc.content} currentPath={`/docs/${slug.join('/')}`} />
                </div>
              </article>
            </main>
          </div>
        </div>
      </>
    );
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
              <MarkdownContent content={doc.content} currentPath={`/docs/${slug.join('/')}`} />
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}

