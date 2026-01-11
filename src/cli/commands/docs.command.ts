/**
 * OSSA Docs Command
 * Generate documentation from agent manifests
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import type { OssaAgent } from '../../types/index.js';

function generateMarkdown(manifests: Array<{ path: string; manifest: OssaAgent }>): string {
  let md = '# OSSA Agent Documentation\n\n';
  md += `Generated from ${manifests.length} agent manifest(s)\n\n`;

  for (const { manifest, path: filePath } of manifests) {
    const name = manifest.metadata?.name || manifest.agent?.name || 'Unknown';
    const version = manifest.metadata?.version || manifest.agent?.version || 'Unknown';
    const description = manifest.metadata?.description || manifest.agent?.description || '';

    md += `## ${name}\n\n`;
    md += `**Version:** ${version}\n\n`;
    if (description) {
      md += `${description}\n\n`;
    }

    // Role
    if (manifest.spec?.role || manifest.agent?.role) {
      md += `### Role\n\n${manifest.spec?.role || manifest.agent?.role}\n\n`;
    }

    // LLM Configuration
    const llm = manifest.spec?.llm || manifest.agent?.llm;
    if (llm) {
      md += `### LLM Configuration\n\n`;
      md += `- **Provider:** ${llm.provider || 'N/A'}\n`;
      md += `- **Model:** ${llm.model || 'N/A'}\n`;
      if (llm.temperature !== undefined) {
        md += `- **Temperature:** ${llm.temperature}\n`;
      }
      md += `\n`;
    }

    // Capabilities
    const capabilities = manifest.agent?.capabilities || [];
    if (capabilities.length > 0) {
      md += `### Capabilities\n\n`;
      for (const cap of capabilities) {
        md += `#### ${cap.name}\n\n`;
        if (cap.description) {
          md += `${cap.description}\n\n`;
        }
        md += `**Input Schema:**\n\`\`\`json\n${JSON.stringify(cap.input_schema, null, 2)}\n\`\`\`\n\n`;
        md += `**Output Schema:**\n\`\`\`json\n${JSON.stringify(cap.output_schema, null, 2)}\n\`\`\`\n\n`;
      }
    }

    // Tools
    if (manifest.spec?.tools && manifest.spec.tools.length > 0) {
      md += `### Tools\n\n`;
      for (const tool of manifest.spec.tools) {
        md += `- **${tool.name || tool.type}** (${tool.type})\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
  }

  return md;
}

function generateHTML(manifests: Array<{ path: string; manifest: OssaAgent }>): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>OSSA Agent Documentation</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #555; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h3 { color: #777; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .nav { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .nav a { margin-right: 15px; text-decoration: none; color: #0066cc; }
  </style>
</head>
<body>
  <h1>OSSA Agent Documentation</h1>
  <p>Generated from ${manifests.length} agent manifest(s)</p>
  <div class="nav">
`;

  for (const { manifest } of manifests) {
    const name = manifest.metadata?.name || manifest.agent?.name || 'Unknown';
    html += `    <a href="#${name.toLowerCase().replace(/\s+/g, '-')}">${name}</a>\n`;
  }

  html += `  </div>\n`;

  for (const { manifest } of manifests) {
    const name = manifest.metadata?.name || manifest.agent?.name || 'Unknown';
    const version = manifest.metadata?.version || manifest.agent?.version || 'Unknown';
    const description = manifest.metadata?.description || manifest.agent?.description || '';

    html += `  <h2 id="${name.toLowerCase().replace(/\s+/g, '-')}">${name}</h2>\n`;
    html += `  <p><strong>Version:</strong> ${version}</p>\n`;
    if (description) {
      html += `  <p>${description}</p>\n`;
    }

    if (manifest.spec?.role || manifest.agent?.role) {
      html += `  <h3>Role</h3>\n  <p>${manifest.spec?.role || manifest.agent?.role}</p>\n`;
    }

    const llm = manifest.spec?.llm || manifest.agent?.llm;
    if (llm) {
      html += `  <h3>LLM Configuration</h3>\n  <ul>\n`;
      html += `    <li><strong>Provider:</strong> ${llm.provider || 'N/A'}</li>\n`;
      html += `    <li><strong>Model:</strong> ${llm.model || 'N/A'}</li>\n`;
      if (llm.temperature !== undefined) {
        html += `    <li><strong>Temperature:</strong> ${llm.temperature}</li>\n`;
      }
      html += `  </ul>\n`;
    }

    const capabilities = manifest.agent?.capabilities || [];
    if (capabilities.length > 0) {
      html += `  <h3>Capabilities</h3>\n`;
      for (const cap of capabilities) {
        html += `    <h4>${cap.name}</h4>\n`;
        if (cap.description) {
          html += `    <p>${cap.description}</p>\n`;
        }
        html += `    <p><strong>Input Schema:</strong></p>\n`;
        html += `    <pre><code>${JSON.stringify(cap.input_schema, null, 2)}</code></pre>\n`;
        html += `    <p><strong>Output Schema:</strong></p>\n`;
        html += `    <pre><code>${JSON.stringify(cap.output_schema, null, 2)}</code></pre>\n`;
      }
    }

    html += `  <hr>\n`;
  }

  html += `</body>\n</html>`;
  return html;
}

function generateOpenAPI(manifests: Array<{ path: string; manifest: OssaAgent }>): any {
  const openapi: any = {
    openapi: '3.1.0',
    info: {
      title: 'OSSA Agents API',
      version: '0.3.0',
      description: 'API documentation generated from OSSA agent manifests',
    },
    paths: {},
    components: {
      schemas: {},
    },
  };

  for (const { manifest } of manifests) {
    const agentName = manifest.metadata?.name || manifest.agent?.name || 'agent';
    const capabilities = manifest.agent?.capabilities || [];

    for (const cap of capabilities) {
      const path = `/agents/${agentName}/capabilities/${cap.name}`;
      openapi.paths[path] = {
        post: {
          summary: cap.description || cap.name,
          requestBody: {
            content: {
              'application/json': {
                schema: cap.input_schema || {},
              },
            },
          },
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: cap.output_schema || {},
                },
              },
            },
          },
        },
      };
    }
  }

  return openapi;
}

function generateCatalog(manifests: Array<{ path: string; manifest: OssaAgent }>): any {
  return {
    version: '0.3.0',
    generated: new Date().toISOString(),
    agents: manifests.map(({ manifest, path: filePath }) => ({
      name: manifest.metadata?.name || manifest.agent?.name,
      version: manifest.metadata?.version || manifest.agent?.version,
      description: manifest.metadata?.description || manifest.agent?.description,
      role: manifest.spec?.role || manifest.agent?.role,
      source: filePath,
      capabilities: (manifest.agent?.capabilities || []).map((cap: any) => ({
        name: cap.name,
        description: cap.description,
      })),
    })),
  };
}

export const docsCommand = new Command('docs')
  .argument('<path>', 'Path to OSSA manifest or directory')
  .option('-f, --format <format>', 'Output format (markdown, html, openapi, catalog)', 'markdown')
  .option('-o, --output <dir>', 'Output directory', '.')
  .option('--catalog', 'Generate agent catalog JSON')
  .description('Generate documentation from OSSA agent manifests')
  .action(
    async (
      manifestPath: string,
      options: {
        format?: string;
        output?: string;
        catalog?: boolean;
      }
    ) => {
      try {
        const manifestRepo = container.get(ManifestRepository);
        const manifests: Array<{ path: string; manifest: OssaAgent }> = [];
        const stat = fs.statSync(manifestPath);

        if (stat.isDirectory()) {
          const findManifests = async (dir: string): Promise<void> => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
                await findManifests(fullPath);
              } else if (
                entry.isFile() &&
                (entry.name.endsWith('.ossa.yaml') || entry.name.endsWith('.ossa.yml'))
              ) {
                try {
                  const manifest = await manifestRepo.load(fullPath);
                  manifests.push({ path: fullPath, manifest });
                } catch (error: any) {
                  console.warn(chalk.yellow(`Failed to load ${fullPath}: ${error.message}`));
                }
              }
            }
          };
          await findManifests(manifestPath);
        } else {
          const manifest = await manifestRepo.load(manifestPath);
          manifests.push({ path: manifestPath, manifest });
        }

        if (manifests.length === 0) {
          console.error(chalk.red('No valid OSSA manifests found'));
          process.exit(1);
        }

        const outputDir = path.resolve(options.output || '.');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(chalk.blue(`Generating ${options.format} documentation from ${manifests.length} manifest(s)...`));

        let output: string;
        let filename: string;

        if (options.format === 'markdown' || options.format === 'md') {
          output = generateMarkdown(manifests);
          filename = 'docs.md';
        } else if (options.format === 'html') {
          output = generateHTML(manifests);
          filename = 'docs.html';
        } else if (options.format === 'openapi') {
          const openapi = generateOpenAPI(manifests);
          output = JSON.stringify(openapi, null, 2);
          filename = 'openapi.json';
        } else if (options.format === 'catalog' || options.catalog) {
          const catalog = generateCatalog(manifests);
          output = JSON.stringify(catalog, null, 2);
          filename = 'catalog.json';
        } else {
          console.error(chalk.red(`Unknown format: ${options.format}`));
          console.log(chalk.blue('Available formats: markdown, html, openapi, catalog'));
          process.exit(1);
          return; // TypeScript control flow
        }

        const outputPath = path.join(outputDir, filename);
        fs.writeFileSync(outputPath, output, 'utf-8');
        console.log(chalk.green(`✓ Documentation written to ${outputPath}`));
      } catch (error: any) {
        console.error(chalk.red('[ERROR]'), error.message);
        if (error.stack) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    }
  );
