/**
 * Base Exporter - Abstract class for export orchestration
 *
 * Extracts the common export pattern shared across all platform adapters:
 * 1. Start timing
 * 2. Validate manifest (optional, based on options)
 * 3. Generate platform-specific files (delegated to subclass)
 * 4. Return result with timing metadata
 * 5. Catch and wrap errors
 *
 * This eliminates ~53% duplication across adapters by centralizing:
 * - Export method boilerplate (validation, timing, error handling)
 * - Validate method boilerplate (base + platform-specific merge)
 * - Common file generation (package.json, tsconfig.json, README)
 *
 * SOLID: Template Method pattern - subclasses provide platform-specific logic
 * DRY: All orchestration boilerplate lives here, not in each adapter
 */

import * as yaml from 'yaml';
import { BaseAdapter } from './adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ExportFile,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './adapter.interface.js';
import {
  generatePackageJson,
  generateTsConfig,
  generateGitIgnore,
  generateReadme,
  type Platform,
  type PackageJsonOptions,
  type TsConfigOptions,
  type ReadmeSections,
} from './common-file-generator.js';

/**
 * Abstract Base Exporter
 *
 * Subclasses implement:
 * - generateFiles() - platform-specific file generation
 * - platformValidate() - platform-specific validation rules
 * - getExportVersion() - version string for metadata
 *
 * The base class handles:
 * - Export orchestration (timing, validation, error handling)
 * - Manifest provenance file generation
 * - Common file helpers (package.json, tsconfig, README, gitignore)
 */
export abstract class BaseExporter extends BaseAdapter {
  /**
   * Generate platform-specific files from the manifest.
   * This is the core method subclasses must implement.
   *
   * @param manifest - Validated OSSA agent manifest
   * @param options - Export options
   * @returns Array of generated files
   */
  protected abstract generateFiles(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportFile[]>;

  /**
   * Platform-specific validation rules.
   * Called after base validation. Override to add platform checks.
   *
   * @param manifest - OSSA agent manifest
   * @returns Object with arrays of errors and warnings
   */
  protected platformValidate(manifest: OssaAgent): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    return { errors: [], warnings: [] };
  }

  /**
   * Get the export adapter version for metadata.
   * Override to provide a specific version string.
   */
  protected getExportVersion(): string {
    return '1.0.0';
  }

  /**
   * Export OSSA manifest to platform-specific format.
   * Orchestrates: validate -> generate -> wrap result with timing.
   *
   * Subclasses do NOT need to override this. Implement generateFiles() instead.
   */
  async export(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      // Step 1: Validate manifest (unless explicitly disabled)
      if (options?.validate !== false) {
        const validation = await this.validate(manifest);
        if (!validation.valid) {
          return this.createResult(
            false,
            [],
            `Validation failed: ${validation.errors?.map((e) => e.message).join(', ')}`,
            {
              duration: Date.now() - startTime,
              warnings: validation.warnings?.map((w) => w.message),
            }
          );
        }
      }

      // Step 2: Generate platform-specific files
      const files = await this.generateFiles(manifest, options);

      // Step 3: Append provenance manifest
      files.push(this.createManifestFile(manifest));

      // Step 4: Return success result with timing
      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: this.getExportVersion(),
      });
    } catch (error) {
      return this.createResult(
        false,
        [],
        error instanceof Error ? error.message : String(error),
        { duration: Date.now() - startTime }
      );
    }
  }

  /**
   * Validate manifest for platform compatibility.
   * Merges base validation with platform-specific rules.
   *
   * Subclasses do NOT need to override this. Implement platformValidate() instead.
   */
  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Base validation (metadata.name, metadata.version, spec.role)
    const baseValidation = await super.validate(manifest);
    if (baseValidation.errors) errors.push(...baseValidation.errors);
    if (baseValidation.warnings) warnings.push(...baseValidation.warnings);

    // Platform-specific validation
    const platformResult = this.platformValidate(manifest);
    errors.push(...platformResult.errors);
    warnings.push(...platformResult.warnings);

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // Common File Generation Helpers
  // Delegates to shared common-file-generator.ts, reducing duplication
  // ──────────────────────────────────────────────────────────────────

  /**
   * Generate a package.json file using shared generator
   */
  protected generatePackageJsonFile(
    manifest: OssaAgent,
    prefix: string,
    options?: PackageJsonOptions
  ): ExportFile {
    return this.createFile(
      `${prefix}/package.json`,
      generatePackageJson(manifest, this.platform as Platform, options),
      'config'
    );
  }

  /**
   * Generate a tsconfig.json file using shared generator
   */
  protected generateTsConfigFile(
    prefix: string,
    options?: TsConfigOptions
  ): ExportFile {
    return this.createFile(
      `${prefix}/tsconfig.json`,
      generateTsConfig(options),
      'config'
    );
  }

  /**
   * Generate a README.md file using shared generator
   */
  protected generateReadmeFile(
    manifest: OssaAgent,
    prefix: string,
    sections?: ReadmeSections
  ): ExportFile {
    return this.createFile(
      `${prefix}/README.md`,
      generateReadme(manifest, this.platform as Platform, sections),
      'documentation'
    );
  }

  /**
   * Generate a .gitignore file using shared generator
   */
  protected generateGitIgnoreFile(prefix: string): ExportFile {
    return this.createFile(
      `${prefix}/.gitignore`,
      generateGitIgnore(this.platform as Platform),
      'config'
    );
  }

  /**
   * Helper: Get the agent name from manifest with fallback
   */
  protected getAgentName(manifest: OssaAgent, fallback?: string): string {
    return manifest.metadata?.name || fallback || this.platform + '-agent';
  }

  /**
   * Helper: Get the agent description from manifest
   */
  protected getAgentDescription(manifest: OssaAgent): string {
    return (
      manifest.spec?.role ||
      manifest.metadata?.description ||
      `${this.displayName} agent`
    );
  }

  /**
   * Helper: Extract tools array from manifest
   */
  protected getTools(manifest: OssaAgent): Array<Record<string, unknown>> {
    return (manifest.spec?.tools || []) as Array<Record<string, unknown>>;
  }

  /**
   * Helper: Extract capabilities array from manifest (as strings)
   */
  protected getCapabilities(manifest: OssaAgent): string[] {
    return (
      (manifest.spec?.capabilities || []) as Array<
        string | Record<string, unknown>
      >
    ).map((c) => (typeof c === 'string' ? c : (c as any).name || ''));
  }
}
