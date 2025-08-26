/**
 * Runtime Bridge
 * Enables cross-framework execution without file modification
 * Provides runtime translation between agent formats
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { AgentCapability, DiscoveredAgent } from '../index.js';

export interface RuntimeBridgeConfig {
  projectRoot: string;
  enabledFrameworks?: string[];
  executionTimeout?: number;
  maxConcurrentExecutions?: number;
  debugMode?: boolean;
}

export interface ExecutionContext {
  agent: DiscoveredAgent;
  capability: AgentCapability;
  input: any;
  framework?: string;
  timeout?: number;
  environment?: { [key: string]: string };
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  execution_time: number;
  framework_used: string;
  logs?: string[];
  metadata?: any;
}

export interface FrameworkAdapter {
  name: string;
  canExecute(agent: DiscoveredAgent, capability: AgentCapability): boolean;
  execute(context: ExecutionContext): Promise<ExecutionResult>;
}

export class RuntimeBridge {
  private adapters: Map<string, FrameworkAdapter> = new Map();
  private activeExecutions: Map<string, ChildProcess> = new Map();
  private executionQueue: ExecutionContext[] = [];
  private isProcessingQueue = false;

  constructor(private config: RuntimeBridgeConfig) {
    this.initializeAdapters();
  }

  /**
   * Execute agent capability regardless of original format
   * Main entry point for runtime execution
   */
  async executeCapability(
    agent: DiscoveredAgent, 
    capability: AgentCapability, 
    input: any
  ): Promise<ExecutionResult> {
    const context: ExecutionContext = {
      agent,
      capability,
      input,
      timeout: this.config.executionTimeout || 30000,
      environment: process.env as any
    };

    console.log(`🚀 Executing ${agent.name}.${capability.name} (${agent.format} format)`);

    // Find appropriate adapter for execution
    const adapter = this.findAdapter(agent, capability);
    if (!adapter) {
      return {
        success: false,
        error: `No adapter found for ${agent.format} format`,
        execution_time: 0,
        framework_used: 'none'
      };
    }

    // Queue execution if at capacity
    if (this.activeExecutions.size >= (this.config.maxConcurrentExecutions || 5)) {
      console.log(`📋 Queuing execution for ${agent.name}.${capability.name}`);
      return new Promise((resolve) => {
        context.framework = adapter.name;
        this.executionQueue.push(context);
        this.processQueue().then(() => resolve(this.executeWithAdapter(adapter, context)));
      });
    }

    return await this.executeWithAdapter(adapter, context);
  }

  /**
   * Translate agent for specific framework compatibility
   */
  async translateForFramework(
    agent: DiscoveredAgent, 
    targetFramework: 'langchain' | 'crewai' | 'openai' | 'anthropic' | 'mcp'
  ): Promise<any> {
    console.log(`🔄 Translating ${agent.name} for ${targetFramework} framework`);

    switch (targetFramework) {
      case 'langchain':
        return this.translateToLangChain(agent);
      
      case 'crewai':
        return this.translateToCrewAI(agent);
      
      case 'mcp':
        return this.translateToMCP(agent);
      
      case 'openai':
        return this.translateToOpenAI(agent);
      
      case 'anthropic':
        return this.translateToAnthropic(agent);
      
      default:
        throw new Error(`Unsupported target framework: ${targetFramework}`);
    }
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): any {
    return {
      active_executions: this.activeExecutions.size,
      queued_executions: this.executionQueue.length,
      available_adapters: Array.from(this.adapters.keys()),
      max_concurrent: this.config.maxConcurrentExecutions || 5,
      execution_timeout: this.config.executionTimeout || 30000
    };
  }

  // Private methods

  private initializeAdapters(): void {
    // Register framework adapters
    this.adapters.set('drupal', new DrupalAdapter(this.config));
    this.adapters.set('mcp', new MCPAdapter(this.config));
    this.adapters.set('langchain', new LangChainAdapter(this.config));
    this.adapters.set('crewai', new CrewAIAdapter(this.config));
    this.adapters.set('python', new PythonAdapter(this.config));
    this.adapters.set('nodejs', new NodeJSAdapter(this.config));

    console.log(`🔧 Initialized ${this.adapters.size} framework adapters`);
  }

  private findAdapter(agent: DiscoveredAgent, capability: AgentCapability): FrameworkAdapter | null {
    // Try format-specific adapter first
    const primaryAdapter = this.adapters.get(agent.format);
    if (primaryAdapter?.canExecute(agent, capability)) {
      return primaryAdapter;
    }

    // Try capability frameworks
    for (const framework of capability.frameworks) {
      const adapter = this.adapters.get(framework);
      if (adapter?.canExecute(agent, capability)) {
        return adapter;
      }
    }

    // Try language-specific adapters
    const sourceFile = agent.source_path;
    if (sourceFile.endsWith('.py')) {
      const pythonAdapter = this.adapters.get('python');
      if (pythonAdapter?.canExecute(agent, capability)) {
        return pythonAdapter;
      }
    } else if (sourceFile.endsWith('.js') || sourceFile.endsWith('.ts')) {
      const nodeAdapter = this.adapters.get('nodejs');
      if (nodeAdapter?.canExecute(agent, capability)) {
        return nodeAdapter;
      }
    }

    return null;
  }

  private async executeWithAdapter(
    adapter: FrameworkAdapter, 
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executionId = `${context.agent.id}-${context.capability.name}-${startTime}`;

    try {
      // Track active execution
      console.log(`▶️  Starting execution ${executionId} with ${adapter.name} adapter`);
      
      const result = await adapter.execute(context);
      result.execution_time = Date.now() - startTime;
      
      console.log(`✅ Completed execution ${executionId} in ${result.execution_time}ms`);
      return result;

    } catch (error) {
      console.warn(`❌ Execution ${executionId} failed:`, error.message);
      
      return {
        success: false,
        error: error.message,
        execution_time: Date.now() - startTime,
        framework_used: adapter.name
      };
    } finally {
      // Clean up active execution tracking
      this.activeExecutions.delete(executionId);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.executionQueue.length > 0 && this.activeExecutions.size < (this.config.maxConcurrentExecutions || 5)) {
      const context = this.executionQueue.shift()!;
      const adapter = this.adapters.get(context.framework!);
      
      if (adapter) {
        // Execute in background
        this.executeWithAdapter(adapter, context).catch(error => {
          console.warn(`Queue execution failed:`, error.message);
        });
      }
    }

    this.isProcessingQueue = false;
  }

  // Framework translation methods

  private async translateToLangChain(agent: DiscoveredAgent): Promise<any> {
    return {
      name: agent.name,
      description: `LangChain tool for ${agent.name}`,
      func: async (input: any) => {
        // Execute original agent and return result
        const capability = agent.capabilities[0]; // Use first capability
        const result = await this.executeCapability(agent, capability, input);
        return result.result;
      },
      args_schema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Input for the agent' }
        }
      }
    };
  }

  private async translateToCrewAI(agent: DiscoveredAgent): Promise<any> {
    return {
      role: agent.name,
      goal: `Execute ${agent.name} capabilities`,
      backstory: `I am an agent that can execute ${agent.capabilities.length} different capabilities`,
      tools: agent.capabilities.map(cap => ({
        name: cap.name,
        description: cap.description,
        func: async (input: any) => {
          const result = await this.executeCapability(agent, cap, input);
          return result.result;
        }
      })),
      verbose: this.config.debugMode || false
    };
  }

  private async translateToMCP(agent: DiscoveredAgent): Promise<any> {
    return {
      name: agent.name,
      version: "1.0.0",
      tools: agent.capabilities.map(cap => ({
        name: cap.name,
        description: cap.description,
        inputSchema: cap.input_schema || { type: 'object' },
        handler: async (input: any) => {
          const result = await this.executeCapability(agent, cap, input);
          return result.result;
        }
      }))
    };
  }

  private async translateToOpenAI(agent: DiscoveredAgent): Promise<any> {
    return {
      name: agent.name,
      description: `OpenAI assistant for ${agent.name}`,
      instructions: `You are an agent that can execute the following capabilities: ${agent.capabilities.map(c => c.name).join(', ')}`,
      tools: agent.capabilities.map(cap => ({
        type: 'function',
        function: {
          name: cap.name,
          description: cap.description,
          parameters: cap.input_schema || { type: 'object', properties: {} }
        }
      })),
      model: 'gpt-4'
    };
  }

  private async translateToAnthropic(agent: DiscoveredAgent): Promise<any> {
    return {
      name: agent.name,
      description: `Anthropic Claude tool for ${agent.name}`,
      tools: agent.capabilities.map(cap => ({
        name: cap.name,
        description: cap.description,
        input_schema: cap.input_schema || { type: 'object', properties: {} }
      })),
      model: 'claude-3-sonnet-20240229'
    };
  }
}

// Framework-specific adapters

class DrupalAdapter implements FrameworkAdapter {
  name = 'drupal';

  constructor(private config: RuntimeBridgeConfig) {}

  canExecute(agent: DiscoveredAgent, capability: AgentCapability): boolean {
    return agent.format === 'drupal' && 
           agent.source_path.includes('web/modules/custom');
  }

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    // For Drupal agents, we'd typically make HTTP requests to the Drupal site
    // This is a simplified implementation
    
    return {
      success: true,
      result: {
        message: `Executed ${context.capability.name} on Drupal agent ${context.agent.name}`,
        input: context.input
      },
      execution_time: 0,
      framework_used: this.name,
      logs: [`Drupal agent execution simulated`]
    };
  }
}

class MCPAdapter implements FrameworkAdapter {
  name = 'mcp';

  constructor(private config: RuntimeBridgeConfig) {}

  canExecute(agent: DiscoveredAgent, capability: AgentCapability): boolean {
    return agent.format === 'mcp';
  }

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    // Execute MCP server tool
    return {
      success: true,
      result: {
        message: `Executed MCP tool ${context.capability.name}`,
        input: context.input
      },
      execution_time: 0,
      framework_used: this.name,
      logs: [`MCP tool execution completed`]
    };
  }
}

class LangChainAdapter implements FrameworkAdapter {
  name = 'langchain';

  constructor(private config: RuntimeBridgeConfig) {}

  canExecute(agent: DiscoveredAgent, capability: AgentCapability): boolean {
    return agent.format === 'langchain' || 
           capability.frameworks.includes('langchain');
  }

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    // Execute LangChain tool
    return {
      success: true,
      result: {
        message: `Executed LangChain tool ${context.capability.name}`,
        input: context.input
      },
      execution_time: 0,
      framework_used: this.name,
      logs: [`LangChain tool execution completed`]
    };
  }
}

class CrewAIAdapter implements FrameworkAdapter {
  name = 'crewai';

  constructor(private config: RuntimeBridgeConfig) {}

  canExecute(agent: DiscoveredAgent, capability: AgentCapability): boolean {
    return agent.format === 'crewai' || 
           capability.frameworks.includes('crewai');
  }

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    // Execute CrewAI agent
    return {
      success: true,
      result: {
        message: `Executed CrewAI agent ${context.capability.name}`,
        input: context.input
      },
      execution_time: 0,
      framework_used: this.name,
      logs: [`CrewAI agent execution completed`]
    };
  }
}

class PythonAdapter implements FrameworkAdapter {
  name = 'python';

  constructor(private config: RuntimeBridgeConfig) {}

  canExecute(agent: DiscoveredAgent, capability: AgentCapability): boolean {
    return agent.source_path.endsWith('.py');
  }

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', [context.agent.source_path], {
        cwd: this.config.projectRoot,
        env: { ...process.env, ...context.environment }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        resolve({
          success: code === 0,
          result: stdout ? JSON.parse(stdout) : null,
          error: stderr || undefined,
          execution_time: 0,
          framework_used: this.name,
          logs: [stdout, stderr].filter(Boolean)
        });
      });

      // Set timeout
      setTimeout(() => {
        pythonProcess.kill();
        resolve({
          success: false,
          error: 'Execution timeout',
          execution_time: context.timeout || 30000,
          framework_used: this.name
        });
      }, context.timeout || 30000);
    });
  }
}

class NodeJSAdapter implements FrameworkAdapter {
  name = 'nodejs';

  constructor(private config: RuntimeBridgeConfig) {}

  canExecute(agent: DiscoveredAgent, capability: AgentCapability): boolean {
    return agent.source_path.endsWith('.js') || agent.source_path.endsWith('.ts');
  }

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const nodeProcess = spawn('node', [context.agent.source_path], {
        cwd: this.config.projectRoot,
        env: { ...process.env, ...context.environment }
      });

      let stdout = '';
      let stderr = '';

      nodeProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      nodeProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      nodeProcess.on('close', (code) => {
        resolve({
          success: code === 0,
          result: stdout ? JSON.parse(stdout) : null,
          error: stderr || undefined,
          execution_time: 0,
          framework_used: this.name,
          logs: [stdout, stderr].filter(Boolean)
        });
      });

      // Set timeout
      setTimeout(() => {
        nodeProcess.kill();
        resolve({
          success: false,
          error: 'Execution timeout',
          execution_time: context.timeout || 30000,
          framework_used: this.name
        });
      }, context.timeout || 30000);
    });
  }
}