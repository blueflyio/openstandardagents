/**
 * File Service
 * 
 * SOLID: Single Responsibility - File I/O operations only
 * DRY: Centralizes all file system operations
 * 
 * Abstraction for file operations to eliminate duplication across services.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { z } from 'zod';

export class FileService {
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Read JSON file with Zod validation
   */
  readJson<T>(filePath: string, schema: z.ZodSchema<T>): T {
    const fullPath = join(this.rootDir, filePath);
    
    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const parsed = JSON.parse(content);
      return schema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid JSON schema in ${filePath}: ${error.message}`);
      }
      throw new Error(`Failed to read JSON file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Read JSON file without validation (returns unknown)
   */
  readJsonUnsafe(filePath: string): unknown {
    const fullPath = join(this.rootDir, filePath);
    
    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      const content = readFileSync(fullPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read JSON file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Write JSON file
   */
  writeJson(filePath: string, data: unknown, pretty: boolean = true): void {
    const fullPath = join(this.rootDir, filePath);
    const dir = dirname(fullPath);

    // Ensure directory exists
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const content = pretty
      ? JSON.stringify(data, null, 2) + '\n'
      : JSON.stringify(data);

    writeFileSync(fullPath, content, 'utf-8');
  }

  /**
   * Read text file
   */
  readText(filePath: string): string {
    const fullPath = join(this.rootDir, filePath);
    
    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      return readFileSync(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Write text file
   */
  writeText(filePath: string, content: string): void {
    const fullPath = join(this.rootDir, filePath);
    const dir = dirname(fullPath);

    // Ensure directory exists
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(fullPath, content, 'utf-8');
  }

  /**
   * Check if file exists
   */
  exists(filePath: string): boolean {
    const fullPath = join(this.rootDir, filePath);
    return existsSync(fullPath);
  }

  /**
   * Get full path relative to root
   */
  resolve(filePath: string): string {
    return join(this.rootDir, filePath);
  }
}
