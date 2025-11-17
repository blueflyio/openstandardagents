import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

function getAllPages(): string[] {
  const pages: string[] = ['', '/docs', '/playground', '/examples', '/schema', '/blog'];

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
  const baseUrl = 'https://github.com/BlueflyCollective/openstandardagents';
  const pages = getAllPages();

  return pages.map((page) => ({
    url: `${baseUrl}${page === '' ? '' : page}`,
    lastModified: new Date(),
    changeFrequency: page.startsWith('/blog') ? 'weekly' : 'monthly',
    priority: page === '' ? 1.0 : page.startsWith('/docs') ? 0.9 : 0.8,
  }));
}

