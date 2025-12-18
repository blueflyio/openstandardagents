/**
 * Agent Publishing Example
 *
 * Demonstrates how to publish an agent to the OSSA registry.
 */

import { OSSA, AgentManifest } from '../src/index.js';

async function main() {
  // Initialize with authentication
  const token = process.env.OSSA_TOKEN;
  if (!token) {
    console.error('❌ Error: OSSA_TOKEN environment variable is required');
    console.error('   Run: export OSSA_TOKEN=ossa_tok_xxx');
    process.exit(1);
  }

  const client = new OSSA({ bearerToken: token });

  console.log('📦 OSSA TypeScript Client - Agent Publishing Example\n');

  // Define the agent manifest
  const manifest: AgentManifest = {
    apiVersion: 'ossa/v0.3.0',
    kind: 'Agent',
    metadata: {
      name: 'example-typescript-agent',
      version: '1.0.0',
      description: 'Example agent published from TypeScript SDK',
      labels: {
        environment: 'production',
        team: 'engineering',
      },
    },
    spec: {
      taxonomy: {
        domain: 'development',
        subdomain: 'code-quality',
        capability: 'linting',
      },
      role: 'Code quality analysis agent that performs automated linting and style checks',
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        temperature: 0.3,
        maxTokens: 4000,
      },
      capabilities: [
        {
          name: 'lint_code',
          description: 'Analyze code and provide linting recommendations',
          input_schema: {
            type: 'object',
            required: ['code', 'language'],
            properties: {
              code: { type: 'string' },
              language: { type: 'string' },
              rules: { type: 'object' },
            },
          },
          output_schema: {
            type: 'object',
            properties: {
              issues: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    line: { type: 'number' },
                    severity: { type: 'string' },
                    message: { type: 'string' },
                    rule: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      ],
      runtime: {
        type: 'serverless',
        config: {
          timeout: 300,
          memory: '512Mi',
        },
      },
    },
  };

  try {
    console.log('1️⃣  Publishing agent...');
    console.log(`   Name: ${manifest.metadata.name}`);
    console.log(`   Version: ${manifest.metadata.version}`);
    console.log(`   Description: ${manifest.metadata.description}\n`);

    const result = await client.agents.publish({
      manifest,
      package: {
        tarball_url: 'https://example.com/agents/example-typescript-agent-1.0.0.tgz',
        shasum: 'a'.repeat(64), // SHA-256 checksum
        size_bytes: 1024 * 100, // 100KB
      },
      documentation: {
        readme: 'https://github.com/example/example-typescript-agent#readme',
        repository: 'https://github.com/example/example-typescript-agent',
      },
      license: 'Apache-2.0',
      keywords: ['linting', 'code-quality', 'typescript'],
    });

    console.log('✅ Agent published successfully!\n');
    console.log(`   Status: ${result.status}`);
    console.log(`   Agent: ${result.agent.publisher}/${result.agent.name}`);
    console.log(`   Version: ${result.agent.version}`);
    console.log(`   Published at: ${new Date(result.agent.published_at).toISOString()}`);
    console.log(`   Registry URL: ${result.agent.registry_url}`);
    console.log(`   Package URL: ${result.agent.package_url}\n`);

    console.log('   Verification:');
    console.log(`   - Schema valid: ${result.verification.schema_valid ? '✓' : '✗'}`);
    console.log(`   - Security scan: ${result.verification.security_scan}`);
    console.log(`   - Verified publisher: ${result.verification.verified_publisher ? '✓' : '✗'}\n`);

    // Wait for verification if pending
    if (result.verification.security_scan === 'pending') {
      console.log('⏳ Security scan is pending. Check back later for results.');
      console.log(`   Monitor at: ${result.agent.registry_url}\n`);
    }
  } catch (error) {
    console.error('❌ Publishing failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

main();
