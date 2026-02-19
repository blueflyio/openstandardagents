/**
 * Safe YAML Parser
 * Prevents YAML injection attacks and DoS vulnerabilities
 */

import YAML from 'yaml';

export interface SafeYAMLOptions {
  maxAliasCount?: number;
  allowCustomTags?: boolean;
  allowMergeKeys?: boolean;
}

/**
 * Safely parses YAML content with security protections
 * @param content - YAML string to parse
 * @param options - Optional security configuration
 * @returns Parsed YAML object
 */
export function safeParseYAML<T = unknown>(
  content: string,
  options: SafeYAMLOptions = {}
): T {
  const {
    maxAliasCount = 100,
    allowCustomTags = false,
    allowMergeKeys = false,
  } = options;

  // Parse with security restrictions
  const parsed = YAML.parse(content, {
    maxAliasCount, // Prevent billion laughs attack
    customTags: allowCustomTags ? undefined : [], // Disable custom tags
    merge: allowMergeKeys, // Disable merge keys (<<)
  });

  return parsed as T;
}

/**
 * Safely stringifies an object to YAML
 * @param obj - Object to stringify
 * @param options - YAML stringify options (indent, lineWidth, etc.)
 * @returns YAML string
 */
export function safeStringifyYAML(
  obj: unknown,
  options?: {
    indent?: number;
    lineWidth?: number;
    minContentWidth?: number;
    defaultStringType?: 'QUOTE_DOUBLE' | 'PLAIN' | 'QUOTE_SINGLE';
  }
): string {
  // Convert undefined to null for consistent output
  const value = obj === undefined ? null : obj;
  return YAML.stringify(value, {
    indent: options?.indent ?? 2,
    lineWidth: options?.lineWidth ?? 0,
    minContentWidth: options?.minContentWidth ?? 0,
    defaultStringType: options?.defaultStringType ?? ('QUOTE_DOUBLE' as any),
  });
}
