#!/usr/bin/env tsx
/**
 * Cursor Agent Hook: Context Filter
 * 
 * Filters and redacts sensitive information from context.
 */

interface HookContext {
  content: string;
  filePath: string;
}

const SENSITIVE_PATTERNS = [
  /(api[_-]?key|apikey)\s*[:=]\s*["']?([^"'\s]+)/gi,
  /(password|passwd|pwd)\s*[:=]\s*["']?([^"'\s]+)/gi,
  /(secret|token)\s*[:=]\s*["']?([^"'\s]+)/gi,
  /(access[_-]?token)\s*[:=]\s*["']?([^"'\s]+)/gi,
];

export function filterContext(context: HookContext): string {
  let { content, filePath } = context;

  // Skip filtering for test files and examples (they may contain placeholder secrets)
  if (filePath.includes('test') || filePath.includes('example')) {
    return content;
  }

  // Redact sensitive information
  for (const pattern of SENSITIVE_PATTERNS) {
    content = content.replace(pattern, (match, key, value) => {
      return `${key}: [REDACTED]`;
    });
  }

  return content;
}

