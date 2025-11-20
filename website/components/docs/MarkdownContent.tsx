'use client';

import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MarkdownContentProps {
  content: string;
  currentPath?: string; // Current pathname for resolving relative links
}

// Helper function to generate ID from heading text
function generateId(text: string): string {
  // Extract ID from {#id} syntax if present
  const idMatch = text.match(/\{#([^}]+)\}/);
  if (idMatch) {
    return idMatch[1];
  }
  // Otherwise generate from text
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper function to clean heading text (remove {#id} syntax)
function cleanHeadingText(text: string): string {
  return text.replace(/\s*\{#[^}]+\}\s*$/, '').trim();
}

// Helper function to fix markdown bold syntax with spaces
function fixMarkdownBold(content: string): string {
  // Fix patterns like "** text**" or "**text **" to "**text**"
  // Also handle cases where ** is at the start of a line or after a heading
  return content
    // Fix "** text" patterns (space after opening **)
    .replace(/\*\* +([^*]+?)\*\*/g, '**$1**')
    // Fix "text **" patterns (space before closing **)
    .replace(/\*\*([^*]+?) +\*\*/g, '**$1**')
    // Fix "** text **" patterns (spaces on both sides)
    .replace(/\*\* +([^*]+?) +\*\*/g, '**$1**');
}

// Helper function to resolve relative markdown links to Next.js routes
function resolveMarkdownLink(href: string, currentPath: string): string {
  // Already absolute or external
  if (href.startsWith('/') || href.startsWith('http') || href.startsWith('#')) {
    return href;
  }

  // Split anchor from path
  const [pathPart, anchor] = href.split('#');
  const anchorPart = anchor ? `#${anchor}` : '';

  // Remove .md extension
  let normalized = pathPart.replace(/\.md$/, '');

  // Handle relative paths starting with ./
  if (normalized.startsWith('./')) {
    normalized = normalized.slice(2);
  }

  // Convert PascalCase/CamelCase to kebab-case
  normalized = normalized
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert dash before capital letters
    .toLowerCase()
    .replace(/[^a-z0-9/-]/g, '-') // Replace non-alphanumeric with dash
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes

  // If currentPath is provided, resolve relative to it
  if (currentPath && !normalized.startsWith('/')) {
    // Get the directory of the current page
    const pathParts = currentPath.split('/').filter(Boolean);
    // Remove the last part (current file) to get directory
    const currentDir = pathParts.slice(0, -1);

    // Handle parent directory references (../)
    if (normalized.startsWith('../')) {
      const upLevels = (normalized.match(/\.\.\//g) || []).length;
      normalized = normalized.replace(/\.\.\//g, '');
      const newDir = currentDir.slice(0, -upLevels);
      return `/docs/${newDir.join('/')}/${normalized}${anchorPart}`;
    }

    // Same directory or subdirectory
    if (currentDir.length > 0) {
      return `/docs/${currentDir.join('/')}/${normalized}${anchorPart}`;
    }
    return `/docs/${normalized}${anchorPart}`;
  }

  // Default to /docs/ prefix if no current path
  return `/docs/${normalized}${anchorPart}`;
}

export function MarkdownContent({ content, currentPath }: MarkdownContentProps) {
  const pathname = usePathname();
  const basePath = currentPath || pathname;

  // Handle anchor link scrolling on mount and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Offset for sticky header
            window.scrollBy(0, -80);
          }
        }, 100);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [pathname]);

  // Fix markdown bold syntax issues
  const fixedContent = fixMarkdownBold(content);

  return (
    <div className="markdown-content [&_pre_code]:bg-transparent [&_pre_code]:text-code-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with IDs
          h1: ({ children }) => {
            const text = React.Children.toArray(children).join('');
            const id = generateId(text);
            const cleanText = cleanHeadingText(text);
            return (
              <h1
                id={id}
                className="text-3xl md:text-4xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200 scroll-mt-20"
              >
                {cleanText}
              </h1>
            );
          },
          h2: ({ children }) => {
            const text = React.Children.toArray(children).join('');
            const id = generateId(text);
            const cleanText = cleanHeadingText(text);
            return (
              <h2
                id={id}
                className="text-2xl md:text-3xl font-semibold text-gray-900 mt-8 mb-4 scroll-mt-20"
              >
                {cleanText}
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = React.Children.toArray(children).join('');
            const id = generateId(text);
            const cleanText = cleanHeadingText(text);
            return (
              <h3
                id={id}
                className="text-xl md:text-2xl font-semibold text-gray-900 mt-6 mb-3 scroll-mt-20"
              >
                {cleanText}
              </h3>
            );
          },
          h4: ({ children }) => {
            const text = React.Children.toArray(children).join('');
            const id = generateId(text);
            const cleanText = cleanHeadingText(text);
            return (
              <h4
                id={id}
                className="text-lg md:text-xl font-semibold text-gray-900 mt-4 mb-2 scroll-mt-20"
              >
                {cleanText}
              </h4>
            );
          },

          // Paragraphs
          p: ({ children }) => (
            <p className="text-gray-700 leading-7 mb-4">
              {children}
            </p>
          ),

          // Links - handle anchor links and internal/external links
          a: ({ href, children }) => {
            if (!href) return <>{children}</>;

            // Handle anchor links (starting with #)
            if (href.startsWith('#')) {
              return (
                <a
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    const id = href.slice(1);
                    const element = document.getElementById(id);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      // Offset for sticky header
                      window.scrollBy(0, -80);
                      // Update URL without scrolling
                      window.history.pushState(null, '', `${pathname}${href}`);
                    }
                  }}
                  className="text-primary hover:text-primary-dark underline"
                >
                  {children}
                </a>
              );
            }

            // Handle external links
            if (href.startsWith('http')) {
              return (
                <a
                  href={href}
                  className="text-primary hover:text-primary-dark underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              );
            }

            // Resolve relative markdown links to Next.js routes
            const resolvedHref = resolveMarkdownLink(href, basePath);

            // Handle internal links
            return (
              <Link
                href={resolvedHref}
                className="text-primary hover:text-primary-dark underline"
              >
                {children}
              </Link>
            );
          },

          // Lists - Tighter spacing for technical documentation
          ul: ({ children }) => (
            <ul className="list-disc list-outside mb-3 ml-5 space-y-1 text-gray-700 text-base">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside mb-3 ml-5 space-y-1 text-gray-700 text-base">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic">
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50">
              {children}
            </tr>
          ),

          // Code
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;

            // Check if this code is inside a pre tag (block code)
            const isBlockCode = (props.node?.parent as any)?.tagName === 'pre';

            if (match) {
              return (
                <div className="my-4 rounded-lg overflow-hidden overflow-x-auto">
                  <SyntaxHighlighter
                    style={vscDarkPlus as any}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: '#1e1e1e',
                      color: '#d4d4d4',
                    }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              );
            }

            // If it's a block code (inside pre), use dark background - no light background
            if (isBlockCode) {
              return (
                <code className="bg-transparent text-code-text text-sm font-mono whitespace-pre">
                  {children}
                </code>
              );
            }

            // Inline code
            return (
              <code className="bg-gray-100 text-primary px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            );
          },

          // Pre (for code blocks without language)
          pre: ({ children }) => {
            // Check if children contain a code element
            const hasCode = React.Children.toArray(children).some(
              (child: any) => child?.type === 'code' || child?.props?.node?.tagName === 'code'
            );

            return (
              <pre className="bg-code-bg text-code-text p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono">
                {children}
              </pre>
            );
          },

          // Horizontal rule
          hr: () => (
            <hr className="my-8 border-t border-gray-200" />
          ),

          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),

          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic">
              {children}
            </em>
          ),

          // Images
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ''}
              className="max-w-full h-auto rounded-lg my-4 shadow-sm"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

