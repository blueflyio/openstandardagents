/**
 * AGENTS.md API Service
 *
 * Implements OpenAPI operations for GET/PUT/DELETE /agents/{name}/agents-md.
 * Used by BuildKit or any HTTP layer that exposes ossa-cli.yaml; logic lives in OSSA.
 * Same behavior as ossa agents-md generate/validate/sync.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { injectable, inject } from 'inversify';
import type { OssaAgent } from '../../types/index.js';
import { AgentsMdService } from './agents-md.service.js';
import { AgentsMdDiscoveryService } from './agents-md-discovery.service.js';
import type { DiscoveredAgentsMd } from './agents-md-discovery.service.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';

export interface AgentsMdOptions {
  outputPath?: string;
  sections?: {
    dev_environment?: { enabled?: boolean; custom?: string };
    testing?: { enabled?: boolean; custom?: string };
    pr_instructions?: { enabled?: boolean; custom?: string };
    security?: { enabled?: boolean; custom?: string };
    code_style?: { enabled?: boolean; custom?: string };
  };
}

export interface AgentsMdContentBody {
  content?: string;
  options?: AgentsMdOptions;
}

export interface AgentsMdResponse {
  content: string;
  path: string;
}

const DEFAULT_AGENTS_DIR = '.agents';

@injectable()
export class AgentsMdApiService {
  constructor(
    @inject(ManifestRepository) private readonly manifestRepo: ManifestRepository,
    @inject(AgentsMdService) private readonly agentsMdService: AgentsMdService,
    @inject(AgentsMdDiscoveryService) private readonly discoveryService: AgentsMdDiscoveryService
  ) {}

  /**
   * Discover all AGENTS.md in workspace (for update and maintenance).
   */
  async discover(baseDir: string): Promise<DiscoveredAgentsMd[]> {
    return this.discoveryService.discover(baseDir);
  }

  /**
   * Maintain: validate and optionally regenerate discovered AGENTS.md.
   */
  async maintain(
    baseDir: string,
    options: { regenerate: boolean; dryRun?: boolean }
  ): Promise<{
    discovered: DiscoveredAgentsMd[];
    updated: string[];
    skipped: string[];
    failed: Array<{ path: string; error: string }>;
  }> {
    return this.discoveryService.maintain(baseDir, options);
  }

  /**
   * Resolve manifest path for an agent by name (convention: .agents/{name}/manifest.ossa.yaml)
   */
  resolveManifestPath(baseDir: string, agentName: string): string {
    return path.join(baseDir, DEFAULT_AGENTS_DIR, agentName, 'manifest.ossa.yaml');
  }

  /**
   * Resolve AGENTS.md path for an agent (default: .agents/{name}/AGENTS.md)
   */
  resolveAgentsMdPath(
    baseDir: string,
    agentName: string,
    outputPath?: string
  ): string {
    const agentDir = path.join(baseDir, DEFAULT_AGENTS_DIR, agentName);
    const relative = outputPath || 'AGENTS.md';
    return path.isAbsolute(relative) ? relative : path.join(agentDir, relative);
  }

  /**
   * GET: Return AGENTS.md content for an agent. Optionally generate from manifest if missing.
   */
  async getAgentsMd(
    agentName: string,
    baseDir: string,
    options?: { generate?: boolean }
  ): Promise<AgentsMdResponse | null> {
    const manifestPath = this.resolveManifestPath(baseDir, agentName);
    let manifest: OssaAgent;
    try {
      manifest = await this.manifestRepo.load(manifestPath);
    } catch {
      return null;
    }

    const outputPath = manifest.extensions?.agents_md?.output_path || 'AGENTS.md';
    const agentsMdPath = this.resolveAgentsMdPath(baseDir, agentName, outputPath);

    try {
      const content = await fs.readFile(agentsMdPath, 'utf-8');
      return { content, path: agentsMdPath };
    } catch {
      if (options?.generate && manifest.extensions?.agents_md?.enabled) {
        await this.agentsMdService.writeAgentsMd(manifest, agentsMdPath);
        const content = await fs.readFile(agentsMdPath, 'utf-8');
        return { content, path: agentsMdPath };
      }
      return null;
    }
  }

  /**
   * PUT: Create or update AGENTS.md. Accepts raw content or generate from manifest with options.
   */
  async putAgentsMd(
    agentName: string,
    baseDir: string,
    body: AgentsMdContentBody
  ): Promise<AgentsMdResponse> {
    const manifestPath = this.resolveManifestPath(baseDir, agentName);
    let manifest: OssaAgent;
    try {
      manifest = await this.manifestRepo.load(manifestPath);
    } catch {
      throw new Error(`Agent not found: ${agentName}`);
    }

    const outputPath =
      body.options?.outputPath ??
      manifest.extensions?.agents_md?.output_path ??
      'AGENTS.md';
    const agentsMdPath = this.resolveAgentsMdPath(baseDir, agentName, outputPath);

    if (body.content !== undefined && body.content !== '') {
      await fs.mkdir(path.dirname(agentsMdPath), { recursive: true });
      await fs.writeFile(agentsMdPath, body.content, 'utf-8');
      return { content: body.content, path: agentsMdPath };
    }

    if (!manifest.extensions?.agents_md) {
      manifest.extensions = { ...manifest.extensions, agents_md: { enabled: true } };
    }
    manifest.extensions!.agents_md!.enabled = true;
    if (body.options?.outputPath) {
      manifest.extensions!.agents_md!.output_path = body.options.outputPath;
    }
    if (body.options?.sections) {
      manifest.extensions!.agents_md!.sections = {
        ...manifest.extensions!.agents_md!.sections,
        ...body.options.sections,
      };
    }

    await this.agentsMdService.writeAgentsMd(manifest, agentsMdPath);
    const content = await fs.readFile(agentsMdPath, 'utf-8');
    return { content, path: agentsMdPath };
  }

  /**
   * DELETE: Remove AGENTS.md file for an agent.
   */
  async deleteAgentsMd(
    agentName: string,
    baseDir: string
  ): Promise<boolean> {
    const manifestPath = this.resolveManifestPath(baseDir, agentName);
    try {
      await this.manifestRepo.load(manifestPath);
    } catch {
      return false;
    }

    const outputPath = 'AGENTS.md';
    const agentsMdPath = this.resolveAgentsMdPath(baseDir, agentName, outputPath);
    try {
      await fs.unlink(agentsMdPath);
      return true;
    } catch {
      return false;
    }
  }
}
