#!/usr/bin/env node
/**
 * Simple Anthropic Adapter Example
 * Demonstrates the absolute minimum needed to use the adapter
 */

import { AnthropicAdapter } from '../src/services/runtime/anthropic.adapter.js';

async function main() {
  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set');
    console.log('\nSet it with:');
    console.log('  export ANTHROPIC_API_KEY=your-key-here');
    process.exit(1);
  }

  // Create manifest
  const manifest = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'simple-assistant',
      version: '1.0.0',
    },
    spec: {
      role: 'You are a helpful AI assistant.',
    },
  };

  // Create adapter
  console.log('Creating Anthropic adapter...');
  const adapter = new AnthropicAdapter(manifest);

  // Show agent info
  const info = adapter.getAgentInfo();
  console.log('\nAgent Info:');
  console.log(`  Name: ${info.name}`);
  console.log(`  Model: ${info.model}`);
  console.log(`  Provider: ${info.provider}`);
  console.log(`  Tools: ${info.tools.length}`);

  // Initialize
  adapter.initialize();

  // Simple chat
  console.log('\n--- Chat Example ---');
  console.log('User: Hello, who are you?');

  const response1 = await adapter.chat('Hello, who are you?');
  console.log(`Assistant: ${response1}`);

  // Follow-up (conversation history maintained)
  console.log('\nUser: What can you help me with?');

  const response2 = await adapter.chat('What can you help me with?');
  console.log(`Assistant: ${response2}`);

  // Show conversation history
  console.log('\n--- Conversation History ---');
  const history = adapter.getConversationHistory();
  console.log(`Total messages: ${history.length}`);

  console.log('\n✅ Done!');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
