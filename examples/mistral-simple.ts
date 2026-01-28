/**
 * Mistral Adapter - Simple Example
 * Minimal example demonstrating basic usage
 */

import { MistralAdapter } from '../src/services/runtime/mistral.adapter.js';
import type { OssaManifestWithMistral } from '../src/services/runtime/mistral.adapter.js';

async function main() {
  console.log('🚀 Mistral AI Adapter - Simple Example\n');

  // Create a simple agent manifest
  const manifest: OssaManifestWithMistral = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'simple-mistral-agent',
      version: '1.0.0',
      description: 'A simple agent using Mistral Large',
    },
    spec: {
      role: 'You are a helpful assistant that provides concise answers.',
      llm: {
        provider: 'mistral',
        model: 'mistral-large-latest',
        temperature: 0.7,
      },
    },
  };

  try {
    // Initialize adapter
    const adapter = new MistralAdapter({ manifest });
    adapter.initialize();

    console.log('Agent Info:', adapter.getAgentInfo());
    console.log('\n📝 Sending message...\n');

    // Send a message
    const response = await adapter.chat('Explain quantum entanglement in one sentence.', {
      verbose: true,
    });

    console.log('\n✅ Response:', response);
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.message.includes('API key')) {
      console.log('\n💡 Tip: Set your Mistral API key:');
      console.log('   export MISTRAL_API_KEY=your-key-here');
    }
  }
}

// Run the example
main();
