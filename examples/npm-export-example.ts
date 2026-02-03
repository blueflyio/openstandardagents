/**
 * NPM Package Export Example
 *
 * Demonstrates exporting OSSA manifests to npm packages
 */

import { NPMExporter } from '../src/services/export/npm/npm-exporter.js';
import type { OssaAgent } from '../src/types/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Example OSSA agent manifest
 */
const manifest: OssaAgent = {
  apiVersion: 'ossa/v0.4.0',
  kind: 'Agent',
  metadata: {
    name: 'code-review-agent',
    version: '1.0.0',
    description: 'An AI agent specialized in code review and analysis',
    author: 'OSSA Team',
    license: 'MIT',
    annotations: {
      repository: 'https://github.com/ossa/code-review-agent',
    },
    labels: {
      category: 'developer-tools',
      framework: 'ossa',
    },
  },
  spec: {
    role: `You are an expert code reviewer with deep knowledge of software engineering best practices.
Your role is to:
- Analyze code for potential bugs and issues
- Suggest improvements for code quality
- Identify security vulnerabilities
- Recommend performance optimizations
- Ensure adherence to coding standards`,
    llm: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
      maxTokens: 8000,
    },
    tools: [
      {
        name: 'analyze-code',
        description: 'Perform static code analysis',
        type: 'function',
      },
      {
        name: 'check-security',
        description: 'Scan code for security vulnerabilities',
        type: 'api',
      },
      {
        name: 'suggest-improvements',
        description: 'Generate code improvement suggestions',
        type: 'function',
      },
    ],
    capabilities: ['code-analysis', 'security-scanning', 'best-practices'],
  },
};

/**
 * Export agent to npm package
 */
async function exportToNpm() {
  const exporter = new NPMExporter();

  console.log('Exporting OSSA manifest to npm package...\n');

  const result = await exporter.export(manifest, {
    scope: '@ossa',
    includeDocker: true,
    includeTests: true,
    nodeVersion: '18-alpine',
  });

  if (!result.success) {
    console.error('❌ Export failed:', result.error);
    process.exit(1);
  }

  console.log(`✅ Export successful!`);
  console.log(`   Package: ${result.packageName}`);
  console.log(`   Version: ${result.version}`);
  console.log(`   Files: ${result.files.length}`);
  console.log(`   Duration: ${result.metadata?.duration}ms\n`);

  // Write files to exports directory
  const outputDir = path.join(process.cwd(), 'exports', 'npm', 'code-review-agent');

  console.log(`Writing files to: ${outputDir}\n`);

  for (const file of result.files) {
    const filePath = path.join(outputDir, file.path);
    const dir = path.dirname(filePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(filePath, file.content, 'utf-8');
    console.log(`  ✓ ${file.path}`);
  }

  console.log('\n📦 Package generated successfully!');
  console.log('\nNext steps:');
  console.log(`  cd ${outputDir}`);
  console.log('  npm install');
  console.log('  npm run build');
  console.log('  npm test');
  console.log('  npm start\n');

  console.log('To publish to npm:');
  console.log('  npm publish\n');

  // Show file structure
  console.log('Generated files:');
  console.log('├── package.json');
  console.log('├── tsconfig.json');
  console.log('├── README.md');
  console.log('├── .gitignore');
  console.log('├── .npmignore');
  console.log('├── Dockerfile');
  console.log('├── docker-compose.yaml');
  console.log('├── openapi.yaml');
  console.log('├── src/');
  console.log('│   ├── index.ts         (Agent class)');
  console.log('│   ├── types.ts         (TypeScript types)');
  console.log('│   ├── server.ts        (Express server)');
  console.log('│   └── tools/');
  console.log('│       ├── index.ts');
  console.log('│       ├── analyze-code.ts');
  console.log('│       ├── check-security.ts');
  console.log('│       └── suggest-improvements.ts');
  console.log('└── tests/');
  console.log('    └── agent.test.ts\n');
}

// Run example
exportToNpm().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
