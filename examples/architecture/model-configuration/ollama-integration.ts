#!/usr/bin/env ts-node
/**
 * Example of OSSA LLM Agent using Ollama for free local inference
 * Run: npx ts-node examples/ollama-integration.ts
 */

import { OSSALlmAgent } from '../dist/adk/agents/llm-agent.js';
import { ADKAgentConfig } from '../dist/adk/agents/index.js';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

async function demonstrateOllamaIntegration() {
  console.log('🤖 OSSA + Ollama Integration Demo');
  console.log('===================================');

  // Create agent configuration
  const agentConfig: ADKAgentConfig = {
    name: 'OllamaTestAgent',
    instruction:
      'You are a helpful AI assistant. Provide clear, concise answers.',
    tools: [],
  };

  // Create LLM agent
  const agent = new OSSALlmAgent(agentConfig);

  console.log(
    `Using Ollama model: ${process.env.OLLAMA_MODEL || 'gpt-oss:20b'}`
  );
  console.log(
    `Ollama URL: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`
  );

  // Test cases
  const testCases = [
    {
      name: 'Basic Greeting',
      input: 'Hello! Can you introduce yourself?',
    },
    {
      name: 'Code Question',
      input: 'Explain what TypeScript interfaces are in one sentence.',
    },
    {
      name: 'OSSA Question',
      input: 'What is OSSA and why is it useful for AI agents?',
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`Input: ${testCase.input}`);
    console.log('---');

    try {
      const startTime = Date.now();
      const result = await agent.invoke({ question: testCase.input });
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`✅ Response (${duration}ms):`);
        console.log(result.output);
        if (result.thinking) {
          console.log(`🧠 Model thinking: ${result.thinking}`);
        }
        console.log(`🏷️  Model: ${result.model}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`💥 Exception: ${error}`);
    }
  }

  console.log(
    '\n🎉 Demo completed! You are now using free local AI with OSSA + Ollama'
  );
}

// Check if Ollama is running
async function checkOllamaConnection(): Promise<boolean> {
  try {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const response = await fetch(`${baseUrl}/api/tags`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  // Check Ollama connection first
  const isOllamaRunning = await checkOllamaConnection();

  if (!isOllamaRunning) {
    console.log('❌ Ollama is not running or not accessible');
    console.log('Please start Ollama with: ollama serve');
    console.log('Then run this demo again.');
    process.exit(1);
  }

  await demonstrateOllamaIntegration();
}

if (require.main === module) {
  main().catch(console.error);
}
