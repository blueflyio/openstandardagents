/**
 * AGENTS.md Discovery Service
 *
 * Discovers all AGENTS.md files in a workspace and their associated OSSA manifests
 * so they can be updated and maintained after creation.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { injectable } from 'inversify';
import type { OssaAgent } from '../../types/index.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { AgentsMdService } from './agents-md.service.js';

const AGENTS_DIR = '.agents';
const MANIFEST_NAME = 'manifest.ossa.yaml';
const AGENTS_MD_NAME = 'AGENTS.md';

export interface DiscoveredAgentsMd {
  /** Absolute path to AGENTS.md */
  agentsMdPath: string;
  /** Absolute path to OSSA manifest (if paired) */
  manifestPath: string | null;
  /** Agent name from .agents/{name} or manifest metadata */
  agentName: string | null;
  /** Whether validation was run and passed */
  valid: boolean | null;
  /** Validation warnings (when manifest exists) */
  warnings: string[];
  /** Base directory (workspace root) */
  baseDir: string;
}

@injectable()
export class AgentsMdDiscoveryService {
  constructor(
    private readonly manifestRepo: ManifestRepository,
    private readonly agentsMdService: AgentsMdService
  ) {}

  /**
   * Discover all AGENTS.md files in a workspace.
   * - Scans .agents/{name}/ for manifest + AGENTS.md pairs.
   * - Scans repo root for AGENTS.md (optional manifest at root).
   * - Optionally scans nested dirs for AGENTS.md and infers manifest.
   * @param baseDir - Workspace directory to scan
   * @param opts - Optional configDir/wikiRoot for pointer validation (reserved for future use)
   */
  async discover(
    baseDir: string,
    _opts?: { configDir?: string; wikiRoot?: string }
  ): Promise<DiscoveredAgentsMd[]> {
    const resolvedBase = path.resolve(baseDir);
    const results: DiscoveredAgentsMd[] = [];

    const agentsDir = path.join(resolvedBase, AGENTS_DIR);
    try {
      const entries = await fs.readdir(agentsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const agentDir = path.join(agentsDir, entry.name);
        const manifestPath = path.join(agentDir, MANIFEST_NAME);
        let manifestExists = false;
        try {
          await fs.access(manifestPath);
          manifestExists = true;
        } catch {
          // no manifest
        }
        if (!manifestExists) continue;

        let agentsMdPath: string;
        try {
          const manifest = await this.manifestRepo.load(manifestPath);
          const outputPath =
            manifest.extensions?.agents_md?.output_path || AGENTS_MD_NAME;
          agentsMdPath = path.isAbsolute(outputPath)
            ? outputPath
            : path.join(agentDir, outputPath);
        } catch {
          agentsMdPath = path.join(agentDir, AGENTS_MD_NAME);
        }

        let valid: boolean | null = null;
        const warnings: string[] = [];
        try {
          const manifest = await this.manifestRepo.load(manifestPath);
          const result = await this.agentsMdService.validateAgentsMd(
            agentsMdPath,
            manifest
          );
          valid = result.valid;
          warnings.push(...result.warnings);
        } catch {
          // AGENTS.md may not exist yet
          try {
            await fs.access(agentsMdPath);
            valid = false;
            warnings.push('Could not validate (manifest or file issue)');
          } catch {
            valid = null;
            warnings.push('AGENTS.md not present');
          }
        }

        results.push({
          agentsMdPath,
          manifestPath,
          agentName: entry.name,
          valid,
          warnings,
          baseDir: resolvedBase,
        });
      }
    } catch {
      // .agents does not exist
    }

    const rootAgentsMd = path.join(resolvedBase, AGENTS_MD_NAME);
    try {
      await fs.access(rootAgentsMd);
      const alreadyInResults = results.some(
        (r) => path.resolve(r.agentsMdPath) === path.resolve(rootAgentsMd)
      );
      if (!alreadyInResults) {
        let valid: boolean | null = null;
        const warnings: string[] = [];
        const rootManifest = path.join(resolvedBase, MANIFEST_NAME);
        try {
          await fs.access(rootManifest);
          const manifest = await this.manifestRepo.load(rootManifest);
          const result = await this.agentsMdService.validateAgentsMd(
            rootAgentsMd,
            manifest
          );
          valid = result.valid;
          warnings.push(...result.warnings);
          results.push({
            agentsMdPath: rootAgentsMd,
            manifestPath: rootManifest,
            agentName: (manifest.metadata as { name?: string })?.name ?? null,
            valid,
            warnings,
            baseDir: resolvedBase,
          });
        } catch {
          results.push({
            agentsMdPath: rootAgentsMd,
            manifestPath: null,
            agentName: null,
            valid: null,
            warnings: ['No OSSA manifest at repo root'],
            baseDir: resolvedBase,
          });
        }
      }
    } catch {
      // no root AGENTS.md
    }

    return results;
  }

  /**
   * Maintain: validate and optionally regenerate each discovered AGENTS.md that has a manifest.
   * @param options.configDir - Optional config root (reserved for pointer validation)
   * @param options.wikiRoot - Optional wikis root (reserved for pointer validation)
   */
  async maintain(
    baseDir: string,
    options: {
      regenerate: boolean;
      dryRun?: boolean;
      configDir?: string;
      wikiRoot?: string;
    }
  ): Promise<{
    discovered: DiscoveredAgentsMd[];
    updated: string[];
    skipped: string[];
    failed: Array<{ path: string; error: string }>;
  }> {
    const discovered = await this.discover(baseDir, {
      configDir: options.configDir,
      wikiRoot: options.wikiRoot,
    });
    const updated: string[] = [];
    const skipped: string[] = [];
    const failed: Array<{ path: string; error: string }> = [];

    for (const item of discovered) {
      if (!item.manifestPath) {
        skipped.push(item.agentsMdPath);
        continue;
      }
      if (item.valid && !options.regenerate) {
        skipped.push(item.agentsMdPath);
        continue;
      }
      if (options.dryRun) {
        updated.push(item.agentsMdPath);
        continue;
      }
      try {
        const manifest = await this.manifestRepo.load(item.manifestPath);
        if (!manifest.extensions?.agents_md?.enabled) {
          manifest.extensions = {
            ...manifest.extensions,
            agents_md: { enabled: true, generate: true },
          };
        }
        await this.agentsMdService.writeAgentsMd(manifest, item.agentsMdPath);
        updated.push(item.agentsMdPath);
      } catch (err) {
        failed.push({
          path: item.agentsMdPath,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { discovered, updated, skipped, failed };
  }
}
