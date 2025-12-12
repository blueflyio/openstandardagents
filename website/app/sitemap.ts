import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

function getAllPages(): string[] {
  // All static pages in the app
  const pages: string[] = [
    '',                    // Home
    '/about',
    '/blog',
    '/brand',
    '/design-guide',
    '/docs',
    '/ecosystem',
    '/examples',
    '/license',
    '/playground',
    '/schema',
    '/specification',
  ];

  // Add blog posts
  const blogDir = path.join(process.cwd(), '../content/blog');
  if (fs.existsSync(blogDir)) {
    const files = fs.readdirSync(blogDir);
    files
      .filter((file) => file.endsWith('.md'))
      .forEach((file) => {
        pages.push(`/blog/${file.replace(/\.md$/, '')}`);
      });
  }

  // Add docs pages
  const docsDir = path.join(process.cwd(), '../../.gitlab/wiki-content');
  if (fs.existsSync(docsDir)) {
    const traverseDir = (dir: string, basePath = ''): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          traverseDir(path.join(dir, entry.name), `${basePath}/${entry.name}`);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const slug = entry.name.replace(/\.md$/, '');
          if (slug !== 'index') {
            pages.push(`/docs${basePath}/${slug}`);
          } else if (basePath) {
            pages.push(`/docs${basePath}`);
          }
        }
      }
    }
    traverseDir(docsDir);
  }

  return pages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://openstandardagents.org';
  const pages = getAllPages();

  return pages.map((page) => {
    // Determine priority based on page type
    let priority = 0.8;
    let changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'monthly';

    if (page === '') {
      priority = 1.0;
      changeFrequency = 'weekly';
    } else if (page === '/docs') {
      priority = 0.95;
      changeFrequency = 'weekly';
    } else if (page.startsWith('/docs/getting-started')) {
      priority = 0.9;
      changeFrequency = 'weekly';
    } else if (page.startsWith('/docs')) {
      priority = 0.85;
      changeFrequency = 'weekly';
    } else if (page === '/examples' || page === '/playground') {
      priority = 0.85;
      changeFrequency = 'weekly';
    } else if (page === '/schema') {
      priority = 0.9;
      changeFrequency = 'weekly';
    } else if (page === '/blog') {
      priority = 0.8;
      changeFrequency = 'daily';
    } else if (page.startsWith('/blog/')) {
      priority = 0.7;
      changeFrequency = 'monthly';
    } else if (page === '/brand' || page === '/license') {
      priority = 0.5;
      changeFrequency = 'yearly';
    }

    return {
      url: `${baseUrl}${page === '' ? '' : page}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
  });
}

