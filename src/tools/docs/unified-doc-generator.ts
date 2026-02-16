#!/usr/bin/env tsx
/**
 * Unified Documentation Generator
 *
 * Consolidates all doc generation scripts into a single DRY implementation
 *
 * Usage: npm run docs:generate [-- --type api|cli|schema|examples|all]
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'fs';
import { join, basename, relative } from 'path';
import yaml from 'js-yaml';

interface GeneratorConfig {
  name: string;
  inputDir: string;
  outputDir: string;
  filePattern: string;
  processor: (file: string) => string;
}

class UnifiedDocGenerator {
  private configs: Map<string, GeneratorConfig> = new Map();

  constructor() {
    this.registerGenerators();
  }

  private registerGenerators() {
    // API Docs Generator
    this.configs.set('api', {
      name: 'API Documentation',
      inputDir: join(process.cwd(), 'openapi'),
      outputDir: join(process.cwd(), 'docs/api-reference'),
      filePattern: '**/*.openapi.yaml',
      processor: this.generateAPIDoc.bind(this),
    });

    // CLI Docs Generator
    this.configs.set('cli', {
      name: 'CLI Documentation',
      inputDir: join(process.cwd(), 'src/cli/commands'),
      outputDir: join(process.cwd(), 'docs/api-reference'),
      filePattern: '**/*.command.ts',
      processor: this.generateCLIDoc.bind(this),
    });

    // Schema Docs Generator
    this.configs.set('schema', {
      name: 'Schema Documentation',
      inputDir: join(process.cwd(), 'spec'),
      outputDir: join(process.cwd(), 'docs/api-reference/schemas'),
      filePattern: '**/*.schema.json',
      processor: this.generateSchemaDoc.bind(this),
    });

    // Examples Docs Generator
    this.configs.set('examples', {
      name: 'Examples Documentation',
      inputDir: join(process.cwd(), 'examples'),
      outputDir: join(process.cwd(), 'docs/api-reference/examples'),
      filePattern: '**/*.ossa.yaml',
      processor: this.generateExampleDoc.bind(this),
    });
  }

  private generateAPIDoc(filePath: string): string {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const spec = yaml.load(content, { schema: yaml.JSON_SCHEMA }) as any;

      if (!spec.openapi || !spec.info) {
        return '';
      }

      let doc = `# ${spec.info.title}\n\n`;
      doc += `${spec.info.description || ''}\n\n`;
      doc += `**Version**: ${spec.info.version}\n`;
      doc += `**OpenAPI**: ${spec.openapi}\n\n`;

      if (spec.servers && spec.servers.length > 0) {
        doc += `## Servers\n\n`;
        spec.servers.forEach((server: any) => {
          doc += `- **${server.description || 'Default'}**: \`${server.url}\`\n`;
        });
        doc += '\n';
      }

      if (spec.paths) {
        doc += `## Endpoints\n\n`;
        Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
          Object.entries(methods).forEach(
            ([method, operation]: [string, any]) => {
              const op = operation as any;
              doc += `### \`${method.toUpperCase()} ${path}\`\n\n`;
              doc += `${op.summary || ''}\n\n`;
              if (op.description) {
                doc += `${op.description}\n\n`;
              }
            }
          );
        });
      }

      return doc;
    } catch (error) {
      console.warn(
        `⚠️  Failed to process ${filePath}: ${(error as Error).message}`
      );
      return '';
    }
  }

  private generateCLIDoc(filePath: string): string {
    const content = readFileSync(filePath, 'utf-8');
    const commandName = basename(filePath, '.command.ts');

    // Extract command description from JSDoc or default
    const descriptionMatch = content.match(/description:\s*['"]([^'"]+)['"]/);
    const description = descriptionMatch
      ? descriptionMatch[1]
      : `OSSA ${commandName} command`;

    let doc = `# ossa ${commandName}\n\n`;
    doc += `${description}\n\n`;
    doc += `## Usage\n\n`;
    doc += `\`\`\`bash\nossa ${commandName} [options]\n\`\`\`\n\n`;

    return doc;
  }

  private generateSchemaDoc(filePath: string): string {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const schema = JSON.parse(content);

      let doc = `# ${schema.title || basename(filePath, '.schema.json')}\n\n`;
      doc += `${schema.description || ''}\n\n`;

      if (schema.properties) {
        doc += `## Properties\n\n`;
        Object.entries(schema.properties).forEach(
          ([key, prop]: [string, any]) => {
            doc += `### \`${key}\`\n\n`;
            doc += `**Type**: \`${prop.type || 'unknown'}\`\n\n`;
            if (prop.description) {
              doc += `${prop.description}\n\n`;
            }
          }
        );
      }

      return doc;
    } catch (error) {
      console.warn(
        `⚠️  Failed to process ${filePath}: ${(error as Error).message}`
      );
      return '';
    }
  }

  private generateExampleDoc(filePath: string): string {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const example = yaml.load(content, { schema: yaml.JSON_SCHEMA }) as any;

      const name = example.metadata?.name || basename(filePath, '.ossa.yaml');

      let doc = `# ${name}\n\n`;
      if (example.metadata?.description) {
        doc += `${example.metadata.description}\n\n`;
      }
      doc += `\`\`\`yaml\n${content}\`\`\`\n\n`;

      return doc;
    } catch (error) {
      console.warn(
        `⚠️  Failed to process ${filePath}: ${(error as Error).message}`
      );
      return '';
    }
  }

  private findFiles(dir: string, pattern: string): string[] {
    const files: string[] = [];

    function walk(currentDir: string) {
      try {
        const entries = readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(currentDir, entry.name);

          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (entry.isFile()) {
            // Simple pattern matching
            if (pattern.includes('**')) {
              const regex = new RegExp(
                pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
              );
              if (regex.test(relative(dir, fullPath))) {
                files.push(fullPath);
              }
            } else if (entry.name.match(pattern.replace(/\*/g, '.*'))) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

    walk(dir);
    return files;
  }

  async generate(type: string = 'all'): Promise<void> {
    const types = type === 'all' ? Array.from(this.configs.keys()) : [type];

    console.log('🚀 Unified Documentation Generator\n');

    for (const genType of types) {
      const config = this.configs.get(genType);
      if (!config) {
        console.warn(`⚠️  Unknown generator type: ${genType}`);
        continue;
      }

      console.log(`📝 Generating ${config.name}...`);

      // Create output directory
      mkdirSync(config.outputDir, { recursive: true });

      // Find files
      const files = this.findFiles(config.inputDir, config.filePattern);

      if (files.length === 0) {
        console.log(`   ℹ️  No files found matching ${config.filePattern}`);
        continue;
      }

      console.log(`   📁 Found ${files.length} file(s)`);

      let generated = 0;
      for (const file of files) {
        const doc = config.processor(file);
        if (doc) {
          const outputFile = join(
            config.outputDir,
            basename(file).replace(/\.(ts|yaml|json)$/, '.md')
          );
          writeFileSync(outputFile, doc);
          generated++;
        }
      }

      console.log(`   ✅ Generated ${generated} documentation file(s)\n`);
    }

    console.log('✅ Documentation generation complete!');
  }
}

// CLI interface
const type = process.argv[2]?.replace('--type=', '') || 'all';
const generator = new UnifiedDocGenerator();
generator.generate(type).catch((error) => {
  console.error('❌ Error generating documentation:', error);
  process.exit(1);
});
