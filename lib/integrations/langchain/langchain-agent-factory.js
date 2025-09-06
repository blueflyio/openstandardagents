/**
 * LangChain Agent Factory for OSSA
 * 
 * Creates LangChain agents from OSSA definitions using established
 * LangChain patterns and components.
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from '@langchain/core/prompts';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { pull } from 'langchain/hub';
import { OssaChainConverter } from './ossa-chain-converter.js';

export class LangChainAgentFactory {
  constructor() {
    this.converter = new OssaChainConverter();
    this.supportedProviders = new Set(['openai', 'anthropic']);
  }

  /**
   * Create LLM instance based on provider configuration
   * @param {Object} config - LLM configuration
   * @returns {Object} LangChain LLM instance
   */
  createLLM(config = {}) {
    const { 
      provider = 'openai', 
      model = 'gpt-3.5-turbo',
      temperature = 0.1,
      apiKey,
      ...otherOptions 
    } = config;

    switch (provider.toLowerCase()) {
      case 'openai':
        return new ChatOpenAI({
          modelName: model,
          temperature,
          openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
          ...otherOptions
        });
      
      case 'anthropic':
        return new ChatAnthropic({
          modelName: model.includes('claude') ? model : 'claude-3-haiku-20240307',
          temperature,
          anthropicApiKey: apiKey || process.env.ANTHROPIC_API_KEY,
          ...otherOptions
        });
        
      default:
        throw new Error(`Unsupported provider: ${provider}. Supported: ${Array.from(this.supportedProviders).join(', ')}`);
    }
  }

  /**
   * Create basic LangChain agent from OSSA definition
   * @param {string} ossaFilePath - Path to OSSA YAML file
   * @param {Object} llmConfig - LLM configuration
   * @returns {Promise&lt;Object&gt;} LangChain agent
   */
  async createBasicAgent(ossaFilePath, llmConfig = {}) {
    const llm = this.createLLM(llmConfig);
    const { chain, config, capabilities } = await this.converter.createChainFromOssa(ossaFilePath, llm);
    
    return {
      agent: chain,
      config,
      capabilities,
      type: 'basic',
      async invoke(input) {
        const result = await chain.call({
          task: input.task || 'general assistance',
          input: input.input || input
        });
        
        return {
          output: result.text,
          metadata: {
            agent: config.name,
            capability_used: 'main_agent',
            timestamp: new Date().toISOString()
          }
        };
      },
      
      async stream(input) {
        // For basic implementation, return non-streaming result
        const result = await this.invoke(input);
        return [result];
      }
    };
  }

  /**
   * Create capability-specific agent from OSSA definition
   * @param {string} ossaFilePath - Path to OSSA YAML file
   * @param {string} capability - Specific capability to use
   * @param {Object} llmConfig - LLM configuration
   * @returns {Promise&lt;Object&gt;} Specialized LangChain agent
   */
  async createCapabilityAgent(ossaFilePath, capability, llmConfig = {}) {
    const ossaAgent = await this.converter.loadOssaDefinition(ossaFilePath);
    const config = this.converter.convertToLangChainConfig(ossaAgent);
    const llm = this.createLLM(llmConfig);
    
    // Find the capability
    const capabilityConfig = config.capabilities.find(cap => 
      cap.name === capability
    );
    
    if (!capabilityConfig) {
      throw new Error(`Capability '${capability}' not found in OSSA definition`);
    }

    if (!capabilityConfig.supported) {
      throw new Error(`Capability '${capability}' is not currently supported`);
    }

    // Get the template for this capability
    const templateKey = `${capability}_template`;
    const template = config.templates[templateKey];
    
    if (!template) {
      throw new Error(`No template found for capability '${capability}'`);
    }

    // Create prompt template
    const promptTemplate = new PromptTemplate({
      template: template.template,
      inputVariables: template.input_variables
    });

    // Create LLM chain
    const chain = new LLMChain({
      llm,
      prompt: promptTemplate,
      verbose: true
    });

    return {
      agent: chain,
      config,
      capability: capabilityConfig,
      type: 'capability',
      
      async invoke(input) {
        const result = await chain.call(input);
        
        return {
          output: result.text,
          metadata: {
            agent: config.name,
            capability_used: capability,
            timestamp: new Date().toISOString()
          }
        };
      },
      
      async stream(input) {
        // For basic implementation, return non-streaming result
        const result = await this.invoke(input);
        return [result];
      }
    };
  }

  /**
   * Create multi-capability agent with routing
   * @param {string} ossaFilePath - Path to OSSA YAML file
   * @param {Object} llmConfig - LLM configuration
   * @returns {Promise&lt;Object&gt;} Multi-capability LangChain agent
   */
  async createMultiCapabilityAgent(ossaFilePath, llmConfig = {}) {
    const ossaAgent = await this.converter.loadOssaDefinition(ossaFilePath);
    const config = this.converter.convertToLangChainConfig(ossaAgent);
    const llm = this.createLLM(llmConfig);
    
    // Create capability-specific chains
    const capabilityChains = {};
    const supportedCapabilities = config.capabilities.filter(cap => cap.supported);
    
    for (const cap of supportedCapabilities) {
      const templateKey = `${cap.name}_template`;
      const template = config.templates[templateKey];
      
      if (template) {
        const promptTemplate = new PromptTemplate({
          template: template.template,
          inputVariables: template.input_variables
        });
        
        capabilityChains[cap.name] = new LLMChain({
          llm,
          prompt: promptTemplate,
          verbose: true
        });
      }
    }

    // Create routing logic
    const routeCapability = (input) => {
      const inputText = typeof input === 'string' ? input : 
                       input.input || input.task || JSON.stringify(input);
      const lowerInput = inputText.toLowerCase();
      
      // Simple keyword-based routing
      const routingRules = {
        analyze_code: ['analyze', 'review', 'check', 'examine', 'inspect'],
        generate_docs: ['document', 'docs', 'documentation', 'explain', 'describe'],
        validate_syntax: ['validate', 'syntax', 'error', 'lint', 'format'],
        suggest_improvements: ['improve', 'optimize', 'enhance', 'better', 'refactor']
      };
      
      for (const [capability, keywords] of Object.entries(routingRules)) {
        if (keywords.some(keyword => lowerInput.includes(keyword))) {
          return capability;
        }
      }
      
      // Default to first available capability
      return supportedCapabilities[0]?.name || 'main_agent';
    };

    return {
      agent: capabilityChains,
      config,
      capabilities: supportedCapabilities,
      type: 'multi_capability',
      
      async invoke(input) {
        const capability = routeCapability(input);
        const chain = capabilityChains[capability];
        
        if (!chain) {
          throw new Error(`No chain available for capability: ${capability}`);
        }
        
        const result = await chain.call(typeof input === 'object' ? input : { input });
        
        return {
          output: result.text,
          metadata: {
            agent: config.name,
            capability_used: capability,
            timestamp: new Date().toISOString()
          }
        };
      },
      
      async invokeCapability(capability, input) {
        const chain = capabilityChains[capability];
        
        if (!chain) {
          throw new Error(`Capability '${capability}' not available`);
        }
        
        const result = await chain.call(typeof input === 'object' ? input : { input });
        
        return {
          output: result.text,
          metadata: {
            agent: config.name,
            capability_used: capability,
            timestamp: new Date().toISOString()
          }
        };
      },
      
      listCapabilities() {
        return supportedCapabilities.map(cap => ({
          name: cap.name,
          description: cap.description,
          type: cap.type
        }));
      }
    };
  }

  /**
   * Create runnable agent using LangChain's Runnable interface
   * @param {string} ossaFilePath - Path to OSSA YAML file
   * @param {Object} llmConfig - LLM configuration
   * @returns {Promise&lt;Object&gt;} Runnable agent
   */
  async createRunnableAgent(ossaFilePath, llmConfig = {}) {
    const llm = this.createLLM(llmConfig);
    const { runnable, config, capabilities } = await this.converter.createRunnableFromOssa(ossaFilePath, llm);
    
    return {
      agent: runnable,
      config,
      capabilities,
      type: 'runnable',
      
      async invoke(input) {
        const result = await runnable.invoke({
          task: input.task || 'general assistance',
          input: input.input || input
        });
        
        return {
          output: result.content || result,
          metadata: {
            agent: config.name,
            capability_used: 'runnable',
            timestamp: new Date().toISOString()
          }
        };
      },
      
      async stream(input) {
        const stream = await runnable.stream({
          task: input.task || 'general assistance', 
          input: input.input || input
        });
        
        const results = [];
        for await (const chunk of stream) {
          results.push({
            output: chunk.content || chunk,
            metadata: {
              agent: config.name,
              capability_used: 'runnable',
              timestamp: new Date().toISOString(),
              chunk: true
            }
          });
        }
        
        return results;
      }
    };
  }

  /**
   * Create agent with tools support (requires OpenAI)
   * @param {string} ossaFilePath - Path to OSSA YAML file
   * @param {Array} tools - LangChain tools
   * @param {Object} llmConfig - LLM configuration (must be OpenAI)
   * @returns {Promise&lt;Object&gt;} Tool-enabled agent
   */
  async createToolAgent(ossaFilePath, tools = [], llmConfig = {}) {
    if (!llmConfig.provider || llmConfig.provider.toLowerCase() !== 'openai') {
      throw new Error('Tool agents currently require OpenAI provider');
    }

    const llm = this.createLLM(llmConfig);
    const ossaAgent = await this.converter.loadOssaDefinition(ossaFilePath);
    const config = this.converter.convertToLangChainConfig(ossaAgent);

    // Create agent prompt from hub or use custom
    let prompt;
    try {
      prompt = await pull("hwchase17/openai-functions-agent");
    } catch (error) {
      // Fallback to basic prompt if hub is unavailable
      prompt = new PromptTemplate({
        template: `You are ${config.agent.name}, ${config.agent.expertise}.

${config.agent.description || ''}

You have access to the following tools:
{tools}

Use the following format:
Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Question: {input}
Thought: {agent_scratchpad}`,
        inputVariables: ["input", "tools", "tool_names", "agent_scratchpad"]
      });
    }

    // Create OpenAI functions agent
    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt
    });

    // Create agent executor
    const executor = new AgentExecutor({
      agent,
      tools,
      verbose: true
    });

    return {
      agent: executor,
      config,
      tools,
      type: 'tool_agent',
      
      async invoke(input) {
        const result = await executor.call({
          input: typeof input === 'string' ? input : input.input || JSON.stringify(input)
        });
        
        return {
          output: result.output,
          metadata: {
            agent: config.name,
            capability_used: 'tool_agent',
            timestamp: new Date().toISOString()
          }
        };
      }
    };
  }
}

export default LangChainAgentFactory;