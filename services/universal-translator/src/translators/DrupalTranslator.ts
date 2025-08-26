/**
 * Drupal AI Agents Translator
 * Reads PHP plugin files and extracts OAAS-compliant configurations
 * NO FILE MODIFICATION - purely read-only analysis
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import * as yaml from 'js-yaml';

export interface DrupalAgentPlugin {
  id: string;
  class_name: string;
  file_path: string;
  plugin_type: 'AiAgent' | 'AiFunctionCall' | 'AiAgentValidation';
  annotation: any;
  capabilities: DrupalCapability[];
  prompts: DrupalPrompt[];
}

export interface DrupalCapability {
  method_name: string;
  description: string;
  parameters: any[];
  return_type: string;
  annotations: any[];
}

export interface DrupalPrompt {
  name: string;
  path: string;
  content: any;
  variables: string[];
}

export class DrupalTranslator {
  
  /**
   * Discover all Drupal AI Agent plugins
   * Scans /llm-platform/web/modules/custom/ai_agents/ for PHP plugins
   */
  async discoverDrupalAgents(projectRoot: string): Promise<DrupalAgentPlugin[]> {
    const aiAgentsPath = path.join(projectRoot, 'web/modules/custom/ai_agents');
    
    if (!await this.pathExists(aiAgentsPath)) {
      console.log('⚠️  Drupal ai_agents module not found, skipping...');
      return [];
    }

    console.log('🔍 Discovering Drupal AI Agent plugins...');

    // Find all PHP plugin files
    const pluginFiles = await glob('src/Plugin/**/*.php', {
      cwd: aiAgentsPath,
      absolute: true
    });

    const agents: DrupalAgentPlugin[] = [];

    for (const filePath of pluginFiles) {
      try {
        const plugin = await this.analyzePHPPlugin(filePath, aiAgentsPath);
        if (plugin) {
          agents.push(plugin);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to analyze ${filePath}:`, error.message);
      }
    }

    console.log(`✅ Found ${agents.length} Drupal AI Agent plugins`);
    return agents;
  }

  /**
   * Analyze a single PHP plugin file
   * Extracts annotations, methods, and capabilities without modification
   */
  private async analyzePHPPlugin(filePath: string, aiAgentsRoot: string): Promise<DrupalAgentPlugin | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract plugin annotation using regex (safer than PHP parser)
    const annotationMatch = content.match(/#\[(AiAgent|AiFunctionCall|AiAgentValidation)\(([^\]]+)\)\]/s);
    if (!annotationMatch) {
      return null; // Not an AI agent plugin
    }

    const [, pluginType, annotationContent] = annotationMatch;
    
    // Extract class name
    const classMatch = content.match(/class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : path.basename(filePath, '.php');
    
    // Generate plugin ID from file path
    const relativePath = path.relative(path.join(aiAgentsRoot, 'src/Plugin'), filePath);
    const pluginId = this.generatePluginId(relativePath, className);

    // Parse annotation parameters
    const annotation = this.parseAnnotationContent(annotationContent);
    
    // Extract capabilities (public methods)
    const capabilities = this.extractCapabilities(content);
    
    // Load associated prompts
    const prompts = await this.loadAssociatedPrompts(pluginId, aiAgentsRoot);

    return {
      id: pluginId,
      class_name: className,
      file_path: filePath,
      plugin_type: pluginType as any,
      annotation,
      capabilities,
      prompts
    };
  }

  /**
   * Parse PHP annotation content to extract configuration
   */
  private parseAnnotationContent(content: string): any {
    // Simple parser for PHP annotation format
    // Handles: id = "content_type", label = @Translation("Content Type Agent")
    const params: any = {};
    
    // Extract id
    const idMatch = content.match(/id\s*=\s*"([^"]+)"/); 
    if (idMatch) params.id = idMatch[1];
    
    // Extract label  
    const labelMatch = content.match(/label\s*=\s*@Translation\("([^"]+)"\)/); 
    if (labelMatch) params.label = labelMatch[1];
    
    // Extract description
    const descMatch = content.match(/description\s*=\s*@Translation\("([^"]+)"\)/); 
    if (descMatch) params.description = descMatch[1];

    return params;
  }

  /**
   * Extract capabilities from PHP class methods
   */
  private extractCapabilities(content: string): DrupalCapability[] {
    const capabilities: DrupalCapability[] = [];
    
    // Find public methods (simplified regex approach)
    const methodMatches = content.matchAll(/public\s+function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([\w|]+))?\s*\{/g);
    
    for (const match of methodMatches) {
      const [, methodName, parameters, returnType] = match;
      
      // Skip constructor and common Drupal methods
      if (['__construct', 'create', 'getFormId', 'buildForm', 'submitForm'].includes(methodName)) {
        continue;
      }

      capabilities.push({
        method_name: methodName,
        description: this.extractMethodDescription(content, methodName),
        parameters: this.parseParameters(parameters),
        return_type: returnType || 'mixed',
        annotations: []
      });
    }

    return capabilities;
  }

  /**
   * Extract method description from docblock
   */
  private extractMethodDescription(content: string, methodName: string): string {
    // Look for docblock before method
    const methodPattern = new RegExp(`/\\*\\*([^*]|\\*(?!/))*\\*/\\s*public\\s+function\\s+${methodName}`, 's');
    const match = content.match(methodPattern);
    
    if (match) {
      const docblock = match[0];
      const descMatch = docblock.match(/\\*\\s*([^@*\\n][^\\n]*)/);
      if (descMatch) {
        return descMatch[1].trim();
      }
    }
    
    return `Execute ${methodName} capability`;
  }

  /**
   * Parse method parameters
   */
  private parseParameters(paramString: string): any[] {
    if (!paramString.trim()) return [];
    
    const params = paramString.split(',').map(param => {
      const cleanParam = param.trim();
      const parts = cleanParam.split(' ');
      
      if (parts.length >= 2) {
        return {
          type: parts[0],
          name: parts[1].replace('$', ''),
          required: !cleanParam.includes('=')
        };
      }
      
      return { name: cleanParam.replace('$', ''), type: 'mixed', required: true };
    });
    
    return params;
  }

  /**
   * Load YAML prompts associated with the plugin
   */
  private async loadAssociatedPrompts(pluginId: string, aiAgentsRoot: string): Promise<DrupalPrompt[]> {
    const prompts: DrupalPrompt[] = [];
    const promptsPath = path.join(aiAgentsRoot, 'prompts');
    
    if (!await this.pathExists(promptsPath)) {
      return prompts;
    }

    // Map plugin ID to prompt directory
    const promptDir = this.getPromptDirectory(pluginId);
    const fullPromptPath = path.join(promptsPath, promptDir);
    
    if (!await this.pathExists(fullPromptPath)) {
      return prompts;
    }

    try {
      const promptFiles = await glob('*.yml', {
        cwd: fullPromptPath,
        absolute: true
      });

      for (const promptFile of promptFiles) {
        try {
          const content = await fs.readFile(promptFile, 'utf-8');
          const parsedContent = yaml.load(content);
          
          prompts.push({
            name: path.basename(promptFile, '.yml'),
            path: promptFile,
            content: parsedContent,
            variables: this.extractPromptVariables(content)
          });
        } catch (error) {
          console.warn(`⚠️  Failed to parse prompt ${promptFile}:`, error.message);
        }
      }
    } catch (error) {
      // Directory doesn't exist or no access
    }

    return prompts;
  }

  /**
   * Map plugin ID to prompt directory name
   */
  private getPromptDirectory(pluginId: string): string {
    const mappings: { [key: string]: string } = {
      'content_type': 'node_content_type_agent',
      'field_type': 'field_type_agent', 
      'taxonomy_agent': 'taxonomy_agent',
      'webform': 'webform_agent',
      'views_agent': 'views_agent',
      'module_enable': 'module_enable'
    };

    return mappings[pluginId] || pluginId;
  }

  /**
   * Extract variables from prompt content
   */
  private extractPromptVariables(content: string): string[] {
    const variables: string[] = [];
    const matches = content.matchAll(/{{\\s*(\\w+)\\s*}}/g);
    
    for (const match of matches) {
      const variable = match[1];
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  }

  /**
   * Generate standardized plugin ID from file path
   */
  private generatePluginId(relativePath: string, className: string): string {
    const pathParts = relativePath.split(path.sep);
    const pluginType = pathParts[0]; // AiAgent, AiFunctionCall, etc.
    
    // Convert CamelCase to snake_case
    const snakeCase = className.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    
    return snakeCase;
  }

  /**
   * Translate Drupal plugin to OAAS format
   */
  async translateToOAAS(plugin: DrupalAgentPlugin): Promise<any> {
    const oaasSpec = {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent",
      metadata: {
        name: `drupal-${plugin.id}`,
        version: "1.0.0",
        created: new Date().toISOString().split('T')[0],
        description: plugin.annotation.description || plugin.annotation.label || `Drupal ${plugin.class_name} agent`,
        annotations: {
          "oaas/compliance-level": "silver",
          "oaas/framework-support": "drupal,langchain,crewai",
          "drupal/plugin-id": plugin.annotation.id || plugin.id,
          "drupal/plugin-type": plugin.plugin_type,
          "drupal/class-name": plugin.class_name,
          "drupal/source-file": plugin.file_path
        },
        labels: {
          domain: "drupal-cms",
          category: plugin.plugin_type.toLowerCase().replace('ai', ''),
          framework: "drupal"
        }
      },
      spec: {
        agent: {
          name: plugin.annotation.label || plugin.class_name,
          expertise: plugin.annotation.description || `Specialized in ${plugin.plugin_type} operations for Drupal CMS`
        },
        capabilities: plugin.capabilities.map(cap => ({
          name: cap.method_name,
          description: cap.description,
          input_schema: this.generateInputSchema(cap.parameters),
          output_schema: this.generateOutputSchema(cap.return_type),
          frameworks: ["drupal", "langchain"],
          compliance: ["iso-42001"]
        })),
        protocols: {
          supported: ["drupal", "openapi", "mcp"],
          primary: "drupal",
          drupal: {
            enabled: true,
            module: "ai_agents", 
            plugin_id: plugin.annotation.id || plugin.id,
            plugin_type: plugin.plugin_type,
            class_name: plugin.class_name,
            prompts: plugin.prompts.map(p => ({
              name: p.name,
              path: p.path,
              variables: p.variables
            }))
          }
        },
        frameworks: {
          drupal: {
            enabled: true,
            plugin_type: plugin.plugin_type,
            integration_method: "ai_agents_module"
          },
          langchain: {
            enabled: true,
            tool_type: "structured",
            async_support: true
          }
        },
        data: {
          prompts_path: plugin.prompts.length > 0 ? path.dirname(plugin.prompts[0].path) : undefined,
          knowledge_base: `Drupal ${plugin.plugin_type} operations`,
          examples: plugin.prompts.length > 0 ? plugin.prompts[0].path : undefined
        }
      }
    };

    return oaasSpec;
  }

  /**
   * Generate JSON schema for input parameters
   */
  private generateInputSchema(parameters: any[]): any {
    if (parameters.length === 0) {
      return { type: "object", properties: {} };
    }

    const properties: any = {};
    const required: string[] = [];

    for (const param of parameters) {
      properties[param.name] = {
        type: this.mapPHPTypeToJSON(param.type),
        description: `${param.name} parameter`
      };
      
      if (param.required) {
        required.push(param.name);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined
    };
  }

  /**
   * Generate JSON schema for output
   */
  private generateOutputSchema(returnType: string): any {
    return {
      type: this.mapPHPTypeToJSON(returnType),
      description: `Response from ${returnType} operation`
    };
  }

  /**
   * Map PHP types to JSON Schema types
   */
  private mapPHPTypeToJSON(phpType: string): string {
    const typeMap: { [key: string]: string } = {
      'string': 'string',
      'int': 'integer', 
      'integer': 'integer',
      'float': 'number',
      'bool': 'boolean',
      'boolean': 'boolean',
      'array': 'array',
      'object': 'object',
      'mixed': 'object',
      'void': 'null'
    };

    return typeMap[phpType.toLowerCase()] || 'object';
  }

  /**
   * Helper to check if path exists
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}