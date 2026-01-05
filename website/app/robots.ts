import { MetadataRoute } from 'next';

// Required for static export (GitLab Pages)
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: 'https://openstandardagents.org/sitemap.xml',
  };
}
