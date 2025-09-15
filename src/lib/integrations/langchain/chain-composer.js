/**
 * OSSA Chain Composer
 * 
 * Implements advanced chain composition patterns from OSSA YAML definitions
 * using LangChain's sequential chains, routing chains, and transformation chains.
 */

import { SequentialChain, SimpleSequentialChain } from 'langchain/chains';
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence, RunnableParallel, RunnableBranch } from '@langchain/core/runnables';
import { OssaChainConverter } from './ossa-chain-converter.js';

export class OssaChainComposer {
  constructor() {
    this.converter = new OssaChainConverter();
    this.compositionPatterns = new Set([
      'sequential',
      'parallel', 
      'conditional',
      'map_reduce',
      'pipeline',
      'router'
    ]);
  }

  /**
   * Create sequential chain from OSSA capabilities
   * @param {string} ossaFilePath - Path to OSSA YAML file
   * @param {Object} llm - LangChain LLM instance
   * @param {Array} capabilityOrder - Order of capabilities to chain
   * @returns {Promise&lt;Object&gt;} Sequential chain
   */
  async createSequentialChain(ossaFilePath, llm, capabilityOrder = null) {
    const ossaAgent = await this.converter.loadOssaDefinition(ossaFilePath);
    const config = this.converter.convertToLangChainConfig(ossaAgent);
    
    // Determine capability order
    const capabilities = capabilityOrder || 
      config.capabilities.filter(cap => cap.supported).map(cap => cap.name);
    
    if (capabilities.length === 0) {
      throw new Error('No supported capabilities found for sequential chain');
    }

    // Create individual chains for each capability
    const chains = [];
    const outputKeys = [];
    
    for (let i = 0; i < capabilities.length; i++) {
      const capName = capabilities[i];
      const template = config.templates[`${capName}_template`];
      
      if (!template) {
        console.warn(`No template found for capability: ${capName}, skipping`);
        continue;
      }

      const prompt = new PromptTemplate({
        template: template.template,
        inputVariables: template.input_variables
      });

      const outputKey = `${capName}_output`;
      const chain = new LLMChain({
        llm,
        prompt,
        outputKey
      });

      chains.push(chain);
      outputKeys.push(outputKey);
    }

    if (chains.length === 0) {
      throw new Error('No valid chains created for sequential composition');
    }

    // Create sequential chain
    const sequentialChain = new SequentialChain({
      chains,
      inputVariables: ['input'],
      outputVariables: outputKeys,
      verbose: true
    });

    return {
      chain: sequentialChain,
      config,
      pattern: 'sequential',
      capabilities,
      outputKeys,
      
      async invoke(input) {
        const result = await sequentialChain.call({ input });
        
        return {
          outputs: result,
          metadata: {
            agent: config.name,
            pattern: 'sequential',
            capabilities_used: capabilities,
            timestamp: new Date().toISOString()
          }
        };
      }
    };
  }

  /**
   * Create parallel execution chain from OSSA capabilities
   * @param {string} ossaFilePath - Path to OSSA YAML file
   * @param {Object} llm - LangChain LLM instance
   * @param {Array} parallelCapabilities - Capabilities to run in parallel
   * @returns {Promise&lt;Object&gt;} Parallel chain using Runnable interface
   */
  async createParallelChain(ossaFilePath, llm, parallelCapabilities = null) {
    const ossaAgent = await this.converter.loadOssaDefinition(ossaFilePath);
    const config = this.converter.convertToLangChainConfig(ossaAgent);
    
    const capabilities = parallelCapabilities || 
      config.capabilities.filter(cap => cap.supported).map(cap => cap.name);
    
    if (capabilities.length === 0) {
      throw new Error('No supported capabilities found for parallel chain');
    }

    // Create parallel runnable branches
    const parallelBranches = {};
    
    for (const capName of capabilities) {
      const template = config.templates[`${capName}_template`];
      
      if (!template) {
        console.warn(`No template found for capability: ${capName}, skipping`);
        continue;
      }

      const prompt = new PromptTemplate({
        template: template.template,
        inputVariables: template.input_variables
      });

      // Create a sequence for this capability
      parallelBranches[capName] = RunnableSequence.from([prompt, llm]);
    }

    if (Object.keys(parallelBranches).length === 0) {
      throw new Error('No valid branches created for parallel composition');
    }

    // Create parallel runnable
    const parallelChain = RunnableParallel.from(parallelBranches);

    return {
      chain: parallelChain,
      config,
      pattern: 'parallel',
      capabilities,
      
      async invoke(input) {
        const results = await parallelChain.invoke(input);
        
        // Transform results for consistent output format
        const transformedResults = {};
        for (const [key, value] of Object.entries(results)) {
          transformedResults[`${key}_output`] = value.content || value;
        }
        
        return {
          outputs: transformedResults,
          metadata: {
            agent: config.name,
            pattern: 'parallel',
            capabilities_used: capabilities,
            timestamp: new Date().toISOString()
          }
        };
      }
    };
  }

  /**
   * Create conditional routing chain based on input analysis
   * @param {string} ossaFilePath - Path to OSSA YAML file 
   * @param {Object} llm - LangChain LLM instance
   * @param {Object} routingRules - Custom routing rules
   * @returns {Promise&lt;Object&gt;} Conditional routing chain
   */
  async createConditionalChain(ossaFilePath, llm, routingRules = null) {
    const ossaAgent = await this.converter.loadOssaDefinition(ossaFilePath);
    const config = this.converter.convertToLangChainConfig(ossaAgent);
    
    const capabilities = config.capabilities.filter(cap => cap.supported);
    
    if (capabilities.length === 0) {
      throw new Error('No supported capabilities found for conditional chain');
    }

    // Default routing rules based on keywords
    const defaultRules = {
      analyze_code: ['analyze', 'review', 'check', 'examine', 'inspect', 'code'],
      generate_docs: ['document', 'docs', 'documentation', 'explain', 'describe'],
      validate_syntax: ['validate', 'syntax', 'error', 'lint', 'format'],
      suggest_improvements: ['improve', 'optimize', 'enhance', 'better', 'refactor']
    };

    const rules = routingRules || defaultRules;

    // Create capability chains
    const capabilityChains = {};
    for (const cap of capabilities) {
      const template = config.templates[`${cap.name}_template`];
      if (template) {
        const prompt = new PromptTemplate({
          template: template.template,
          inputVariables: template.input_variables
        });
        capabilityChains[cap.name] = RunnableSequence.from([prompt, llm]);
      }
    }

    // Create routing function
    const router = (input) => {
      const inputText = typeof input === 'string' ? input : 
                       input.input || input.text || JSON.stringify(input);
      const lowerInput = inputText.toLowerCase();
      
      // Check routing rules
      for (const [capability, keywords] of Object.entries(rules)) {
        if (capabilityChains[capability] && 
            keywords.some(keyword => lowerInput.includes(keyword))) {
          return capability;
        }
      }
      
      // Default to first available capability
      return Object.keys(capabilityChains)[0];
    };

    // Create branched runnable
    const branches = Object.entries(capabilityChains).map(([name, chain]) => [
      (input) => router(input) === name,
      chain
    ]);

    const conditionalChain = RunnableBranch.from(branches);

    return {
      chain: conditionalChain,
      config,
      pattern: 'conditional',
      capabilities: capabilities.map(c => c.name),
      routingRules: rules,
      
      async invoke(input) {
        const selectedCapability = router(input);
        const result = await conditionalChain.invoke(input);
        
        return {
          output: result.content || result,
          metadata: {
            agent: config.name,
            pattern: 'conditional',
            selected_capability: selectedCapability,
            timestamp: new Date().toISOString()
          }
        };
      },
      
      getRouting(input) {
        return {
          selected: router(input),
          available: Object.keys(capabilityChains),
          rules: rules
        };
      }
    };
  }

  /**
   * Create map-reduce pattern for processing multiple inputs
   * @param {string} ossaFilePath - Path to OSSA YAML file
   * @param {Object} llm - LangChain LLM instance
   * @param {string} mapCapability - Capability to use for mapping
   * @param {string} reduceCapability - Capability to use for reducing
   * @returns {Promise&lt;Object&gt;} Map-reduce chain
   */
  async createMapReduceChain(ossaFilePath, llm, mapCapability, reduceCapability = null) {
    const ossaAgent = await this.converter.loadOssaDefinition(ossaFilePath);
    const config = this.converter.convertToLangChainConfig(ossaAgent);
    
    // Validate capabilities
    const mapCap = config.capabilities.find(cap => cap.name === mapCapability && cap.supported);
    if (!mapCap) {
      throw new Error(`Map capability '${mapCapability}' not found or not supported`);
    }

    // Use same capability for reduce if not specified
    const reduceCapabilityName = reduceCapability || mapCapability;
    const reduceCap = config.capabilities.find(cap => cap.name === reduceCapabilityName && cap.supported);
    if (!reduceCap) {
      throw new Error(`Reduce capability '${reduceCapabilityName}' not found or not supported`);
    }

    // Create map chain
    const mapTemplate = config.templates[`${mapCapability}_template`];
    const mapPrompt = new PromptTemplate({
      template: mapTemplate.template,
      inputVariables: mapTemplate.input_variables
    });
    const mapChain = new LLMChain({ llm, prompt: mapPrompt });

    // Create reduce chain
    const reduceTemplate = config.templates[`${reduceCapabilityName}_template`];
    const reducePrompt = new PromptTemplate({
      template: `${reduceTemplate.template}

Please synthesize and combine the following results into a comprehensive summary:

Results to combine: {combined_results}

Combined Analysis:`,
      inputVariables: ['combined_results']
    });
    const reduceChain = new LLMChain({ llm, prompt: reducePrompt });

    return {
      mapChain,
      reduceChain,
      config,
      pattern: 'map_reduce',
      mapCapability,
      reduceCapability: reduceCapabilityName,
      
      async invoke(inputs) {
        if (!Array.isArray(inputs)) {
          throw new Error('Map-reduce requires an array of inputs');
        }
        
        // Map phase - process each input
        console.log(`🗺️  Map phase: Processing ${inputs.length} inputs with ${mapCapability}`);
        const mapResults = [];
        
        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i];
          console.log(`  Processing item ${i + 1}/${inputs.length}`);
          
          const result = await mapChain.call(typeof input === 'object' ? input : { input });
          mapResults.push(result.text);
        }
        
        // Reduce phase - combine results
        console.log(`🔄 Reduce phase: Combining results with ${reduceCapabilityName}`);
        const combinedResults = mapResults.join('\n\n--- Result Separator ---\n\n');
        const finalResult = await reduceChain.call({ combined_results: combinedResults });
        
        return {
          mapResults,
          finalResult: finalResult.text,
          metadata: {
            agent: config.name,
            pattern: 'map_reduce',
            map_capability: mapCapability,
            reduce_capability: reduceCapabilityName,
            inputs_processed: inputs.length,
            timestamp: new Date().toISOString()
          }
        };
      }
    };
  }

  /**
   * Create pipeline chain with transformation steps
   * @param {string} ossaFilePath - Path to OSSA YAML file
   * @param {Object} llm - LangChain LLM instance
   * @param {Array} pipelineSteps - Ordered pipeline steps configuration
   * @returns {Promise&lt;Object&gt;} Pipeline chain
   */
  async createPipelineChain(ossaFilePath, llm, pipelineSteps = null) {
    const ossaAgent = await this.converter.loadOssaDefinition(ossaFilePath);
    const config = this.converter.convertToLangChainConfig(ossaAgent);
    
    // Default pipeline: analyze -> improve -> document
    const defaultSteps = [
      { capability: 'analyze_code', transform: 'passthrough' },
      { capability: 'suggest_improvements', transform: 'extract_code' },
      { capability: 'generate_docs', transform: 'combine_context' }
    ];
    
    const steps = pipelineSteps || defaultSteps.filter(step => 
      config.capabilities.some(cap => cap.name === step.capability && cap.supported)
    );

    if (steps.length === 0) {
      throw new Error('No valid pipeline steps available');
    }

    // Create transformation functions
    const transformers = {
      passthrough: (data) => data,
      extract_code: (data) => {
        // Extract code blocks from previous output if present
        const codeMatch = data.match(/```[\s\S]*?```/);
        return codeMatch ? codeMatch[0] : data;
      },
      combine_context: (data, previousData = []) => {
        return {
          code: previousData[0] || '',
          analysis: data,
          context: 'Pipeline processing result'
        };
      }
    };

    // Build pipeline
    const pipelineStages = [];
    const stageOutputs = [];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const template = config.templates[`${step.capability}_template`];
      
      if (!template) {
        console.warn(`No template for ${step.capability}, skipping`);
        continue;
      }

      const prompt = new PromptTemplate({
        template: template.template,
        inputVariables: template.input_variables
      });

      const stage = {
        name: step.capability,
        chain: new LLMChain({ llm, prompt }),
        transform: transformers[step.transform] || transformers.passthrough
      };

      pipelineStages.push(stage);
    }

    return {
      stages: pipelineStages,
      config,
      pattern: 'pipeline',
      steps,
      
      async invoke(input) {
        const results = [];
        let currentData = input;
        
        console.log(`🏭 Pipeline: Processing through ${pipelineStages.length} stages`);
        
        for (let i = 0; i < pipelineStages.length; i++) {
          const stage = pipelineStages[i];
          console.log(`  Stage ${i + 1}: ${stage.name}`);
          
          // Transform data for current stage
          const stageInput = stage.transform(currentData, results);
          
          // Execute stage
          const stageResult = await stage.chain.call(
            typeof stageInput === 'object' ? stageInput : { input: stageInput }
          );
          
          results.push(stageResult.text);
          currentData = stageResult.text;
        }
        
        return {
          stages: pipelineStages.map(s => s.name),
          results,
          final_output: results[results.length - 1],
          metadata: {
            agent: config.name,
            pattern: 'pipeline',
            stages_executed: pipelineStages.length,
            timestamp: new Date().toISOString()
          }
        };
      }
    };
  }

  /**
   * Create a composition from OSSA workspace or orchestration rules
   * @param {string} ossaFilePath - Path to OSSA YAML file
   * @param {Object} llm - LangChain LLM instance
   * @param {Object} compositionConfig - Composition configuration
   * @returns {Promise&lt;Object&gt;} Composed chain system
   */
  async createComposition(ossaFilePath, llm, compositionConfig) {
    const { pattern, ...config } = compositionConfig;
    
    if (!this.compositionPatterns.has(pattern)) {
      throw new Error(`Unsupported composition pattern: ${pattern}. Supported: ${Array.from(this.compositionPatterns).join(', ')}`);
    }

    switch (pattern) {
      case 'sequential':
        return this.createSequentialChain(ossaFilePath, llm, config.capabilities);
      
      case 'parallel':
        return this.createParallelChain(ossaFilePath, llm, config.capabilities);
      
      case 'conditional':
        return this.createConditionalChain(ossaFilePath, llm, config.routingRules);
      
      case 'map_reduce':
        return this.createMapReduceChain(ossaFilePath, llm, config.mapCapability, config.reduceCapability);
      
      case 'pipeline':
        return this.createPipelineChain(ossaFilePath, llm, config.steps);
      
      default:
        throw new Error(`Pattern ${pattern} not implemented yet`);
    }
  }
}

export default OssaChainComposer;