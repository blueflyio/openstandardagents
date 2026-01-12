/**
 * Codegen Service - CI-Based Schema/Version Generation
 *
 * CRUD Operations:
 * - generate: Create/update generated files
 * - list: Show what would be generated
 * - validate: Check for version drift
 * - sync: Update all files to current version
 *
 * Single Source of Truth: package.json version
 *
 * @see src/utils/version.ts for getVersion(), getApiVersion()
 */

import { injectable, inject } from 'inversify';
import { getVersion, getApiVersion } from '../../utils/version.js';
import { ManifestGenerator } from './generators/manifest.generator.js';
import { VSCodeGenerator } from './generators/vscode.generator.js';
import { OpenAPIGenerator } from './generators/openapi.generator.js';
import { TypesGenerator } from './generators/types.generator.js';
import { ZodGenerator } from './generators/zod.generator.js';
import { OpenAPIZodGenerator } from './generators/openapi-zod.generator.js';

export interface GenerateResult {
  generator: string;
  filesUpdated: number;
  filesCreated: number;
  errors: string[];
}

export interface DriftReport {
  hasDrift: boolean;
  currentVersion: string;
  filesWithOldVersion: Array<{
    path: string;
    foundVersion: string;
  }>;
}

export type GeneratorType = 'types' | 'zod' | 'openapi-zod' | 'manifests' | 'vscode' | 'openapi' | 'all';

@injectable()
export class CodegenService {
  constructor(
    @inject(ManifestGenerator) private manifestGenerator: ManifestGenerator,
    @inject(VSCodeGenerator) private vscodeGenerator: VSCodeGenerator,
    @inject(OpenAPIGenerator) private openapiGenerator: OpenAPIGenerator,
    @inject(TypesGenerator) private typesGenerator: TypesGenerator,
    @inject(ZodGenerator) private zodGenerator: ZodGenerator,
    @inject(OpenAPIZodGenerator) private openapiZodGenerator: OpenAPIZodGenerator,
  ) {}

  /**
   * Get current version info
   */
  getVersionInfo(): { version: string; apiVersion: string } {
    return {
      version: getVersion(),
      apiVersion: getApiVersion(),
    };
  }

  /**
   * CRUD: CREATE/UPDATE - Generate files
   */
  async generate(type: GeneratorType, dryRun = false): Promise<GenerateResult[]> {
    const results: GenerateResult[] = [];
    const generators = this.getGenerators(type);

    for (const gen of generators) {
      const result = await gen.generate(dryRun);
      results.push(result);
    }

    return results;
  }

  /**
   * CRUD: READ - List files that would be generated
   */
  async list(type: GeneratorType): Promise<string[]> {
    const generators = this.getGenerators(type);
    const files: string[] = [];

    for (const gen of generators) {
      const genFiles = await gen.listTargetFiles();
      files.push(...genFiles);
    }

    return files;
  }

  /**
   * CRUD: VALIDATE - Check for version drift
   */
  async validate(): Promise<DriftReport> {
    const currentVersion = getVersion();
    const apiVersion = getApiVersion();
    const filesWithOldVersion: DriftReport['filesWithOldVersion'] = [];

    // Check all generators for drift
    const generators = this.getGenerators('all');
    for (const gen of generators) {
      const drift = await gen.checkDrift(currentVersion, apiVersion);
      filesWithOldVersion.push(...drift);
    }

    return {
      hasDrift: filesWithOldVersion.length > 0,
      currentVersion,
      filesWithOldVersion,
    };
  }

  /**
   * CRUD: UPDATE - Sync all files to current version
   */
  async sync(dryRun = false): Promise<GenerateResult[]> {
    return this.generate('all', dryRun);
  }

  private getGenerators(type: GeneratorType): Generator[] {
    const generatorMap: Record<string, Generator> = {
      types: this.typesGenerator,
      zod: this.zodGenerator,
      'openapi-zod': this.openapiZodGenerator,
      manifests: this.manifestGenerator,
      vscode: this.vscodeGenerator,
      openapi: this.openapiGenerator,
    };

    if (type === 'all') {
      return Object.values(generatorMap);
    }

    const generator = generatorMap[type];
    if (!generator) {
      throw new Error(`Unknown generator type: ${type}`);
    }

    return [generator];
  }
}

/**
 * Base interface for all generators
 */
export interface Generator {
  name: string;
  generate(dryRun: boolean): Promise<GenerateResult>;
  listTargetFiles(): Promise<string[]>;
  checkDrift(version: string, apiVersion: string): Promise<DriftReport['filesWithOldVersion']>;
}
