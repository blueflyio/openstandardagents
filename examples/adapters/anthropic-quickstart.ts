/**
 * Anthropic Quick Start - Use OSSA with Anthropic SDK
 *
 * This example shows how to load an OSSA manifest and execute it
 * directly with the Anthropic Claude API using the runtime adapter.
 */

import { AnthropicAdapter } from '@bluefly/openstandardagents';
import { parse } from 'yaml';
import { readFileSync } from 'fs';

async function main() {
  // Load OSSA manifest from file
  const manifestPath = './examples/getting-started/02-agent-with-tools.ossa.yaml';
  const manifestYaml = readFileSync(manifestPath, 'utf-8');
  const ossaManifest = parse(manifestYaml);

  // Create Anthropic adapter with configuration
  const adapter = new AnthropicAdapter(ossaManifest, {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 4096,
  });

  // Get agent information
  const agentInfo = adapter.getAgentInfo();
  console.log('Agent Info:');
  console.log(JSON.stringify(agentInfo, null, 2));

  // Chat with the agent using simple text interface
  const userMessage = 'Hello! Can you help me understand what you can do?';
  console.log(`\nUser: ${userMessage}`);

  const response = await adapter.chat(userMessage, {
    verbose: true,
    maxTurns: 5,
  });

  console.log(`\nAssistant: ${response}`);

  // Get usage statistics
  const history = adapter.getConversationHistory();
  console.log(`\nConversation turns: ${history.length}`);
}

main().catch(console.error);

/**
 * Usage:
 *
 * 1. Install dependencies:
 *    npm install @bluefly/openstandardagents yaml
 *
 * 2. Set your API key:
 *    export ANTHROPIC_API_KEY='your-api-key-here'
 *
 * 3. Run this example:
 *    npx tsx examples/adapters/anthropic-quickstart.ts
 *
 * Features:
 * - Automatic tool mapping from OSSA manifest
 * - Multi-turn conversation support
 * - Token usage tracking
 * - Simple chat interface
 */
