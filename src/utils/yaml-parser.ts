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
export function safeParseYAML<T = unknown>(content: string, options: SafeYAMLOptions = {}): T {
  const { maxAliasCount = 100, allowCustomTags = false, allowMergeKeys = false } = options;

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
 * @returns YAML string
 */
export function safeStringifyYAML(obj: unknown): string {
  // Convert undefined to null for consistent output
  const value = obj === undefined ? null : obj;
  return YAML.stringify(value, {
    // No security restrictions needed for stringify
  });
}
