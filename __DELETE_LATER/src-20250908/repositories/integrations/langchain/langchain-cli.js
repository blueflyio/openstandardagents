#!/usr/bin/env node

/**
 * OSSA LangChain CLI Integration
 * 
 * Command-line interface for working with OSSA LangChain integration
 */

import { LangChainAgentFactory } from './langchain-agent-factory.js';
import { OssaChainComposer } from './chain-composer.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LangChainCLI {
  constructor() {
    this.factory = new LangChainAgentFactory();
    this.composer = new OssaChainComposer();
  }

  /**
   * Display help information
   */
  showHelp() {
    console.log(`
🔗 OSSA LangChain Integration CLI

Usage: node langchain-cli.js &lt;command&gt; [options]

Commands:
  validate &lt;ossa-file&gt;        Validate OSSA file for LangChain compatibility
  convert &lt;ossa-file&gt;         Convert OSSA to LangChain configuration
  test &lt;ossa-file&gt;            Test LangChain agent creation (requires API key)
  capabilities &lt;ossa-file&gt;    List supported capabilities
  compose &lt;ossa-file&gt; &lt;pattern&gt; Create composed chain
  examples                   Show available examples
  
Options:
  --provider &lt;provider&gt;      LLM provider (openai, anthropic) [default: openai]
  --model &lt;model&gt;            Model name [default: gpt-3.5-turbo]
  --temperature &lt;temp&gt;       Temperature setting [default: 0.1]
  --output &lt;file&gt;            Output file for conversion results
  --capability &lt;name&gt;        Specific capability to test
  --verbose                  Enable verbose logging
  --dry-run                  Show what would be done without execution

Patterns:
  sequential                Sequential capability chaining
  parallel                  Parallel capability execution
  conditional               Conditional capability routing
  map_reduce                Map-reduce processing pattern
  pipeline                  Data transformation pipeline

Examples:
  node langchain-cli.js validate ./agent.yml
  node langchain-cli.js convert ./agent.yml --output config.json
  node langchain-cli.js test ./agent.yml --provider openai
  node langchain-cli.js compose ./agent.yml sequential
  node langchain-cli.js capabilities ./agent.yml
    `);
  }

  /**
   * Validate OSSA file for LangChain compatibility
   */
  async validateOssa(ossaFile, options = {}) {
    try {
      console.log(`🔍 Validating OSSA file: ${ossaFile}`);
      
      // Load and validate OSSA definition
      const ossaAgent = await this.factory.converter.loadOssaDefinition(ossaFile);
      const config = this.factory.converter.convertToLangChainConfig(ossaAgent);
      
      console.log('✅ OSSA file is valid for LangChain integration');
      console.log(`📝 Agent: ${config.name} v${config.version}`);
      console.log(`📖 Description: ${config.description}`);
      
      // Check capabilities
      const supportedCaps = config.capabilities.filter(cap => cap.supported);
      const unsupportedCaps = config.capabilities.filter(cap => !cap.supported);
      
      console.log(`\n🎯 Capabilities (${config.capabilities.length} total):`);
      if (supportedCaps.length > 0) {
        console.log(`✅ Supported (${supportedCaps.length}):`);
        supportedCaps.forEach(cap => {
          console.log(`  • ${cap.name}: ${cap.description}`);
        });
      }
      
      if (unsupportedCaps.length > 0) {
        console.log(`⚠️  Unsupported (${unsupportedCaps.length}):`);
        unsupportedCaps.forEach(cap => {
          console.log(`  • ${cap.name}: ${cap.description}`);
        });
      }

      // Check framework configuration
      if (config.frameworks?.langchain?.enabled) {
        console.log('✅ LangChain framework is enabled');
      } else {
        console.log('⚠️  LangChain framework is not explicitly enabled in OSSA definition');
      }

      return { valid: true, config, supportedCapabilities: supportedCaps.length };
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Convert OSSA to LangChain configuration
   */
  async convertOssa(ossaFile, options = {}) {
    try {
      console.log(`🔄 Converting OSSA file: ${ossaFile}`);
      
      const ossaAgent = await this.factory.converter.loadOssaDefinition(ossaFile);
      const config = this.factory.converter.convertToLangChainConfig(ossaAgent);
      
      // Create conversion result
      const conversionResult = {
        conversion_timestamp: new Date().toISOString(),
        source_file: ossaFile,
        ossa_version: ossaAgent.apiVersion,
        agent_metadata: {
          name: config.name,
          version: config.version,
          description: config.description
        },
        langchain_config: config,
        supported_patterns: Array.from(this.composer.compositionPatterns),
        usage_examples: {
          basic_agent: `
const factory = new LangChainAgentFactory();
const agent = await factory.createBasicAgent('${path.basename(ossaFile)}', llmConfig);
const result = await agent.invoke({ task: 'help', input: 'your input here' });`,
          
          capability_agent: config.capabilities.filter(c => c.supported).slice(0, 1).map(cap => `
const agent = await factory.createCapabilityAgent('${path.basename(ossaFile)}', '${cap.name}', llmConfig);
const result = await agent.invoke(inputData);`)[0],
          
          composition: `
const composer = new OssaChainComposer();
const chain = await composer.createSequentialChain('${path.basename(ossaFile)}', llm);
const result = await chain.invoke(inputData);`
        }
      };
      
      console.log('✅ Conversion completed');
      console.log(`📊 Supported capabilities: ${config.capabilities.filter(c => c.supported).length}`);
      console.log(`🎭 Available patterns: ${conversionResult.supported_patterns.join(', ')}`);
      
      // Output to file if requested
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(conversionResult, null, 2));
        console.log(`💾 Configuration saved to: ${options.output}`);
      }
      
      if (options.verbose) {
        console.log('\n📋 Full Configuration:');
        console.log(JSON.stringify(config, null, 2));
      }
      
      return conversionResult;
      
    } catch (error) {
      console.error('❌ Conversion failed:', error.message);
      throw error;
    }
  }

  /**
   * Test LangChain agent creation and execution
   */
  async testAgent(ossaFile, options = {}) {
    const { provider = 'openai', model, temperature = 0.1, capability, verbose, dryRun } = options;
    
    try {
      console.log(`🧪 Testing LangChain agent: ${ossaFile}`);
      console.log(`🤖 Provider: ${provider}`);
      
      // Check API key
      const envVar = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
      if (!process.env[envVar] && !dryRun) {
        console.log(`⚠️  ${envVar} not found. Use --dry-run to test without LLM calls.`);
        return;
      }
      
      const llmConfig = {
        provider,
        model: model || (provider === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-haiku-20240307'),
        temperature
      };
      
      if (dryRun) {
        console.log('🏃 Dry run mode - testing agent creation without LLM calls');
      }
      
      // Validate first
      const validation = await this.validateOssa(ossaFile, { verbose });
      if (!validation.valid) {
        console.error('❌ OSSA validation failed, cannot create agent');
        return;
      }
      
      console.log('\n🔨 Creating LangChain agent...');
      
      if (capability) {
        // Test specific capability
        console.log(`🎯 Testing capability: ${capability}`);
        
        if (!dryRun) {
          const agent = await this.factory.createCapabilityAgent(ossaFile, capability, llmConfig);
          console.log('✅ Capability agent created successfully');
          
          // Test with sample input
          const testInput = this.getCapabilityTestInput(capability);
          console.log(`📝 Test input: ${JSON.stringify(testInput)}`);
          
          const result = await agent.invoke(testInput);
          console.log('📤 Test result:');
          console.log(result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''));
        } else {
          console.log('✅ Capability agent structure validated (dry run)');
        }
        
      } else {
        // Test basic agent
        console.log('🤖 Testing basic agent');
        
        if (!dryRun) {
          const agent = await this.factory.createBasicAgent(ossaFile, llmConfig);
          console.log('✅ Basic agent created successfully');
          console.log(`📋 Available capabilities: ${agent.capabilities.map(c => c.name).join(', ')}`);
          
          // Test with sample input
          const testInput = { task: 'help', input: 'What can you help me with?' };
          const result = await agent.invoke(testInput);
          console.log('📤 Test result:');
          console.log(result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''));
        } else {
          console.log('✅ Basic agent structure validated (dry run)');
        }
      }
      
      console.log('\n✨ Agent testing completed successfully!');
      
    } catch (error) {
      console.error('❌ Agent testing failed:', error.message);
      
      if (error.message.includes('API key')) {
        console.log(`💡 Tip: Set ${provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'} or use --dry-run`);
      } else if (error.message.includes('Capability')) {
        console.log('💡 Tip: Use "capabilities" command to see supported capabilities');
      }
    }
  }

  /**
   * List supported capabilities
   */
  async listCapabilities(ossaFile, options = {}) {
    try {
      console.log(`📋 Analyzing capabilities: ${ossaFile}`);
      
      const validation = await this.validateOssa(ossaFile, options);
      if (!validation.valid) {
        return;
      }
      
      const config = validation.config;
      console.log(`\n🎯 Capability Analysis for ${config.name}:`);
      console.log(`Total capabilities: ${config.capabilities.length}`);
      
      config.capabilities.forEach((cap, index) => {
        const status = cap.supported ? '✅' : '❌';
        const type = cap.type || 'general';
        
        console.log(`\n${index + 1}. ${cap.name} ${status}`);
        console.log(`   Description: ${cap.description}`);
        console.log(`   Type: ${type}`);
        console.log(`   Supported: ${cap.supported ? 'Yes' : 'No'}`);
        
        if (cap.input_schema) {
          console.log(`   Input Schema: Available`);
        }
        if (cap.output_schema) {
          console.log(`   Output Schema: Available`);
        }
      });
      
      const supportedCount = config.capabilities.filter(c => c.supported).length;
      console.log(`\n📊 Summary: ${supportedCount}/${config.capabilities.length} capabilities supported`);
      
    } catch (error) {
      console.error('❌ Failed to analyze capabilities:', error.message);
    }
  }

  /**
   * Create composed chain
   */
  async composeChain(ossaFile, pattern, options = {}) {
    const { provider = 'openai', model, temperature = 0.1, verbose, dryRun } = options;
    
    try {
      console.log(`🎼 Creating composed chain: ${pattern}`);
      console.log(`📂 OSSA file: ${ossaFile}`);
      
      if (!this.composer.compositionPatterns.has(pattern)) {
        console.error(`❌ Unsupported pattern: ${pattern}`);
        console.log(`Supported patterns: ${Array.from(this.composer.compositionPatterns).join(', ')}`);
        return;
      }
      
      // Validate OSSA file
      const validation = await this.validateOssa(ossaFile);
      if (!validation.valid) {
        return;
      }
      
      if (validation.supportedCapabilities === 0) {
        console.error('❌ No supported capabilities found for composition');
        return;
      }
      
      console.log(`✅ Validation passed (${validation.supportedCapabilities} supported capabilities)`);
      
      if (dryRun) {
        console.log('🏃 Dry run mode - showing composition structure');
        console.log(`📋 Pattern: ${pattern}`);
        console.log(`🔧 Would create ${pattern} chain with available capabilities`);
        return;
      }
      
      // Check API key
      const envVar = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
      if (!process.env[envVar]) {
        console.log(`⚠️  ${envVar} not found. Use --dry-run to test structure only.`);
        return;
      }
      
      const llmConfig = {
        provider,
        model: model || (provider === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-haiku-20240307'),
        temperature
      };
      
      const llm = this.factory.createLLM(llmConfig);
      
      console.log('🔨 Creating composed chain...');
      
      let composedChain;
      switch (pattern) {
        case 'sequential':
          composedChain = await this.composer.createSequentialChain(ossaFile, llm);
          break;
        case 'parallel':
          composedChain = await this.composer.createParallelChain(ossaFile, llm);
          break;
        case 'conditional':
          composedChain = await this.composer.createConditionalChain(ossaFile, llm);
          break;
        case 'pipeline':
          composedChain = await this.composer.createPipelineChain(ossaFile, llm);
          break;
        default:
          console.error(`❌ Pattern ${pattern} not implemented in CLI yet`);
          return;
      }
      
      console.log('✅ Composed chain created successfully!');
      console.log(`📋 Pattern: ${composedChain.pattern}`);
      console.log(`🎯 Capabilities: ${composedChain.capabilities?.join(', ') || 'N/A'}`);
      
      if (verbose) {
        console.log('\n🔍 Chain Details:');
        console.log(`Type: ${composedChain.pattern}`);
        if (composedChain.routingRules) {
          console.log('Routing Rules:', JSON.stringify(composedChain.routingRules, null, 2));
        }
      }
      
      console.log('\n💡 Chain is ready for invocation with your inputs!');
      
    } catch (error) {
      console.error('❌ Chain composition failed:', error.message);
    }
  }

  /**
   * Show available examples
   */
  async showExamples() {
    console.log(`
🎯 OSSA LangChain Integration Examples

Available example files in examples/langchain/:

📝 Basic Examples:
  • ossa-langchain-basic-example.js
    - Basic agent creation from OSSA definitions
    - Multi-capability routing
    - Provider configuration examples

🏃 Runnable Examples:
  • ossa-langchain-runnable-example.js  
    - Streaming support demonstration
    - Runnable interface usage
    - Multi-provider testing

🎼 Composition Examples:
  • ossa-langchain-composition-example.js
    - Sequential chain composition
    - Parallel execution patterns
    - Conditional routing
    - Map-reduce processing
    - Pipeline transformations

🚀 How to run:
  export OPENAI_API_KEY="your-key"
  node examples/langchain/ossa-langchain-basic-example.js

📖 Documentation:
  docs/integrations/langchain-integration.md

🛠️  CLI Usage:
  # Validate OSSA file
  node lib/integrations/langchain/langchain-cli.js validate examples/01-agent-basic/agent.yml
  
  # Convert to LangChain config
  node lib/integrations/langchain/langchain-cli.js convert examples/01-agent-basic/agent.yml
  
  # Test agent creation
  node lib/integrations/langchain/langchain-cli.js test examples/01-agent-basic/agent.yml
    `);
  }

  /**
   * Get test input for capability
   */
  getCapabilityTestInput(capability) {
    const testInputs = {
      analyze_code: { code: 'function add(a, b) { return a + b; }' },
      generate_docs: { code: 'function multiply(x, y) { return x * y; }', context: 'Math utility' },
      validate_syntax: { code: 'function broken() { return "missing semicolon" }', language: 'javascript' },
      suggest_improvements: { code: 'var x = 1; var y = 2; var result = x + y;', context: 'Simple addition' }
    };
    
    return testInputs[capability] || { input: `Test input for ${capability}` };
  }

  /**
   * Main CLI entry point
   */
  async run(args) {
    const command = args[0];
    const options = this.parseOptions(args);
    
    switch (command) {
      case 'validate':
        if (!args[1]) {
          console.error('❌ OSSA file path required');
          this.showHelp();
          return;
        }
        await this.validateOssa(args[1], options);
        break;
        
      case 'convert':
        if (!args[1]) {
          console.error('❌ OSSA file path required');
          this.showHelp();
          return;
        }
        await this.convertOssa(args[1], options);
        break;
        
      case 'test':
        if (!args[1]) {
          console.error('❌ OSSA file path required');
          this.showHelp();
          return;
        }
        await this.testAgent(args[1], options);
        break;
        
      case 'capabilities':
        if (!args[1]) {
          console.error('❌ OSSA file path required');
          this.showHelp();
          return;
        }
        await this.listCapabilities(args[1], options);
        break;
        
      case 'compose':
        if (!args[1] || !args[2]) {
          console.error('❌ OSSA file path and pattern required');
          this.showHelp();
          return;
        }
        await this.composeChain(args[1], args[2], options);
        break;
        
      case 'examples':
        await this.showExamples();
        break;
        
      case 'help':
      case '--help':
      case '-h':
        this.showHelp();
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        this.showHelp();
    }
  }

  /**
   * Parse command line options
   */
  parseOptions(args) {
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--provider':
          options.provider = args[++i];
          break;
        case '--model':
          options.model = args[++i];
          break;
        case '--temperature':
          options.temperature = parseFloat(args[++i]);
          break;
        case '--output':
          options.output = args[++i];
          break;
        case '--capability':
          options.capability = args[++i];
          break;
        case '--verbose':
          options.verbose = true;
          break;
        case '--dry-run':
          options.dryRun = true;
          break;
      }
    }
    
    return options;
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new LangChainCLI();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    cli.showHelp();
  } else {
    cli.run(args).catch(console.error);
  }
}

export default LangChainCLI;