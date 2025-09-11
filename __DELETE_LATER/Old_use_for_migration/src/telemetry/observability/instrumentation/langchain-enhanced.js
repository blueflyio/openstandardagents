/**
 * Enhanced LangChain Integration with OSSA Observability
 * 
 * Wraps existing LangChain agent factory with comprehensive observability
 * using OpenLLMetry/Traceloop and Langfuse integration.
 */

import { LangChainAgentFactory } from '../../integrations/langchain/langchain-agent-factory.js';
import { getOSSATracer } from '../middleware/ossa-tracer.js';

/**
 * Observable LangChain Agent Factory
 * Extends the base factory with comprehensive tracing
 */
export class ObservableLangChainAgentFactory extends LangChainAgentFactory {
  constructor(options = {}) {
    super();
    this.tracingOptions = {
      trackTokenUsage: true,
      trackLatency: true,
      trackErrors: true,
      trackChainExecution: true,
      ...options.tracing
    };
    this.tracer = null;
  }

  /**
   * Initialize tracer if not already done
   */
  async ensureTracer() {
    if (!this.tracer) {
      this.tracer = getOSSATracer({
        serviceName: 'ossa-langchain-agent',
        version: '0.1.8'
      });
      await this.tracer.initialize();
    }
    return this.tracer;
  }

  /**
   * Create LLM with observability wrapper
   */
  createLLM(config = {}) {
    const llm = super.createLLM(config);
    
    // Wrap LLM methods for tracing
    if (this.tracingOptions.trackTokenUsage) {
      const originalCall = llm._call || llm.call;
      llm._call = async (messages, options, runManager) => {
        const tracer = await this.ensureTracer();
        
        return await tracer.traceLLMCall(
          config.provider || 'openai',
          config.model || 'gpt-3.5-turbo',
          messages,
          { config, options },
          async () => originalCall.call(llm, messages, options, runManager)
        );
      };
    }

    return llm;
  }

  /**
   * Create basic agent with observability
   */
  async createBasicAgent(ossaFilePath, llmConfig = {}) {
    const tracer = await this.ensureTracer();
    
    return await tracer.traceAgentExecution(
      'basic-agent',
      'create',
      { ossaFilePath, llmConfig },
      async () => {
        const agent = await super.createBasicAgent(ossaFilePath, llmConfig);
        return this.wrapAgentWithObservability(agent, 'basic');
      }
    );
  }

  /**
   * Create capability agent with observability
   */
  async createCapabilityAgent(ossaFilePath, capability, llmConfig = {}) {
    const tracer = await this.ensureTracer();
    
    return await tracer.traceAgentExecution(
      'capability-agent',
      'create',
      { ossaFilePath, capability, llmConfig },
      async () => {
        const agent = await super.createCapabilityAgent(ossaFilePath, capability, llmConfig);
        return this.wrapAgentWithObservability(agent, 'capability');
      }
    );
  }

  /**
   * Create multi-capability agent with observability
   */
  async createMultiCapabilityAgent(ossaFilePath, llmConfig = {}) {
    const tracer = await this.ensureTracer();
    
    return await tracer.traceAgentExecution(
      'multi-capability-agent',
      'create',
      { ossaFilePath, llmConfig },
      async () => {
        const agent = await super.createMultiCapabilityAgent(ossaFilePath, llmConfig);
        return this.wrapAgentWithObservability(agent, 'multi-capability');
      }
    );
  }

  /**
   * Create runnable agent with observability
   */
  async createRunnableAgent(ossaFilePath, llmConfig = {}) {
    const tracer = await this.ensureTracer();
    
    return await tracer.traceAgentExecution(
      'runnable-agent',
      'create',
      { ossaFilePath, llmConfig },
      async () => {
        const agent = await super.createRunnableAgent(ossaFilePath, llmConfig);
        return this.wrapAgentWithObservability(agent, 'runnable');
      }
    );
  }

  /**
   * Create tool agent with observability
   */
  async createToolAgent(ossaFilePath, tools = [], llmConfig = {}) {
    const tracer = await this.ensureTracer();
    
    return await tracer.traceAgentExecution(
      'tool-agent',
      'create',
      { ossaFilePath, toolCount: tools.length, llmConfig },
      async () => {
        const agent = await super.createToolAgent(ossaFilePath, tools, llmConfig);
        return this.wrapAgentWithObservability(agent, 'tool');
      }
    );
  }

  /**
   * Wrap agent methods with observability
   */
  wrapAgentWithObservability(agent, agentType) {
    const originalInvoke = agent.invoke;
    const originalStream = agent.stream;
    const originalInvokeCapability = agent.invokeCapability;

    // Wrap invoke method
    agent.invoke = async (input) => {
      const tracer = await this.ensureTracer();
      
      return await tracer.traceAgentExecution(
        `${agentType}-agent`,
        'invoke',
        { 
          input: typeof input === 'string' ? input.substring(0, 100) : 'complex_input',
          agentType,
          agentName: agent.config?.name
        },
        async ({ trace }) => {
          const startTime = Date.now();
          
          try {
            const result = await originalInvoke.call(agent, input);
            
            // Enhanced metadata
            result.metadata = {
              ...result.metadata,
              observability: {
                tracingEnabled: true,
                duration_ms: Date.now() - startTime,
                agentType,
                traceId: trace?.id || 'not_available'
              }
            };
            
            return result;
          } catch (error) {
            // Add observability metadata to error
            error.observability = {
              agentType,
              duration_ms: Date.now() - startTime,
              failed: true
            };
            throw error;
          }
        }
      );
    };

    // Wrap stream method if available
    if (originalStream) {
      agent.stream = async (input) => {
        const tracer = await this.ensureTracer();
        
        return await tracer.traceAgentExecution(
          `${agentType}-agent`,
          'stream',
          { 
            input: typeof input === 'string' ? input.substring(0, 100) : 'complex_input',
            agentType,
            agentName: agent.config?.name
          },
          async ({ trace }) => {
            const startTime = Date.now();
            
            try {
              const results = await originalStream.call(agent, input);
              
              // Add observability metadata to each result
              return results.map((result, index) => ({
                ...result,
                metadata: {
                  ...result.metadata,
                  observability: {
                    tracingEnabled: true,
                    streamIndex: index,
                    agentType,
                    traceId: trace?.id || 'not_available'
                  }
                }
              }));
            } catch (error) {
              error.observability = {
                agentType,
                duration_ms: Date.now() - startTime,
                failed: true,
                operation: 'stream'
              };
              throw error;
            }
          }
        );
      };
    }

    // Wrap invokeCapability method if available
    if (originalInvokeCapability) {
      agent.invokeCapability = async (capability, input) => {
        const tracer = await this.ensureTracer();
        
        return await tracer.traceAgentExecution(
          `${agentType}-agent`,
          'invoke-capability',
          { 
            capability,
            input: typeof input === 'string' ? input.substring(0, 100) : 'complex_input',
            agentType,
            agentName: agent.config?.name
          },
          async ({ trace }) => {
            const startTime = Date.now();
            
            try {
              const result = await originalInvokeCapability.call(agent, capability, input);
              
              result.metadata = {
                ...result.metadata,
                observability: {
                  tracingEnabled: true,
                  duration_ms: Date.now() - startTime,
                  capability,
                  agentType,
                  traceId: trace?.id || 'not_available'
                }
              };
              
              return result;
            } catch (error) {
              error.observability = {
                agentType,
                capability,
                duration_ms: Date.now() - startTime,
                failed: true
              };
              throw error;
            }
          }
        );
      };
    }

    // Add observability metadata methods
    agent.getObservabilityConfig = () => ({
      tracingEnabled: true,
      agentType,
      observabilityFeatures: {
        tokenUsage: this.tracingOptions.trackTokenUsage,
        latency: this.tracingOptions.trackLatency,
        errors: this.tracingOptions.trackErrors,
        chainExecution: this.tracingOptions.trackChainExecution
      }
    });

    agent.getTracer = () => this.tracer;

    return agent;
  }
}

/**
 * Enhanced Chain Composer with Observability
 */
export class ObservableChainComposer {
  constructor(options = {}) {
    this.tracingOptions = {
      trackChainSteps: true,
      trackDataFlow: true,
      ...options.tracing
    };
    this.tracer = null;
  }

  async ensureTracer() {
    if (!this.tracer) {
      this.tracer = getOSSATracer({
        serviceName: 'ossa-chain-composer',
        version: '0.1.8'
      });
      await this.tracer.initialize();
    }
    return this.tracer;
  }

  /**
   * Compose agents with observability tracking
   */
  async composeAgents(agents, composition = 'sequential', options = {}) {
    const tracer = await this.ensureTracer();
    
    return await tracer.traceAgentExecution(
      'chain-composer',
      'compose',
      { 
        agentCount: agents.length,
        composition,
        options
      },
      async () => {
        // Implementation of chain composition with tracing
        const composedChain = {
          agents,
          composition,
          options,
          
          async execute(input) {
            return await tracer.traceAgentExecution(
              'composed-chain',
              'execute',
              { composition, agentCount: agents.length },
              async () => {
                const results = [];
                let currentInput = input;
                
                for (let i = 0; i < agents.length; i++) {
                  const agent = agents[i];
                  const stepResult = await agent.invoke(currentInput);
                  
                  results.push({
                    ...stepResult,
                    metadata: {
                      ...stepResult.metadata,
                      chainStep: i,
                      composition
                    }
                  });
                  
                  // Use output as input for next agent in sequential composition
                  if (composition === 'sequential') {
                    currentInput = stepResult.output;
                  }
                }
                
                return {
                  output: composition === 'sequential' ? 
                    results[results.length - 1].output : 
                    results.map(r => r.output),
                  results,
                  metadata: {
                    composition,
                    agentCount: agents.length,
                    totalSteps: results.length,
                    observability: {
                      tracingEnabled: true,
                      composition
                    }
                  }
                };
              }
            );
          }
        };
        
        return composedChain;
      }
    );
  }
}

export { ObservableLangChainAgentFactory as default };