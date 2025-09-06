/**
 * OSSA to LangChain Chain Converter
 * 
 * Converts OSSA agent definitions to LangChain chain configurations
 * following established LangChain patterns and best practices.
 */

import { BasePromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import yaml from 'yaml';
import fs from 'fs/promises';
import path from 'path';

export class OssaChainConverter {
  constructor() {
    this.supportedCapabilities = new Set([
      'analyze_code',
      'generate_docs', 
      'validate_syntax',
      'suggest_improvements',
      'text_processing',
      'data_analysis',
      'code_review',
      'planning'
    ]);
  }

  /**
   * Load and parse OSSA agent definition from YAML file
   * @param {string} filePath - Path to OSSA YAML file
   * @returns {Promise&lt;Object&gt;} Parsed OSSA agent definition
   */
  async loadOssaDefinition(filePath) {
    try {
      const yamlContent = await fs.readFile(filePath, 'utf-8');
      const ossaAgent = yaml.parse(yamlContent);
      
      this.validateOssaStructure(ossaAgent);
      return ossaAgent;
    } catch (error) {
      throw new Error(`Failed to load OSSA definition: ${error.message}`);
    }
  }

  /**
   * Validate basic OSSA structure
   * @param {Object} ossaAgent - Parsed OSSA agent definition
   */
  validateOssaStructure(ossaAgent) {
    const required = ['apiVersion', 'kind', 'metadata', 'spec'];
    for (const field of required) {
      if (!ossaAgent[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (ossaAgent.kind !== 'Agent') {
      throw new Error(`Expected kind 'Agent', got '${ossaAgent.kind}'`);
    }

    if (!ossaAgent.spec.agent || !ossaAgent.spec.capabilities) {
      throw new Error('Missing required spec fields: agent and capabilities');
    }
  }

  /**
   * Convert OSSA agent to LangChain chain configuration
   * @param {Object} ossaAgent - OSSA agent definition
   * @returns {Object} LangChain chain configuration
   */
  convertToLangChainConfig(ossaAgent) {
    const { metadata, spec } = ossaAgent;
    
    return {
      name: metadata.name,
      version: metadata.version,
      description: metadata.description || spec.agent.expertise,
      agent: {
        name: spec.agent.name,
        expertise: spec.agent.expertise,
        description: spec.agent.description,
        personality: spec.agent.personality
      },
      capabilities: this.convertCapabilities(spec.capabilities),
      chains: this.generateChainDefinitions(spec.capabilities, spec.agent),
      templates: this.generatePromptTemplates(spec.capabilities, spec.agent),
      security: spec.security || {},
      frameworks: spec.frameworks || {}
    };
  }

  /**
   * Convert OSSA capabilities to LangChain-compatible format
   * @param {Array} capabilities - OSSA capabilities array
   * @returns {Array} LangChain-compatible capabilities
   */
  convertCapabilities(capabilities) {
    return capabilities.map(cap => {
      if (typeof cap === 'string') {
        return {
          name: cap,
          description: this.getDefaultDescription(cap),
          type: this.inferCapabilityType(cap),
          supported: this.supportedCapabilities.has(cap)
        };
      }
      
      return {
        name: cap.name,
        description: cap.description || this.getDefaultDescription(cap.name),
        type: this.inferCapabilityType(cap.name),
        input_schema: cap.input_schema,
        output_schema: cap.output_schema,
        timeout_ms: cap.timeout_ms || 30000,
        streaming: cap.streaming || false,
        supported: this.supportedCapabilities.has(cap.name)
      };
    });
  }

  /**
   * Generate LangChain chain definitions from OSSA capabilities
   * @param {Array} capabilities - OSSA capabilities
   * @param {Object} agent - Agent specification
   * @returns {Array} LangChain chain definitions
   */
  generateChainDefinitions(capabilities, agent) {
    const chains = [];
    
    // Main agent chain
    chains.push({
      name: 'main_agent_chain',
      type: 'sequential',
      description: `Main chain for ${agent.name}`,
      steps: this.generateChainSteps(capabilities, agent)
    });

    // Capability-specific chains
    capabilities.forEach(cap => {
      const capName = typeof cap === 'string' ? cap : cap.name;
      if (this.supportedCapabilities.has(capName)) {
        chains.push({
          name: `${capName}_chain`,
          type: 'llm_chain',
          description: `Chain for ${capName} capability`,
          template_key: `${capName}_template`,
          capability: capName
        });
      }
    });

    return chains;
  }

  /**
   * Generate chain steps for the main sequential chain
   * @param {Array} capabilities - OSSA capabilities
   * @param {Object} agent - Agent specification
   * @returns {Array} Chain steps
   */
  generateChainSteps(capabilities, agent) {
    const steps = [
      {
        name: 'input_validation',
        type: 'validation',
        description: 'Validate input parameters'
      },
      {
        name: 'context_preparation',
        type: 'transformation',
        description: 'Prepare context and parameters'
      }
    ];

    // Add capability-specific steps
    capabilities.forEach(cap => {
      const capName = typeof cap === 'string' ? cap : cap.name;
      if (this.supportedCapabilities.has(capName)) {
        steps.push({
          name: capName,
          type: 'llm_call',
          description: `Execute ${capName} capability`,
          template_key: `${capName}_template`
        });
      }
    });

    steps.push({
      name: 'output_formatting',
      type: 'transformation', 
      description: 'Format final output'
    });

    return steps;
  }

  /**
   * Generate prompt templates for LangChain
   * @param {Array} capabilities - OSSA capabilities
   * @param {Object} agent - Agent specification
   * @returns {Object} Prompt templates
   */
  generatePromptTemplates(capabilities, agent) {
    const templates = {};
    
    // Main agent template
    templates['main_agent'] = {
      template: `You are ${agent.name}, an AI agent with expertise in ${agent.expertise}.

${agent.description ? `Description: ${agent.description}` : ''}
${agent.personality ? `Personality: ${agent.personality}` : ''}

Your task is to help with: {task}

Input: {input}

Please provide a helpful and accurate response based on your expertise.`,
      input_variables: ['task', 'input']
    };

    // Capability-specific templates
    capabilities.forEach(cap => {
      const capName = typeof cap === 'string' ? cap : cap.name;
      if (this.supportedCapabilities.has(capName)) {
        templates[`${capName}_template`] = this.generateCapabilityTemplate(capName, agent);
      }
    });

    return templates;
  }

  /**
   * Generate template for specific capability
   * @param {string} capabilityName - Name of the capability
   * @param {Object} agent - Agent specification
   * @returns {Object} Template configuration
   */
  generateCapabilityTemplate(capabilityName, agent) {
    const templates = {
      analyze_code: {
        template: `As ${agent.name}, analyze the following code for quality, structure, and best practices:

Code to analyze:
{code}

Please provide:
1. Overall code quality assessment
2. Structural analysis
3. Identified issues or concerns
4. Best practices evaluation

Analysis:`,
        input_variables: ['code']
      },
      generate_docs: {
        template: `As ${agent.name}, generate comprehensive documentation for the following code:

Code:
{code}

Context: {context}

Please provide:
1. Overview and purpose
2. Function/method documentation
3. Parameter descriptions
4. Return value details
5. Usage examples

Documentation:`,
        input_variables: ['code', 'context']
      },
      validate_syntax: {
        template: `As ${agent.name}, validate the syntax and formatting of the following code:

Code:
{code}

Language: {language}

Please check for:
1. Syntax errors
2. Formatting issues
3. Style violations
4. Best practice violations

Validation Results:`,
        input_variables: ['code', 'language']
      },
      suggest_improvements: {
        template: `As ${agent.name}, suggest improvements for the following code:

Code:
{code}

Context: {context}

Please provide:
1. Performance improvements
2. Readability enhancements
3. Maintainability suggestions
4. Security considerations
5. Specific code changes

Improvement Suggestions:`,
        input_variables: ['code', 'context']
      }
    };

    return templates[capabilityName] || {
      template: `As ${agent.name}, help with ${capabilityName}:

Input: {input}

Please provide a helpful response:`,
      input_variables: ['input']
    };
  }

  /**
   * Get default description for a capability
   * @param {string} capabilityName - Name of the capability
   * @returns {string} Default description
   */
  getDefaultDescription(capabilityName) {
    const descriptions = {
      analyze_code: 'Analyzes code quality, structure, and best practices',
      generate_docs: 'Generates comprehensive documentation from code',
      validate_syntax: 'Validates syntax and formatting of code',
      suggest_improvements: 'Suggests improvements for code quality and performance',
      text_processing: 'Processes and analyzes text content',
      data_analysis: 'Analyzes and interprets data',
      code_review: 'Performs comprehensive code reviews',
      planning: 'Creates plans and strategies for tasks'
    };
    
    return descriptions[capabilityName] || `Performs ${capabilityName} operations`;
  }

  /**
   * Infer capability type from name
   * @param {string} capabilityName - Name of the capability
   * @returns {string} Inferred type
   */
  inferCapabilityType(capabilityName) {
    const types = {
      analyze_code: 'analysis',
      generate_docs: 'generation',
      validate_syntax: 'validation',
      suggest_improvements: 'analysis',
      text_processing: 'transformation',
      data_analysis: 'analysis',
      code_review: 'analysis',
      planning: 'planning'
    };
    
    return types[capabilityName] || 'general';
  }

  /**
   * Create LangChain chain from OSSA definition
   * @param {string} ossaFilePath - Path to OSSA YAML file
   * @param {Object} llm - LangChain LLM instance
   * @returns {Promise&lt;Object&gt;} Created LangChain chain
   */
  async createChainFromOssa(ossaFilePath, llm) {
    const ossaAgent = await this.loadOssaDefinition(ossaFilePath);
    const config = this.convertToLangChainConfig(ossaAgent);
    
    // Create main prompt template
    const mainTemplate = new PromptTemplate({
      template: config.templates.main_agent.template,
      inputVariables: config.templates.main_agent.input_variables
    });

    // Create main LLM chain
    const mainChain = new LLMChain({
      llm: llm,
      prompt: mainTemplate,
      verbose: true
    });

    return {
      chain: mainChain,
      config: config,
      capabilities: config.capabilities,
      metadata: {
        name: config.name,
        version: config.version,
        description: config.description
      }
    };
  }

  /**
   * Create a runnable sequence from OSSA definition
   * @param {string} ossaFilePath - Path to OSSA YAML file
   * @param {Object} llm - LangChain LLM instance
   * @returns {Promise&lt;RunnableSequence&gt;} Created runnable sequence
   */
  async createRunnableFromOssa(ossaFilePath, llm) {
    const ossaAgent = await this.loadOssaDefinition(ossaFilePath);
    const config = this.convertToLangChainConfig(ossaAgent);
    
    // Create prompt template
    const template = new PromptTemplate({
      template: config.templates.main_agent.template,
      inputVariables: config.templates.main_agent.input_variables
    });

    // Create runnable sequence
    const sequence = RunnableSequence.from([
      {
        task: (input) => input.task || 'general assistance',
        input: new RunnablePassthrough()
      },
      template,
      llm
    ]);

    return {
      runnable: sequence,
      config: config,
      capabilities: config.capabilities
    };
  }
}

export default OssaChainConverter;