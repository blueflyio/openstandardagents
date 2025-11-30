#!/usr/bin/env tsx
/**
 * Cursor Agent Hook: Post-Edit Validation
 * 
 * Validates OSSA manifests after edits and runs tests if needed.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

interface HookContext {
  filePath: string;
  operation: 'edit' | 'create' | 'delete';
}

const OSSA_MANIFEST_PATTERNS = [
  /\.ossa\.ya?ml$/,
  /agent\.ya?ml$/,
  /examples\/.*\.ya?ml$/,
];

export function postEdit(context: HookContext): { success: boolean; message?: string } {
  const { filePath, operation } = context;

  // Validate OSSA manifests after edit
  if (OSSA_MANIFEST_PATTERNS.some(pattern => pattern.test(filePath))) {
    if (operation === 'edit' || operation === 'create') {
      try {
        // Run OSSA validation
        execSync(`ossa validate "${filePath}"`, { stdio: 'pipe' });
        return { success: true, message: `Validated ${filePath} successfully` };
      } catch (error) {
        return {
          success: false,
          message: `OSSA validation failed for ${filePath}. Please fix errors.`,
        };
      }
    }
  }

  // Run tests if TypeScript files changed
  if (filePath.endsWith('.ts') && (operation === 'edit' || operation === 'create')) {
    // Only run if in test directory or if it's a source file
    if (filePath.includes('src/') || filePath.includes('tests/')) {
      try {
        execSync('npm run test:unit', { stdio: 'pipe', timeout: 30000 });
        return { success: true, message: 'Unit tests passed' };
      } catch (error) {
        // Don't block, just warn
        return {
          success: true,
          message: 'Unit tests failed. Please review and fix.',
        };
      }
    }
  }

  return { success: true };
}

