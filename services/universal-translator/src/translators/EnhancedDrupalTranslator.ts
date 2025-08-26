/**
 * Enhanced Drupal AI Agents Translator
 * Understands the ai_agents core module and how 14 specialized modules extend it
 * NO FILE MODIFICATION - purely read-only analysis
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
  description: string;
  type: string;
  core_version_requirement: string;
  dependencies: string[];
  package?: string;
}

export interface DrupalAgentPlugin {
  id: string;
  class_name: string;
  file_path: string;
  module: string;
  plugin_type: 'AiAgent' | 'AiFunctionCall' | 'AiAgentValidation';
  annotation: AgentAnnotation;
  base_class: string;
  implements: string[];
  capabilities: DrupalCapability[];
  function_calls: FunctionCall[];
  configuration_schema: any;
  prompts: DrupalPrompt[];
}

export interface AgentAnnotation {
  id: string;
  label: string;
  description: string;
  module_dependencies?: string[];
  provider_dependencies?: string[];
  category?: string;
  requires_auth?: boolean;
}

export interface FunctionCall {
  id: string;
  function_name: string;
  name: string;
  group: string;
  context_definitions: any[];
  method_name: string;
}

export interface DrupalCapability {
  method_name: string;
  description: string;
  parameters: Parameter[];
  return_type: string;
  annotations: any[];
  access_requirements: string[];
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description?: string;
}

export interface ServiceDefinition {
  id: string;
  class: string;
  arguments: string[];
  tags?: any[];
  public?: boolean;
}

export interface PermissionDefinition {
  name: string;
  title: string;
  description?: string;
  restrict_access?: boolean;
}

export interface RouteDefinition {
  name: string;
  path: string;
  methods: string[];
  controller: string;
  requirements?: any;
  options?: any;
}

export interface DrupalPrompt {
  name: string;
  path: string;
  content: any;
  variables: string[];
}

export class EnhancedDrupalTranslator {
  private coreModule: DrupalModule | null = null;
  private specializedModules: Map<string, DrupalModule> = new Map();

  /**
   * Primary entry point - discovers and analyzes all AI agent modules
   */
  async discoverAllDrupalAgents(projectRoot: string): Promise<DrupalModule[]> {
    console.log('🔍 Discovering Drupal AI Agent ecosystem...');
    
    const modules: DrupalModule[] = [];
    
    // First, analyze the core ai_agents module
    this.coreModule = await this.analyzeCoreModule(projectRoot);
    if (this.coreModule) {
      modules.push(this.coreModule);
      console.log(`✅ Core ai_agents module found with ${this.coreModule.agents.length} agents`);
    }

    // Then analyze the 14 specialized modules
    const specializedModuleNames = [
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

    for (const moduleName of specializedModuleNames) {
      try {
        const module = await this.analyzeSpecializedModule(projectRoot, moduleName);
        if (module) {
          this.specializedModules.set(moduleName, module);
          modules.push(module);
          console.log(`✅ ${moduleName}: ${module.agents.length} agents, ${module.services.length} services`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to analyze ${moduleName}:`, error.message);
      }
    }

    console.log(`🎯 Total discovered: ${modules.length} modules, ${modules.reduce((sum, m) => sum + m.agents.length, 0)} agents`);
    return modules;
  }

  /**
   * Analyze the core ai_agents module that provides the foundation
   */
  private async analyzeCoreModule(projectRoot: string): Promise<DrupalModule | null> {
    const modulePath = path.join(projectRoot, 'web/modules/custom/ai_agents');
    
    if (!await this.pathExists(modulePath)) {
      console.warn('❌ Core ai_agents module not found');
      return null;
    }

    console.log('🔍 Analyzing core ai_agents module...');

    return await this.analyzeModule(modulePath, 'ai_agents', 'core');
  }

  /**
   * Analyze a specialized module that extends ai_agents
   */
  private async analyzeSpecializedModule(projectRoot: string, moduleName: string): Promise<DrupalModule | null> {
    const modulePath = path.join(projectRoot, `web/modules/custom/${moduleName}`);
    
    if (!await this.pathExists(modulePath)) {
      console.log(`⚠️  Module ${moduleName} not found, skipping...`);
      return null;
    }

    return await this.analyzeModule(modulePath, moduleName, 'specialized');
  }

  /**
   * Comprehensive module analysis
   */
  private async analyzeModule(modulePath: string, moduleName: string, type: 'core' | 'specialized'): Promise<DrupalModule> {
    // Read module info
    const info = await this.readModuleInfo(modulePath, moduleName);
    
    // Discover agents
    const agents = await this.discoverAgentsInModule(modulePath, moduleName);
    
    // Read services
    const services = await this.readServiceDefinitions(modulePath, moduleName);
    
    // Read permissions  
    const permissions = await this.readPermissions(modulePath, moduleName);
    
    // Read routing
    const routing = await this.readRouting(modulePath, moduleName);

    return {
      name: moduleName,
      path: modulePath,
      type,
      info,
      agents,
      services,
      permissions,
      routing,
      dependencies: info.dependencies
    };
  }

  /**
   * Read .info.yml file
   */
  private async readModuleInfo(modulePath: string, moduleName: string): Promise<ModuleInfo> {
    const infoFile = path.join(modulePath, `${moduleName}.info.yml`);
    
    try {
      const content = await fs.readFile(infoFile, 'utf-8');
      const parsed = yaml.load(content) as any;
      
      return {
        name: parsed.name || moduleName,
        description: parsed.description || '',
        type: parsed.type || 'module',
        core_version_requirement: parsed.core_version_requirement || '^10',
        dependencies: parsed.dependencies || [],
        package: parsed.package
      };
    } catch (error) {
      console.warn(`⚠️  Could not read ${infoFile}:`, error.message);
      return {
        name: moduleName,
        description: '',
        type: 'module',
        core_version_requirement: '^10',
        dependencies: []
      };
    }
  }

  /**
   * Discover all agents in a module
   */
  private async discoverAgentsInModule(modulePath: string, moduleName: string): Promise<DrupalAgentPlugin[]> {
    const agents: DrupalAgentPlugin[] = [];
    
    // Look for PHP plugin files
    const pluginPaths = [
      'src/Plugin/AiAgent',
      'src/Plugin/AiFunctionCall', 
      'src/Plugin/AiAgentValidation'
    ];

    for (const pluginPath of pluginPaths) {
      const fullPath = path.join(modulePath, pluginPath);
      
      if (await this.pathExists(fullPath)) {
        const pluginFiles = await glob('**/*.php', {
          cwd: fullPath,
          absolute: true
        });

        for (const file of pluginFiles) {
          try {
            const agent = await this.analyzeAgentPlugin(file, moduleName, pluginPath);
            if (agent) {
              agents.push(agent);
            }
          } catch (error) {
            console.warn(`⚠️  Failed to analyze ${file}:`, error.message);
          }
        }
      }
    }

    return agents;
  }

  /**
   * Analyze a single agent plugin file
   */
  private async analyzeAgentPlugin(filePath: string, moduleName: string, pluginDir: string): Promise<DrupalAgentPlugin | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract plugin annotation - handle both PHP 8 attributes and legacy annotations
    const attributeMatch = content.match(/#\[(AiAgent|AiFunctionCall|AiAgentValidation)\(\s*([^)]+)\s*\)\]/s);
    const legacyMatch = content.match(/\/\*\*[^*]*\*\s*@(AiAgent|AiFunctionCall|AiAgentValidation)\(\s*([^)]+)\s*\)/s);
    
    if (!attributeMatch && !legacyMatch) {
      return null; // Not an AI agent plugin
    }

    const match = attributeMatch || legacyMatch;
    const [, pluginType, annotationContent] = match!;
    
    // Extract class information
    const classMatch = content.match(/class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s\\]+))?/);
    if (!classMatch) {
      return null;
    }

    const [, className, baseClass, implementsClause] = classMatch;
    const implements = implementsClause ? implementsClause.split(',').map(i => i.trim()) : [];
    
    // Parse annotation
    const annotation = this.parseAdvancedAnnotation(annotationContent, pluginType === 'AiAgent');
    
    // Extract capabilities (public methods)
    const capabilities = this.extractAdvancedCapabilities(content, className);
    
    // Extract function calls
    const functionCalls = this.extractFunctionCalls(content);
    
    // Extract configuration schema
    const configSchema = this.extractConfigurationSchema(content);
    
    // Load prompts
    const prompts = await this.loadModulePrompts(annotation.id || className.toLowerCase(), moduleName);

    const pluginId = annotation.id || this.generatePluginId(className);

    return {
      id: pluginId,
      class_name: className,
      file_path: filePath,
      module: moduleName,
      plugin_type: pluginType as any,
      annotation,
      base_class: baseClass || 'AiAgentBase',
      implements,
      capabilities,
      function_calls: functionCalls,
      configuration_schema: configSchema,
      prompts
    };
  }

  /**
   * Parse modern PHP attribute or legacy annotation
   */
  private parseAdvancedAnnotation(content: string, isAgent: boolean): AgentAnnotation {
    const annotation: AgentAnnotation = {
      id: '',
      label: '',
      description: ''
    };

    // Extract basic fields
    const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
    const labelMatch = content.match(/label:\s*(?:new\s+TranslatableMarkup\(['"]([^'"]+)['"]\)|@Translation\(['"]([^'"]+)['"]\))/);
    const descMatch = content.match(/description:\s*(?:new\s+TranslatableMarkup\(['"]([^'"]+)['"]\)|@Translation\(['"]([^'"]+)['"]\))/);
    
    if (idMatch) annotation.id = idMatch[1];
    if (labelMatch) annotation.label = labelMatch[1] || labelMatch[2];
    if (descMatch) annotation.description = descMatch[1] || descMatch[2];

    // Extract arrays
    const extractArray = (fieldName: string): string[] => {
      const match = content.match(new RegExp(`${fieldName}:\\s*\\[([^\\]]+)\\]`, 's'));
      if (match) {
        return match[1].split(',').map(item => 
          item.trim().replace(/['"]/g, '')
        ).filter(Boolean);
      }
      return [];
    };

    annotation.module_dependencies = extractArray('module_dependencies');
    annotation.provider_dependencies = extractArray('provider_dependencies');

    // Extract category
    const categoryMatch = content.match(/category:\s*['"]([^'"]+)['"]/);
    if (categoryMatch) annotation.category = categoryMatch[1];

    // Extract boolean flags
    const requiresAuthMatch = content.match(/requires_auth:\s*(TRUE|FALSE|true|false)/i);
    if (requiresAuthMatch) {
      annotation.requires_auth = requiresAuthMatch[1].toLowerCase() === 'true';
    }

    return annotation;
  }

  /**
   * Extract advanced capabilities with full method analysis
   */
  private extractAdvancedCapabilities(content: string, className: string): DrupalCapability[] {
    const capabilities: DrupalCapability[] = [];
    
    // Match public methods with full signatures
    const methodRegex = /\/\*\*([^*]|\*(?!\/))*\*\/\s*public\s+function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([\w|\\]+))?\s*\{/g;
    
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const [fullMatch, docblock, methodName, paramString, returnType] = match;
      
      // Skip common Drupal lifecycle methods
      if (this.isLifecycleMethod(methodName)) {
        continue;
      }

      const parameters = this.parseAdvancedParameters(paramString);
      const description = this.extractMethodDocumentation(docblock, methodName);
      const accessRequirements = this.extractAccessRequirements(docblock);

      capabilities.push({
        method_name: methodName,
        description,
        parameters,
        return_type: returnType || 'mixed',
        annotations: [],
        access_requirements: accessRequirements
      });
    }

    // Look for agentsCapabilities() method for metadata
    const capabilitiesMethod = content.match(/public\s+function\s+agentsCapabilities\(\)\s*\{([^}]+)\}/s);
    if (capabilitiesMethod) {
      // This contains structured capability metadata
      // TODO: Parse this for enhanced capability descriptions
    }

    return capabilities;
  }

  /**
   * Extract function calls defined in the agent
   */
  private extractFunctionCalls(content: string): FunctionCall[] {
    const functionCalls: FunctionCall[] = [];
    
    const functionCallRegex = /#\[FunctionCall\(\s*([^)]+)\s*\)\]\s*public\s+function\s+(\w+)/g;
    
    let match;
    while ((match = functionCallRegex.exec(content)) !== null) {
      const [, annotationContent, methodName] = match;
      
      const functionCall: FunctionCall = {
        id: '',
        function_name: '',
        name: '',
        group: '',
        context_definitions: [],
        method_name: methodName
      };

      // Parse function call annotation
      const idMatch = annotationContent.match(/id:\s*['"]([^'"]+)['"]/);
      const nameMatch = annotationContent.match(/name:\s*['"]([^'"]+)['"]/);
      const groupMatch = annotationContent.match(/group:\s*['"]([^'"]+)['"]/);
      
      if (idMatch) functionCall.id = idMatch[1];
      if (nameMatch) functionCall.name = nameMatch[1];
      if (groupMatch) functionCall.group = groupMatch[1];
      
      functionCall.function_name = functionCall.name.toLowerCase().replace(/\s+/g, '_');

      functionCalls.push(functionCall);
    }

    return functionCalls;
  }

  /**
   * Extract configuration schema from getConfigurationSchema method
   */
  private extractConfigurationSchema(content: string): any {
    const schemaMatch = content.match(/public\s+function\s+getConfigurationSchema\(\)\s*\{([^}]+)\}/s);
    
    if (schemaMatch) {
      // This would require more sophisticated PHP parsing
      // For now, return a placeholder indicating schema exists
      return {
        type: 'object',
        description: 'Configuration schema defined in getConfigurationSchema() method'
      };
    }

    return null;
  }

  /**
   * Load prompts associated with a module/agent
   */
  private async loadModulePrompts(agentId: string, moduleName: string): Promise<DrupalPrompt[]> {
    const prompts: DrupalPrompt[] = [];
    
    // For core ai_agents module, look in prompts directory
    if (moduleName === 'ai_agents' && this.coreModule) {
      const promptsPath = path.join(this.coreModule.path, 'prompts', agentId);
      
      if (await this.pathExists(promptsPath)) {
        const promptFiles = await glob('*.yml', { cwd: promptsPath, absolute: true });
        
        for (const file of promptFiles) {
          try {
            const content = await fs.readFile(file, 'utf-8');
            const parsed = yaml.load(content);
            
            prompts.push({
              name: path.basename(file, '.yml'),
              path: file,
              content: parsed,
              variables: this.extractPromptVariables(content)
            });
          } catch (error) {
            console.warn(`⚠️  Failed to parse prompt ${file}:`, error.message);
          }
        }
      }
    }

    return prompts;
  }

  /**
   * Read service definitions from .services.yml
   */
  private async readServiceDefinitions(modulePath: string, moduleName: string): Promise<ServiceDefinition[]> {
    const servicesFile = path.join(modulePath, `${moduleName}.services.yml`);
    const services: ServiceDefinition[] = [];
    
    try {
      const content = await fs.readFile(servicesFile, 'utf-8');
      const parsed = yaml.load(content) as any;
      
      if (parsed?.services) {
        for (const [serviceId, definition] of Object.entries(parsed.services)) {
          services.push({
            id: serviceId,
            class: (definition as any).class || '',
            arguments: (definition as any).arguments || [],
            tags: (definition as any).tags,
            public: (definition as any).public
          });
        }
      }
    } catch (error) {
      // Services file might not exist
    }

    return services;
  }

  /**
   * Read permission definitions
   */
  private async readPermissions(modulePath: string, moduleName: string): Promise<PermissionDefinition[]> {
    const permissionsFile = path.join(modulePath, `${moduleName}.permissions.yml`);
    const permissions: PermissionDefinition[] = [];
    
    try {
      const content = await fs.readFile(permissionsFile, 'utf-8');
      const parsed = yaml.load(content) as any;
      
      for (const [permName, definition] of Object.entries(parsed || {})) {
        permissions.push({
          name: permName,
          title: (definition as any).title || permName,
          description: (definition as any).description,
          restrict_access: (definition as any).restrict_access
        });
      }
    } catch (error) {
      // Permissions file might not exist
    }

    return permissions;
  }

  /**
   * Read routing definitions
   */
  private async readRouting(modulePath: string, moduleName: string): Promise<RouteDefinition[]> {
    const routingFile = path.join(modulePath, `${moduleName}.routing.yml`);
    const routes: RouteDefinition[] = [];
    
    try {
      const content = await fs.readFile(routingFile, 'utf-8');
      const parsed = yaml.load(content) as any;
      
      for (const [routeName, definition] of Object.entries(parsed || {})) {
        const def = definition as any;
        routes.push({
          name: routeName,
          path: def.path || '',
          methods: def.methods || ['GET'],
          controller: def.defaults?._controller || '',
          requirements: def.requirements,
          options: def.options
        });
      }
    } catch (error) {
      // Routing file might not exist
    }

    return routes;
  }

  /**
   * Translate a Drupal module to OAAS format
   */
  async translateModuleToOAAS(module: DrupalModule): Promise<any[]> {
    const oaasAgents = [];

    for (const agent of module.agents) {
      const oaasSpec = await this.translateAgentToOAAS(agent, module);
      oaasAgents.push(oaasSpec);
    }

    return oaasAgents;
  }

  /**
   * Translate individual agent to OAAS format
   */
  private async translateAgentToOAAS(agent: DrupalAgentPlugin, module: DrupalModule): Promise<any> {
    return {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent", 
      metadata: {
        name: `${module.name}-${agent.id}`,
        version: "1.0.0",
        created: new Date().toISOString().split('T')[0],
        description: agent.annotation.description || agent.annotation.label,
        annotations: {
          "oaas/compliance-level": this.determineComplianceLevel(agent, module),
          "oaas/framework-support": this.determineFrameworkSupport(agent, module),
          "drupal/module": module.name,
          "drupal/plugin-id": agent.id,
          "drupal/plugin-type": agent.plugin_type,
          "drupal/class-name": agent.class_name,
          "drupal/base-class": agent.base_class,
          "drupal/source-file": agent.file_path
        },
        labels: {
          domain: this.determineDomain(module.name),
          category: agent.annotation.category || agent.plugin_type.toLowerCase(),
          framework: "drupal",
          module_type: module.type
        }
      },
      spec: {
        agent: {
          name: agent.annotation.label || agent.class_name,
          expertise: agent.annotation.description || `Specialized in ${agent.plugin_type} operations using ${module.name}`,
          level: module.type === 'core' ? 2 : 3 // Core agents are level 2, specialized are level 3
        },
        capabilities: agent.capabilities.map(cap => ({
          name: cap.method_name,
          description: cap.description,
          input_schema: this.generateInputSchema(cap.parameters),
          output_schema: this.generateOutputSchema(cap.return_type),
          frameworks: this.getCapabilityFrameworks(agent, module),
          access_requirements: cap.access_requirements
        })),
        function_calls: agent.function_calls.map(fc => ({
          id: fc.id,
          name: fc.name,
          function_name: fc.function_name,
          group: fc.group,
          method_name: fc.method_name
        })),
        protocols: {
          supported: ["drupal", "openapi", "rest"],
          primary: "drupal",
          drupal: {
            enabled: true,
            module: module.name,
            plugin_id: agent.id,
            plugin_type: agent.plugin_type,
            class_name: agent.class_name,
            base_class: agent.base_class,
            implements: agent.implements,
            dependencies: {
              modules: agent.annotation.module_dependencies || [],
              providers: agent.annotation.provider_dependencies || []
            }
          }
        },
        frameworks: this.generateFrameworkConfig(agent, module),
        configuration: agent.configuration_schema,
        data: {
          prompts_count: agent.prompts.length,
          prompts_path: agent.prompts.length > 0 ? path.dirname(agent.prompts[0].path) : undefined,
          knowledge_base: `${module.name} ${agent.plugin_type} operations`,
          examples: agent.prompts.length > 0 ? agent.prompts[0].path : undefined,
          services: module.services.map(s => s.id),
          permissions: module.permissions.map(p => p.name),
          routes: module.routes.map(r => r.path)
        }
      }
    };
  }

  // Helper methods for translation

  private determineComplianceLevel(agent: DrupalAgentPlugin, module: DrupalModule): string {
    if (module.type === 'core') return 'silver';
    if (module.name.includes('gov_compliance')) return 'gold';
    return 'bronze';
  }

  private determineFrameworkSupport(agent: DrupalAgentPlugin, module: DrupalModule): string {
    const frameworks = ['drupal'];
    if (module.name.includes('langchain')) frameworks.push('langchain');
    if (module.name.includes('crewai')) frameworks.push('crewai');
    if (module.name.includes('huggingface')) frameworks.push('huggingface');
    return frameworks.join(',');
  }

  private determineDomain(moduleName: string): string {
    const domainMap: { [key: string]: string } = {
      'ai_agents': 'drupal-cms',
      'ai_agent_crewai': 'multi-agent-systems',
      'ai_agent_huggingface': 'machine-learning',
      'ai_agent_orchestra': 'agent-orchestration',
      'ai_agentic_workflows': 'workflow-automation',
      'gov_compliance': 'government-compliance',
      'code_executor': 'code-execution',
      'dita_ccms': 'documentation-management',
      'llm': 'language-models'
    };
    
    return domainMap[moduleName] || 'drupal-extension';
  }

  private getCapabilityFrameworks(agent: DrupalAgentPlugin, module: DrupalModule): string[] {
    const frameworks = ['drupal'];
    if (agent.base_class.includes('LangChain') || module.name.includes('langchain')) {
      frameworks.push('langchain');
    }
    return frameworks;
  }

  private generateFrameworkConfig(agent: DrupalAgentPlugin, module: DrupalModule): any {
    const config: any = {
      drupal: {
        enabled: true,
        plugin_type: agent.plugin_type,
        integration_method: "ai_agents_module",
        base_class: agent.base_class
      }
    };

    if (module.name.includes('langchain')) {
      config.langchain = {
        enabled: true,
        tool_type: "structured",
        async_support: true
      };
    }

    if (module.name.includes('crewai')) {
      config.crewai = {
        enabled: true,
        role_type: "agent",
        collaboration: true
      };
    }

    return config;
  }

  private generateInputSchema(parameters: Parameter[]): any {
    if (parameters.length === 0) {
      return { type: "object", properties: {} };
    }

    const properties: any = {};
    const required: string[] = [];

    for (const param of parameters) {
      properties[param.name] = {
        type: this.mapPHPTypeToJSON(param.type),
        description: param.description || `${param.name} parameter`
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

  private generateOutputSchema(returnType: string): any {
    return {
      type: this.mapPHPTypeToJSON(returnType),
      description: `Response from ${returnType} operation`
    };
  }

  private mapPHPTypeToJSON(phpType: string): string {
    const typeMap: { [key: string]: string } = {
      'string': 'string',
      'int': 'integer',
      'integer': 'integer', 
      'float': 'number',
      'double': 'number',
      'bool': 'boolean',
      'boolean': 'boolean',
      'array': 'array',
      'object': 'object',
      'mixed': 'object',
      'void': 'null',
      'null': 'null'
    };

    return typeMap[phpType.toLowerCase()] || 'object';
  }

  // Utility methods

  private isLifecycleMethod(methodName: string): boolean {
    const lifecycleMethods = [
      '__construct', 'create', 'getFormId', 'buildForm', 'submitForm', 'validateForm',
      'defaultConfiguration', 'getConfiguration', 'setConfiguration',
      'calculateDependencies', 'onDependencyRemoval'
    ];
    return lifecycleMethods.includes(methodName);
  }

  private parseAdvancedParameters(paramString: string): Parameter[] {
    if (!paramString.trim()) return [];
    
    const params: Parameter[] = [];
    const paramParts = paramString.split(',');
    
    for (const part of paramParts) {
      const cleanPart = part.trim();
      if (!cleanPart) continue;
      
      // Parse: ?Type $name = default
      const match = cleanPart.match(/(\??)(\w+)?\s*\$(\w+)(?:\s*=\s*(.+))?/);
      if (match) {
        const [, nullable, type, name, defaultValue] = match;
        
        params.push({
          name,
          type: type || 'mixed',
          required: !nullable && defaultValue === undefined,
          default: defaultValue,
          description: `Parameter: ${name}`
        });
      }
    }
    
    return params;
  }

  private extractMethodDocumentation(docblock: string, methodName: string): string {
    if (!docblock) return `Execute ${methodName} capability`;
    
    // Extract first line of documentation
    const lines = docblock.split('\n');
    for (const line of lines) {
      const cleaned = line.replace(/^\s*\*\s*/, '').trim();
      if (cleaned && !cleaned.startsWith('@')) {
        return cleaned;
      }
    }
    
    return `Execute ${methodName} capability`;
  }

  private extractAccessRequirements(docblock: string): string[] {
    const requirements: string[] = [];
    if (!docblock) return requirements;
    
    // Look for @access or @permission annotations
    const accessMatch = docblock.match(/@access\s+(.+)/);
    if (accessMatch) {
      requirements.push(accessMatch[1].trim());
    }
    
    return requirements;
  }

  private extractPromptVariables(content: string): string[] {
    const variables: string[] = [];
    const matches = content.matchAll(/\{\{\s*(\w+)\s*\}\}/g);
    
    for (const match of matches) {
      const variable = match[1];
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  }

  private generatePluginId(className: string): string {
    return className.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}