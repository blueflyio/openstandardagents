import Link from 'next/link';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const metadata: Metadata = {
  title: 'OSSA Blog - Insights, Research, and Updates',
  description: 'Insights, research, and updates on the open standard for AI agents. Learn about OSSA, agent orchestration, and best practices.',
};

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  formattedDate: string;
  author: string;
  category: string;
  tags: string[];
  excerpt: string;
}

const blogDirectory = path.join(process.cwd(), 'content/blog');

// Helper function to fix malformed YAML frontmatter (double quotes)
function fixYamlFrontmatter(content: string): string {
  // Fix double-quoted values in frontmatter
  // Pattern: key: ""value"" -> key: "value"
  // Also handle escaped quotes in values
  let fixed = content;
  
  // Fix double quotes around values (key: ""value"" -> key: "value")
  fixed = fixed.replace(/(\w+):\s*""([^"]*)""/g, '$1: "$2"');
  
  // Fix escaped quotes in excerpt (\"value\" -> value)
  fixed = fixed.replace(/excerpt:\s*"\\"([^"]*)\\""/g, 'excerpt: "$1"');
  
  return fixed;
}

function getAllBlogPosts(): BlogPost[] {
  if (!fs.existsSync(blogDirectory)) {
    console.warn(`Blog directory does not exist: ${blogDirectory}`);
    return [];
  }

  const fileNames = fs.readdirSync(blogDirectory);
  const posts = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      try {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(blogDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        
        // Fix malformed YAML before parsing
        const fixedContent = fixYamlFrontmatter(fileContents);
        const { data } = matter(fixedContent);

        // Clean up extracted values (remove extra quotes if present)
        const cleanValue = (value: any): any => {
          if (typeof value === 'string') {
            // Remove surrounding double quotes if present
            return value.replace(/^""(.*)""$/, '$1').replace(/^"(.*)"$/, '$1');
          }
          return value;
        };

        const dateValue = cleanValue(data.date) || new Date().toISOString();
        const dateObj = new Date(dateValue);
        const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
        
        // Format date during server-side rendering to avoid hydration mismatch
        const formattedDate = validDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        return {
          slug,
          title: cleanValue(data.title) || slug,
          date: validDate.toISOString(),
          formattedDate,
          author: cleanValue(data.author) || 'OSSA Team',
          category: cleanValue(data.category) || 'General',
          tags: Array.isArray(data.tags) ? data.tags.map(cleanValue) : [],
          excerpt: cleanValue(data.excerpt) || '',
        };
      } catch (error) {
        console.error(`Error parsing blog post ${fileName}:`, error);
        // Return a default post so the page doesn't crash
        const defaultDate = new Date();
        return {
          slug: fileName.replace(/\.md$/, ''),
          title: fileName.replace(/\.md$/, ''),
          date: defaultDate.toISOString(),
          formattedDate: defaultDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          author: 'OSSA Team',
          category: 'General',
          tags: [],
          excerpt: '',
        };
      }
    })
    .filter(post => post !== null && post !== undefined)
    .sort((a, b) => {
      try {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (isNaN(dateA) || isNaN(dateB)) return 0;
        return dateB - dateA;
      } catch {
        return 0;
      }
    });

  return posts;
}

export default function BlogPage() {
  let posts: BlogPost[] = [];
  let featuredPost: BlogPost | undefined;
  let otherPosts: BlogPost[] = [];

  try {
    posts = getAllBlogPosts();
    // Featured post - Welcome to OSSA
    const featuredSlug = 'welcome-to-ossa';
    featuredPost = posts.find(p => p.slug.toLowerCase() === featuredSlug);
    otherPosts = posts.filter(p => p.slug !== featuredPost?.slug);
  } catch (error) {
    console.error('Error loading blog posts:', error);
    // Continue with empty arrays - page will show "No blog posts yet"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-blue-600 to-secondary text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-5xl font-bold mb-6">OSSA Blog</h1>
          <p className="text-xl opacity-90 max-w-3xl mb-4">
            Insights, research, and updates on the open standard for AI agents
          </p>
          {featuredPost && featuredPost.title && featuredPost.excerpt && (
            <p className="text-lg opacity-80 max-w-3xl">
              Start with our featured article: <strong>&quot;{featuredPost.title}&quot;</strong> - {featuredPost.excerpt}
            </p>
          )}
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
                  <span>{featuredPost.formattedDate}</span>
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
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 block border border-gray-200"
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
                <span>{post.formattedDate}</span>
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
