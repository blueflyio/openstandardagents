/**
 * Agent Migration Service
 *
 * SOLID: Single Responsibility - Agent manifest migration only
 * DRY: Uses .version.json as single source of truth
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import {
  MigrateAgentsRequestSchema,
  type MigrateAgentsRequest,
  type MigrateAgentsResponse,
  type AgentUpgradeResult,
} from '../schemas/migrate.schema.js';
import { VersionConfigSchema } from '../schemas/version.schema.js';
import * as YAML from 'yaml';

export class AgentMigrationService {
  private readonly rootDir: string;
  private readonly versionFile: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.versionFile = join(rootDir, '.version.json');
  }

  /**
   * Migrate agent manifests to latest or specified version
   * DYNAMIC: Uses .version.json for target version
   */
  async migrateAgents(
    request: MigrateAgentsRequest
  ): Promise<MigrateAgentsResponse> {
    // Validate request with Zod
    const validated = MigrateAgentsRequestSchema.parse(request);

    // Get target version from .version.json if not specified
    const targetVersion = validated.targetVersion || this.getTargetVersion();

    // Find all agent manifests
    const agentFiles = this.findAgentManifests(validated.paths);

    const results: AgentUpgradeResult[] = [];
    let upgraded = 0;
    let skipped = 0;
    let failed = 0;

    for (const filePath of agentFiles) {
      try {
        const result = await this.upgradeAgent(
          filePath,
          targetVersion,
          validated.dryRun,
          validated.force
        );
        results.push(result);

        if (result.success) {
          if (result.oldVersion === result.newVersion) {
            skipped++;
          } else {
            upgraded++;
          }
        } else {
          failed++;
        }
      } catch (error) {
        results.push({
          path: filePath,
          success: false,
          oldVersion: 'unknown',
          newVersion: targetVersion,
          error: error instanceof Error ? error.message : String(error),
        });
        failed++;
      }
    }

    return {
      success: failed === 0,
      targetVersion,
      totalFiles: agentFiles.length,
      upgraded,
      skipped,
      failed,
      results,
      dryRun: validated.dryRun,
    };
  }

  /**
   * Get target version from .version.json
   */
  private getTargetVersion(): string {
    if (!existsSync(this.versionFile)) {
      throw new Error(
        '.version.json not found. Run `ossa-dev version detect` first.'
      );
    }

    const content = readFileSync(this.versionFile, 'utf-8');
    const config = VersionConfigSchema.parse(JSON.parse(content));
    return config.current;
  }

  /**
   * Find all agent manifest files
   * Searches for both .ossa.* files and agent files in specific directories
   */
  private findAgentManifests(paths?: string[]): string[] {
    const searchPaths =
      paths && paths.length > 0
        ? paths
        : ['.gitlab', '.ossa', 'examples', 'spec'];

    const files: string[] = [];

    for (const searchPath of searchPaths) {
      const fullPath = join(this.rootDir, searchPath);
      if (!existsSync(fullPath)) {
        continue;
      }

      try {
        // Find both .ossa.* files and plain .yaml/.yml/.json files in agent directories
        const found = execSync(
          `find "${fullPath}" -type f \\( -name "*.ossa.yaml" -o -name "*.ossa.yml" -o -name "*.ossa.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" \\) | grep -v node_modules | grep -v dist | grep -v coverage`,
          {
            encoding: 'utf-8',
            cwd: this.rootDir,
          }
        )
          .trim()
          .split('\n')
          .filter(Boolean)
          .filter((file) => {
            // Only include files that look like agent manifests
            const content = readFileSync(file, 'utf-8').substring(0, 500);
            return (
              content.includes('apiVersion') &&
              content.includes('ossa/v') &&
              (content.includes('kind: Agent') ||
                content.includes('"kind": "Agent"'))
            );
          });

        files.push(...found);
      } catch {
        // Continue if find fails
      }
    }

    return files;
  }

  /**
   * Upgrade a single agent manifest
   */
  private async upgradeAgent(
    filePath: string,
    targetVersion: string,
    dryRun: boolean,
    force: boolean
  ): Promise<AgentUpgradeResult> {
    const content = readFileSync(filePath, 'utf-8');
    const isYaml = filePath.endsWith('.yaml') || filePath.endsWith('.yml');

    let manifest: any;
    let oldVersion = 'unknown';

    try {
      manifest = isYaml ? YAML.parse(content) : JSON.parse(content);
      oldVersion = this.extractVersion(manifest.apiVersion || '');
    } catch (error) {
      return {
        path: filePath,
        success: false,
        oldVersion,
        newVersion: targetVersion,
        error: `Failed to parse manifest: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Check if already at target version
    if (oldVersion === targetVersion && !force) {
      return {
        path: filePath,
        success: true,
        oldVersion,
        newVersion: targetVersion,
      };
    }

    // Update apiVersion using minor version only (e.g., ossa/v0.3 not ossa/v0.3.5)
    const minorVersion = this.extractMinorVersion(targetVersion);
    const newApiVersion = `ossa/v${minorVersion}`;
    manifest.apiVersion = newApiVersion;

    if (!dryRun) {
      try {
        const newContent = isYaml
          ? YAML.stringify(manifest)
          : JSON.stringify(manifest, null, 2) + '\n';
        writeFileSync(filePath, newContent, 'utf-8');
      } catch (error) {
        return {
          path: filePath,
          success: false,
          oldVersion,
          newVersion: targetVersion,
          error: `Failed to write manifest: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    return {
      path: filePath,
      success: true,
      oldVersion,
      newVersion: targetVersion,
    };
  }

  /**
   * Extract version from apiVersion string (e.g., "ossa/v0.3.5" → "0.3.5")
   */
  private extractVersion(apiVersion: string): string {
    const match = apiVersion.match(/ossa\/v(.+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Extract minor version from full version (e.g., "0.3.5" → "0.3")
   */
  private extractMinorVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1]}`;
    }
    return version;
  }
}
