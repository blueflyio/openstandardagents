/**
 * OSSA API Documentation Generator
 * Generates beautiful API documentation from OpenAPI specs
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface DocGenOptions {
  format?: 'redoc' | 'swagger' | 'both';
  output?: string;
}

export async function main(options: DocGenOptions = {}) {
  try {
    console.log(chalk.blue('🚀 OSSA API Documentation Generator'));
    console.log(chalk.blue('===================================='));
    console.log('');

    const OSSA_DIR = '/Users/flux423/Sites/LLM/OSSA';
    const API_DIR = `${OSSA_DIR}/src/api`;
    const DOCS_DIR = `${OSSA_DIR}/docs`;
    const OUTPUT_DIR = options.output || `${DOCS_DIR}/api`;

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(chalk.green(`✅ Created output directory: ${OUTPUT_DIR}`));
    }

    // Find all OpenAPI specs
    const specs = findOpenAPISpecs(API_DIR);
    console.log(chalk.blue(`📋 Found ${specs.length} OpenAPI specifications`));

    if (specs.length === 0) {
      console.log(chalk.yellow('⚠️  No OpenAPI specs found'));
      return;
    }

    // Generate documentation for each spec
    for (const spec of specs) {
      console.log(chalk.blue(`\n📖 Generating documentation for: ${spec.name}`));

      if (options.format === 'swagger' || options.format === 'both' || !options.format) {
        generateSwaggerDocs(spec, OUTPUT_DIR);
      }

      if (options.format === 'redoc' || options.format === 'both' || !options.format) {
        generateRedocDocs(spec, OUTPUT_DIR);
      }
    }

    console.log(chalk.green('\n✅ Documentation generation complete!'));
    console.log(chalk.cyan(`📁 Output directory: ${OUTPUT_DIR}`));
  } catch (error) {
    console.error(chalk.red('❌ Error generating API documentation:'), error);
    process.exit(1);
  }
}

interface SpecInfo {
  name: string;
  path: string;
  relativePath: string;
}

function findOpenAPISpecs(directory: string): SpecInfo[] {
  const specs: SpecInfo[] = [];

  function searchDirectory(dir: string) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        searchDirectory(fullPath);
      } else if (item.endsWith('.openapi.yml') || item.endsWith('.openapi.yaml')) {
        specs.push({
          name: item.replace(/\.openapi\.ya?ml$/, ''),
          path: fullPath,
          relativePath: path.relative(directory, fullPath)
        });
      }
    }
  }

  searchDirectory(directory);
  return specs;
}

function generateSwaggerDocs(spec: SpecInfo, outputDir: string): void {
  try {
    const outputFile = path.join(outputDir, `${spec.name}-swagger.html`);

    // Simple HTML template for Swagger UI
    const swaggerHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>${spec.name} API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@latest/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@latest/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '${spec.relativePath}',
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.presets.standalone
      ]
    });
  </script>
</body>
</html>`;

    fs.writeFileSync(outputFile, swaggerHTML);
    console.log(chalk.green(`  ✅ Generated Swagger UI: ${outputFile}`));
  } catch (error) {
    console.error(chalk.red(`  ❌ Failed to generate Swagger docs for ${spec.name}:`), error);
  }
}

function generateRedocDocs(spec: SpecInfo, outputDir: string): void {
  try {
    const outputFile = path.join(outputDir, `${spec.name}-redoc.html`);

    // Simple HTML template for ReDoc
    const redocHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>${spec.name} API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <redoc spec-url='${spec.relativePath}'></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;

    fs.writeFileSync(outputFile, redocHTML);
    console.log(chalk.green(`  ✅ Generated ReDoc: ${outputFile}`));
  } catch (error) {
    console.error(chalk.red(`  ❌ Failed to generate ReDoc for ${spec.name}:`), error);
  }
}

// CLI execution
if (require.main === module) {
  const format = process.argv.find((arg) => ['redoc', 'swagger', 'both'].includes(arg)) as
    | 'redoc'
    | 'swagger'
    | 'both'
    | undefined;
  const outputIndex = process.argv.indexOf('--output') || process.argv.indexOf('-o');
  const output = outputIndex > -1 ? process.argv[outputIndex + 1] : undefined;

  main({ format, output });
}
