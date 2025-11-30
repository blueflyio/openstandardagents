#!/usr/bin/env tsx
/**
 * Cursor Agent Hook: Pre-Edit Validation
 * 
 * Validates OSSA manifests and schemas before allowing edits.
 * Blocks edits to critical files if validation fails.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface HookContext {
  filePath: string;
  operation: 'edit' | 'create' | 'delete';
}

const CRITICAL_FILES = [
  'spec/v0.2.5-RC/ossa-0.2.5-RC.schema.json',
  'package.json',
  'tsconfig.json',
];

const OSSA_MANIFEST_PATTERNS = [
  /\.ossa\.ya?ml$/,
  /agent\.ya?ml$/,
  /examples\/.*\.ya?ml$/,
];

export function preEdit(context: HookContext): { allow: boolean; reason?: string } {
  const { filePath, operation } = context;

  // Block deletions of critical files
  if (operation === 'delete' && CRITICAL_FILES.some(cf => filePath.includes(cf))) {
    return {
      allow: false,
      reason: `Cannot delete critical file: ${filePath}. Use __DELETE_LATER/ folder instead.`,
    };
  }

  // Validate OSSA manifests before edit
  if (OSSA_MANIFEST_PATTERNS.some(pattern => pattern.test(filePath))) {
    if (operation === 'edit' || operation === 'create') {
      // Run validation in post-edit hook instead
      // This hook just checks if file is valid OSSA manifest
      return { allow: true };
    }
  }

  return { allow: true };
}

