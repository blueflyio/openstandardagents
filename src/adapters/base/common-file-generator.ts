/**
 * Common File Generator
 *
 * Centralized generation of standard project files (package.json, tsconfig,
 * .gitignore, README, LICENSE, etc.) that are duplicated across adapters.
 *
 * SOLID: Single Responsibility - Standard file generation only
 * DRY: Eliminates 8,000+ duplicate lines across adapters
 */

import type { OssaAgent } from '../../types/index.js';
import type { ExportFile, ExportOptions } from './adapter.interface.js';
import { renderConditional, type TemplateData } from './template-engine.js';
import {
  isMultiAgentManifest,
  generateTeamFiles,
  generateSubagentFiles,
  type TeamTargetPlatform,
} from '../../services/multi-agent/team-generator.service.js';
import { generateAgentsMd } from '../../services/agents-md/agents-md-generator.service.js';
import {
  generateEvalStubs,
  generateGovernanceConfig,
  generateObservabilityConfig,
} from './perfect-agent-utils.js';

// ──────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────

/**
 * Supported target platforms for file generation
 */
export type Platform =
  | 'langchain'
  | 'crewai'
  | 'mcp'
  | 'npm'
  | 'drupal'
  | 'gitlab-duo'
  | 'docker'
  | 'kubernetes'
  | 'custom';

/**
 * Options for package.json generation
 */
export interface PackageJsonOptions {
  /** Override the package name (default: derived from manifest) */
  name?: string;
  /** npm scope (e.g., "@ossa") */
  scope?: string;
  /** Entry point file (default: "index.js") */
  main?: string;
  /** TypeScript types entry (default: "index.d.ts") */
  types?: string;
  /** Module type (default: "module") */
  type?: 'module' | 'commonjs';
  /** npm scripts */
  scripts?: Record<string, string>;
  /** Production dependencies */
  dependencies?: Record<string, string>;
  /** Dev dependencies */
  devDependencies?: Record<string, string>;
  /** Peer dependencies */
  peerDependencies?: Record<string, string>;
  /** Extra keywords beyond defaults */
  extraKeywords?: string[];
  /** Files to include in package */
  files?: string[];
  /** Bin entries */
  bin?: Record<string, string>;
  /** Extra top-level fields */
  extra?: Record<string, unknown>;
}

/**
 * Options for tsconfig.json generation
 */
export interface TsConfigOptions {
  /** Target JS version (default: "ES2022") */
  target?: string;
  /** Module system (default: "Node16") */
  module?: string;
  /** Module resolution (default: "Node16") */
  moduleResolution?: string;
  /** Output directory (default: ".") */
  outDir?: string;
  /** Root directory (default: ".") */
  rootDir?: string;
  /** Include patterns (default: ["*.ts"]) */
  include?: string[];
  /** Exclude patterns (default: ["node_modules", "*.js"]) */
  exclude?: string[];
  /** Emit declarations (default: true) */
  declaration?: boolean;
  /** Enable strict mode (default: true) */
  strict?: boolean;
}

/**
 * Sections to include in a generated README
 */
export interface ReadmeSections {
  /** Override the installation section */
  installation?: string;
  /** Override the usage section */
  usage?: string;
  /** Additional sections appended after standard content */
  additional?: Array<{ title: string; content: string }>;
  /** Footer content */
  footer?: string;
}

// ──────────────────────────────────────────────────────────────────
// Package.json Generation
// ──────────────────────────────────────────────────────────────────

/**
 * Default platform-specific scripts
 */
const PLATFORM_SCRIPTS: Record<string, Record<string, string>> = {
  langchain: {
    start: 'node --loader ts-node/esm agent.ts',
    build: 'tsc',
  },
  mcp: {
    build: 'tsc',
    start: 'node server.js',
    dev: 'tsx server.ts',
    watch: 'tsx watch server.ts',
  },
  npm: {
    test: 'echo "Error: no test specified" && exit 1',
  },
  crewai: {
    start: 'python main.py',
  },
  'gitlab-duo': {
    build: 'tsc',
    start: 'node dist/index.js',
  },
  docker: {
    build: 'docker build -t agent .',
    start: 'docker run agent',
  },
  kubernetes: {
    build: 'tsc',
    deploy: 'kubectl apply -f deployment.yaml',
  },
  custom: {
    build: 'tsc',
    start: 'node index.js',
  },
};

/**
 * Default platform-specific dependencies
 */
const PLATFORM_DEPENDENCIES: Record<string, Record<string, string>> = {
  langchain: {
    '@langchain/openai': '^0.0.19',
    '@langchain/core': '^0.1.0',
    '@langchain/anthropic': '^0.0.1',
    langchain: '^0.1.0',
    dotenv: '^16.0.0',
  },
  mcp: {
    '@modelcontextprotocol/sdk': '^0.5.0',
  },
  npm: {},
  crewai: {},
  'gitlab-duo': {},
  docker: {},
  kubernetes: {},
  custom: {},
};

/**
 * Default platform-specific dev dependencies
 */
const PLATFORM_DEV_DEPENDENCIES: Record<string, Record<string, string>> = {
  langchain: {
    '@types/node': '^20.0.0',
    typescript: '^5.0.0',
    'ts-node': '^10.9.0',
  },
  mcp: {
    '@types/node': '^20.0.0',
    typescript: '^5.0.0',
    tsx: '^4.0.0',
  },
  npm: {},
  crewai: {},
  'gitlab-duo': {
    '@types/node': '^20.0.0',
    typescript: '^5.0.0',
  },
  docker: {
    '@types/node': '^20.0.0',
    typescript: '^5.0.0',
  },
  kubernetes: {
    '@types/node': '^20.0.0',
    typescript: '^5.0.0',
  },
  custom: {
    '@types/node': '^20.0.0',
    typescript: '^5.0.0',
  },
};

/**
 * Generate a package.json string from an OSSA manifest.
 *
 * @param manifest - OSSA agent manifest
 * @param platform - Target platform
 * @param options - Override options
 * @returns JSON string
 */
export function generatePackageJson(
  manifest: OssaAgent,
  platform: Platform,
  options?: PackageJsonOptions
): string {
  const name =
    options?.name ??
    (options?.scope
      ? `${options.scope}/${sanitizePackageName(manifest.metadata?.name || 'agent')}`
      : manifest.metadata?.name || 'agent');

  const defaultKeywords = ['ossa', 'agent', 'ai', platform];
  const labels = manifest.metadata?.labels
    ? Object.values(manifest.metadata.labels)
    : [];

  const pkg: Record<string, unknown> = {
    name,
    version: manifest.metadata?.version || '1.0.0',
    description: manifest.metadata?.description || `OSSA agent for ${platform}`,
    type: options?.type ?? 'module',
    main: options?.main ?? 'index.js',
  };

  if (options?.types) {
    pkg.types = options.types;
  }

  if (options?.bin) {
    pkg.bin = options.bin;
  }

  pkg.scripts = {
    ...(PLATFORM_SCRIPTS[platform] || PLATFORM_SCRIPTS.custom),
    ...options?.scripts,
  };

  const deps = {
    ...(PLATFORM_DEPENDENCIES[platform] || {}),
    ...options?.dependencies,
  };
  if (Object.keys(deps).length > 0) {
    pkg.dependencies = deps;
  }

  const devDeps = {
    ...(PLATFORM_DEV_DEPENDENCIES[platform] || {}),
    ...options?.devDependencies,
  };
  if (Object.keys(devDeps).length > 0) {
    pkg.devDependencies = devDeps;
  }

  if (
    options?.peerDependencies &&
    Object.keys(options.peerDependencies).length > 0
  ) {
    pkg.peerDependencies = options.peerDependencies;
  }

  pkg.keywords = [
    ...defaultKeywords,
    ...labels,
    ...(options?.extraKeywords || []),
  ];
  pkg.license = manifest.metadata?.license || 'MIT';

  if (manifest.metadata?.author) {
    pkg.author = manifest.metadata.author;
  }

  if (options?.files) {
    pkg.files = options.files;
  }

  // Merge extra fields
  if (options?.extra) {
    Object.assign(pkg, options.extra);
  }

  return JSON.stringify(pkg, null, 2);
}

// ──────────────────────────────────────────────────────────────────
// tsconfig.json Generation
// ──────────────────────────────────────────────────────────────────

/**
 * Generate a tsconfig.json string.
 *
 * @param options - Override compiler options
 * @returns JSON string
 */
export function generateTsConfig(options?: TsConfigOptions): string {
  const config = {
    compilerOptions: {
      target: options?.target ?? 'ES2022',
      module: options?.module ?? 'Node16',
      moduleResolution: options?.moduleResolution ?? 'Node16',
      outDir: options?.outDir ?? '.',
      rootDir: options?.rootDir ?? '.',
      strict: options?.strict ?? true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: options?.declaration ?? true,
    },
    include: options?.include ?? ['*.ts'],
    exclude: options?.exclude ?? ['node_modules', '*.js'],
  };

  return JSON.stringify(config, null, 2);
}

// ──────────────────────────────────────────────────────────────────
// .gitignore Generation
// ──────────────────────────────────────────────────────────────────

/** Common gitignore entries shared across all platforms */
const COMMON_GITIGNORE = `# Dependencies
node_modules/

# Build output
dist/
build/
*.js
*.d.ts
*.js.map

# Coverage
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local

# Logs
*.log
npm-debug.log*
`;

/** Platform-specific gitignore additions */
const PLATFORM_GITIGNORE: Record<string, string> = {
  langchain: `
# Python
__pycache__/
*.py[cod]
*$py.class
.Python
venv/
.venv/
*.egg-info/
`,
  crewai: `
# Python
__pycache__/
*.py[cod]
*$py.class
.Python
venv/
.venv/
*.egg-info/
`,
  mcp: '',
  npm: '',
  drupal: `
# Drupal
sites/default/files/
sites/default/settings.local.php
`,
  docker: `
# Docker
.dockerignore
`,
  kubernetes: `
# Kubernetes
*.kubeconfig
`,
  'gitlab-duo': '',
  custom: '',
};

/**
 * Generate a .gitignore file for a target platform.
 *
 * @param platform - Target platform
 * @returns .gitignore content
 */
export function generateGitIgnore(platform: Platform): string {
  const extra = PLATFORM_GITIGNORE[platform] || '';
  return (COMMON_GITIGNORE + extra).trimEnd() + '\n';
}

// ──────────────────────────────────────────────────────────────────
// .dockerignore Generation
// ──────────────────────────────────────────────────────────────────

/**
 * Generate a .dockerignore file.
 *
 * @returns .dockerignore content
 */
export function generateDockerIgnore(): string {
  return `node_modules/
dist/
coverage/
.git/
.gitignore
.env
.env.local
*.log
*.md
!README.md
.vscode/
.idea/
.DS_Store
Thumbs.db
tests/
*.test.ts
*.spec.ts
`;
}

// ──────────────────────────────────────────────────────────────────
// README Generation
// ──────────────────────────────────────────────────────────────────

/**
 * Generate a README.md from an OSSA manifest with platform-specific content.
 *
 * @param manifest - OSSA agent manifest
 * @param platform - Target platform
 * @param sections - Optional section overrides
 * @returns README content
 */
export function generateReadme(
  manifest: OssaAgent,
  platform: Platform,
  sections?: ReadmeSections
): string {
  const name = manifest.metadata?.name || 'OSSA Agent';
  const description =
    manifest.metadata?.description ||
    `${platform} agent generated from OSSA manifest`;
  const role = manifest.spec?.role || 'AI Agent';
  const license = manifest.metadata?.license || 'MIT';
  const apiVersion = manifest.apiVersion?.split('/')[1] || 'v0.4.1';

  // Build tools list
  const tools = (manifest.spec?.tools || []) as Array<Record<string, unknown>>;
  const toolsList = tools
    .map(
      (t) =>
        `- **${t.name || 'unknown'}**: ${t.description || 'No description'}`
    )
    .join('\n');

  // LLM info
  const llm = manifest.spec?.llm as Record<string, unknown> | undefined;

  const data: TemplateData = {
    name,
    description,
    role,
    platform,
    license,
    apiVersion,
    toolsList: toolsList || undefined,
    llmProvider: llm?.provider as string | undefined,
    llmModel: llm?.model as string | undefined,
    llmTemperature:
      llm?.temperature !== undefined ? String(llm.temperature) : undefined,
    llmMaxTokens:
      llm?.maxTokens !== undefined ? String(llm.maxTokens) : undefined,
    installCommand:
      sections?.installation || getDefaultInstallCommand(platform),
    usageCode: sections?.usage || getDefaultUsage(platform, name),
  };

  let readme = renderConditional(
    `# {{name}}

{{description}}

## Description

{{role}}

## Installation

\`\`\`bash
{{installCommand}}
\`\`\`

## Usage

\`\`\`
{{usageCode}}
\`\`\`

{{#if toolsList}}
## Tools

{{toolsList}}
{{/if}}

{{#if llmProvider}}
## LLM Configuration

- **Provider**: {{llmProvider}}
- **Model**: {{llmModel}}
- **Temperature**: {{llmTemperature}}
- **Max Tokens**: {{llmMaxTokens}}
{{/if}}

## Generated from OSSA

This agent was generated from an OSSA {{apiVersion}} manifest.

Original manifest: \`agent.ossa.yaml\`

## License

{{license}}
`,
    data
  );

  // Append additional sections
  if (sections?.additional) {
    for (const section of sections.additional) {
      readme += `\n## ${section.title}\n\n${section.content}\n`;
    }
  }

  // Append footer
  if (sections?.footer) {
    readme += `\n---\n\n${sections.footer}\n`;
  }

  return readme;
}

/**
 * Default install commands per platform
 */
function getDefaultInstallCommand(platform: Platform): string {
  switch (platform) {
    case 'langchain':
      return 'pip install -r requirements.txt\n# or\nnpm install';
    case 'mcp':
      return 'npm install\nnpm run build';
    case 'npm':
      return 'npm install';
    case 'crewai':
      return 'pip install -r requirements.txt';
    case 'docker':
      return 'docker build -t agent .';
    case 'kubernetes':
      return 'kubectl apply -f deployment.yaml';
    default:
      return 'npm install';
  }
}

/**
 * Default usage snippets per platform
 */
function getDefaultUsage(platform: Platform, name: string): string {
  switch (platform) {
    case 'langchain':
      return `python ${name}.py\n# or\nnpm start`;
    case 'mcp':
      return 'npm start';
    case 'npm':
      return `import agent from '${name}';\nconsole.log(agent.metadata);`;
    case 'crewai':
      return 'python main.py';
    case 'docker':
      return 'docker run agent';
    case 'kubernetes':
      return 'kubectl get pods';
    default:
      return 'npm start';
  }
}

// ──────────────────────────────────────────────────────────────────
// LICENSE Generation
// ──────────────────────────────────────────────────────────────────

/**
 * License templates keyed by SPDX identifier
 */
const LICENSE_TEMPLATES: Record<string, (year: number) => string> = {
  MIT: (year) => `MIT License

Copyright (c) ${year}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,

  'Apache-2.0': (year) => `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright ${year}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,

  ISC: (year) => `ISC License

Copyright (c) ${year}

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`,
};

/**
 * Generate LICENSE file content.
 *
 * @param type - SPDX license identifier (e.g., "MIT", "Apache-2.0", "ISC")
 * @returns License text (defaults to MIT if unknown)
 */
export function generateLicense(type: string): string {
  const year = new Date().getFullYear();
  const generator = LICENSE_TEMPLATES[type] || LICENSE_TEMPLATES['MIT'];
  return generator(year);
}

// ──────────────────────────────────────────────────────────────────
// CHANGELOG Generation
// ──────────────────────────────────────────────────────────────────

/**
 * Generate an initial CHANGELOG.md from an OSSA manifest.
 *
 * @param manifest - OSSA agent manifest
 * @returns CHANGELOG content
 */
export function generateChangelog(manifest: OssaAgent): string {
  const version = manifest.metadata?.version || '1.0.0';
  const name = manifest.metadata?.name || 'Agent';
  const today = new Date().toISOString().split('T')[0];

  return `# Changelog

All notable changes to ${name} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [${version}] - ${today}

### Added
- Initial release generated from OSSA manifest
- Agent configuration and metadata
${manifest.spec?.tools && Array.isArray(manifest.spec.tools) && manifest.spec.tools.length > 0 ? `- ${manifest.spec.tools.length} tool(s) configured\n` : ''}`;
}

// ──────────────────────────────────────────────────────────────────
// Utility Functions
// ──────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────
// Perfect Agent File Generation (standalone orchestrator)
// ──────────────────────────────────────────────────────────────────

/**
 * Options for standalone perfect agent file generation.
 */
export interface PerfectAgentOptions {
  includeAgentCard?: boolean;
  includeAgentsMd?: boolean;
  includeEvals?: boolean;
  includeGovernance?: boolean;
  includeObservability?: boolean;
  includeSkill?: boolean;
  includeTeam?: boolean;
  platform?: string;
}

interface GeneratedFile {
  path: string;
  content: string;
  type: 'code' | 'config' | 'documentation' | 'test' | 'other';
  language?: string;
}

/**
 * Standalone perfect agent file generator.
 * Use this from CLI or non-adapter contexts.
 * Delegates to generatePerfectAgentBundle for actual file generation.
 *
 * @param manifest - OSSA agent manifest
 * @param options - Which sections to include (all enabled by default)
 * @returns Array of generated files
 */
export async function generatePerfectAgentFiles(
  manifest: OssaAgent,
  options?: PerfectAgentOptions
): Promise<GeneratedFile[]> {
  return generatePerfectAgentBundle(manifest, options);
}

/**
 * Sanitize a string for use as an npm package name.
 *
 * @param name - Raw name
 * @returns Sanitized npm-compatible name
 */
export function sanitizePackageName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

/**
 * Extract common metadata from an OSSA manifest in a normalized format
 * suitable for file generation.
 *
 * @param manifest - OSSA agent manifest
 * @returns Normalized metadata
 */
export function extractMetadata(manifest: OssaAgent): {
  name: string;
  version: string;
  description: string;
  role: string;
  license: string;
  author: string | undefined;
  apiVersion: string;
} {
  return {
    name: manifest.metadata?.name || 'agent',
    version: manifest.metadata?.version || '1.0.0',
    description: manifest.metadata?.description || '',
    role: (manifest.spec?.role as string) || '',
    license: manifest.metadata?.license || 'MIT',
    author: manifest.metadata?.author as string | undefined,
    apiVersion: manifest.apiVersion?.split('/')[1] || 'v0.4.1',
  };
}

// ──────────────────────────────────────────────────────────────────
// Multi-Agent Team File Generation
// ──────────────────────────────────────────────────────────────────

/**
 * Generate team scaffolding files from manifest spec.team.
 *
 * @param manifest - OSSA agent manifest with spec.team
 * @param platform - Target platform for code generation
 * @returns Array of ExportFile objects
 */
export function generateTeamFilesForExport(
  manifest: OssaAgent,
  platform: TeamTargetPlatform = 'generic',
  includeDocumentation = true
): ExportFile[] {
  if (!isMultiAgentManifest(manifest)) return [];

  const files: ExportFile[] = [];

  const teamFiles = generateTeamFiles(manifest, {
    platform,
    includeDocumentation,
  });
  for (const tf of teamFiles) {
    files.push({
      path: tf.path,
      content: tf.content,
      type: tf.type as ExportFile['type'],
      language: tf.language,
    });
  }

  const subagentFiles = generateSubagentFiles(manifest, { platform });
  for (const sf of subagentFiles) {
    files.push({
      path: sf.path,
      content: sf.content,
      type: sf.type as ExportFile['type'],
      language: sf.language,
    });
  }

  return files;
}

/**
 * Generate AGENTS.md file from manifest with team topology awareness.
 *
 * @param manifest - OSSA agent manifest
 * @returns ExportFile for AGENTS.md
 */
export function generateAgentsMdFile(manifest: OssaAgent): ExportFile {
  const content = generateAgentsMd(manifest);
  return {
    path: 'AGENTS.md',
    content,
    type: 'documentation',
    language: 'markdown',
  };
}

/**
 * Generate the complete "perfect agent" bundle: AGENTS.md + team scaffolding +
 * evals + governance + observability.
 *
 * @param manifest - OSSA agent manifest
 * @param options - Export options controlling which parts are included
 * @param platform - Target platform for team code generation
 * @returns Array of ExportFile objects
 */
export function generatePerfectAgentBundle(
  manifest: OssaAgent,
  options?: ExportOptions,
  platform: TeamTargetPlatform = 'generic'
): ExportFile[] {
  const files: ExportFile[] = [];
  const isPerfect = options?.perfectAgent;

  if (isPerfect || options?.includeAgentsMd) {
    files.push(generateAgentsMdFile(manifest));
  }

  if (isPerfect || options?.includeTeam) {
    files.push(...generateTeamFilesForExport(manifest, platform));
  }

  if (isPerfect || options?.includeEvals) {
    files.push(generateEvalStubs(manifest));
  }

  if (isPerfect || options?.includeGovernance) {
    files.push(generateGovernanceConfig(manifest));
  }

  if (isPerfect || options?.includeObservability) {
    files.push(generateObservabilityConfig(manifest));
  }

  return files;
}
