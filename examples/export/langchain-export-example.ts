/**
 * LangChain Export Example
 *
 * Demonstrates complete LangChain export with:
 * - Python agent code
 * - FastAPI REST API
 * - OpenAPI 3.1 specification
 * - Docker containerization
 * - Multiple memory backends
 */

import { LangChainExporter } from '../../src/services/export/langchain/index.js';
import type { OssaAgent } from '../../src/types/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Example: Customer Support Bot
 */
const supportBotManifest: OssaAgent = {
  apiVersion: 'ossa/v0.3.6',
  kind: 'Agent',
  metadata: {
    name: 'support-bot',
    version: '1.0.0',
    description:
      'Customer support agent with ticket creation and knowledge base search',
    author: 'OSSA Team',
    license: 'MIT',
  },
  spec: {
    role: `You are a helpful customer support agent. Your responsibilities:

1. Answer customer questions using the knowledge base
2. Create support tickets for complex issues
3. Escalate urgent matters to human agents
4. Maintain a friendly, professional tone

Always be helpful, clear, and empathetic.`,
    llm: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
    },
    tools: [
      {
        name: 'search_docs',
        type: 'function',
        description:
          'Search the knowledge base for relevant documentation and FAQs',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of results',
              default: 5,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'create_ticket',
        type: 'function',
        description:
          'Create a support ticket for complex issues that require human attention',
        input_schema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Ticket title',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the issue',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Ticket priority',
              default: 'medium',
            },
          },
          required: ['title', 'description'],
        },
      },
      {
        name: 'get_order_status',
        type: 'api',
        description: 'Get the current status of a customer order',
        config: {
          endpoint: 'https://api.example.com/orders/{order_id}',
          method: 'GET',
        },
      },
    ],
  },
};

/**
 * Export with all features enabled
 */
async function exportSupportBot() {
  console.log('🚀 Exporting LangChain Support Bot...\n');

  const exporter = new LangChainExporter();

  const result = await exporter.export(supportBotManifest, {
    pythonVersion: '3.11',
    includeApi: true,
    includeOpenApi: true,
    includeDocker: true,
    includeTests: true,
    memoryBackend: 'redis',
    apiPort: 8000,
  });

  if (!result.success) {
    console.error('❌ Export failed:', result.error);
    process.exit(1);
  }

  // Write files to output directory
  const outputDir = path.join(process.cwd(), 'examples/export/output/support-bot');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('📝 Writing files:\n');

  for (const file of result.files) {
    const filePath = path.join(outputDir, file.path);
    const fileDir = path.dirname(filePath);

    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    fs.writeFileSync(filePath, file.content, 'utf-8');
    console.log(`  ✅ ${file.path} (${file.type}, ${file.content.length} bytes)`);
  }

  console.log('\n✨ Export completed successfully!\n');
  console.log('📊 Export Statistics:');
  console.log(`  - Python Version: ${result.metadata?.pythonVersion}`);
  console.log(`  - LangChain Version: ${result.metadata?.langchainVersion}`);
  console.log(`  - Tools: ${result.metadata?.toolsCount}`);
  console.log(`  - Memory: ${result.metadata?.memoryType}`);
  console.log(`  - API: ${result.metadata?.hasApi ? 'Yes' : 'No'}`);
  console.log(`  - OpenAPI: ${result.metadata?.hasOpenApi ? 'Yes' : 'No'}`);
  console.log(`  - Duration: ${result.metadata?.duration}ms`);
  console.log(`  - Files: ${result.files.length}`);

  console.log('\n🚀 Next Steps:');
  console.log(`  cd ${outputDir}`);
  console.log(`  # Copy .env.example to .env and add your API keys`);
  console.log(`  cp .env.example .env`);
  console.log(`  # Run with Docker:`);
  console.log(`  docker-compose up`);
  console.log(`  # OR run locally:`);
  console.log(`  pip install -r requirements.txt`);
  console.log(`  uvicorn server:app --reload`);
  console.log(`  # API docs at: http://localhost:8000/docs`);
}

/**
 * Export with buffer memory (simple)
 */
async function exportSimpleAgent() {
  console.log('\n📦 Exporting Simple Agent with Buffer Memory...\n');

  const simpleManifest: OssaAgent = {
    apiVersion: 'ossa/v0.3.6',
    kind: 'Agent',
    metadata: {
      name: 'simple-agent',
      version: '1.0.0',
      description: 'Simple conversational agent',
    },
    spec: {
      role: 'You are a helpful AI assistant.',
      llm: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        temperature: 0.7,
      },
    },
  };

  const exporter = new LangChainExporter();

  const result = await exporter.export(simpleManifest, {
    memoryBackend: 'buffer',
    includeApi: true,
    includeDocker: true,
  });

  if (result.success) {
    const outputDir = path.join(
      process.cwd(),
      'examples/export/output/simple-agent'
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const file of result.files) {
      const filePath = path.join(outputDir, file.path);
      const fileDir = path.dirname(filePath);

      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      fs.writeFileSync(filePath, file.content, 'utf-8');
    }

    console.log(`✅ Simple agent exported to: ${outputDir}`);
    console.log(`   Files: ${result.files.length}`);
  }
}

// Run examples
async function main() {
  try {
    await exportSupportBot();
    await exportSimpleAgent();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url.endsWith(process.argv[1])) {
  main();
}
