/**
 * Base NPM Package Generator
 * Provides shared npm package generation logic for all adapters
 *
 * SOLID: Single Responsibility - NPM package structure generation
 * DRY: Shared by NPM adapter and GitLab package generator
 */

import type { OssaAgent } from '../../types/index.js';

export interface PackageJsonOptions {
  /** Package scope (e.g., '@ossa', '@gitlab-duo') */
  scope?: string;
  /** Package name */
  name: string;
  /** Package version */
  version: string;
  /** Package description */
  description: string;
  /** Main entry point */
  main?: string;
  /** TypeScript types entry point */
  types?: string;
  /** Module type */
  type?: 'module' | 'commonjs';
  /** NPM scripts */
  scripts?: Record<string, string>;
  /** Dependencies */
  dependencies?: Record<string, string>;
  /** Dev dependencies */
  devDependencies?: Record<string, string>;
  /** Peer dependencies */
  peerDependencies?: Record<string, string>;
  /** Node engine requirement */
  engines?: Record<string, string>;
  /** Package keywords */
  keywords?: string[];
  /** Author */
  author?: string;
  /** License */
  license?: string;
  /** Repository URL */
  repository?: string;
  /** Homepage URL */
  homepage?: string;
  /** Bugs URL */
  bugs?: string;
  /** Files to include in package */
  files?: string[];
  /** Additional fields */
  [key: string]: any;
}

export class BasePackageGenerator {
  /**
   * Generate package.json content
   */
  protected generatePackageJson(options: PackageJsonOptions): string {
    const pkg: Record<string, any> = {
      name: options.scope ? `${options.scope}/${options.name}` : options.name,
      version: options.version,
      description: options.description,
    };

    // Add optional fields only if provided
    if (options.type) pkg.type = options.type;
    if (options.main) pkg.main = options.main;
    if (options.types) pkg.types = options.types;
    if (options.scripts) pkg.scripts = options.scripts;
    if (options.keywords && options.keywords.length > 0) pkg.keywords = options.keywords;
    if (options.author) pkg.author = options.author;
    if (options.license) pkg.license = options.license;

    if (options.repository) {
      pkg.repository = {
        type: 'git',
        url: options.repository,
      };
    }

    if (options.bugs) {
      pkg.bugs = {
        url: options.bugs,
      };
    }

    if (options.homepage) pkg.homepage = options.homepage;
    if (options.files && options.files.length > 0) pkg.files = options.files;
    if (options.dependencies && Object.keys(options.dependencies).length > 0) {
      pkg.dependencies = options.dependencies;
    }
    if (options.devDependencies && Object.keys(options.devDependencies).length > 0) {
      pkg.devDependencies = options.devDependencies;
    }
    if (options.peerDependencies && Object.keys(options.peerDependencies).length > 0) {
      pkg.peerDependencies = options.peerDependencies;
    }
    if (options.engines && Object.keys(options.engines).length > 0) {
      pkg.engines = options.engines;
    }

    // Add any additional fields not explicitly handled
    const handledKeys = new Set([
      'scope', 'name', 'version', 'description', 'type', 'main', 'types',
      'scripts', 'keywords', 'author', 'license', 'repository', 'bugs',
      'homepage', 'files', 'dependencies', 'devDependencies', 'peerDependencies', 'engines'
    ]);

    for (const [key, value] of Object.entries(options)) {
      if (!handledKeys.has(key) && value !== undefined) {
        pkg[key] = value;
      }
    }

    return JSON.stringify(pkg, null, 2);
  }

  /**
   * Generate TypeScript configuration
   */
  protected generateTsConfig(): string {
    const config = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ES2022',
        moduleResolution: 'node',
        lib: ['ES2022'],
        outDir: './dist',
        rootDir: './src',
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.ts'],
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Generate .gitignore content
   */
  protected generateGitignore(): string {
    return `# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Build output
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
`;
  }

  /**
   * Generate .npmignore content
   */
  protected generateNpmignore(): string {
    return `# Source files
src/
tsconfig.json

# Development files
.eslintrc.*
.prettierrc
.editorconfig

# Testing
*.test.ts
*.spec.ts
coverage/
.nyc_output/

# Documentation source
docs/

# CI/CD
.gitlab-ci.yml
.github/

# Git
.git/
.gitignore

# IDE
.vscode/
.idea/
`;
  }

  /**
   * Extract agent name from manifest
   */
  protected getAgentName(manifest: OssaAgent): string {
    return manifest.metadata?.name || 'unknown-agent';
  }

  /**
   * Extract agent version from manifest
   */
  protected getAgentVersion(manifest: OssaAgent): string {
    return manifest.metadata?.version || '1.0.0';
  }

  /**
   * Extract agent description from manifest
   */
  protected getAgentDescription(manifest: OssaAgent): string {
    return manifest.metadata?.description || '';
  }

  /**
   * Extract agent author from manifest
   */
  protected getAgentAuthor(manifest: OssaAgent): string {
    return (manifest.metadata?.author as string) || '';
  }

  /**
   * Extract agent license from manifest
   */
  protected getAgentLicense(manifest: OssaAgent): string {
    return manifest.metadata?.license || 'MIT';
  }

  /**
   * Sanitize package name for npm
   */
  protected sanitizePackageName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }
}
