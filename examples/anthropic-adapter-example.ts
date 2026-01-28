/**
 * Anthropic Adapter Usage Example
 * Demonstrates how to use the AnthropicAdapter with OSSA manifests
 */

import { AnthropicAdapter } from '../src/services/runtime/anthropic.adapter.js';
import type { OssaManifest } from '../src/services/runtime/anthropic.adapter.js';

// Example 1: Basic Chat Agent (No Tools)
async function basicChatExample() {
  console.log('\n=== Basic Chat Example ===\n');

  const manifest: OssaManifest = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'basic-chat-agent',
      version: '1.0.0',
      description: 'A simple conversational agent',
    },
    spec: {
      role: 'You are a helpful AI assistant that provides clear and concise answers.',
      llm: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        maxTokens: 1024,
      },
    },
  };

  const adapter = new AnthropicAdapter(manifest);
  adapter.initialize();

  const response = await adapter.chat('What are the three laws of robotics?', {
    verbose: true,
  });

  console.log('\nResponse:', response);
  console.log('\nAgent Info:', adapter.getAgentInfo());
}

// Example 2: Agent with Tools
async function toolCallingExample() {
  console.log('\n=== Tool Calling Example ===\n');

  const manifest: OssaManifest = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'weather-agent',
      version: '1.0.0',
      description: 'Weather information agent',
    },
    spec: {
      role: 'You are a helpful weather assistant. Use the get_weather tool to provide current weather information.',
      llm: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.5,
        maxTokens: 2048,
      },
    },
    extensions: {
      anthropic: {
        tools: [
          {
            name: 'get_weather',
            description: 'Get the current weather for a given location',
            input_schema: {
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
          {
            name: 'get_forecast',
            description: 'Get the weather forecast for the next few days',
            input_schema: {
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
        ],
      },
    },
  };

  const adapter = new AnthropicAdapter(manifest);
  adapter.initialize();

  // Register tool handlers
  adapter.registerToolHandler('get_weather', async (args) => {
    const location = args.location as string;
    const unit = (args.unit as string) || 'fahrenheit';

    // Simulate API call
    return JSON.stringify({
      location,
      temperature: unit === 'celsius' ? 22 : 72,
      unit,
      conditions: 'Partly cloudy',
      humidity: 65,
      wind_speed: 10,
    });
  });

  adapter.registerToolHandler('get_forecast', async (args) => {
    const location = args.location as string;
    const days = args.days as number;

    // Simulate API call
    const forecast = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      high: 75 + i,
      low: 55 + i,
      conditions: i % 2 === 0 ? 'Sunny' : 'Partly cloudy',
    }));

    return JSON.stringify({
      location,
      forecast,
    });
  });

  const response = await adapter.chat(
    "What's the weather like in San Francisco, and what's the forecast for the next 3 days?",
    {
      verbose: true,
      maxTurns: 5,
    }
  );

  console.log('\nFinal Response:', response);
}

// Example 3: Streaming Response
async function streamingExample() {
  console.log('\n=== Streaming Example ===\n');

  const manifest: OssaManifest = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'streaming-agent',
      version: '1.0.0',
    },
    spec: {
      role: 'You are a helpful AI assistant. Provide detailed, thoughtful responses.',
    },
    extensions: {
      anthropic: {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0.7,
      },
    },
  };

  const adapter = new AnthropicAdapter(manifest);
  adapter.initialize();

  console.log('User: Explain how neural networks work in simple terms.\n');
  console.log('Assistant: ');

  const stream = adapter.chatStream(
    'Explain how neural networks work in simple terms.'
  );

  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }

  console.log('\n');
}

// Example 4: Multi-turn Conversation
async function conversationExample() {
  console.log('\n=== Multi-turn Conversation Example ===\n');

  const manifest: OssaManifest = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'conversation-agent',
      version: '1.0.0',
    },
    spec: {
      role: 'You are a knowledgeable AI tutor. Help students learn by asking questions and providing explanations.',
      llm: {
        provider: 'anthropic',
        model: 'claude-3-haiku-20250320', // Using Haiku for faster responses
        temperature: 0.8,
        maxTokens: 512,
      },
    },
  };

  const adapter = new AnthropicAdapter(manifest);
  adapter.initialize();

  const questions = [
    "What is the Pythagorean theorem?",
    "Can you give me an example?",
    "How is it used in real life?",
  ];

  for (const question of questions) {
    console.log(`\nUser: ${question}`);
    const response = await adapter.chat(question);
    console.log(`Assistant: ${response}`);
  }

  console.log('\nConversation History:');
  console.log(JSON.stringify(adapter.getConversationHistory(), null, 2));
}

// Example 5: Using Different Claude Models
async function modelComparisonExample() {
  console.log('\n=== Model Comparison Example ===\n');

  const models = [
    { name: 'Claude 3.5 Sonnet', id: 'claude-3-5-sonnet-20241022' },
    { name: 'Claude 3 Opus', id: 'claude-3-opus-20240229' },
    { name: 'Claude 3 Haiku', id: 'claude-3-haiku-20250320' },
  ];

  const prompt = 'Write a haiku about artificial intelligence.';

  for (const model of models) {
    console.log(`\n--- ${model.name} ---`);

    const manifest: OssaManifest = {
      apiVersion: 'ossa/v0.3.0',
      kind: 'Agent',
      metadata: {
        name: `${model.id}-agent`,
        version: '1.0.0',
      },
      spec: {
        role: 'You are a creative poet.',
      },
      extensions: {
        anthropic: {
          model: model.id,
          max_tokens: 256,
          temperature: 0.9,
        },
      },
    };

    const adapter = new AnthropicAdapter(manifest);
    adapter.initialize();

    const response = await adapter.chat(prompt);
    console.log(response);
  }
}

// Example 6: Error Handling
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===\n');

  const manifest: OssaManifest = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'error-demo-agent',
      version: '1.0.0',
    },
    spec: {
      role: 'You are a helpful assistant.',
    },
    extensions: {
      anthropic: {
        tools: [
          {
            name: 'risky_operation',
            description: 'An operation that might fail',
            input_schema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  description: 'The action to perform',
                },
              },
              required: ['action'],
            },
          },
        ],
      },
    },
  };

  const adapter = new AnthropicAdapter(manifest);
  adapter.initialize();

  // Register a tool that throws an error
  adapter.registerToolHandler('risky_operation', async (args) => {
    if (args.action === 'fail') {
      throw new Error('Operation failed intentionally');
    }
    return JSON.stringify({ success: true, action: args.action });
  });

  try {
    const response = await adapter.chat(
      'Please perform a risky operation with action "fail"',
      { verbose: true }
    );
    console.log('\nResponse:', response);
  } catch (error) {
    console.error('\nCaught error:', error);
  }
}

// Run examples
async function main() {
  // Check if API key is set
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set');
    console.log('\nPlease set your API key:');
    console.log('  export ANTHROPIC_API_KEY=your-key-here');
    process.exit(1);
  }

  try {
    // Run examples (comment out any you don't want to run)
    await basicChatExample();
    // await toolCallingExample();
    // await streamingExample();
    // await conversationExample();
    // await modelComparisonExample();
    // await errorHandlingExample();
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
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
  conversationExample,
  modelComparisonExample,
  errorHandlingExample,
};
