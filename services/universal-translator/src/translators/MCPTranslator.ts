/**
 * MCP (Model Context Protocol) Translator
 * Translates MCP servers and tools to OAAS format without modification
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export interface MCPServer {
  name: string;
  command: string;
  args?: string[];
  env?: { [key: string]: string };
  capabilities?: string[];
  tools?: MCPTool[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handler?: string;
}

export interface MCPResource {
  name: string;
  description: string;
  uri?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: any[];
}

export interface MCPConfiguration {
  mcpServers?: { [serverName: string]: MCPServer };
  servers?: { [serverName: string]: MCPServer };
}

export interface DiscoveryResult {
  id: string;
  name: string;
  format: 'drupal' | 'mcp' | 'langchain' | 'crewai' | 'openai' | 'anthropic' | 'unknown';
  source_path: string;
  capabilities: string[];
  metadata: any;
  confidence: number;
}

export class MCPTranslator {

  /**
   * Discover MCP configurations and servers (compatible with DiscoveryEngine)
   */
  async discoverMCP(projectRoot: string): Promise<DiscoveryResult[]> {
    console.log('🔍 Discovering MCP servers...');
    
    const discoveries: DiscoveryResult[] = [];
    const servers = await this.discoverMCPServers(projectRoot);
    
    // Convert MCPServer objects to DiscoveryResult format
    for (const server of servers) {
      discoveries.push({
        id: `mcp-${server.name}`,
        name: server.name,
        format: 'mcp',
        source_path: 'unknown', // Will be set by findMCPConfigs
        capabilities: [
          ...(server.tools?.map(t => t.name) || []),
          ...(server.resources?.map(r => r.name) || []),
          ...(server.prompts?.map(p => p.name) || [])
        ],
        metadata: {
          command: server.command,
          args: server.args,
          env: server.env,
          capabilities: server.capabilities,
          tools_count: server.tools?.length || 0,
          resources_count: server.resources?.length || 0,
          prompts_count: server.prompts?.length || 0
        },
        confidence: this.calculateServerConfidence(server)
      });
    }
    
    console.log(`✅ Found ${discoveries.length} MCP servers`);
    return discoveries;
  }

  /**
   * Internal method: Discover MCP configurations and servers
   */
  private async discoverMCPServers(projectRoot: string): Promise<MCPServer[]> {
    console.log('🔍 Discovering MCP servers...');
    
    const servers: MCPServer[] = [];
    
    // Find mcp.json configuration files
    const mcpConfigs = await this.findMCPConfigs(projectRoot);
    for (const config of mcpConfigs) {
      servers.push(...config.servers);
    }
    
    // Find standalone MCP server implementations
    const standaloneServers = await this.findStandaloneMCPServers(projectRoot);
    servers.push(...standaloneServers);
    
    console.log(`✅ Found ${servers.length} MCP servers`);
    return servers;
  }

  /**
   * Find and parse mcp.json configuration files
   */
  private async findMCPConfigs(projectRoot: string): Promise<{ path: string; servers: MCPServer[] }[]> {
    const configs: { path: string; servers: MCPServer[] }[] = [];
    
    try {
      const configFiles = await glob('**/mcp.json', {
        cwd: projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**']
      });

      for (const configPath of configFiles) {
        try {
          const content = await fs.readFile(configPath, 'utf-8');
          const config: MCPConfiguration = JSON.parse(content);
          
          const servers: MCPServer[] = [];
          const serverConfigs = config.mcpServers || config.servers || {};
          
          for (const [serverName, serverConfig] of Object.entries(serverConfigs)) {
            servers.push({
              name: serverName,
              command: serverConfig.command,
              args: serverConfig.args,
              env: serverConfig.env,
              capabilities: this.extractCapabilities(serverConfig),
              tools: await this.extractTools(serverConfig, configPath),
              resources: await this.extractResources(serverConfig, configPath),
              prompts: await this.extractPrompts(serverConfig, configPath)
            });
          }
          
          configs.push({ path: configPath, servers });
        } catch (error) {
          console.warn(`⚠️  Failed to parse MCP config ${configPath}:`, error.message);
        }
      }
    } catch (error) {
      console.warn('⚠️  MCP config discovery failed:', error.message);
    }
    
    return configs;
  }

  /**
   * Find standalone MCP server implementations
   */
  private async findStandaloneMCPServers(projectRoot: string): Promise<MCPServer[]> {
    const servers: MCPServer[] = [];
    
    try {
      // Look for files that might be MCP servers
      const serverFiles = await glob('**/*{mcp,server}*.{js,ts,py}', {
        cwd: projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**']
      });

      for (const serverPath of serverFiles) {
        try {
          const content = await fs.readFile(serverPath, 'utf-8');
          
          if (this.isMCPServer(content)) {
            const serverName = path.basename(serverPath, path.extname(serverPath));
            const tools = this.extractToolsFromCode(content);
            const resources = this.extractResourcesFromCode(content);
            const prompts = this.extractPromptsFromCode(content);
            
            servers.push({
              name: serverName,
              command: this.inferCommand(serverPath),
              capabilities: ['tools', 'resources', 'prompts'].filter(cap => {
                if (cap === 'tools') return tools.length > 0;
                if (cap === 'resources') return resources.length > 0;
                if (cap === 'prompts') return prompts.length > 0;
                return false;
              }),
              tools,
              resources,
              prompts
            });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    } catch (error) {
      console.warn('⚠️  Standalone MCP server discovery failed:', error.message);
    }
    
    return servers;
  }

  /**
   * Check if file content represents an MCP server
   */
  private isMCPServer(content: string): boolean {
    // Look for MCP-specific patterns
    const mcpPatterns = [
      /from\s+mcp\s+import/,
      /import.*mcp/,
      /@tool/,
      /list_tools/,
      /call_tool/,
      /Server\(/,
      /mcp\.Server/,
      /tools\s*:\s*\[/,
      /resources\s*:\s*\[/
    ];

    return mcpPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Extract capabilities from server config
   */
  private extractCapabilities(serverConfig: MCPServer): string[] {
    const capabilities: string[] = [];
    
    if (serverConfig.capabilities) {
      return serverConfig.capabilities;
    }
    
    // Infer capabilities from configuration
    if (serverConfig.tools?.length) capabilities.push('tools');
    if (serverConfig.resources?.length) capabilities.push('resources');
    if (serverConfig.prompts?.length) capabilities.push('prompts');
    
    // Default MCP capabilities
    if (capabilities.length === 0) {
      capabilities.push('tools', 'resources', 'prompts');
    }
    
    return capabilities;
  }

  /**
   * Extract tools from server config or code
   */
  private async extractTools(serverConfig: MCPServer, configPath: string): Promise<MCPTool[]> {
    if (serverConfig.tools) {
      return serverConfig.tools;
    }
    
    // Try to find tools in server implementation
    const serverDir = path.dirname(configPath);
    try {
      const serverFiles = await glob('**/*.{js,ts,py}', {
        cwd: serverDir,
        absolute: true
      });
      
      for (const serverFile of serverFiles) {
        const content = await fs.readFile(serverFile, 'utf-8');
        const tools = this.extractToolsFromCode(content);
        if (tools.length > 0) {
          return tools;
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    return [];
  }

  /**
   * Extract tools from code content
   */
  private extractToolsFromCode(content: string): MCPTool[] {
    const tools: MCPTool[] = [];
    
    // Python @tool decorator pattern
    const pythonToolMatches = content.matchAll(/@tool\s*(?:\([^)]*\))?\s*(?:async\s+)?def\s+(\w+)/g);
    for (const match of pythonToolMatches) {
      const toolName = match[1];
      const description = this.extractDocstring(content, toolName);
      tools.push({
        name: toolName,
        description: description || `Execute ${toolName} operation`,
        inputSchema: this.extractInputSchema(content, toolName)
      });
    }
    
    // JavaScript/TypeScript tool patterns
    const jsToolMatches = content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g);
    for (const match of jsToolMatches) {
      const toolName = match[1];
      if (this.isToolFunction(content, toolName)) {
        tools.push({
          name: toolName,
          description: this.extractJSDocDescription(content, toolName) || `Execute ${toolName} operation`,
          inputSchema: this.extractJSInputSchema(content, toolName)
        });
      }
    }
    
    return tools;
  }

  /**
   * Extract resources from server config or code
   */
  private async extractResources(serverConfig: MCPServer, configPath: string): Promise<MCPResource[]> {
    if (serverConfig.resources) {
      return serverConfig.resources;
    }
    
    // Try to infer resources from server directory
    const serverDir = path.dirname(configPath);
    const resources: MCPResource[] = [];
    
    try {
      const resourceFiles = await glob('**/*.{md,txt,json,yaml,yml}', {
        cwd: serverDir,
        absolute: true
      });
      
      for (const resourceFile of resourceFiles) {
        const name = path.basename(resourceFile);
        const ext = path.extname(resourceFile);
        
        resources.push({
          name: name,
          description: `${ext.substring(1).toUpperCase()} resource: ${name}`,
          uri: `file://${resourceFile}`,
          mimeType: this.getMimeType(ext)
        });
      }
    } catch (error) {
      // Ignore errors
    }
    
    return resources;
  }

  /**
   * Extract resources from code content
   */
  private extractResourcesFromCode(content: string): MCPResource[] {
    const resources: MCPResource[] = [];
    
    // Look for resource definitions
    const resourcePatterns = [
      /list_resources/,
      /get_resource/,
      /Resource\(/
    ];
    
    if (resourcePatterns.some(pattern => pattern.test(content))) {
      // Default resources if patterns are found
      resources.push({
        name: 'default',
        description: 'Default MCP resource'
      });
    }
    
    return resources;
  }

  /**
   * Extract prompts from server config or code
   */
  private async extractPrompts(serverConfig: MCPServer, configPath: string): Promise<MCPPrompt[]> {
    if (serverConfig.prompts) {
      return serverConfig.prompts;
    }
    
    return this.extractPromptsFromCode(''); // Default empty prompts
  }

  /**
   * Extract prompts from code content
   */
  private extractPromptsFromCode(content: string): MCPPrompt[] {
    const prompts: MCPPrompt[] = [];
    
    // Look for prompt definitions
    const promptPatterns = [
      /list_prompts/,
      /get_prompt/,
      /Prompt\(/
    ];
    
    if (promptPatterns.some(pattern => pattern.test(content))) {
      // Default prompts if patterns are found
      prompts.push({
        name: 'default',
        description: 'Default MCP prompt'
      });
    }
    
    return prompts;
  }

  /**
   * Extract docstring from Python function
   */
  private extractDocstring(content: string, functionName: string): string | null {
    const funcPattern = new RegExp(`def\\s+${functionName}\\s*\\([^)]*\\):[^"']*["']{3}([^"']+)["']{3}`, 's');
    const match = content.match(funcPattern);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract JSDoc description
   */
  private extractJSDocDescription(content: string, functionName: string): string | null {
    const funcPattern = new RegExp(`/\\*\\*([^*]|\\*(?!/))*\\*/\\s*(?:export\\s+)?(?:async\\s+)?function\\s+${functionName}`, 's');
    const match = content.match(funcPattern);
    if (match) {
      const jsdoc = match[0];
      const descMatch = jsdoc.match(/\*\s*([^@*\n][^\n]*)/);
      return descMatch ? descMatch[1].trim() : null;
    }
    return null;
  }

  /**
   * Check if function is a tool function
   */
  private isToolFunction(content: string, functionName: string): boolean {
    const funcContext = content.substring(
      Math.max(0, content.indexOf(functionName) - 200),
      content.indexOf(functionName) + 200
    );
    
    return funcContext.includes('@tool') || 
           funcContext.includes('tool') || 
           funcContext.includes('Tool');
  }

  /**
   * Extract input schema from function signature
   */
  private extractInputSchema(content: string, functionName: string): any {
    // Simple schema extraction - could be enhanced
    return {
      type: 'object',
      properties: {},
      description: `Input schema for ${functionName}`
    };
  }

  /**
   * Extract JavaScript input schema
   */
  private extractJSInputSchema(content: string, functionName: string): any {
    return {
      type: 'object',
      properties: {},
      description: `Input schema for ${functionName}`
    };
  }

  /**
   * Infer command for running the server
   */
  private inferCommand(serverPath: string): string {
    const ext = path.extname(serverPath);
    
    switch (ext) {
      case '.py':
        return 'python';
      case '.js':
        return 'node';
      case '.ts':
        return 'npx tsx';
      default:
        return 'node';
    }
  }

  /**
   * Get MIME type for file extension
   */
  private getMimeType(ext: string): string {
    const mimeTypes: { [ext: string]: string } = {
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.yaml': 'application/yaml',
      '.yml': 'application/yaml'
    };
    
    return mimeTypes[ext] || 'text/plain';
  }

  /**
   * Translate MCP server to OAAS format
   */
  async translateToOAAS(server: MCPServer): Promise<any> {
    const oaasSpec = {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent", 
      metadata: {
        name: `mcp-${server.name}`,
        version: "1.0.0",
        created: new Date().toISOString().split('T')[0],
        description: `MCP Server: ${server.name}`,
        annotations: {
          "oaas/compliance-level": "silver",
          "oaas/framework-support": "mcp,langchain,crewai",
          "mcp/server-name": server.name,
          "mcp/command": server.command,
          "mcp/capabilities": server.capabilities?.join(',') || 'tools,resources,prompts'
        },
        labels: {
          domain: "mcp-protocol",
          category: "server",
          framework: "mcp"
        }
      },
      spec: {
        agent: {
          name: server.name,
          expertise: `MCP server providing ${server.capabilities?.join(', ') || 'tools, resources, and prompts'}`
        },
        capabilities: [
          ...(server.tools?.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema,
            output_schema: { type: 'object', description: 'Tool execution result' },
            frameworks: ['mcp', 'langchain'],
            compliance: ['mcp-protocol']
          })) || []),
          ...(server.resources?.map(resource => ({
            name: `get_${resource.name}`,
            description: `Access resource: ${resource.description}`,
            input_schema: { type: 'object', properties: { uri: { type: 'string' } } },
            output_schema: { type: 'object', description: 'Resource content' },
            frameworks: ['mcp'],
            compliance: ['mcp-protocol']
          })) || []),
          ...(server.prompts?.map(prompt => ({
            name: `get_${prompt.name}_prompt`,
            description: `Get prompt: ${prompt.description}`,
            input_schema: { type: 'object', properties: prompt.arguments || {} },
            output_schema: { type: 'object', description: 'Prompt template' },
            frameworks: ['mcp'],
            compliance: ['mcp-protocol']
          })) || [])
        ],
        protocols: {
          supported: ['mcp', 'openapi'],
          primary: 'mcp',
          mcp: {
            enabled: true,
            server_name: server.name,
            command: server.command,
            args: server.args,
            env: server.env,
            capabilities: server.capabilities
          }
        },
        frameworks: {
          mcp: {
            enabled: true,
            server_config: {
              command: server.command,
              args: server.args,
              env: server.env
            }
          },
          langchain: {
            enabled: true,
            tool_type: 'mcp_bridge',
            async_support: true
          }
        },
        data: {
          tools_count: server.tools?.length || 0,
          resources_count: server.resources?.length || 0,
          prompts_count: server.prompts?.length || 0
        }
      }
    };

    return oaasSpec;
  }

  /**
   * Calculate confidence score for MCP server detection
   */
  private calculateServerConfidence(server: MCPServer): number {
    let confidence = 0.7; // Base confidence for having a command

    // Boost confidence for well-defined servers
    if (server.tools && server.tools.length > 0) {
      confidence += 0.15;
    }
    if (server.resources && server.resources.length > 0) {
      confidence += 0.1;
    }
    if (server.prompts && server.prompts.length > 0) {
      confidence += 0.05;
    }
    if (server.capabilities && server.capabilities.length > 0) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }
}