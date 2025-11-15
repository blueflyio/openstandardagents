import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { MarkdownContent } from '@/components/docs/MarkdownContent';
import { StructuredData } from '@/components/StructuredData';
import Link from 'next/link';
import type { Metadata } from 'next';

interface PageProps {
  params: {
    slug: string;
  };
}

function getPost(slug: string): {
  content: string;
  metadata: {
    title: string;
    date: string;
    author: string;
    category: string;
    tags: string[];
    excerpt: string;
  };
} | null {
  const blogDir = path.join(process.cwd(), '../../content/blog');
  const filePath = path.join(blogDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    content,
    metadata: {
      title: data.title || '',
      date: data.date || '',
      author: data.author || 'OSSA Team',
      category: data.category || 'General',
      tags: data.tags || [],
      excerpt: data.excerpt || '',
    },
  };
}

function getAllPostSlugs(): string[] {
  const blogDir = path.join(process.cwd(), '../../content/blog');

  if (!fs.existsSync(blogDir)) {
    return [];
  }

  const files = fs.readdirSync(blogDir);
  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''));
}

export function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const post = getPost(params.slug);

  if (!post) {
    return {};
  }

  return {
    title: post.metadata.title,
    description: post.metadata.excerpt,
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.excerpt,
      type: 'article',
      publishedTime: post.metadata.date,
      authors: [post.metadata.author],
      tags: post.metadata.tags,
    },
  };
}

export default function BlogPostPage({ params }: PageProps): JSX.Element {
  const post = getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/blog"
        className="text-primary hover:underline mb-4 inline-block"
      >
        ← Back to Blog
      </Link>

      <StructuredData
        type="Article"
        data={{
          title: post.metadata.title,
          date: post.metadata.date,
          author: post.metadata.author,
          description: post.metadata.excerpt,
        }}
      />
      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.metadata.title}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <time dateTime={post.metadata.date}>
              {format(new Date(post.metadata.date), 'MMMM d, yyyy')}
            </time>
            <span>•</span>
            <span>{post.metadata.author}</span>
            <span>•</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
              {post.metadata.category}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-4">
            {post.metadata.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="prose prose-lg max-w-none">
          <MarkdownContent content={post.content} />
        </div>
      </article>
    </div>
  );
}

