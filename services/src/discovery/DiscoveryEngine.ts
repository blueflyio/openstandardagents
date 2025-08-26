/**
 * Universal Agent Discovery Engine
 * Discovers agents in ANY format across the project without modification
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export interface DiscoveryResult {
  id: string;
  name: string;
  format: 'drupal' | 'mcp' | 'langchain' | 'crewai' | 'openai' | 'anthropic' | 'unknown';
  source_path: string;
  capabilities: string[];
  metadata: any;
  confidence: number;
}

export interface DiscoveryConfig {
  projectRoot: string;
  discoveryPaths?: string[];
  excludePaths?: string[];
  formats?: string[];
  deepScan?: boolean;
}

export class DiscoveryEngine {
  constructor(private config: DiscoveryConfig) {}

  /**
   * Discover all agents across all supported formats
   */
  async discoverAll(): Promise<DiscoveryResult[]> {
    console.log('🔍 Starting universal agent discovery...');
    console.log(`📁 Project root: ${this.config.projectRoot}`);

    const discoveries: DiscoveryResult[] = [];

    // Parallel discovery across all formats
    const discoveryPromises = [
      this.discoverDrupalAgents(),
      this.discoverMCPAgents(), 
      this.discoverLangChainAgents(),
      this.discoverCrewAIAgents(),
      this.discoverGenericAgents()
    ];

    const results = await Promise.allSettled(discoveryPromises);

    // Combine all discovery results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        discoveries.push(...result.value);
      } else {
        console.warn(`⚠️  Discovery method ${index} failed:`, result.reason.message);
      }
    });

    // Remove duplicates and sort by confidence
    const uniqueDiscoveries = this.deduplicateDiscoveries(discoveries);
    const sortedDiscoveries = uniqueDiscoveries.sort((a, b) => b.confidence - a.confidence);

    console.log(`✅ Discovered ${sortedDiscoveries.length} unique agents`);
    return sortedDiscoveries;
  }

  // Basic discovery methods - simplified for clean package
  private async discoverDrupalAgents(): Promise<DiscoveryResult[]> {
    const drupalPath = path.join(this.config.projectRoot, 'web/modules/custom');
    
    try {
      await fs.access(drupalPath);
      const pluginFiles = await glob('**/src/Plugin/**/*.php', { cwd: drupalPath, absolute: true });
      
      return pluginFiles.map((filePath, index) => ({
        id: `drupal-plugin-${index}`,
        name: path.basename(filePath, '.php'),
        format: 'drupal' as const,
        source_path: filePath,
        capabilities: ['drupal_capability'],
        metadata: { type: 'drupal_plugin' },
        confidence: 0.9
      }));
    } catch {
      return [];
    }
  }

  private async discoverMCPAgents(): Promise<DiscoveryResult[]> {
    try {
      const mcpConfigs = await glob('**/mcp.json', {
        cwd: this.config.projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**']
      });

      return mcpConfigs.map((configPath, index) => ({
        id: `mcp-server-${index}`,
        name: `MCP Server ${index + 1}`,
        format: 'mcp' as const,
        source_path: configPath,
        capabilities: ['mcp_tools'],
        metadata: { type: 'mcp_server' },
        confidence: 0.8
      }));
    } catch {
      return [];
    }
  }

  private async discoverLangChainAgents(): Promise<DiscoveryResult[]> {
    try {
      const langchainFiles = await glob('**/*.{py,js,ts}', {
        cwd: this.config.projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**']
      });

      const discoveries: DiscoveryResult[] = [];
      
      for (const filePath of langchainFiles.slice(0, 10)) { // Limit for performance
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          if (content.includes('langchain') || content.includes('@tool')) {
            discoveries.push({
              id: `langchain-${path.basename(filePath, path.extname(filePath))}`,
              name: `LangChain: ${path.basename(filePath)}`,
              format: 'langchain',
              source_path: filePath,
              capabilities: ['langchain_tool'],
              metadata: { type: 'langchain_implementation' },
              confidence: 0.7
            });
          }
        } catch {
          // Skip files that can't be read
        }
      }
      
      return discoveries;
    } catch {
      return [];
    }
  }

  private async discoverCrewAIAgents(): Promise<DiscoveryResult[]> {
    try {
      const crewFiles = await glob('**/*.{py,yaml,yml}', {
        cwd: this.config.projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**']
      });

      const discoveries: DiscoveryResult[] = [];
      
      for (const filePath of crewFiles.slice(0, 10)) { // Limit for performance
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          if (content.includes('crewai') || content.includes('Agent(') || content.includes('Crew(')) {
            discoveries.push({
              id: `crewai-${path.basename(filePath, path.extname(filePath))}`,
              name: `CrewAI: ${path.basename(filePath)}`,
              format: 'crewai',
              source_path: filePath,
              capabilities: ['crewai_agent'],
              metadata: { type: 'crewai_implementation' },
              confidence: 0.7
            });
          }
        } catch {
          // Skip files that can't be read
        }
      }
      
      return discoveries;
    } catch {
      return [];
    }
  }

  private async discoverGenericAgents(): Promise<DiscoveryResult[]> {
    try {
      const agentFiles = await glob('**/*agent*.{js,ts,py,json,yaml,yml}', {
        cwd: this.config.projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**']
      });

      return agentFiles.slice(0, 5).map((filePath, index) => ({
        id: `generic-agent-${index}`,
        name: `Generic: ${path.basename(filePath)}`,
        format: 'unknown' as const,
        source_path: filePath,
        capabilities: ['unknown'],
        metadata: { type: 'generic_agent' },
        confidence: 0.3
      }));
    } catch {
      return [];
    }
  }

  private deduplicateDiscoveries(discoveries: DiscoveryResult[]): DiscoveryResult[] {
    const seen = new Set<string>();
    const unique: DiscoveryResult[] = [];
    
    for (const discovery of discoveries) {
      const key = `${discovery.source_path}:${discovery.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(discovery);
      }
    }
    
    return unique;
  }
}