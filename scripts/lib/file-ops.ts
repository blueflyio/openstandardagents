/**
 * File Operations Utilities
 * 
 * DRY: Reusable file operations with proper error handling
 * Type-safe: Validates paths and operations
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { z } from 'zod';

const FilePathSchema = z.string().min(1);

/**
 * Read file with validation
 */
export function readFile(filePath: string): string {
  const validatedPath = FilePathSchema.parse(filePath);
  
  if (!existsSync(validatedPath)) {
    throw new Error(`File not found: ${validatedPath}`);
  }
  
  try {
    return readFileSync(validatedPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read file ${validatedPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Write file with validation
 */
export function writeFile(filePath: string, content: string): void {
  const validatedPath = FilePathSchema.parse(filePath);
  
  try {
    writeFileSync(validatedPath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write file ${validatedPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  const validatedPath = FilePathSchema.parse(filePath);
  return existsSync(validatedPath);
}

/**
 * Validate file exists or throw
 */
export function requireFile(filePath: string, errorMessage?: string): void {
  if (!fileExists(filePath)) {
    throw new Error(errorMessage || `Required file not found: ${filePath}`);
  }
}
