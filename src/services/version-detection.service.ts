/**
 * Version Detection Service
 * Detects OSSA manifest version using apiVersion field or schema validation fallback
 */

import { injectable, inject } from 'inversify';
import { ValidationService } from './validation.service.js';
import type { OssaAgent } from '../types/index.js';

/**
 * Version detection result
 */
export interface VersionDetectionResult {
  version: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'apiVersion' | 'schema-validation' | 'legacy-field' | 'unknown';
  warnings: string[];
}

@injectable()
export class VersionDetectionService {
  constructor(
    @inject(ValidationService) private validationService: ValidationService
  ) {}

  /**
   * Detect version from manifest
   * Priority:
   * 1. apiVersion field (REQUIRED in OSSA spec) - HIGH confidence
   * 2. Legacy ossaVersion field - MEDIUM confidence
   * 3. Schema validation fallback - LOW confidence
   */
  async detectVersion(manifest: unknown): Promise<VersionDetectionResult> {
    const warnings: string[] = [];

    if (!manifest || typeof manifest !== 'object') {
      return {
        version: 'unknown',
        confidence: 'low',
        source: 'unknown',
        warnings: ['Invalid manifest: not an object'],
      };
    }

    const m = manifest as Record<string, unknown>;

    // 1. Check apiVersion field (PRIMARY method - REQUIRED in spec)
    if (typeof m.apiVersion === 'string' && m.apiVersion.startsWith('ossa/v')) {
      const match = m.apiVersion.match(/^ossa\/v(\d+\.\d+(?:\.\d+)?)$/);
      if (match) {
        return {
          version: match[1],
          confidence: 'high',
          source: 'apiVersion',
          warnings: [],
        };
      }

      warnings.push(`Invalid apiVersion format: ${m.apiVersion}`);
    }

    // 2. Check legacy ossaVersion field (v1.0 format)
    if (m.ossaVersion === '1.0') {
      return {
        version: '1.0',
        confidence: 'medium',
        source: 'legacy-field',
        warnings: [
          'Using legacy ossaVersion field - consider migrating to apiVersion',
        ],
      };
    }

    // 3. Fallback: validate against known schemas (SLOW)
    warnings.push(
      'apiVersion field missing - falling back to schema validation'
    );
    const detectedVersion =
      await this.detectVersionBySchemaValidation(manifest);

    if (detectedVersion) {
      return {
        version: detectedVersion,
        confidence: 'low',
        source: 'schema-validation',
        warnings: [
          ...warnings,
          'Consider adding apiVersion field for faster detection',
        ],
      };
    }

    return {
      version: 'unknown',
      confidence: 'low',
      source: 'unknown',
      warnings: [
        ...warnings,
        'Unable to detect version - manifest may be invalid',
      ],
    };
  }

  /**
   * Detect version by validating against known schemas
   * Tests from newest to oldest to favor latest versions
   */
  private async detectVersionBySchemaValidation(
    manifest: unknown
  ): Promise<string | null> {
    // Test versions from newest to oldest
    const versionsToTest = [
      '0.3.5',
      '0.3.4',
      '0.3.3',
      '0.3.2',
      '0.3.1',
      '0.3.0',
    ];

    for (const version of versionsToTest) {
      try {
        const result = await this.validationService.validate(manifest, version);
        if (result.valid) {
          return version;
        }
      } catch (error) {
        // Schema might not exist for this version, continue
        continue;
      }
    }

    return null;
  }

  /**
   * Check if manifest needs migration to target version
   */
  needsMigration(currentVersion: string, targetVersion: string): boolean {
    if (currentVersion === 'unknown') {
      return true; // Unknown version always needs migration
    }

    if (currentVersion === targetVersion) {
      return false; // Already at target version
    }

    // Compare semantic versions
    const current = this.parseVersion(currentVersion);
    const target = this.parseVersion(targetVersion);

    if (!current || !target) {
      return true; // Can't compare, assume migration needed
    }

    // Need migration if current < target
    return this.compareVersions(current, target) < 0;
  }

  /**
   * Parse semantic version string
   */
  private parseVersion(
    version: string
  ): { major: number; minor: number; patch: number } | null {
    const match = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?$/);
    if (!match) return null;

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: match[3] ? parseInt(match[3], 10) : 0,
    };
  }

  /**
   * Compare two parsed versions
   * Returns: -1 if a < b, 0 if a === b, 1 if a > b
   */
  private compareVersions(
    a: { major: number; minor: number; patch: number },
    b: { major: number; minor: number; patch: number }
  ): number {
    if (a.major !== b.major) return a.major < b.major ? -1 : 1;
    if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
    if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
    return 0;
  }

  /**
   * Get migration path from source to target version
   * Returns array of versions to migrate through (in order)
   */
  getMigrationPath(sourceVersion: string, targetVersion: string): string[] {
    const source = this.parseVersion(sourceVersion);
    const target = this.parseVersion(targetVersion);

    if (!source || !target) {
      return []; // Invalid versions
    }

    if (this.compareVersions(source, target) >= 0) {
      return []; // No migration needed (source >= target)
    }

    const path: string[] = [];

    // For now, only support patch-level migrations within same minor version
    // or direct minor version upgrades
    if (source.major === target.major && source.minor === target.minor) {
      // Patch-level migration: go directly to target
      path.push(targetVersion);
    } else if (source.major === target.major) {
      // Minor version migration: step through each minor version
      for (let minor = source.minor + 1; minor <= target.minor; minor++) {
        path.push(`${source.major}.${minor}.0`);
      }
      // If target has different patch, add final step
      if (target.patch !== 0) {
        path.push(targetVersion);
      }
    } else {
      // Major version migration: not supported yet, go direct
      path.push(targetVersion);
    }

    return path;
  }
}
