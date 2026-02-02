/**
 * Export Orchestrator
 *
 * Coordinates export operations across multiple platforms.
 * Handles batch exports, validation, and file writing.
 *
 * SOLID: Single Responsibility - Coordinates exports
 * DRY: Reusable export logic
 */

import * as fs from 'fs';
import * as path from 'path';
import type { OssaAgent } from '../../types/index.js';
import type {
  PlatformAdapter,
  ExportOptions,
  ExportResult,
} from '../../adapters/base/adapter.interface.js';
import { registry } from '../../adapters/registry/platform-registry.js';

/**
 * Batch export options
 */
export interface BatchExportOptions extends ExportOptions {
  /**
   * Platforms to export to (empty = all)
   */
  platforms?: string[];

  /**
   * Continue on error
   */
  continueOnError?: boolean;

  /**
   * Parallel execution
   */
  parallel?: boolean;
}

/**
 * Batch export result
 */
export interface BatchExportResult {
  /**
   * Overall success
   */
  success: boolean;

  /**
   * Individual platform results
   */
  results: ExportResult[];

  /**
   * Summary statistics
   */
  summary: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
}

/**
 * Export Orchestrator Service
 */
export class ExportOrchestrator {
  /**
   * Export to single platform
   */
  async exportSingle(
    manifest: OssaAgent,
    platform: string,
    options?: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();

    // Get adapter
    const adapter = registry.getAdapter(platform);
    if (!adapter) {
      return {
        platform,
        success: false,
        files: [],
        error: `Platform not found: ${platform}. Available: ${registry.getPlatforms().join(', ')}`,
        metadata: {
          duration: Date.now() - startTime,
        },
      };
    }

    // Validate if requested
    if (options?.validate !== false) {
      const validation = await adapter.validate(manifest);
      if (!validation.valid) {
        return {
          platform,
          success: false,
          files: [],
          error: `Validation failed: ${validation.errors?.map((e) => e.message).join(', ')}`,
          metadata: {
            duration: Date.now() - startTime,
            warnings: validation.warnings?.map((w) => w.message),
          },
        };
      }
    }

    // Export
    const result = await adapter.export(manifest, options);

    // Write files (if not dry-run)
    if (!options?.dryRun && result.success) {
      await this.writeFiles(result.files, options?.outputDir || '.');
    }

    // Update metadata
    result.metadata = {
      ...result.metadata,
      duration: Date.now() - startTime,
    };

    return result;
  }

  /**
   * Export to multiple platforms (batch)
   */
  async exportBatch(
    manifest: OssaAgent,
    options?: BatchExportOptions
  ): Promise<BatchExportResult> {
    const startTime = Date.now();

    // Determine platforms
    const platforms =
      options?.platforms && options.platforms.length > 0
        ? options.platforms
        : registry.getPlatforms();

    if (platforms.length === 0) {
      return {
        success: false,
        results: [],
        summary: {
          total: 0,
          successful: 0,
          failed: 0,
          duration: Date.now() - startTime,
        },
      };
    }

    // Export to all platforms
    const results: ExportResult[] = [];

    if (options?.parallel) {
      // Parallel execution
      const promises = platforms.map((platform) =>
        this.exportSingle(manifest, platform, options).catch((error) => ({
          platform,
          success: false,
          files: [],
          error: error instanceof Error ? error.message : String(error),
        }))
      );

      results.push(...(await Promise.all(promises)));
    } else {
      // Sequential execution
      for (const platform of platforms) {
        try {
          const result = await this.exportSingle(manifest, platform, options);
          results.push(result);

          // Stop on error if not continuing
          if (!result.success && !options?.continueOnError) {
            break;
          }
        } catch (error) {
          const result: ExportResult = {
            platform,
            success: false,
            files: [],
            error: error instanceof Error ? error.message : String(error),
          };
          results.push(result);

          if (!options?.continueOnError) {
            break;
          }
        }
      }
    }

    // Calculate summary
    const summary = {
      total: platforms.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      duration: Date.now() - startTime,
    };

    return {
      success: summary.failed === 0,
      results,
      summary,
    };
  }

  /**
   * Validate manifest for platform
   */
  async validate(
    manifest: OssaAgent,
    platform: string
  ): Promise<{ valid: boolean; errors?: string[]; warnings?: string[] }> {
    const adapter = registry.getAdapter(platform);
    if (!adapter) {
      return {
        valid: false,
        errors: [`Platform not found: ${platform}`],
      };
    }

    const result = await adapter.validate(manifest);
    return {
      valid: result.valid,
      errors: result.errors?.map((e) => e.message),
      warnings: result.warnings?.map((w) => w.message),
    };
  }

  /**
   * Get available platforms
   */
  getPlatforms(): string[] {
    return registry.getPlatforms();
  }

  /**
   * Get platform info
   */
  getPlatformInfo() {
    return registry.getAdapterInfo();
  }

  /**
   * Write exported files to disk
   */
  private async writeFiles(
    files: ExportResult['files'],
    outputDir: string
  ): Promise<void> {
    for (const file of files) {
      const filePath = path.join(outputDir, file.path);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(filePath, file.content, 'utf-8');
    }
  }
}
