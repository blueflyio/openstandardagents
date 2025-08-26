/**
 * Enhanced Drupal Translator for OAAS Universal Services
 * Understands ai_agents foundation and 14 specialized modules
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import * as yaml from 'js-yaml';

export interface DrupalModule {
  name: string;
  path: string;
  type: 'core' | 'specialized';
  info: ModuleInfo;
  agents: DrupalAgentPlugin[];
  services: ServiceDefinition[];
  permissions: PermissionDefinition[];
  routing: RouteDefinition[];
  dependencies: string[];
}

export interface ModuleInfo {
  name: string;
  type: string;
  description: string;
  package: string;
  core_version_requirement: string;
  dependencies: string[];
}

export interface DrupalAgentPlugin {
  id: string;
  class_name: string;
  file_path: string;
  plugin_type: string;
  annotation: any;
  capabilities: CapabilityDefinition[];
  prompts: PromptDefinition[];
  dependencies: string[];
  implements_interfaces: string[];
}

export interface CapabilityDefinition {
  method_name: string;
  description: string;
  parameters: any[];
  return_type: string;
  annotations: any[];
}

export interface PromptDefinition {
  id: string;
  template: string;
  variables: string[];
  context: string;
}

export interface ServiceDefinition {
  id: string;
  class_name: string;
  arguments: any[];
  tags: string[];
}

export interface PermissionDefinition {
  id: string;
  title: string;
  description?: string;
}

export interface RouteDefinition {
  name: string;
  path: string;
  defaults: any;
  methods?: string[];
  requirements?: any;
}

export class EnhancedDrupalTranslator {
  
  /**
   * Discover all Drupal AI agent modules in the project
   */
  async discoverAllDrupalAgents(projectRoot: string): Promise<DrupalModule[]> {
    console.log('🔍 Enhanced Drupal Discovery Starting...');
    console.log(`📁 Project root: ${projectRoot}`);

    try {
      // Focus on the 15 specific modules the user mentioned
      const targetModules = [
        'ai_agents',  // Foundation module
        'ai_agent_crewai',
        'ai_agent_huggingface',
        'ai_agent_orchestra',
        'ai_agentic_workflows',
        'ai_provider_apple',
        'ai_provider_langchain',
        'alternative_services',
        'api_normalizer',
        'code_executor',
        'dita_ccms',
        'gov_compliance',
        'llm',
        'mcp_registry',
        'recipe_onboarding'
      ];

      const modules: DrupalModule[] = [];
      const customModulesPath = path.join(projectRoot, 'web', 'modules', 'custom');

      for (const moduleName of targetModules) {
        const modulePath = path.join(customModulesPath, moduleName);
        
        try {
          await fs.access(modulePath);
          console.log(`📦 Analyzing module: ${moduleName}`);
          
          const module = await this.analyzeModule(moduleName, modulePath);
          if (module) {
            modules.push(module);
            console.log(`✅ ${moduleName}: ${module.agents.length} agents, ${module.services.length} services`);
          }
        } catch (error: any) {
          console.log(`⚠️  Module not found or inaccessible: ${moduleName}`);
        }
      }

      console.log(`✅ Enhanced discovery completed: ${modules.length} modules analyzed`);
      return modules;

    } catch (error: any) {
      console.error('❌ Enhanced Drupal discovery failed:', error.message);
      return [];
    }
  }

  /**
   * Deep analysis of a specific Drupal module
   */
  private async analyzeModule(name: string, modulePath: string): Promise<DrupalModule | null> {
    try {
      const infoFile = path.join(modulePath, `${name}.info.yml`);
      let info: ModuleInfo;

      try {
        const infoContent = await fs.readFile(infoFile, 'utf-8');
        const parsedInfo = yaml.load(infoContent) as any;
        
        info = {
          name: parsedInfo.name || name,
          type: parsedInfo.type || 'module',
          description: parsedInfo.description || '',
          package: parsedInfo.package || 'Custom',
          core_version_requirement: parsedInfo.core_version_requirement || '^10',
          dependencies: parsedInfo.dependencies || []
        };
      } catch {
        // Create basic info if file doesn't exist
        info = {
          name: name,
          type: 'module',
          description: `AI Agent module: ${name}`,
          package: 'AI Agents',
          core_version_requirement: '^10',
          dependencies: []
        };
      }

      // Analyze different components
      const agents = await this.discoverAgentPlugins(modulePath);
      const services = await this.discoverServices(modulePath, name);
      const permissions = await this.discoverPermissions(modulePath, name);
      const routing = await this.discoverRouting(modulePath, name);

      return {
        name,
        path: modulePath,
        type: name === 'ai_agents' ? 'core' : 'specialized',
        info,
        agents,
        services,
        permissions,
        routing,
        dependencies: info.dependencies
      };

    } catch (error: any) {
      console.warn(`Failed to analyze module ${name}:`, error.message);
      return null;
    }
  }

  /**
   * Discover agent plugins in a module (PHP classes with #[AiAgent] attributes)
   */
  private async discoverAgentPlugins(modulePath: string): Promise<DrupalAgentPlugin[]> {
    const agents: DrupalAgentPlugin[] = [];

    try {
      // Look for PHP files in src/Plugin/AiAgent/ or src/
      const phpFiles = await glob('**/*.php', {
        cwd: modulePath,
        absolute: true,
        ignore: ['**/vendor/**', '**/tests/**']
      });

      for (const phpFile of phpFiles) {
        try {
          const content = await fs.readFile(phpFile, 'utf-8');
          
          // Look for #[AiAgent] attributes or legacy @AiAgent annotations
          if (this.containsAgentDefinition(content)) {
            const agent = await this.parseAgentPlugin(phpFile, content);
            if (agent) {
              agents.push(agent);
            }
          }
        } catch (error: any) {
          // Skip files that can't be read
        }
      }
    } catch (error: any) {
      console.warn(`Agent plugin discovery failed:`, error.message);
    }

    return agents;
  }

  /**
   * Check if PHP content contains agent definitions
   */
  private containsAgentDefinition(content: string): boolean {
    return content.includes('#[AiAgent') || 
           content.includes('@AiAgent') ||
           content.includes('AiAgentInterface') ||
           content.includes('class ') && content.includes('Agent');
  }

  /**
   * Parse an agent plugin from PHP content
   */
  private async parseAgentPlugin(filePath: string, content: string): Promise<DrupalAgentPlugin | null> {
    try {
      const fileName = path.basename(filePath, '.php');
      
      // Extract class name
      const classMatch = content.match(/class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : fileName;

      // Extract plugin annotation/attribute
      let annotation = {};
      
      // Try to parse #[AiAgent(...)] attributes
      const attributeMatch = content.match(/#\[AiAgent\((.*?)\)\]/s);
      if (attributeMatch) {
        try {
          // Basic parsing of PHP attribute syntax
          annotation = this.parseAttributeContent(attributeMatch[1]);
        } catch {
          annotation = { id: fileName.toLowerCase(), label: fileName };
        }
      } else {
        // Legacy annotation parsing
        const legacyMatch = content.match(/@AiAgent\((.*?)\)/s);
        if (legacyMatch) {
          annotation = this.parseLegacyAnnotation(legacyMatch[1]);
        } else {
          annotation = { id: fileName.toLowerCase(), label: className };
        }
      }

      // Extract capabilities (public methods)
      const capabilities = this.extractCapabilities(content);

      // Extract prompts (constants or properties)
      const prompts = this.extractPrompts(content);

      // Extract dependencies from constructor
      const dependencies = this.extractDependencies(content);

      // Extract implemented interfaces
      const interfaces = this.extractInterfaces(content);

      return {
        id: (annotation as any).id || fileName.toLowerCase(),
        class_name: className,
        file_path: filePath,
        plugin_type: 'ai_agent',
        annotation,
        capabilities,
        prompts,
        dependencies,
        implements_interfaces: interfaces
      };

    } catch (error: any) {
      console.warn(`Failed to parse agent plugin ${filePath}:`, error.message);
      return null;
    }
  }

  private parseAttributeContent(content: string): any {
    // Simple PHP attribute parsing
    const result: any = {};
    
    // Extract id
    const idMatch = content.match(/id:\s*["']([^"']+)["']/);
    if (idMatch) result.id = idMatch[1];
    
    // Extract label  
    const labelMatch = content.match(/label:\s*["']([^"']+)["']/);
    if (labelMatch) result.label = labelMatch[1];
    
    // Extract description
    const descMatch = content.match(/description:\s*["']([^"']+)["']/);
    if (descMatch) result.description = descMatch[1];

    return result;
  }

  private parseLegacyAnnotation(content: string): any {
    // Parse legacy @AiAgent annotation
    const result: any = {};
    
    const pairs = content.split(',').map(s => s.trim());
    for (const pair of pairs) {
      const [key, value] = pair.split('=').map(s => s.trim());
      if (key && value) {
        result[key] = value.replace(/['"]/g, '');
      }
    }
    
    return result;
  }

  private extractCapabilities(content: string): CapabilityDefinition[] {
    const capabilities: CapabilityDefinition[] = [];
    
    // Find public methods
    const methodMatches = content.matchAll(/public\s+function\s+(\w+)\s*\([^)]*\)/g);
    
    for (const match of methodMatches) {
      const methodName = match[1];
      
      // Skip magic methods and common Drupal methods
      if (methodName.startsWith('__') || 
          ['create', 'buildForm', 'validateForm', 'submitForm'].includes(methodName)) {
        continue;
      }
      
      capabilities.push({
        method_name: methodName,
        description: `Agent capability: ${methodName}`,
        parameters: [], // Would need more sophisticated parsing
        return_type: 'mixed',
        annotations: []
      });
    }
    
    return capabilities;
  }

  private extractPrompts(content: string): PromptDefinition[] {
    const prompts: PromptDefinition[] = [];
    
    // Look for const properties that might be prompts
    const promptMatches = content.matchAll(/const\s+(\w*PROMPT\w*)\s*=\s*['"]([^'"]+)['"]/gi);
    
    for (const match of promptMatches) {
      prompts.push({
        id: match[1],
        template: match[2],
        variables: [], // Would need template parsing
        context: 'agent_operation'
      });
    }
    
    return prompts;
  }

  private extractDependencies(content: string): string[] {
    const deps: string[] = [];
    
    // Extract from constructor parameters
    const constructorMatch = content.match(/public\s+function\s+__construct\s*\(([^)]+)\)/s);
    if (constructorMatch) {
      const params = constructorMatch[1];
      const serviceMatches = params.matchAll(/(\w+Interface|\w+Manager|\w+Service)\s+\$\w+/g);
      
      for (const match of serviceMatches) {
        deps.push(match[1]);
      }
    }
    
    return deps;
  }

  private extractInterfaces(content: string): string[] {
    const interfaces: string[] = [];
    
    const implementsMatch = content.match(/class\s+\w+(?:\s+extends\s+\w+)?\s+implements\s+([^{]+)/);
    if (implementsMatch) {
      const interfaceList = implementsMatch[1];
      const interfaceNames = interfaceList.split(',').map(s => s.trim());
      interfaces.push(...interfaceNames);
    }
    
    return interfaces;
  }

  private async discoverServices(modulePath: string, moduleName: string): Promise<ServiceDefinition[]> {
    const services: ServiceDefinition[] = [];
    
    try {
      const servicesFile = path.join(modulePath, `${moduleName}.services.yml`);
      const content = await fs.readFile(servicesFile, 'utf-8');
      const parsed = yaml.load(content) as any;
      
      if (parsed && parsed.services) {
        for (const [id, service] of Object.entries(parsed.services as any)) {
          const svc = service as any;
          services.push({
            id,
            class_name: svc?.class || '',
            arguments: svc?.arguments || [],
            tags: svc?.tags || []
          });
        }
      }
    } catch (error: any) {
      // Services file not required
    }
    
    return services;
  }

  private async discoverPermissions(modulePath: string, moduleName: string): Promise<PermissionDefinition[]> {
    const permissions: PermissionDefinition[] = [];
    
    try {
      const permissionsFile = path.join(modulePath, `${moduleName}.permissions.yml`);
      const content = await fs.readFile(permissionsFile, 'utf-8');
      const parsed = yaml.load(content) as any;
      
      if (parsed) {
        for (const [id, perm] of Object.entries(parsed as any)) {
          const p = perm as any;
          permissions.push({
            id,
            title: p?.title || id,
            description: p?.description
          });
        }
      }
    } catch (error: any) {
      // Permissions file not required
    }
    
    return permissions;
  }

  private async discoverRouting(modulePath: string, moduleName: string): Promise<RouteDefinition[]> {
    const routes: RouteDefinition[] = [];
    
    try {
      const routingFile = path.join(modulePath, `${moduleName}.routing.yml`);
      const content = await fs.readFile(routingFile, 'utf-8');
      const parsed = yaml.load(content) as any;
      
      if (parsed) {
        for (const [name, route] of Object.entries(parsed as any)) {
          const r = route as any;
          routes.push({
            name,
            path: r?.path || '',
            defaults: r?.defaults || {},
            methods: r?.methods,
            requirements: r?.requirements
          });
        }
      }
    } catch (error: any) {
      // Routing file not required
    }
    
    return routes;
  }

  /**
   * Translate a Drupal module to OAAS format
   */
  async translateModuleToOAAS(module: DrupalModule): Promise<any[]> {
    const oaasAgents: any[] = [];

    for (const agent of module.agents) {
      const oaasSpec = await this.translateAgentToOAAS(agent, module);
      oaasAgents.push(oaasSpec);
    }

    return oaasAgents;
  }

  /**
   * Translate a single agent to OAAS specification
   */
  private async translateAgentToOAAS(agent: DrupalAgentPlugin, module: DrupalModule): Promise<any> {
    return {
      apiVersion: 'openapi-ai-agents/v0.1.1',
      kind: 'Agent',
      metadata: {
        name: agent.annotation.id || agent.id,
        description: agent.annotation.description || `Drupal AI Agent: ${agent.class_name}`,
        annotations: {
          'drupal/module': module.name,
          'drupal/class-name': agent.class_name,
          'drupal/plugin-type': agent.plugin_type,
          'drupal/file-path': agent.file_path,
          'oaas/translator': 'enhanced-drupal-v1.0.0'
        }
      },
      spec: {
        agent: {
          name: agent.annotation.label || agent.class_name,
          description: agent.annotation.description || `AI agent implemented as Drupal plugin`,
          version: '1.0.0'
        },
        capabilities: agent.capabilities.map(cap => ({
          name: cap.method_name,
          description: cap.description,
          input_schema: {
            type: 'object',
            properties: {
              // Would need more sophisticated schema generation
            }
          },
          output_schema: {
            type: 'object'
          }
        })),
        function_calls: agent.capabilities.map(cap => ({
          name: cap.method_name,
          description: cap.description,
          parameters: {
            type: 'object',
            properties: {}
          }
        })),
        prompts: agent.prompts.map(prompt => ({
          id: prompt.id,
          template: prompt.template,
          variables: prompt.variables,
          context: prompt.context
        })),
        frameworks: {
          drupal: {
            plugin_type: agent.plugin_type,
            class_name: agent.class_name,
            dependencies: agent.dependencies,
            interfaces: agent.implements_interfaces
          }
        },
        runtime: {
          platform: 'drupal',
          requirements: {
            drupal_version: module.info.core_version_requirement,
            dependencies: module.dependencies
          }
        }
      }
    };
  }
}