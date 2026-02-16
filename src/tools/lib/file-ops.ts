#!/usr/bin/env node
/**
 * File operations utilities
 *
 * Follows DRY principles for file operations
 */

import fs from 'fs';
import path from 'path';

/**
 * Require that a file exists, throw error if not
 */
export function requireFile(filePath: string, errorMessage?: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(errorMessage || `Required file not found: ${filePath}`);
  }
}

/**
 * Write file with directory creation
 */
export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf8');
}
