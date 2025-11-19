import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  excerpt: string;
}

const blogDirectory = path.join(process.cwd(), 'content/blog');

function getAllBlogPosts(): BlogPost[] {
  const fileNames = fs.readdirSync(blogDirectory);
  const posts = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(blogDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        title: data.title || slug,
        date: data.date || new Date().toISOString(),
        author: data.author || 'OSSA Team',
        category: data.category || 'General',
        tags: data.tags || [],
        excerpt: data.excerpt || '',
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export default function BlogPage() {
  const posts = getAllBlogPosts();

  // Featured post - OpenAPI AI Agents Standard
  const featuredSlug = 'openapi-ai-agents-standard';
  const featuredPost = posts.find(p => p.slug.toLowerCase().includes(featuredSlug) || p.slug.toLowerCase().includes('openapi'));
  const otherPosts = posts.filter(p => p.slug !== featuredPost?.slug);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-blue-600 to-secondary text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-5xl font-bold mb-6">OSSA Blog</h1>
          <p className="text-xl opacity-90 max-w-3xl">
            Insights, research, and updates on the open standard for AI agents
          </p>
        </div>
      </div>

      {/* Featured Post */}
      {featuredPost && (
        <div className="container mx-auto max-w-6xl px-4 -mt-10">
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="block bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-primary rounded-full">
                  Featured
                </span>
                <span className="inline-block px-3 py-1 text-xs font-semibold text-primary bg-blue-100 rounded-full">
                  {featuredPost.category}
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 hover:text-primary transition-colors">
                {featuredPost.title}
              </h2>

              <p className="text-lg text-gray-600 mb-6 max-w-4xl">
                {featuredPost.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="font-medium">{featuredPost.author}</span>
                  <span>•</span>
                  <span>{new Date(featuredPost.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <span className="text-primary font-medium">Read article →</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Blog Posts Grid */}
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-gray-900">Latest Posts</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="glass-card p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 block"
            >
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-primary bg-blue-100 rounded-full">
                  {post.category}
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-3 text-gray-900 hover:text-primary transition-colors">
                {post.title}
              </h2>

              <p className="text-gray-600 mb-4 line-clamp-3">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{post.author}</span>
                <span>{new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>

              {post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>

        {otherPosts.length === 0 && !featuredPost && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No blog posts yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
