/**
 * Manifest Repository
 * Loads and saves OSSA agent manifests
 */

import * as fs from 'fs';
import * as path from 'path';
import { stringify as stringifyYaml } from 'yaml';
import { injectable } from 'inversify';
import type { IManifestRepository, OssaAgent } from '../types/index.js';
import { validateFilePath } from '../utils/path-validator.js';
import { safeParseYAML } from '../utils/yaml-parser.js';

@injectable()
export class ManifestRepository implements IManifestRepository {
  /**
   * Load manifest from file
   * @param filePath - Path to manifest file (YAML or JSON)
   * @returns Parsed manifest object
   */
  async load(filePath: string): Promise<OssaAgent> {
    // Validate path for security
    const resolvedPath = validateFilePath(filePath);

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const ext = path.extname(resolvedPath).toLowerCase();

    try {
      if (ext === '.json') {
        return JSON.parse(content);
      } else if (ext === '.yaml' || ext === '.yml') {
        // Use safe YAML parsing to prevent injection attacks
        return safeParseYAML(content);
      } else {
        throw new Error(
          `Unsupported file format: ${ext}. Must be .json, .yaml, or .yml`
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to parse manifest file ${resolvedPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Save manifest to file
   * @param filePath - Path to save manifest
   * @param manifest - OSSA agent manifest
   */
  async save(filePath: string, manifest: OssaAgent): Promise<void> {
    const resolvedPath = path.resolve(filePath);
    const ext = path.extname(resolvedPath).toLowerCase();

    // Ensure directory exists
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let content: string;

    if (ext === '.json') {
      content = JSON.stringify(manifest, null, 2);
    } else if (ext === '.yaml' || ext === '.yml') {
      // Use YAML stringify with options that ensure proper handling of strings with special characters
      // Environment variable patterns like ${VAR:-default} need to be preserved correctly
      content = stringifyYaml(manifest, null, {
        indent: 2,
        lineWidth: 0,
        minContentWidth: 0,
        // Use 'QUOTE_DOUBLE' to ensure strings with special chars are quoted
        // This prevents YAML parsers from misinterpreting ${VAR:-default} patterns
        defaultStringType: 'QUOTE_DOUBLE' as any,
      });
    } else {
      throw new Error(
        `Unsupported file format: ${ext}. Must be .json, .yaml, or .yml`
      );
    }

    try {
      fs.writeFileSync(resolvedPath, content, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to save manifest to ${resolvedPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Check if file exists
   * @param filePath - Path to check
   * @returns True if file exists
   */
  exists(filePath: string): boolean {
    return fs.existsSync(path.resolve(filePath));
  }
}
