/**
 * Manifest Repository
 * Loads and saves OSSA agent manifests
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { injectable } from 'inversify';
import type { IManifestRepository, OssaAgent } from '../types/index';

@injectable()
export class ManifestRepository implements IManifestRepository {
  /**
   * Load manifest from file
   * @param filePath - Path to manifest file (YAML or JSON)
   * @returns Parsed manifest object
   */
  async load(filePath: string): Promise<unknown> {
    const resolvedPath = path.resolve(filePath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Manifest file not found: ${resolvedPath}`);
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const ext = path.extname(resolvedPath).toLowerCase();

    try {
      if (ext === '.json') {
        return JSON.parse(content);
      } else if (ext === '.yaml' || ext === '.yml') {
        return parseYaml(content);
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

    try {
      if (ext === '.json') {
        content = JSON.stringify(manifest, null, 2);
      } else if (ext === '.yaml' || ext === '.yml') {
        content = stringifyYaml(manifest, {
          indent: 2,
          lineWidth: 0,
          minContentWidth: 0,
        });
      } else {
        throw new Error(
          `Unsupported file format: ${ext}. Must be .json, .yaml, or .yml`
        );
      }

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
