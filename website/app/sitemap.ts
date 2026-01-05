import { MetadataRoute } from 'next';

// Required for static export (GitLab Pages)
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://openstandardagents.org';
  
  // Core pages
  const routes = [
    '',
    '/docs',
    '/docs/specification',
    '/docs/getting-started/5-minute-overview',
    '/docs/getting-started/installation',
    '/docs/getting-started/hello-world',
    '/docs/getting-started/first-agent',
    '/docs/schema-reference',
    '/docs/openapi-extensions',
    '/docs/openapi-integration/openapi-3.1-specification',
    '/docs/implementation/agent-development-workflow',
    '/docs/implementation/runtime-integration',
    '/docs/cli-reference',
    '/docs/architecture/execution-flow',
    '/docs/architecture/multi-agent-systems',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route.startsWith('/docs/specification') ? 0.9 : 0.8,
  }));
}
