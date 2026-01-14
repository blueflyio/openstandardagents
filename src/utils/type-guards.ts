/**
 * Type Guards for OSSA Manifests
 *
 * Provides type-safe runtime validation for OSSA manifest structures.
 * Prevents runtime errors from unsafe type casting.
 *
 * DRY: Single source of truth for type checking
 * SOLID: Type validation separated from business logic
 *
 * @module utils/type-guards
 */

import type { OssaAgent } from '../types/index.js';

/**
 * Type guard for OSSA Agent manifest
 */
export function isOssaAgent(value: unknown): value is OssaAgent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check required top-level fields
  if (typeof obj.apiVersion !== 'string' || !obj.apiVersion) {
    return false;
  }

  if (obj.kind !== 'Agent') {
    return false;
  }

  // Check metadata structure
  if (!obj.metadata || typeof obj.metadata !== 'object') {
    return false;
  }

  const metadata = obj.metadata as Record<string, unknown>;
  if (typeof metadata.name !== 'string' || !metadata.name) {
    return false;
  }

  // Check spec structure
  if (!obj.spec || typeof obj.spec !== 'object') {
    return false;
  }

  const spec = obj.spec as Record<string, unknown>;
  if (typeof spec.role !== 'string' || !spec.role) {
    return false;
  }

  return true;
}

/**
 * Type guard for tool objects
 */
export function isTool(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  // Tools must be objects
  return !Array.isArray(value);
}

/**
 * Type guard for tool with auth property
 */
export function isToolWithAuth(
  value: unknown
): value is Record<string, unknown> & { auth?: Record<string, unknown> } {
  if (!isTool(value)) {
    return false;
  }

  const tool = value;

  // If auth exists, it must be an object
  if ('auth' in tool && (tool.auth === null || typeof tool.auth !== 'object')) {
    return false;
  }

  return true;
}

/**
 * Type guard for tool with description property
 */
export function isToolWithDescription(
  value: unknown
): value is Record<string, unknown> & { description?: string; name?: string } {
  if (!isTool(value)) {
    return false;
  }

  const tool = value;

  // Description and name should be strings if present
  if (
    'description' in tool &&
    tool.description !== undefined &&
    typeof tool.description !== 'string'
  ) {
    return false;
  }

  if (
    'name' in tool &&
    tool.name !== undefined &&
    typeof tool.name !== 'string'
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard for registry object
 */
export function isAgentRegistry(value: unknown): value is Record<
  string,
  unknown
> & {
  apiVersion?: string;
  kind?: string;
  agents?: unknown[];
  discovery?: Record<string, unknown>;
} {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const registry = value as Record<string, unknown>;

  // apiVersion should be string if present
  if (
    'apiVersion' in registry &&
    registry.apiVersion !== undefined &&
    typeof registry.apiVersion !== 'string'
  ) {
    return false;
  }

  // kind should be string if present
  if (
    'kind' in registry &&
    registry.kind !== undefined &&
    typeof registry.kind !== 'string'
  ) {
    return false;
  }

  // agents should be array if present
  if (
    'agents' in registry &&
    registry.agents !== undefined &&
    !Array.isArray(registry.agents)
  ) {
    return false;
  }

  // discovery should be object if present
  if (
    'discovery' in registry &&
    registry.discovery !== undefined &&
    typeof registry.discovery !== 'object'
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard for policy object
 */
export function isToolPolicy(value: unknown): value is Record<
  string,
  unknown
> & {
  apiVersion?: string;
  kind?: string;
  spec?: Record<string, unknown>;
} {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const policy = value as Record<string, unknown>;

  // apiVersion should be string if present
  if (
    'apiVersion' in policy &&
    policy.apiVersion !== undefined &&
    typeof policy.apiVersion !== 'string'
  ) {
    return false;
  }

  // kind should be string if present
  if (
    'kind' in policy &&
    policy.kind !== undefined &&
    typeof policy.kind !== 'string'
  ) {
    return false;
  }

  // spec should be object if present
  if (
    'spec' in policy &&
    policy.spec !== undefined &&
    typeof policy.spec !== 'object'
  ) {
    return false;
  }

  return true;
}

/**
 * Safe property access with type checking
 */
export function safeGet<T>(
  obj: unknown,
  path: string,
  typeGuard?: (value: unknown) => value is T
): T | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return undefined;
    }

    const record = current as Record<string, unknown>;
    if (!(key in record)) {
      return undefined;
    }

    current = record[key];
  }

  if (typeGuard && !typeGuard(current)) {
    return undefined;
  }

  return current as T;
}

/**
 * Safe array access with type checking
 */
export function safeGetArray<T>(
  value: unknown,
  typeGuard?: (item: unknown) => item is T
): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  if (typeGuard) {
    return value.filter(typeGuard);
  }

  return value as T[];
}
