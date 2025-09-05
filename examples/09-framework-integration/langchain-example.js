#!/usr/bin/env node

/**
 * OSSA LangChain Basic Example
 * 
 * Demonstrates how to create and use a LangChain agent from an OSSA definition
 * using the basic agent factory.
 */

import { LangChainAgentFactory } from '../../lib/integrations/langchain/langchain-agent-factory.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBasicExample() {
  console.log('🚀 OSSA LangChain Basic Example\n');
  
  try {
    // Initialize the agent factory
    const factory = new LangChainAgentFactory();
    
    // Path to OSSA agent definition
    const ossaAgentPath = path.join(__dirname, '../01-agent-basic/agent.yml');
    
    // LLM configuration - using OpenAI with environment variable
    const llmConfig = {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.1
    };
    
    console.log('📝 Creating LangChain agent from OSSA definition...');
    console.log(`📂 OSSA file: ${ossaAgentPath}`);
    
    // Create basic agent
    const basicAgent = await factory.createBasicAgent(ossaAgentPath, llmConfig);
    
    console.log('✅ Agent created successfully!');
    console.log(`🤖 Agent: ${basicAgent.config.name}`);
    console.log(`📖 Description: ${basicAgent.config.description}`);
    console.log(`🎯 Capabilities: ${basicAgent.capabilities.map(c => c.name).join(', ')}\n`);
    
    // Test the agent with different types of requests
    const testInputs = [
      {
        task: 'code analysis',
        input: 'Please analyze this Python function:\n\ndef calculate_average(numbers):\n    return sum(numbers) / len(numbers)'
      },
      {
        task: 'documentation',
        input: 'Help me understand what this agent can do'
      },
      {
        task: 'general assistance',
        input: 'What are the best practices for writing clean code?'
      }
    ];
    
    console.log('🧪 Testing agent with various inputs...\n');
    
    for (let i = 0; i < testInputs.length; i++) {
      const testInput = testInputs[i];
      console.log(`--- Test ${i + 1}: ${testInput.task} ---`);
      console.log(`Input: ${testInput.input.substring(0, 80)}${testInput.input.length > 80 ? '...' : ''}`);
      
      try {
        const result = await basicAgent.invoke(testInput);
        console.log(`Output: ${result.output.substring(0, 200)}${result.output.length > 200 ? '...' : ''}`);
        console.log(`Capability used: ${result.metadata.capability_used}`);
        console.log(`Timestamp: ${result.metadata.timestamp}\n`);
      } catch (error) {
        console.error(`❌ Error in test ${i + 1}:`, error.message);
        console.log('This might be due to missing API keys. Set OPENAI_API_KEY environment variable.\n');
      }
    }
    
    console.log('✨ Basic example completed!\n');
    
  } catch (error) {
    console.error('❌ Error running basic example:', error.message);
    
    if (error.message.includes('ENOENT')) {
      console.log('\n💡 Make sure the OSSA agent file exists at the expected path.');
    } else if (error.message.includes('API key')) {
      console.log('\n💡 Set your OpenAI API key: export OPENAI_API_KEY="your-api-key"');
    }
  }
}

async function runCapabilityExample() {
  console.log('🔧 OSSA LangChain Capability-Specific Example\n');
  
  try {
    const factory = new LangChainAgentFactory();
    const ossaAgentPath = path.join(__dirname, '../01-agent-basic/agent.yml');
    
    const llmConfig = {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.1
    };
    
    // Create capability-specific agent for code analysis
    console.log('🔍 Creating code analysis agent...');
    const codeAnalysisAgent = await factory.createCapabilityAgent(
      ossaAgentPath, 
      'analyze_code', 
      llmConfig
    );
    
    console.log('✅ Code analysis agent created!');
    console.log(`🎯 Capability: ${codeAnalysisAgent.capability.name}`);
    console.log(`📝 Description: ${codeAnalysisAgent.capability.description}\n`);
    
    // Test with code analysis
    const codeInput = {
      code: `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(result);`
    };
    
    console.log('🧪 Testing code analysis capability...');
    console.log('Code to analyze:', codeInput.code.substring(0, 100) + '...');
    
    try {
      const result = await codeAnalysisAgent.invoke(codeInput);
      console.log('\n📊 Analysis Result:');
      console.log(result.output);
      console.log(`\n🔖 Metadata:`, result.metadata);
    } catch (error) {
      console.error('❌ Error in capability test:', error.message);
      console.log('This might be due to missing API keys.');
    }
    
  } catch (error) {
    console.error('❌ Error in capability example:', error.message);
  }
}

async function runMultiCapabilityExample() {
  console.log('🎭 OSSA LangChain Multi-Capability Example\n');
  
  try {
    const factory = new LangChainAgentFactory();
    const ossaAgentPath = path.join(__dirname, '../01-agent-basic/agent.yml');
    
    const llmConfig = {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.1
    };
    
    console.log('⚡ Creating multi-capability agent...');
    const multiAgent = await factory.createMultiCapabilityAgent(ossaAgentPath, llmConfig);
    
    console.log('✅ Multi-capability agent created!');
    console.log('🎯 Available capabilities:');
    multiAgent.listCapabilities().forEach(cap => {
      console.log(`  • ${cap.name}: ${cap.description}`);
    });
    console.log();
    
    // Test automatic routing
    const testPrompts = [
      'Analyze this code for potential issues: function add(a, b) { return a + b; }',
      'Generate documentation for a sorting algorithm',
      'Validate the syntax of this Python code: def greet(): print("hello"',
      'Suggest improvements for performance optimization'
    ];
    
    console.log('🤖 Testing automatic capability routing...\n');
    
    for (let i = 0; i < testPrompts.length; i++) {
      console.log(`--- Test ${i + 1} ---`);
      console.log(`Prompt: ${testPrompts[i]}`);
      
      try {
        const result = await multiAgent.invoke({ input: testPrompts[i] });
        console.log(`Routed to capability: ${result.metadata.capability_used}`);
        console.log(`Response: ${result.output.substring(0, 150)}...\n`);
      } catch (error) {
        console.error(`❌ Error in routing test ${i + 1}:`, error.message);
      }
    }
    
    // Test direct capability invocation
    console.log('🎯 Testing direct capability invocation...');
    try {
      const directResult = await multiAgent.invokeCapability('suggest_improvements', {
        code: 'var x = 1; var y = 2; var sum = x + y; console.log(sum);',
        context: 'JavaScript code for adding two numbers'
      });
      
      console.log('Direct invocation result:');
      console.log(directResult.output.substring(0, 200) + '...');
      
    } catch (error) {
      console.error('❌ Error in direct invocation:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error in multi-capability example:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🎉 OSSA LangChain Integration Examples\n');
  console.log('This demonstrates converting OSSA agent definitions to LangChain chains.\n');
  
  // Check for API key
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  No API keys found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY to run examples with actual LLM calls.');
    console.log('Examples will show the structure but may fail on LLM invocation.\n');
  }
  
  // Run examples
  await runBasicExample();
  await runCapabilityExample();
  await runMultiCapabilityExample();
  
  console.log('🏁 All examples completed!');
  console.log('\nFor more advanced usage, see:');
  console.log('- ossa-langchain-runnable-example.js (Runnable interface)');
  console.log('- ossa-langchain-composition-example.js (Chain composition)');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runBasicExample, runCapabilityExample, runMultiCapabilityExample };