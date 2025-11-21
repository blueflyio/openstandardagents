/**
 * Discovery Service
 * Discovers OSSA agents in workspace by scanning for .agents/ folders
 */

import * as fs from 'fs';
import * as path from 'path';
import { injectable, inject } from 'inversify';
import { ManifestRepository } from '../repositories/manifest.repository.js';
import { ValidationService } from './validation.service.js';
import type { OssaAgent } from '../types/index.js';

export interface DiscoveredAgent {
  name: string;
  path: string;
  manifest: OssaAgent;
  metadata: {
    version?: string;
    description?: string;
    labels?: Record<string, string>;
    taxonomy?: {
      domain?: string;
      subdomain?: string;
      capabilities?: string[];
    };
  };
  location: {
    type: 'project' | 'module' | 'package' | 'component';
    root: string;
    relativePath: string;
  };
}

export interface DiscoveryResult {
  agents: DiscoveredAgent[];
  registry: {
    version: string;
    timestamp: string;
    totalAgents: number;
    byDomain: Record<string, number>;
    byCapability: Record<string, string[]>;
  };
}

@injectable()
export class DiscoveryService {
  constructor(
    @inject(ManifestRepository) private manifestRepo: ManifestRepository,
    @inject(ValidationService) private validationService: ValidationService
  ) {}

  /**
   * Discover all agents in a workspace
   * @param rootDir - Root directory to scan (default: current working directory)
   * @param options - Discovery options
   * @returns Discovery result with agents and registry
   */
  async discover(
    rootDir: string = process.cwd(),
    options: {
      recursive?: boolean;
      validate?: boolean;
      maxDepth?: number;
    } = {}
  ): Promise<DiscoveryResult> {
    const {
      recursive = true,
      validate = true,
      maxDepth = 10,
    } = options;

    const agents: DiscoveredAgent[] = [];
    const agentsDirs = this.findAgentsDirectories(rootDir, recursive, maxDepth);

    for (const agentsDir of agentsDirs) {
      const discovered = await this.discoverInDirectory(agentsDir, rootDir, validate);
      agents.push(...discovered);
    }

    return {
      agents,
      registry: this.buildRegistry(agents),
    };
  }

  /**
   * Find all .agents/ directories in workspace
   */
  private findAgentsDirectories(
    rootDir: string,
    recursive: boolean,
    maxDepth: number,
    currentDepth = 0
  ): string[] {
    const dirs: string[] = [];
    const resolvedRoot = path.resolve(rootDir);

    if (!fs.existsSync(resolvedRoot)) {
      return dirs;
    }

    const agentsDir = path.join(resolvedRoot, '.agents');
    if (fs.existsSync(agentsDir) && fs.statSync(agentsDir).isDirectory()) {
      dirs.push(agentsDir);
    }

    if (recursive && currentDepth < maxDepth) {
      try {
        const entries = fs.readdirSync(resolvedRoot, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            const subDir = path.join(resolvedRoot, entry.name);
            dirs.push(...this.findAgentsDirectories(subDir, recursive, maxDepth, currentDepth + 1));
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    }

    return dirs;
  }

  /**
   * Discover agents in a specific .agents/ directory
   */
  private async discoverInDirectory(
    agentsDir: string,
    rootDir: string,
    validate: boolean
  ): Promise<DiscoveredAgent[]> {
    const discovered: DiscoveredAgent[] = [];

    if (!fs.existsSync(agentsDir)) {
      return discovered;
    }

    try {
      const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const agentDir = path.join(agentsDir, entry.name);
          const manifestPath = this.findManifestFile(agentDir);

          if (manifestPath) {
            try {
              const manifest = await this.manifestRepo.load(manifestPath);

              if (validate) {
                const validation = await this.validationService.validate(manifest);
                if (!validation.valid) {
                  console.warn(`⚠️  Agent ${entry.name} failed validation, skipping`);
                  continue;
                }
              }

              const ossaAgent = manifest as OssaAgent;
              const location = this.determineLocation(manifestPath, rootDir);

              discovered.push({
                name: ossaAgent.metadata?.name || entry.name,
                path: manifestPath,
                manifest: ossaAgent,
                metadata: {
                  version: ossaAgent.metadata?.version,
                  description: ossaAgent.metadata?.description,
                  labels: ossaAgent.metadata?.labels,
                  taxonomy: (ossaAgent.spec as any)?.taxonomy,
                },
                location,
              });
            } catch (error) {
              console.warn(`⚠️  Failed to load agent ${entry.name}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }

    return discovered;
  }

  /**
   * Find manifest file in agent directory
   */
  private findManifestFile(agentDir: string): string | null {
    const preferred = path.join(agentDir, 'agent.ossa.yaml');
    if (fs.existsSync(preferred)) {
      return preferred;
    }

    const alternative = path.join(agentDir, 'agent.yml');
    if (fs.existsSync(alternative)) {
      return alternative;
    }

    return null;
  }

  /**
   * Determine agent location type
   */
  private determineLocation(manifestPath: string, rootDir: string): DiscoveredAgent['location'] {
    const relativePath = path.relative(rootDir, manifestPath);
    const parts = relativePath.split(path.sep);

    // Determine type based on path structure
    let type: DiscoveredAgent['location']['type'] = 'project';
    if (parts.includes('modules') || parts.includes('custom')) {
      type = 'module';
    } else if (parts.includes('packages') || parts.includes('node_modules')) {
      type = 'package';
    } else if (parts.includes('components') || parts.includes('app')) {
      type = 'component';
    }

    // Find root (first .agents/ parent)
    const agentsIndex = parts.indexOf('.agents');
    const root = agentsIndex > 0 ? parts.slice(0, agentsIndex).join(path.sep) : rootDir;

    return {
      type,
      root: path.isAbsolute(root) ? root : path.join(rootDir, root),
      relativePath,
    };
  }

  /**
   * Build registry from discovered agents
   */
  private buildRegistry(agents: DiscoveredAgent[]): DiscoveryResult['registry'] {
    const byDomain: Record<string, number> = {};
    const byCapability: Record<string, string[]> = {};

    for (const agent of agents) {
      const domain = agent.metadata.taxonomy?.domain || 'uncategorized';
      byDomain[domain] = (byDomain[domain] || 0) + 1;

      const capabilities = agent.metadata.taxonomy?.capabilities || [];
      for (const capability of capabilities) {
        if (!byCapability[capability]) {
          byCapability[capability] = [];
        }
        byCapability[capability].push(agent.name);
      }
    }

    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      totalAgents: agents.length,
      byDomain,
      byCapability,
    };
  }

  /**
   * Save registry to file
   */
  async saveRegistry(registry: DiscoveryResult['registry'], outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2));
  }
}

