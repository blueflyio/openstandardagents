/**
 * Mistral AI Adapter Usage Example
 * Demonstrates how to use the MistralAdapter with OSSA manifests
 *
 * Supported Models:
 * - mistral-large-latest (Mistral Large 2)
 * - mistral-medium-latest (Mistral Medium)
 * - mistral-small-latest (Mistral Small)
 * - mixtral-8x7b-instruct (Mixtral 8x7B)
 * - mixtral-8x22b-instruct (Mixtral 8x22B)
 */

import { MistralAdapter } from '../src/services/runtime/mistral.adapter.js';
import type { OssaManifestWithMistral } from '../src/services/runtime/mistral.adapter.js';

// Example 1: Basic Chat Agent (No Tools)
async function basicChatExample() {
  console.log('\n=== Basic Chat Example ===\n');

  const manifest: OssaManifestWithMistral = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'basic-chat-agent',
      version: '1.0.0',
      description: 'A simple conversational agent using Mistral Large',
    },
    spec: {
      role: 'You are a helpful AI assistant that provides clear and concise answers.',
      llm: {
        provider: 'mistral',
        model: 'mistral-large-latest',
        temperature: 0.7,
        maxTokens: 1024,
      },
    },
  };

  const adapter = new MistralAdapter({ manifest });
  adapter.initialize();

  const response = await adapter.chat('Explain quantum computing in simple terms.', {
    verbose: true,
  });

  console.log('\nResponse:', response);
  console.log('\nAgent Info:', adapter.getAgentInfo());
}

// Example 2: Agent with Tools
async function toolCallingExample() {
  console.log('\n=== Tool Calling Example ===\n');

  const manifest: OssaManifestWithMistral = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'weather-agent',
      version: '1.0.0',
      description: 'Weather information agent using Mistral',
    },
    spec: {
      role: 'You are a helpful weather assistant. Use the get_weather tool to provide current weather information.',
      llm: {
        provider: 'mistral',
        model: 'mistral-large-latest',
        temperature: 0.5,
        maxTokens: 2048,
      },
    },
    extensions: {
      mistral: {
        tools: [
          {
            type: 'function',
            function: {
              name: 'get_weather',
              description: 'Get the current weather for a given location',
              parameters: {
                type: 'object',
                properties: {
                  location: {
                    type: 'string',
                    description: 'The city and state, e.g. San Francisco, CA',
                  },
                  unit: {
                    type: 'string',
                    enum: ['celsius', 'fahrenheit'],
                    description: 'The temperature unit',
                  },
                },
                required: ['location'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'get_forecast',
              description: 'Get the weather forecast for the next few days',
              parameters: {
                type: 'object',
                properties: {
                  location: {
                    type: 'string',
                    description: 'The city and state, e.g. San Francisco, CA',
                  },
                  days: {
                    type: 'number',
                    description: 'Number of days to forecast (1-7)',
                  },
                },
                required: ['location', 'days'],
              },
            },
          },
        ],
      },
    },
  };

  const adapter = new MistralAdapter({ manifest });
  adapter.initialize();

  // Register tool handlers
  adapter.registerToolHandler('get_weather', async (args) => {
    const location = args.location as string;
    const unit = (args.unit as string) || 'fahrenheit';

    // Simulate weather API call
    return JSON.stringify({
      location,
      temperature: unit === 'celsius' ? 22 : 72,
      unit,
      conditions: 'Partly cloudy',
      humidity: 65,
      wind_speed: 8,
    });
  });

  adapter.registerToolHandler('get_forecast', async (args) => {
    const location = args.location as string;
    const days = (args.days as number) || 3;

    // Simulate forecast API call
    return JSON.stringify({
      location,
      forecast: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        high: 75 + i,
        low: 55 + i,
        conditions: i % 2 === 0 ? 'Sunny' : 'Partly cloudy',
      })),
    });
  });

  const response = await adapter.chat(
    "What's the weather in Paris and give me a 5-day forecast?",
    {
      verbose: true,
    }
  );

  console.log('\nResponse:', response);
}

// Example 3: Streaming Chat
async function streamingExample() {
  console.log('\n=== Streaming Example ===\n');

  const manifest: OssaManifestWithMistral = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'streaming-agent',
      version: '1.0.0',
      description: 'Streaming response agent',
    },
    spec: {
      role: 'You are a creative writing assistant.',
      llm: {
        provider: 'mistral',
        model: 'mistral-large-latest',
        temperature: 0.9,
      },
    },
  };

  const adapter = new MistralAdapter({ manifest });
  adapter.initialize();

  console.log('Response (streaming):');
  for await (const chunk of adapter.chatStream('Write a haiku about AI.', {
    verbose: false,
  })) {
    process.stdout.write(chunk);
  }
  console.log('\n');
}

// Example 4: Using Mixtral with Advanced Configuration
async function mixtralExample() {
  console.log('\n=== Mixtral Example ===\n');

  const manifest: OssaManifestWithMistral = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'mixtral-agent',
      version: '1.0.0',
      description: 'Agent using Mixtral 8x7B model',
    },
    spec: {
      role: 'You are a code analysis assistant.',
    },
    extensions: {
      mistral: {
        model: 'mixtral-8x7b-instruct-v0.1',
        temperature: 0.3,
        max_tokens: 4096,
        top_p: 0.9,
        random_seed: 42,
        safe_mode: false,
      },
    },
  };

  const adapter = new MistralAdapter({ manifest });
  adapter.initialize();

  const code = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
  `.trim();

  const response = await adapter.chat(
    `Analyze this code and suggest improvements:\n\n${code}`,
    {
      verbose: true,
    }
  );

  console.log('\nResponse:', response);
}

// Example 5: Multi-turn Conversation
async function conversationExample() {
  console.log('\n=== Multi-turn Conversation Example ===\n');

  const manifest: OssaManifestWithMistral = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'conversation-agent',
      version: '1.0.0',
      description: 'Multi-turn conversational agent',
    },
    spec: {
      role: 'You are a knowledgeable tutor who helps students learn programming concepts.',
      llm: {
        provider: 'mistral',
        model: 'mistral-large-latest',
        temperature: 0.7,
      },
    },
  };

  const adapter = new MistralAdapter({ manifest });
  adapter.initialize();

  // First turn
  console.log('\n--- Turn 1 ---');
  const response1 = await adapter.chat('What is a closure in JavaScript?');
  console.log('Assistant:', response1);

  // Second turn (maintains context)
  console.log('\n--- Turn 2 ---');
  const response2 = await adapter.chat('Can you show me an example?');
  console.log('Assistant:', response2);

  // Third turn (maintains context)
  console.log('\n--- Turn 3 ---');
  const response3 = await adapter.chat('What are common use cases?');
  console.log('Assistant:', response3);

  // Display conversation history
  console.log('\n--- Conversation History ---');
  const history = adapter.getConversationHistory();
  console.log(`Total messages: ${history.length}`);
}

// Example 6: Tool Calling with Streaming
async function streamingWithToolsExample() {
  console.log('\n=== Streaming with Tools Example ===\n');

  const manifest: OssaManifestWithMistral = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'calculator-agent',
      version: '1.0.0',
      description: 'Calculator agent with streaming',
    },
    spec: {
      role: 'You are a helpful math assistant. Use the calculator tool for complex calculations.',
    },
    extensions: {
      mistral: {
        model: 'mistral-large-latest',
        temperature: 0.1,
        tools: [
          {
            type: 'function',
            function: {
              name: 'calculate',
              description: 'Perform mathematical calculations',
              parameters: {
                type: 'object',
                properties: {
                  expression: {
                    type: 'string',
                    description: 'The mathematical expression to evaluate',
                  },
                },
                required: ['expression'],
              },
            },
          },
        ],
      },
    },
  };

  const adapter = new MistralAdapter({ manifest });
  adapter.initialize();

  // Register calculator tool
  adapter.registerToolHandler('calculate', async (args) => {
    const expression = args.expression as string;
    try {
      // WARNING: eval() is dangerous in production. Use a proper math parser.
      const result = eval(expression);
      return JSON.stringify({ expression, result });
    } catch (error) {
      return JSON.stringify({
        error: `Failed to evaluate: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  });

  console.log('Response (streaming with tools):');
  for await (const chunk of adapter.chatStream(
    'What is 12345 * 67890 + 9876?',
    {
      verbose: true,
    }
  )) {
    process.stdout.write(chunk);
  }
  console.log('\n');
}

// Example 7: Safe Mode Example
async function safeModeExample() {
  console.log('\n=== Safe Mode Example ===\n');

  const manifest: OssaManifestWithMistral = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'safe-agent',
      version: '1.0.0',
      description: 'Agent with safety features enabled',
    },
    spec: {
      role: 'You are a helpful assistant.',
    },
    extensions: {
      mistral: {
        model: 'mistral-large-latest',
        safe_mode: true,
        safe_prompt: true,
        temperature: 0.5,
      },
    },
  };

  const adapter = new MistralAdapter({ manifest });
  adapter.initialize();

  const response = await adapter.chat(
    'Tell me about internet safety best practices.',
    {
      verbose: true,
    }
  );

  console.log('\nResponse:', response);
}

// Main execution
async function main() {
  try {
    // Run examples (comment out ones you don't want to run)
    await basicChatExample();
    await toolCallingExample();
    await streamingExample();
    await mixtralExample();
    await conversationExample();
    await streamingWithToolsExample();
    await safeModeExample();
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  basicChatExample,
  toolCallingExample,
  streamingExample,
  mixtralExample,
  conversationExample,
  streamingWithToolsExample,
  safeModeExample,
};
