/**
 * ManifestCrudService — Unified CRUD for all OSSA manifest kinds
 *
 * Extracts and consolidates logic from MCP server inline handlers
 * and CLI commands. No TUI/HTTP dependencies.
 */

import { injectable, inject } from 'inversify';
import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';
import semver from 'semver';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../validation.service.js';
import { MigrationTransformService } from '../migration-transform.service.js';
import { VersionDetectionService } from '../version-detection.service.js';
import { getApiVersion } from '../../utils/version.js';
import { scanManifests } from '../../utils/manifest-scanner.js';
import {
  getDefaultAgentVersion,
  getDefaultAgentKind,
  getDefaultRoleTemplate,
  getDefaultDescriptionTemplate,
  getAgentTypeConfigs,
} from '../../config/defaults.js';
import type { OssaAgent, ValidationResult } from '../../types/index.js';

// ---------------------------------------------------------------------------
// Input / Output types
// ---------------------------------------------------------------------------

export interface CreateManifestInput {
  name: string;
  output_dir?: string;
  description?: string;
  role?: string;
  type?:
    | 'worker'
    | 'orchestrator'
    | 'reviewer'
    | 'analyzer'
    | 'executor'
    | 'approver';
  version?: string;
}

export interface CreateManifestResult {
  success: boolean;
  manifest_path: string;
  agent_dir: string;
  files_created: string[];
  manifest: OssaAgent;
}

export interface ManifestListResult {
  count: number;
  agents: Array<{
    name: string | undefined;
    version?: string;
    path: string;
    kind?: string;
    apiVersion?: string;
    description?: string;
    error?: string;
  }>;
}

export interface InspectResult {
  name: string | undefined;
  version: string;
  version_analysis: {
    major: number;
    minor: number;
    patch: number;
    prerelease: readonly (string | number)[];
  } | null;
  kind: string | undefined;
  apiVersion: string | undefined;
  description: string | undefined;
  role: string | null;
  llm: unknown;
  tools: Array<{ name: unknown; type: unknown }>;
  tool_count: number;
  access_tier: unknown;
  autonomy_level: unknown;
  deploy_targets: string[];
  has_extensions: boolean;
  extension_keys: string[];
  validation: { valid: boolean; error_count: number; warning_count: number };
  file_size_bytes: number;
  manifest_path: string;
}

export interface DiffChange {
  type: 'added' | 'removed' | 'modified';
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface DiffResult {
  path_a: string;
  path_b: string;
  name_a: string | undefined;
  name_b: string | undefined;
  total_changes: number;
  breaking_changes: string[];
  changes: DiffChange[];
  compatible: boolean;
}

export interface MigrateResult {
  migrated: boolean;
  from?: string;
  to?: string;
  reason?: string;
  migrations?: string[];
  manifest_path?: string;
  written_to?: string;
  manifest?: OssaAgent;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@injectable()
export class ManifestCrudService {
  constructor(
    @inject(ManifestRepository) private manifestRepo: ManifestRepository,
    @inject(ValidationService) private validationService: ValidationService,
    @inject(MigrationTransformService)
    private migrationTransformService: MigrationTransformService,
    @inject(VersionDetectionService)
    private versionDetectionService: VersionDetectionService
  ) {}

  // ---- Create (scaffold) ----
  async create(input: CreateManifestInput): Promise<CreateManifestResult> {
    const outputDir = path.resolve(input.output_dir || '.agents');
    const agentDir = path.join(outputDir, input.name);

    if (fs.existsSync(agentDir)) {
      throw new Error(`Directory already exists: ${agentDir}`);
    }

    const typeConfigs = getAgentTypeConfigs();
    const typeConfig =
      typeConfigs[input.type || 'worker'] || typeConfigs.worker;

    const manifest: OssaAgent = {
      apiVersion: getApiVersion(),
      kind: getDefaultAgentKind(),
      metadata: {
        name: input.name,
        version: input.version || getDefaultAgentVersion(),
        description:
          input.description || getDefaultDescriptionTemplate(input.name),
      },
      spec: {
        role: input.role || getDefaultRoleTemplate(input.name),
        llm: { provider: 'openai', model: '${LLM_MODEL:-gpt-4}' },
        tools: typeConfig.capabilityName
          ? [{ type: 'capability', name: typeConfig.capabilityName }]
          : [],
      },
    };

    fs.mkdirSync(agentDir, { recursive: true });
    fs.mkdirSync(path.join(agentDir, 'prompts'), { recursive: true });
    fs.mkdirSync(path.join(agentDir, 'tools'), { recursive: true });

    const manifestPath = path.join(agentDir, 'manifest.ossa.yaml');
    await this.manifestRepo.save(manifestPath, manifest);

    const agentsMd = `# ${input.name}\n\n${manifest.metadata?.description || ''}\n\n## Tools\n\nTBD\n\n## Usage\n\n\`\`\`bash\nossa validate .agents/${input.name}/manifest.ossa.yaml\n\`\`\`\n`;
    fs.writeFileSync(path.join(agentDir, 'AGENTS.md'), agentsMd, 'utf8');

    return {
      success: true,
      manifest_path: manifestPath,
      agent_dir: agentDir,
      files_created: ['manifest.ossa.yaml', 'AGENTS.md', 'prompts/', 'tools/'],
      manifest,
    };
  }

  // ---- Read ----
  async read(filePath: string): Promise<OssaAgent> {
    return this.manifestRepo.load(path.resolve(filePath));
  }

  // ---- List ----
  async list(
    directory: string,
    opts?: { recursive?: boolean; format?: 'summary' | 'detailed' | 'json' }
  ): Promise<ManifestListResult> {
    const baseDir = path.resolve(directory);
    const recursive = opts?.recursive ?? true;

    const results = await scanManifests(baseDir, {
      recursive,
      includeAgentsDirs: true,
      absolute: true,
    });

    const agents = results.map((r) =>
      r.error
        ? { name: r.name || 'unknown', path: r.path, error: r.error }
        : {
            name: r.name || 'unknown',
            version: r.version,
            path: r.path,
            kind: r.kind,
            apiVersion: r.apiVersion,
            description: r.description,
          }
    );

    return { count: agents.length, agents };
  }

  // ---- Validate ----
  async validate(
    manifest: unknown,
    opts?: { platform?: string; strict?: boolean }
  ): Promise<ValidationResult> {
    const result = await this.validationService.validate(
      manifest,
      opts?.platform
    );

    if (opts?.strict && result.warnings?.length) {
      const promoted = result.warnings.map((w: string) => `[strict] ${w}`);
      result.errors = [
        ...(result.errors || []),
        ...promoted,
      ] as typeof result.errors;
      result.valid = !result.errors?.length;
    }

    return result;
  }

  // ---- Inspect ----
  async inspect(filePath: string): Promise<InspectResult> {
    const manifestPath = path.resolve(filePath);
    const manifest = await this.manifestRepo.load(manifestPath);
    const validation = await this.validationService.validate(manifest);
    const fileStat = fs.statSync(manifestPath);

    const meta = manifest.metadata;
    const spec = manifest.spec as Record<string, unknown> | undefined;
    const extensions = (manifest as Record<string, unknown>).extensions as
      | Record<string, unknown>
      | undefined;

    const versionStr = (meta?.version as string) || '0.0.0';
    const parsed = semver.parse(versionStr);
    const specTools = (spec?.tools as Array<Record<string, unknown>>) || [];
    const access = spec?.access as Record<string, unknown> | undefined;
    const autonomy = spec?.autonomy as Record<string, unknown> | undefined;

    const deployTargets: string[] = [];
    if (extensions) {
      if (extensions.kagent) deployTargets.push('kagent');
      if (extensions.docker) deployTargets.push('docker');
      if (extensions.kubernetes) deployTargets.push('kubernetes');
    }

    return {
      name: meta?.name,
      version: versionStr,
      version_analysis: parsed
        ? {
            major: parsed.major,
            minor: parsed.minor,
            patch: parsed.patch,
            prerelease: parsed.prerelease,
          }
        : null,
      kind: manifest.kind,
      apiVersion: manifest.apiVersion,
      description: meta?.description,
      role: spec?.role
        ? String(spec.role).substring(0, 200) +
          (String(spec.role).length > 200 ? '...' : '')
        : null,
      llm: spec?.llm || null,
      tools: specTools.map((t) => ({ name: t.name || t.type, type: t.type })),
      tool_count: specTools.length,
      access_tier: access?.tier || null,
      autonomy_level: autonomy?.level || autonomy?.humanInLoop || null,
      deploy_targets: deployTargets,
      has_extensions: !!extensions,
      extension_keys: extensions ? Object.keys(extensions) : [],
      validation: {
        valid: validation.valid,
        error_count: validation.errors?.length || 0,
        warning_count: validation.warnings?.length || 0,
      },
      file_size_bytes: fileStat.size,
      manifest_path: manifestPath,
    };
  }

  // ---- Diff ----
  async diff(pathA: string, pathB: string): Promise<DiffResult> {
    const resolvedA = path.resolve(pathA);
    const resolvedB = path.resolve(pathB);

    const manifestA = await this.manifestRepo.load(resolvedA);
    const manifestB = await this.manifestRepo.load(resolvedB);

    const allChanges = this.deepDiff(
      manifestA as unknown as Record<string, unknown>,
      manifestB as unknown as Record<string, unknown>
    );
    const breakingChanges = allChanges.filter((c) => this.isBreakingChange(c));

    return {
      path_a: resolvedA,
      path_b: resolvedB,
      name_a: manifestA.metadata?.name,
      name_b: manifestB.metadata?.name,
      total_changes: allChanges.length,
      breaking_changes: breakingChanges.map((c) => `${c.path}: ${c.type}`),
      changes: allChanges,
      compatible: breakingChanges.length === 0,
    };
  }

  // ---- Migrate ----
  async migrate(
    filePath: string,
    targetVersion?: string,
    outputDir?: string
  ): Promise<MigrateResult> {
    const manifestPath = path.resolve(filePath);
    const manifest = await this.manifestRepo.load(manifestPath);
    const detectionResult =
      await this.versionDetectionService.detectVersion(manifest);
    const currentVersion =
      detectionResult.version || (manifest.apiVersion as string) || 'unknown';
    const target = targetVersion || 'ossa/v0.4';

    if (currentVersion === target || `ossa/${currentVersion}` === target) {
      return {
        migrated: false,
        reason: `Already at ${target}`,
        manifest_path: manifestPath,
      };
    }

    const fromVer = currentVersion.replace(/^ossa\/v?/, '');
    const toVer = target.replace(/^ossa\/v?/, '');

    const transform = this.migrationTransformService.getTransform(
      fromVer,
      toVer
    );
    let migrated: OssaAgent;
    const migrations: string[] = [];

    if (transform) {
      migrated = this.migrationTransformService.applyTransform(
        manifest,
        fromVer,
        toVer
      );
      migrations.push(`${transform.description} (${fromVer} → ${toVer})`);
      if (transform.breaking)
        migrations.push('WARNING: This migration contains breaking changes');

      const warnings = this.migrationTransformService.validateMigration(
        manifest,
        migrated
      );
      if (warnings.length)
        migrations.push(...warnings.map((w) => `WARN: ${w}`));
    } else {
      migrated = JSON.parse(JSON.stringify(manifest)) as OssaAgent;
      migrated.apiVersion = target;
      migrations.push(
        `apiVersion: ${currentVersion} → ${target} (no registered transform — apiVersion updated only)`
      );
    }

    if (outputDir) {
      const outDir = path.resolve(outputDir);
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, path.basename(manifestPath));
      const output = yaml.dump(migrated as Record<string, unknown>, {
        lineWidth: 120,
        noRefs: true,
      });
      fs.writeFileSync(outPath, output, 'utf8');
      return {
        migrated: true,
        from: currentVersion,
        to: target,
        migrations,
        written_to: outPath,
      };
    }

    return {
      migrated: true,
      from: currentVersion,
      to: target,
      migrations,
      manifest: migrated,
    };
  }

  // ---- Private: deep diff ----
  private deepDiff(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>,
    prefix = ''
  ): DiffChange[] {
    const changes: DiffChange[] = [];
    const allKeys = new Set([
      ...Object.keys(obj1 || {}),
      ...Object.keys(obj2 || {}),
    ]);

    for (const key of allKeys) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      if (!(key in (obj1 || {}))) {
        changes.push({ type: 'added', path: fieldPath, newValue: val2 });
      } else if (!(key in (obj2 || {}))) {
        changes.push({ type: 'removed', path: fieldPath, oldValue: val1 });
      } else if (
        typeof val1 === 'object' &&
        typeof val2 === 'object' &&
        val1 !== null &&
        val2 !== null &&
        !Array.isArray(val1) &&
        !Array.isArray(val2)
      ) {
        changes.push(
          ...this.deepDiff(
            val1 as Record<string, unknown>,
            val2 as Record<string, unknown>,
            fieldPath
          )
        );
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        changes.push({
          type: 'modified',
          path: fieldPath,
          oldValue: val1,
          newValue: val2,
        });
      }
    }
    return changes;
  }

  private isBreakingChange(change: DiffChange): boolean {
    if (change.type === 'removed') return true;
    if (
      change.path.includes('metadata.name') ||
      change.path.includes('metadata.version')
    )
      return true;
    if (change.path.includes('spec.role')) return true;
    if (change.path.includes('apiVersion')) return true;
    return false;
  }
}
