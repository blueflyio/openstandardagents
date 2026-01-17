/**
 * Path Validation Utility
 * Prevents path traversal attacks and validates file access
 */

import { resolve, normalize } from 'path';
import { existsSync, statSync } from 'fs';

export class PathValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathValidationError';
  }
}

/**
 * Validates a file path for security and existence
 * @param filePath - The file path to validate
 * @param basePath - Optional base path to restrict access (defaults to null for no restriction)
 * @returns Absolute, validated file path
 * @throws PathValidationError if path is invalid or inaccessible
 */
export function validateFilePath(
  filePath: string,
  basePath: string | null = null
): string {
  // Normalize and resolve path
  const normalized = normalize(filePath);
  const resolved = resolve(normalized);

  // If basePath is provided, enforce path traversal protection
  if (basePath !== null) {
    const baseResolved = resolve(basePath);
    if (!resolved.startsWith(baseResolved)) {
      throw new PathValidationError(
        `Access denied: Path '${filePath}' attempts to escape base directory`
      );
    }
  }

  // Check if path exists
  if (!existsSync(resolved)) {
    throw new PathValidationError(`File not found: ${filePath}`);
  }

  // Ensure it's a file, not a directory
  const stats = statSync(resolved);
  if (!stats.isFile()) {
    throw new PathValidationError(`Path is not a file: ${filePath}`);
  }

  return resolved;
}

/**
 * Validates a directory path for security and existence
 * @param dirPath - The directory path to validate
 * @param basePath - Optional base path to restrict access (defaults to null for no restriction)
 * @returns Absolute, validated directory path
 * @throws PathValidationError if path is invalid or inaccessible
 */
export function validateDirectoryPath(
  dirPath: string,
  basePath: string | null = null
): string {
  const normalized = normalize(dirPath);
  const resolved = resolve(normalized);

  // If basePath is provided, enforce path traversal protection
  if (basePath !== null) {
    const baseResolved = resolve(basePath);
    if (!resolved.startsWith(baseResolved)) {
      throw new PathValidationError(
        `Access denied: Path '${dirPath}' attempts to escape base directory`
      );
    }
  }

  // Check if path exists
  if (!existsSync(resolved)) {
    throw new PathValidationError(`Directory not found: ${dirPath}`);
  }

  // Ensure it's a directory
  const stats = statSync(resolved);
  if (!stats.isDirectory()) {
    throw new PathValidationError(`Path is not a directory: ${dirPath}`);
  }

  return resolved;
}
