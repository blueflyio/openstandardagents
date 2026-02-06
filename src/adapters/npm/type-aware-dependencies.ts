/**
 * Type-Aware NPM Dependencies
 *
 * Automatically add correct SDK dependencies based on agentType
 */

import type { OssaAgent } from '../../types/index.js';

/**
 * SDK dependencies by agent type
 */
const TYPE_DEPENDENCIES: Record<string, Record<string, string>> = {
  claude: {
    '@anthropic-ai/sdk': '^0.71.0',
  },
  openai: {
    openai: '^6.9.1',
  },
  langchain: {
    '@langchain/core': '^0.3.31',
    '@langchain/community': '^0.3.19',
    langchain: '^0.3.9',
  },
  kagent: {
    '@kubernetes/client-node': '^0.23.0',
  },
  swarm: {
    openai: '^6.9.1', // OpenAI Swarm uses OpenAI SDK
  },
  crewai: {
    '@crewai/crewai': '^0.1.0', // Hypothetical
  },
};

/**
 * Capability-specific dependencies
 */
const CAPABILITY_DEPENDENCIES: Record<string, Record<string, string>> = {
  vision: {
    sharp: '^0.33.5', // Image processing
  },
  audio: {
    '@google-cloud/speech': '^6.8.0', // Audio transcription
  },
  retrieval: {
    '@qdrant/js-client-rest': '^1.9.0', // Vector DB
    'pdf-parse': '^1.1.1', // PDF parsing
  },
  memory: {
    '@qdrant/js-client-rest': '^1.9.0', // Vector memory
  },
  'web-search': {
    axios: '^1.12.2', // HTTP client
  },
  code: {
    vm2: '^3.9.19', // Secure code execution
  },
};

/**
 * Transport-specific dependencies
 */
const TRANSPORT_DEPENDENCIES: Record<string, Record<string, string>> = {
  grpc: {
    '@grpc/grpc-js': '^1.12.4',
    '@grpc/proto-loader': '^0.7.15',
  },
  http: {
    express: '^4.18.2',
  },
  websocket: {
    ws: '^8.19.0',
  },
};

/**
 * Get type-aware dependencies for a manifest
 */
export function getTypeAwareDependencies(
  manifest: OssaAgent
): Record<string, string> {
  const deps: Record<string, string> = {};

  // Add agent type dependencies
  const agentType = manifest.metadata?.agentType;
  if (agentType && TYPE_DEPENDENCIES[agentType]) {
    Object.assign(deps, TYPE_DEPENDENCIES[agentType]);
  }

  // Add capability dependencies
  const capabilities = manifest.metadata?.agentArchitecture?.capabilities || [];
  for (const capability of capabilities) {
    if (CAPABILITY_DEPENDENCIES[capability]) {
      Object.assign(deps, CAPABILITY_DEPENDENCIES[capability]);
    }
  }

  // Add transport dependencies
  const transport = (manifest.spec as any)?.transport;
  if (transport?.protocol && TRANSPORT_DEPENDENCIES[transport.protocol]) {
    Object.assign(deps, TRANSPORT_DEPENDENCIES[transport.protocol]);
  }

  return deps;
}

/**
 * Enhance package.json with type-aware dependencies
 */
export function enhancePackageJson(
  packageJson: Record<string, any>,
  manifest: OssaAgent
): Record<string, any> {
  const typeAwareDeps = getTypeAwareDependencies(manifest);

  // Merge type-aware dependencies
  packageJson.dependencies = {
    ...packageJson.dependencies,
    ...typeAwareDeps,
  };

  // Add metadata
  if (!packageJson.ossa) {
    packageJson.ossa = {};
  }

  packageJson.ossa.agentType = manifest.metadata?.agentType;
  packageJson.ossa.agentKind = manifest.metadata?.agentKind;
  packageJson.ossa.optimized = true;

  return packageJson;
}

/**
 * Generate README section explaining dependencies
 */
export function generateDependenciesSection(manifest: OssaAgent): string {
  const deps = getTypeAwareDependencies(manifest);
  const agentType = manifest.metadata?.agentType;

  let section = '## Dependencies\n\n';
  section += `This package is optimized for **${agentType || 'custom'}** agents.\n\n`;

  if (Object.keys(deps).length > 0) {
    section += 'The following dependencies are automatically included:\n\n';

    for (const [pkg, version] of Object.entries(deps)) {
      section += `- \`${pkg}@${version}\`\n`;
    }

    section += '\n';
  }

  // Add usage hint
  if (agentType === 'claude') {
    section += '### Usage with Claude\n\n';
    section += '```typescript\n';
    section += "import Anthropic from '@anthropic-ai/sdk';\n";
    section += "import { agent } from './agent';\n\n";
    section += 'const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n';
    section += '// Use agent with Claude SDK\n';
    section += '```\n\n';
  } else if (agentType === 'openai') {
    section += '### Usage with OpenAI\n\n';
    section += '```typescript\n';
    section += "import OpenAI from 'openai';\n";
    section += "import { agent } from './agent';\n\n";
    section += 'const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });\n';
    section += '// Use agent with OpenAI SDK\n';
    section += '```\n\n';
  } else if (agentType === 'kagent') {
    section += '### Deployment to Kubernetes\n\n';
    section += '```bash\n';
    section += '# Build container\n';
    section += 'docker build -t my-kagent .\n\n';
    section += '# Deploy to K8s\n';
    section += 'kubectl apply -f kagent-crd.yaml\n';
    section += '```\n\n';
  }

  return section;
}
