/**
 * LangServe Export Example
 *
 * Demonstrates how to export an OSSA agent to a production-ready
 * LangServe deployment with Docker, Kubernetes, and cloud platform configs.
 */

import { LangChainExporter } from '../../src/services/export/langchain/index.js';
import type { OssaAgent } from '../../src/types/index.js';

// Example OSSA manifest
const manifest: OssaAgent = {
  apiVersion: 'ossa.ai/v0.4.1',
  kind: 'Agent',
  metadata: {
    name: 'customer-support-agent',
    description: 'AI-powered customer support agent with LangServe deployment',
    version: '1.0.0',
    labels: {
      'app.kubernetes.io/name': 'customer-support-agent',
      'app.kubernetes.io/component': 'ai-agent',
    },
  },
  spec: {
    role: 'You are a helpful customer support agent. Assist users with their questions about products, orders, and services.',
    llm: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
    },
    tools: [
      {
        name: 'search_knowledge_base',
        description: 'Search the knowledge base for information',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'create_ticket',
        description: 'Create a support ticket',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Ticket title',
            },
            description: {
              type: 'string',
              description: 'Ticket description',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Ticket priority',
            },
          },
          required: ['title', 'description', 'priority'],
        },
      },
    ],
    memory: {
      type: 'conversation-buffer',
    },
  },
};

async function exportToLangServe() {
  const exporter = new LangChainExporter();

  console.log('Exporting OSSA agent to LangServe deployment...\n');

  // Export with LangServe support
  const result = await exporter.export(manifest, {
    pythonVersion: '3.11',
    includeApi: true,
    includeOpenApi: true,
    includeDocker: true,
    includeTests: true,
    memoryBackend: 'buffer',
    apiPort: 8000,

    // Enable LangServe deployment
    includeLangServe: true,

    // LangServe configuration
    langserve: {
      enableFeedback: true,
      enablePublicTraceLink: true,
      enablePlayground: true,
      routePath: '/agent',
      port: 8000,
      includeDeployment: true,
      deploymentPlatforms: ['docker', 'kubernetes', 'railway', 'render', 'fly'],
    },

    // Observability
    callbacks: {
      langsmith: true,
      langfuse: false,
      opentelemetry: false,
    },

    // Error handling
    errorHandling: {
      retry: {
        enabled: true,
        maxRetries: 3,
        backoffMultiplier: 2,
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        timeout: 60000,
      },
      fallback: {
        useCachedResponses: true,
      },
    },
  });

  if (result.success) {
    console.log('✓ Export successful!\n');
    console.log(`Generated ${result.files.length} files:\n`);

    // Group files by type
    const filesByType = result.files.reduce(
      (acc, file) => {
        const type = file.type || 'other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(file.path);
        return acc;
      },
      {} as Record<string, string[]>
    );

    // Display files
    for (const [type, files] of Object.entries(filesByType)) {
      console.log(`${type.toUpperCase()}:`);
      files.forEach((file) => console.log(`  - ${file}`));
      console.log();
    }

    console.log('Metadata:');
    console.log(`  Python Version: ${result.metadata?.pythonVersion}`);
    console.log(`  LangChain Version: ${result.metadata?.langchainVersion}`);
    console.log(`  Tools: ${result.metadata?.toolsCount}`);
    console.log(`  Memory Backend: ${result.metadata?.memoryType}`);
    console.log(`  Duration: ${result.metadata?.duration}ms`);
    console.log();

    // Display LangServe endpoints
    console.log('LangServe Endpoints:');
    console.log('  POST /agent/invoke - Synchronous invocation');
    console.log('  POST /agent/batch - Batch processing');
    console.log('  POST /agent/stream - Streaming responses (SSE)');
    console.log('  POST /agent/stream_log - Detailed streaming');
    console.log('  GET /agent/playground - Interactive playground UI');
    console.log('  GET /docs - OpenAPI documentation');
    console.log('  GET /health - Health check');
    console.log();

    // Display deployment options
    console.log('Deployment Options:');
    console.log('  1. Docker:');
    console.log('     docker build -f Dockerfile.langserve -t customer-support-agent .');
    console.log('     docker-compose -f docker-compose.langserve.yaml up');
    console.log();
    console.log('  2. Kubernetes:');
    console.log('     kubectl apply -f k8s/');
    console.log();
    console.log('  3. Railway:');
    console.log('     railway up');
    console.log();
    console.log('  4. Render:');
    console.log('     Connect Git repo and deploy via render.yaml');
    console.log();
    console.log('  5. Fly.io:');
    console.log('     fly launch && fly deploy');
    console.log();

    // Display file content preview for key files
    console.log('Key Files Preview:\n');

    const langserveApp = result.files.find((f) => f.path === 'langserve_app.py');
    if (langserveApp) {
      console.log('--- langserve_app.py (first 30 lines) ---');
      console.log(langserveApp.content.split('\n').slice(0, 30).join('\n'));
      console.log('...\n');
    }

    const deploymentReadme = result.files.find((f) => f.path === 'DEPLOYMENT.md');
    if (deploymentReadme) {
      console.log('--- DEPLOYMENT.md (first 40 lines) ---');
      console.log(deploymentReadme.content.split('\n').slice(0, 40).join('\n'));
      console.log('...\n');
    }

    // Usage examples
    console.log('Usage Examples:\n');
    console.log('Python Client:');
    console.log('```python');
    console.log('from langserve import RemoteRunnable');
    console.log('');
    console.log('agent = RemoteRunnable("http://localhost:8000/agent")');
    console.log('result = agent.invoke("How do I track my order?")');
    console.log('print(result)');
    console.log('```\n');

    console.log('JavaScript/TypeScript Client:');
    console.log('```typescript');
    console.log('import { RemoteRunnable } from "@langchain/core/runnables/remote";');
    console.log('');
    console.log('const agent = new RemoteRunnable({');
    console.log('  url: "http://localhost:8000/agent"');
    console.log('});');
    console.log('const result = await agent.invoke("How do I return a product?");');
    console.log('```\n');

    console.log('cURL:');
    console.log('```bash');
    console.log('curl -X POST "http://localhost:8000/agent/invoke" \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"input": "What are your business hours?"}\'');
    console.log('```\n');
  } else {
    console.error('✗ Export failed:');
    console.error(result.error);
    process.exit(1);
  }
}

// Run example
exportToLangServe().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
