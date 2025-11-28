#!/usr/bin/env tsx
/**
 * Generate API documentation from OpenAPI specifications
 * 
 * Usage: npm run docs:api:generate
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import yaml from 'js-yaml';

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

const OPENAPI_DIR = join(process.cwd(), 'openapi');
const OUTPUT_DIR = join(process.cwd(), 'website/content/docs/api-reference');

function generateEndpointDoc(path: string, method: string, operation: any): string {
  const methodUpper = method.toUpperCase();
  let doc = `### ${operation.summary || `${methodUpper} ${path}`}\n\n`;
  
  doc += '```http\n';
  doc += `${methodUpper} ${path}\n`;
  doc += '```\n\n';
  
  if (operation.description) {
    doc += `**Description**: ${operation.description}\n\n`;
  }
  
  // Parameters
  if (operation.parameters && operation.parameters.length > 0) {
    doc += '**Parameters**:\n\n';
    for (const param of operation.parameters) {
      const required = param.required ? ', required' : '';
      doc += `- \`${param.name}\` (${param.in}${required}) - ${param.description || 'No description'}\n`;
    }
    doc += '\n';
  }
  
  // Request body
  if (operation.requestBody) {
    doc += '**Request Body**:\n\n';
    const content = operation.requestBody.content;
    if (content && content['application/json']) {
      doc += '```json\n';
      doc += JSON.stringify(content['application/json'].example || {}, null, 2);
      doc += '\n```\n\n';
    }
  }
  
  // Responses
  if (operation.responses) {
    doc += '**Responses**:\n\n';
    for (const [code, response] of Object.entries(operation.responses)) {
      doc += `**${code}**: ${(response as any).description}\n\n`;
      const content = (response as any).content;
      if (content && content['application/json']) {
        doc += '```json\n';
        doc += JSON.stringify(content['application/json'].example || {}, null, 2);
        doc += '\n```\n\n';
      }
    }
  }
  
  // Example
  doc += '**Example**:\n\n';
  doc += '```bash\n';
  doc += `curl -X ${methodUpper} "https://api.ossa.dev${path}" \\\n`;
  doc += '  -H "Authorization: Bearer YOUR_TOKEN"';
  if (operation.requestBody) {
    doc += ' \\\n  -H "Content-Type: application/json" \\\n  -d @request.json';
  }
  doc += '\n```\n\n';
  
  return doc;
}

function generateAPIDoc(spec: OpenAPISpec, filename: string): string {
  const apiName = spec.info.title;
  const apiVersion = spec.info.version;
  
  let doc = `# ${apiName}\n\n`;
  doc += `**Version**: ${apiVersion}\n\n`;
  
  if (spec.info.description) {
    doc += `${spec.info.description}\n\n`;
  }
  
  doc += '## Base URL\n\n';
  if (spec.servers && spec.servers.length > 0) {
    for (const server of spec.servers) {
      doc += `- \`${server.url}\``;
      if (server.description) {
        doc += ` - ${server.description}`;
      }
      doc += '\n';
    }
  } else {
    doc += '`https://api.ossa.dev`\n';
  }
  doc += '\n';
  
  // Authentication
  if (spec.components?.securitySchemes) {
    doc += '## Authentication\n\n';
    doc += 'This API requires authentication. See [Authentication Guide](../authentication.md) for details.\n\n';
  }
  
  // Endpoints
  doc += '## Endpoints\n\n';
  
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
        doc += generateEndpointDoc(path, method, operation);
      }
    }
  }
  
  // Related documentation
  doc += '## Related Documentation\n\n';
  doc += '- [CLI Reference](../cli-reference/index.md)\n';
  doc += '- [Schema Reference](../schema-reference/index.md)\n';
  doc += '- [Authentication Guide](../authentication.md)\n';
  
  return doc;
}

function main() {
  console.log('🚀 Generating API documentation...\n');
  
  // Create output directory
  mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Process core APIs
  const coreDir = join(OPENAPI_DIR, 'core');
  const coreFiles = readdirSync(coreDir).filter(f => f.endsWith('.yaml'));
  
  console.log(`📁 Processing ${coreFiles.length} core API specs...\n`);
  
  for (const file of coreFiles) {
    try {
      const specPath = join(coreDir, file);
      const specContent = readFileSync(specPath, 'utf-8');
      const spec = yaml.load(specContent) as OpenAPISpec;
      
      const docContent = generateAPIDoc(spec, file);
      const outputFile = join(OUTPUT_DIR, file.replace('.openapi.yaml', '.md'));
      
      writeFileSync(outputFile, docContent);
      console.log(`✅ Generated: ${basename(outputFile)}`);
    } catch (error) {
      console.log(`⚠️  Skipped: ${file} (${(error as Error).message})`);
    }
  }
  
  // Generate index
  const indexContent = `# API Reference

Welcome to the OSSA API Reference documentation.

## Core APIs

${coreFiles.map(f => {
  const name = f.replace('.openapi.yaml', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const link = f.replace('.openapi.yaml', '.md');
  return `- [${name}](${link})`;
}).join('\n')}

## Authentication

All API endpoints require authentication. See the [Authentication Guide](./authentication.md) for details.

## Rate Limiting

- 100 requests per minute per API key
- 1000 requests per hour per API key

## Error Responses

All APIs use standard HTTP status codes and return errors in the following format:

\`\`\`json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": []
}
\`\`\`

## Support

For API support, please:
- Check the [Troubleshooting Guide](../guides/troubleshooting.md)
- Open an issue on [GitLab](https://gitlab.com/blueflyio/openstandardagents/-/issues)
- Join our [Discord community](https://discord.gg/ossa)
`;
  
  writeFileSync(join(OUTPUT_DIR, 'index.md'), indexContent);
  console.log(`✅ Generated: index.md`);
  
  console.log(`\n✨ API documentation generated successfully!`);
  console.log(`📂 Output: ${OUTPUT_DIR}`);
}

main();
