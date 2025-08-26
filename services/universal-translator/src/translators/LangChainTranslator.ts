/**
 * LangChain Translator
 * Translates LangChain tools, chains, and agents to OAAS format without modification
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export interface LangChainTool {
  name: string;
  description: string;
  func?: string;
  args_schema?: any;
  return_direct?: boolean;
  verbose?: boolean;
  callbacks?: any[];
}

export interface LangChainChain {
  name: string;
  description?: string;
  chain_type: 'llm' | 'sequential' | 'router' | 'map_reduce' | 'stuff' | 'refine';
  components: string[];
  prompt?: string;
}

export interface LangChainAgent {
  name: string;
  description?: string;
  agent_type: 'zero_shot' | 'react' | 'self_ask' | 'conversational' | 'chat' | 'structured_chat';
  tools: LangChainTool[];
  chains?: LangChainChain[];
  memory?: string;
  callbacks?: any[];
}

export interface LangChainImplementation {
  file_path: string;
  language: 'python' | 'javascript' | 'typescript';
  tools: LangChainTool[];
  chains: LangChainChain[];
  agents: LangChainAgent[];
  imports: string[];
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

export class LangChainTranslator {

  /**
   * Discover LangChain implementations (compatible with DiscoveryEngine)
   */
  async discoverLangChain(projectRoot: string): Promise<DiscoveryResult[]> {
    console.log('🔍 Discovering LangChain implementations...');
    
    const discoveries: DiscoveryResult[] = [];
    const implementations = await this.discoverLangChainImplementations(projectRoot);
    
    // Convert LangChainImplementation objects to DiscoveryResult format
    for (const impl of implementations) {
      const fileName = path.basename(impl.file_path, path.extname(impl.file_path));
      
      discoveries.push({
        id: `langchain-${fileName}`,
        name: fileName,
        format: 'langchain',
        source_path: impl.file_path,
        capabilities: [
          ...impl.tools.map(t => t.name),
          ...impl.chains.map(c => c.name),
          ...impl.agents.map(a => a.name)
        ],
        metadata: {
          language: impl.language,
          tools_count: impl.tools.length,
          chains_count: impl.chains.length,
          agents_count: impl.agents.length,
          imports: impl.imports,
          tools: impl.tools,
          chains: impl.chains,
          agents: impl.agents
        },
        confidence: this.calculateImplementationConfidence(impl)
      });
    }
    
    console.log(`✅ Found ${discoveries.length} LangChain implementations`);
    return discoveries;
  }

  /**
   * Internal method: Discover LangChain implementations across the project
   */
  private async discoverLangChainImplementations(projectRoot: string): Promise<LangChainImplementation[]> {
    console.log('🔍 Discovering LangChain implementations...');
    
    const implementations: LangChainImplementation[] = [];
    
    try {
      // Find files that might contain LangChain code
      const langchainFiles = await glob('**/*.{py,js,ts}', {
        cwd: projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/__pycache__/**']
      });

      for (const filePath of langchainFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          
          if (this.isLangChainFile(content)) {
            const implementation = await this.analyzeLangChainFile(filePath, content);
            if (implementation.tools.length > 0 || implementation.chains.length > 0 || implementation.agents.length > 0) {
              implementations.push(implementation);
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    } catch (error) {
      console.warn('⚠️  LangChain discovery failed:', error.message);
    }
    
    console.log(`✅ Found ${implementations.length} LangChain implementations`);
    return implementations;
  }

  /**
   * Check if file contains LangChain code
   */
  private isLangChainFile(content: string): boolean {
    const langchainPatterns = [
      /from\s+langchain/,
      /import.*langchain/,
      /@tool/,
      /Tool\(/,
      /BaseTool/,
      /Chain\(/,
      /Agent\(/,
      /ConversationChain/,
      /LLMChain/,
      /SequentialChain/
    ];

    return langchainPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Analyze LangChain file and extract components
   */
  private async analyzeLangChainFile(filePath: string, content: string): Promise<LangChainImplementation> {
    const ext = path.extname(filePath);
    const language = ext === '.py' ? 'python' : (ext === '.ts' ? 'typescript' : 'javascript');
    
    return {
      file_path: filePath,
      language,
      tools: this.extractTools(content, language),
      chains: this.extractChains(content, language),
      agents: this.extractAgents(content, language),
      imports: this.extractImports(content, language)
    };
  }

  /**
   * Extract LangChain tools from code
   */
  private extractTools(content: string, language: string): LangChainTool[] {
    const tools: LangChainTool[] = [];
    
    if (language === 'python') {
      // Python @tool decorator pattern
      const toolMatches = content.matchAll(/@tool\s*(?:\([^)]*\))?\s*def\s+(\w+)\s*\([^)]*\):/g);
      for (const match of toolMatches) {
        const toolName = match[1];
        const description = this.extractPythonDocstring(content, toolName);
        tools.push({
          name: toolName,
          description: description || `Execute ${toolName} operation`,
          args_schema: this.extractPythonArgsSchema(content, toolName)
        });
      }
      
      // Python Tool class pattern
      const toolClassMatches = content.matchAll(/class\s+(\w+)\s*\(.*?Tool.*?\):/g);
      for (const match of toolClassMatches) {
        const className = match[1];
        const description = this.extractClassDescription(content, className);
        tools.push({
          name: this.camelToSnake(className),
          description: description || `${className} tool`,
          args_schema: this.extractToolClassSchema(content, className)
        });
      }
    } else {
      // JavaScript/TypeScript Tool patterns
      const jsToolMatches = content.matchAll(/new\s+Tool\s*\(\s*\{([^}]+)\}/g);
      for (const match of jsToolMatches) {
        const toolConfig = match[1];
        const tool = this.parseJSToolConfig(toolConfig);
        if (tool) {
          tools.push(tool);
        }
      }
      
      // Function-based tools
      const functionToolMatches = content.matchAll(/createTool\s*\(\s*\{([^}]+)\}/g);
      for (const match of functionToolMatches) {
        const toolConfig = match[1];
        const tool = this.parseJSToolConfig(toolConfig);
        if (tool) {
          tools.push(tool);
        }
      }
    }
    
    return tools;
  }

  /**
   * Extract LangChain chains from code
   */
  private extractChains(content: string, language: string): LangChainChain[] {
    const chains: LangChainChain[] = [];
    
    if (language === 'python') {
      // Python chain patterns
      const chainPatterns = [
        { pattern: /LLMChain\s*\([^)]+\)/, type: 'llm' },
        { pattern: /SequentialChain\s*\([^)]+\)/, type: 'sequential' },
        { pattern: /RouterChain\s*\([^)]+\)/, type: 'router' },
        { pattern: /MapReduceChain\s*\([^)]+\)/, type: 'map_reduce' }
      ];
      
      chainPatterns.forEach(({ pattern, type }) => {
        const matches = content.matchAll(new RegExp(pattern.source, 'g'));
        for (const match of matches) {
          chains.push({
            name: `${type}_chain_${chains.length + 1}`,
            description: `${type.charAt(0).toUpperCase() + type.slice(1)} chain`,
            chain_type: type as any,
            components: this.extractChainComponents(match[0])
          });
        }
      });
    } else {
      // JavaScript/TypeScript chain patterns
      const jsChainMatches = content.matchAll(/new\s+(\w*Chain)\s*\(/g);
      for (const match of jsChainMatches) {
        const chainClass = match[1];
        const chainType = this.inferChainType(chainClass);
        chains.push({
          name: this.camelToSnake(chainClass),
          description: `${chainClass} implementation`,
          chain_type: chainType as any,
          components: []
        });
      }
    }
    
    return chains;
  }

  /**
   * Extract LangChain agents from code
   */
  private extractAgents(content: string, language: string): LangChainAgent[] {
    const agents: LangChainAgent[] = [];
    
    if (language === 'python') {
      // Python agent patterns
      const agentMatches = content.matchAll(/initialize_agent\s*\(([^)]+)\)/g);
      for (const match of agentMatches) {
        const agentConfig = match[1];
        const agentType = this.extractAgentType(agentConfig);
        const tools = this.extractAgentTools(agentConfig);
        
        agents.push({
          name: `agent_${agents.length + 1}`,
          description: `${agentType} agent`,
          agent_type: agentType as any,
          tools: tools.map(toolName => ({
            name: toolName,
            description: `Tool: ${toolName}`
          }))
        });
      }
      
      // Agent class patterns
      const agentClassMatches = content.matchAll(/class\s+(\w+)\s*\(.*?Agent.*?\):/g);
      for (const match of agentClassMatches) {
        const className = match[1];
        agents.push({
          name: this.camelToSnake(className),
          description: `${className} agent`,
          agent_type: 'conversational',
          tools: []
        });
      }
    } else {
      // JavaScript/TypeScript agent patterns
      const jsAgentMatches = content.matchAll(/new\s+(\w*Agent)\s*\(/g);
      for (const match of jsAgentMatches) {
        const agentClass = match[1];
        agents.push({
          name: this.camelToSnake(agentClass),
          description: `${agentClass} implementation`,
          agent_type: 'conversational',
          tools: []
        });
      }
    }
    
    return agents;
  }

  /**
   * Extract import statements
   */
  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];
    
    if (language === 'python') {
      const importMatches = content.matchAll(/from\s+langchain[.\w]*\s+import\s+([^\n]+)/g);
      for (const match of importMatches) {
        imports.push(match[1].trim());
      }
    } else {
      const importMatches = content.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]langchain[^'"]*['"]/g);
      for (const match of importMatches) {
        imports.push(match[1].trim());
      }
    }
    
    return imports;
  }

  // Helper methods

  private extractPythonDocstring(content: string, functionName: string): string | null {
    const funcPattern = new RegExp(`def\\s+${functionName}\\s*\\([^)]*\\):[^"']*["']{3}([^"']+)["']{3}`, 's');
    const match = content.match(funcPattern);
    return match ? match[1].trim() : null;
  }

  private extractPythonArgsSchema(content: string, functionName: string): any {
    // Extract function signature and infer schema
    const funcPattern = new RegExp(`def\\s+${functionName}\\s*\\(([^)]+)\\):`);
    const match = content.match(funcPattern);
    
    if (match) {
      const args = match[1].split(',').map(arg => arg.trim());
      const properties: any = {};
      
      args.forEach(arg => {
        const parts = arg.split(':');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const type = parts[1].trim();
          properties[name] = { type: this.pythonTypeToJSON(type) };
        }
      });
      
      return {
        type: 'object',
        properties,
        required: Object.keys(properties)
      };
    }
    
    return { type: 'object', properties: {} };
  }

  private extractClassDescription(content: string, className: string): string | null {
    const classPattern = new RegExp(`class\\s+${className}[^:]*:[^"']*["']{3}([^"']+)["']{3}`, 's');
    const match = content.match(classPattern);
    return match ? match[1].trim() : null;
  }

  private extractToolClassSchema(content: string, className: string): any {
    // Look for args_schema definition in class
    const schemaPattern = new RegExp(`class\\s+${className}[^}]+args_schema[^=]*=([^\\n]+)`, 's');
    const match = content.match(schemaPattern);
    
    if (match) {
      // Simple schema extraction
      return { type: 'object', properties: {} };
    }
    
    return { type: 'object', properties: {} };
  }

  private parseJSToolConfig(configString: string): LangChainTool | null {
    try {
      // Extract name and description from config string
      const nameMatch = configString.match(/name\s*:\s*['"]([^'"]+)['"]/);
      const descMatch = configString.match(/description\s*:\s*['"]([^'"]+)['"]/);
      
      if (nameMatch) {
        return {
          name: nameMatch[1],
          description: descMatch ? descMatch[1] : `Tool: ${nameMatch[1]}`,
          args_schema: { type: 'object', properties: {} }
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }
    
    return null;
  }

  private extractChainComponents(chainString: string): string[] {
    // Simple extraction of chain components
    const components: string[] = [];
    
    if (chainString.includes('chains=')) {
      components.push('chains');
    }
    if (chainString.includes('llm=')) {
      components.push('llm');
    }
    if (chainString.includes('prompt=')) {
      components.push('prompt');
    }
    
    return components;
  }

  private inferChainType(chainClass: string): string {
    const typeMap: { [key: string]: string } = {
      'LLMChain': 'llm',
      'SequentialChain': 'sequential',
      'RouterChain': 'router',
      'MapReduceChain': 'map_reduce',
      'StuffDocumentsChain': 'stuff',
      'RefineDocumentsChain': 'refine'
    };
    
    return typeMap[chainClass] || 'llm';
  }

  private extractAgentType(configString: string): string {
    const typeMap: { [key: string]: string } = {
      'ZERO_SHOT_REACT_DESCRIPTION': 'zero_shot',
      'REACT_DOCSTORE': 'react',
      'SELF_ASK_WITH_SEARCH': 'self_ask',
      'CONVERSATIONAL_REACT_DESCRIPTION': 'conversational',
      'CHAT_ZERO_SHOT_REACT_DESCRIPTION': 'chat',
      'STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION': 'structured_chat'
    };
    
    for (const [key, value] of Object.entries(typeMap)) {
      if (configString.includes(key)) {
        return value;
      }
    }
    
    return 'zero_shot';
  }

  private extractAgentTools(configString: string): string[] {
    const tools: string[] = [];
    
    // Look for tools array in config
    const toolsMatch = configString.match(/tools\s*=\s*\[([^\]]+)\]/);
    if (toolsMatch) {
      const toolsList = toolsMatch[1].split(',');
      toolsList.forEach(tool => {
        const cleanTool = tool.trim().replace(/['"]/g, '');
        if (cleanTool) {
          tools.push(cleanTool);
        }
      });
    }
    
    return tools;
  }

  private camelToSnake(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  private pythonTypeToJSON(pythonType: string): string {
    const typeMap: { [key: string]: string } = {
      'str': 'string',
      'int': 'integer',
      'float': 'number',
      'bool': 'boolean',
      'list': 'array',
      'dict': 'object'
    };
    
    return typeMap[pythonType.toLowerCase()] || 'string';
  }

  /**
   * Translate LangChain implementation to OAAS format
   */
  async translateToOAAS(implementation: LangChainImplementation): Promise<any> {
    const fileName = path.basename(implementation.file_path, path.extname(implementation.file_path));
    
    const capabilities = [
      ...implementation.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.args_schema || { type: 'object', properties: {} },
        output_schema: { type: 'object', description: 'Tool execution result' },
        frameworks: ['langchain', 'mcp'],
        compliance: ['langchain-tools']
      })),
      ...implementation.chains.map(chain => ({
        name: chain.name,
        description: chain.description || `${chain.chain_type} chain execution`,
        input_schema: { type: 'object', properties: { input: { type: 'string' } } },
        output_schema: { type: 'object', description: 'Chain execution result' },
        frameworks: ['langchain'],
        compliance: ['langchain-chains']
      })),
      ...implementation.agents.map(agent => ({
        name: agent.name,
        description: agent.description || `${agent.agent_type} agent interaction`,
        input_schema: { type: 'object', properties: { input: { type: 'string' } } },
        output_schema: { type: 'object', description: 'Agent response' },
        frameworks: ['langchain'],
        compliance: ['langchain-agents']
      }))
    ];

    const oaasSpec = {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent",
      metadata: {
        name: `langchain-${fileName}`,
        version: "1.0.0",
        created: new Date().toISOString().split('T')[0],
        description: `LangChain implementation: ${fileName}`,
        annotations: {
          "oaas/compliance-level": "silver",
          "oaas/framework-support": "langchain,mcp,crewai",
          "langchain/language": implementation.language,
          "langchain/file-path": implementation.file_path,
          "langchain/tools-count": implementation.tools.length,
          "langchain/chains-count": implementation.chains.length,
          "langchain/agents-count": implementation.agents.length
        },
        labels: {
          domain: "langchain",
          category: "tool-chain",
          framework: "langchain",
          language: implementation.language
        }
      },
      spec: {
        agent: {
          name: fileName,
          expertise: `LangChain ${implementation.language} implementation with ${implementation.tools.length} tools, ${implementation.chains.length} chains, and ${implementation.agents.length} agents`
        },
        capabilities,
        protocols: {
          supported: ['langchain', 'openapi', 'mcp'],
          primary: 'langchain',
          langchain: {
            enabled: true,
            language: implementation.language,
            imports: implementation.imports,
            tools: implementation.tools.map(t => t.name),
            chains: implementation.chains.map(c => c.name),
            agents: implementation.agents.map(a => a.name)
          }
        },
        frameworks: {
          langchain: {
            enabled: true,
            language: implementation.language,
            integration_method: 'direct_import'
          },
          mcp: {
            enabled: true,
            bridge_type: 'langchain_to_mcp',
            tools_supported: true
          }
        },
        data: {
          source_file: implementation.file_path,
          language: implementation.language,
          components: {
            tools: implementation.tools.length,
            chains: implementation.chains.length,
            agents: implementation.agents.length
          },
          imports: implementation.imports
        }
      }
    };

    return oaasSpec;
  }

  /**
   * Calculate confidence score for LangChain implementation detection
   */
  private calculateImplementationConfidence(implementation: LangChainImplementation): number {
    let confidence = 0.6; // Base confidence for having LangChain imports

    // Boost confidence for components found
    if (implementation.tools.length > 0) {
      confidence += 0.2;
    }
    if (implementation.chains.length > 0) {
      confidence += 0.15;
    }
    if (implementation.agents.length > 0) {
      confidence += 0.15;
    }
    if (implementation.imports.length > 0) {
      confidence += 0.05;
    }

    // Language-specific patterns boost confidence
    if (implementation.language === 'python' && implementation.tools.some(t => t.name.includes('tool'))) {
      confidence += 0.1;
    }
    if ((implementation.language === 'typescript' || implementation.language === 'javascript') && 
        implementation.tools.some(t => t.name.includes('Tool'))) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }
}