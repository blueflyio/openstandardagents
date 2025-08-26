/**
 * Universal Agent Discovery Engine
 * Discovers agents in ANY format across the project without modification
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { DrupalTranslator } from '../translators/DrupalTranslator.js';
import { MCPTranslator } from '../translators/MCPTranslator.js';
import { LangChainTranslator } from '../translators/LangChainTranslator.js';
import { CrewAITranslator } from '../translators/CrewAITranslator.js';

export interface DiscoveryResult {
  id: string;
  name: string;
  format: 'drupal' | 'mcp' | 'langchain' | 'crewai' | 'openai' | 'anthropic' | 'unknown';
  source_path: string;
  capabilities: string[];
  metadata: any;
  confidence: number; // 0-1 confidence score for format detection
}

export interface DiscoveryConfig {
  projectRoot: string;
  discoveryPaths?: string[];
  excludePaths?: string[];
  formats?: string[];
  deepScan?: boolean;
}

export class DiscoveryEngine {
  private drupalTranslator: DrupalTranslator;
  private mcpTranslator: MCPTranslator;
  private langchainTranslator: LangChainTranslator;
  private crewaiTranslator: CrewAITranslator;

  constructor(private config: DiscoveryConfig) {
    this.drupalTranslator = new DrupalTranslator();
    this.mcpTranslator = new MCPTranslator();
    this.langchainTranslator = new LangChainTranslator();
    this.crewaiTranslator = new CrewAITranslator();
  }

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
      this.discoverOpenAIAgents(),
      this.discoverAnthropicAgents(),
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
    this.logDiscoveryStats(sortedDiscoveries);

    return sortedDiscoveries;
  }

  /**
   * Discover Drupal AI Agent plugins
   */
  private async discoverDrupalAgents(): Promise<DiscoveryResult[]> {
    try {
      const plugins = await this.drupalTranslator.discoverDrupalAgents(this.config.projectRoot);
      
      return plugins.map(plugin => ({
        id: `drupal-${plugin.id}`,
        name: plugin.annotation.label || plugin.class_name,
        format: 'drupal' as const,
        source_path: plugin.file_path,
        capabilities: plugin.capabilities.map(c => c.method_name),
        metadata: {
          class_name: plugin.class_name,
          plugin_type: plugin.plugin_type,
          annotation: plugin.annotation,
          prompts_count: plugin.prompts.length,
          raw_data: plugin // Store complete plugin data for translation
        },
        confidence: 0.95 // High confidence for proper Drupal plugins
      }));
    } catch (error) {
      console.warn('⚠️  Drupal agent discovery failed:', error.message);
      return [];
    }
  }

  /**
   * Discover MCP (Model Context Protocol) servers and agents
   */
  private async discoverMCPAgents(): Promise<DiscoveryResult[]> {
    try {
      return await this.mcpTranslator.discoverMCP(this.config.projectRoot);
    } catch (error) {
      console.warn('⚠️  MCP agent discovery failed:', error.message);
      return [];
    }
  }

  /**
   * Discover LangChain agents and tools
   */
  private async discoverLangChainAgents(): Promise<DiscoveryResult[]> {
    try {
      return await this.langchainTranslator.discoverLangChain(this.config.projectRoot);
    } catch (error) {
      console.warn('⚠️  LangChain agent discovery failed:', error.message);
      return [];
    }
  }

  /**
   * Discover CrewAI agents and crews
   */
  private async discoverCrewAIAgents(): Promise<DiscoveryResult[]> {
    try {
      // CrewAI translator doesn't have discoverCrewAI method yet, use internal method
      const implementations = await this.crewaiTranslator.discoverCrewAIImplementations(this.config.projectRoot);
      
      return implementations.map(impl => {
        const fileName = path.basename(impl.file_path, path.extname(impl.file_path));
        const totalAgents = impl.crews.reduce((sum, crew) => sum + crew.agents.length, 0) + impl.standalone_agents.length;
        
        return {
          id: `crewai-${fileName}`,
          name: `CrewAI: ${fileName}`,
          format: 'crewai' as const,
          source_path: impl.file_path,
          capabilities: [
            ...impl.crews.flatMap(crew => crew.agents.map(a => a.role)),
            ...impl.standalone_agents.map(a => a.role),
            ...impl.standalone_tasks.map((_, i) => `task_${i + 1}`)
          ],
          metadata: {
            language: impl.language,
            crews_count: impl.crews.length,
            agents_count: totalAgents,
            tasks_count: impl.crews.reduce((sum, crew) => sum + crew.tasks.length, 0) + impl.standalone_tasks.length,
            tools_count: impl.tools.length,
            raw_data: impl
          },
          confidence: 0.8
        };
      });
    } catch (error) {
      console.warn('⚠️  CrewAI agent discovery failed:', error.message);
      return [];
    }
  }

  /**
   * Discover OpenAI Assistant configurations
   */
  private async discoverOpenAIAgents(): Promise<DiscoveryResult[]> {
    const discoveries: DiscoveryResult[] = [];

    try {
      const files = await glob('**/*.{json,yaml,yml,js,ts,py}', {
        cwd: this.config.projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**']
      });

      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          
          if (this.detectOpenAIPatterns(content)) {
            const name = path.basename(filePath, path.extname(filePath));
            discoveries.push({
              id: `openai-${name}`,
              name: `OpenAI Assistant: ${name}`,
              format: 'openai',
              source_path: filePath,
              capabilities: ['chat', 'function_calling', 'file_search', 'code_interpreter'],
              metadata: {
                detected_patterns: this.getOpenAIPatterns(content),
                file_type: path.extname(filePath)
              },
              confidence: 0.7
            });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    } catch (error) {
      console.warn('⚠️  OpenAI agent discovery failed:', error.message);
    }

    return discoveries;
  }

  /**
   * Discover Anthropic Claude agents and tools
   */
  private async discoverAnthropicAgents(): Promise<DiscoveryResult[]> {
    const discoveries: DiscoveryResult[] = [];

    try {
      const files = await glob('**/*.{js,ts,py,json}', {
        cwd: this.config.projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**']
      });

      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          
          if (this.detectAnthropicPatterns(content)) {
            const name = path.basename(filePath, path.extname(filePath));
            discoveries.push({
              id: `anthropic-${name}`,
              name: `Anthropic Tool: ${name}`,
              format: 'anthropic',
              source_path: filePath,
              capabilities: ['tool_use', 'function_calling'],
              metadata: {
                detected_patterns: this.getAnthropicPatterns(content),
                file_type: path.extname(filePath)
              },
              confidence: 0.7
            });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    } catch (error) {
      console.warn('⚠️  Anthropic agent discovery failed:', error.message);
    }

    return discoveries;
  }

  /**
   * Generic agent discovery for unknown formats
   */
  private async discoverGenericAgents(): Promise<DiscoveryResult[]> {
    const discoveries: DiscoveryResult[] = [];

    try {
      // Look for files with "agent" in the name
      const agentFiles = await glob('**/*agent*.{js,ts,py,json,yaml,yml}', {
        cwd: this.config.projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**']
      });

      for (const filePath of agentFiles) {
        // Only include if not already discovered by specific translators
        const fileName = path.basename(filePath);
        const isAlreadyDiscovered = discoveries.some(d => d.source_path === filePath);
        
        if (!isAlreadyDiscovered) {
          discoveries.push({
            id: `generic-${path.basename(filePath, path.extname(filePath))}`,
            name: `Generic Agent: ${fileName}`,
            format: 'unknown',
            source_path: filePath,
            capabilities: ['unknown'],
            metadata: {
              file_name: fileName,
              detected_by: 'generic_discovery'
            },
            confidence: 0.3
          });
        }
      }
    } catch (error) {
      console.warn('⚠️  Generic agent discovery failed:', error.message);
    }

    return discoveries;
  }

  // Helper methods for pattern detection

  private async detectMCPServer(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.includes('mcp') && (
        content.includes('tools') ||
        content.includes('resources') ||
        content.includes('Server') ||
        content.includes('client.connect')
      );
    } catch {
      return false;
    }
  }

  private detectLangChainPatterns(content: string): boolean {
    return content.includes('langchain') || 
           content.includes('@tool') ||
           content.includes('Tool(') ||
           content.includes('BaseTool') ||
           content.includes('from langchain');
  }

  private extractLangChainTools(content: string): string[] {
    const tools: string[] = [];
    
    // Extract @tool decorators
    const toolMatches = content.matchAll(/@tool\\s*(?:\\([^)]*\\))?\\s*def\\s+(\\w+)/g);
    for (const match of toolMatches) {
      tools.push(match[1]);
    }
    
    // Extract Tool class definitions
    const toolClassMatches = content.matchAll(/class\\s+(\\w+)\\s*\\(.*Tool.*\\)/g);
    for (const match of toolClassMatches) {
      tools.push(match[1]);
    }
    
    return tools;
  }

  private detectCrewAIPatterns(content: string): boolean {
    return content.includes('crewai') ||
           content.includes('Agent(') ||
           content.includes('Crew(') ||
           content.includes('from crewai');
  }

  private extractCrewAIAgents(content: string): string[] {
    const agents: string[] = [];
    
    // Extract Agent definitions
    const agentMatches = content.matchAll(/Agent\\s*\\(\\s*role\\s*=\\s*['""]([^'""]+)['""])/g);
    for (const match of agentMatches) {
      agents.push(match[1]);
    }
    
    return agents;
  }

  private detectOpenAIPatterns(content: string): boolean {
    return content.includes('openai') &&
           (content.includes('assistant') ||
            content.includes('function_calling') ||
            content.includes('tools') ||
            content.includes('OpenAI'));
  }

  private getOpenAIPatterns(content: string): string[] {
    const patterns: string[] = [];
    
    if (content.includes('assistant')) patterns.push('assistant');
    if (content.includes('function_calling')) patterns.push('function_calling');
    if (content.includes('tools')) patterns.push('tools');
    if (content.includes('file_search')) patterns.push('file_search');
    
    return patterns;
  }

  private detectAnthropicPatterns(content: string): boolean {
    return content.includes('anthropic') ||
           content.includes('claude') ||
           content.includes('tool_use');
  }

  private getAnthropicPatterns(content: string): string[] {
    const patterns: string[] = [];
    
    if (content.includes('tool_use')) patterns.push('tool_use');
    if (content.includes('function_calling')) patterns.push('function_calling');
    if (content.includes('claude')) patterns.push('claude');
    
    return patterns;
  }

  /**
   * Remove duplicate discoveries based on source path and ID
   */
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

  /**
   * Log discovery statistics
   */
  private logDiscoveryStats(discoveries: DiscoveryResult[]): void {
    const stats: { [format: string]: number } = {};
    
    discoveries.forEach(d => {
      stats[d.format] = (stats[d.format] || 0) + 1;
    });
    
    console.log('📊 Discovery Statistics:');
    Object.entries(stats).forEach(([format, count]) => {
      console.log(`   ${format}: ${count} agents`);
    });
  }
}