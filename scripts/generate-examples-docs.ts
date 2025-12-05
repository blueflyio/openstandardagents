#!/usr/bin/env tsx
/**
 * Generate examples documentation from YAML files
 */

import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'fs';
import { join, relative, basename } from 'path';
import yaml from 'js-yaml';

const EXAMPLES_DIR = join(process.cwd(), 'examples');
const OUTPUT_FILE = join(process.cwd(), 'website/content/docs/examples/catalog.md');

interface Example {
  path: string;
  name: string;
  role?: string;
  description?: string;
  category: string;
}

function findYamlFiles(dir: string, category: string = ''): Example[] {
  const examples: Example[] = [];
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      examples.push(...findYamlFiles(fullPath, category || entry));
    } else if (entry.match(/\.(yaml|yml)$/)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        // Use JSON_SCHEMA to prevent arbitrary code execution (CWE-502)
        const data = yaml.load(content, { schema: yaml.JSON_SCHEMA }) as any;
        
        if (data?.agent) {
          examples.push({
            path: relative(EXAMPLES_DIR, fullPath),
            name: data.agent.name || basename(entry, '.yaml'),
            role: data.agent.role,
            description: data.agent.description,
            category: category || 'general'
          });
        }
      } catch (error) {
        // Skip invalid YAML
      }
    }
  }
  
  return examples;
}

function generateDocs(examples: Example[]): string {
  const byCategory = examples.reduce((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = [];
    acc[ex.category].push(ex);
    return acc;
  }, {} as Record<string, Example[]>);
  
  let doc = `# Examples Catalog

Auto-generated catalog of all OSSA agent examples.

**Total Examples**: ${examples.length}

`;

  for (const [category, items] of Object.entries(byCategory).sort()) {
    doc += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    
    for (const item of items.sort((a, b) => a.name.localeCompare(b.name))) {
      doc += `### ${item.name}\n\n`;
      if (item.role) doc += `**Role**: \`${item.role}\`\n\n`;
      if (item.description) doc += `${item.description}\n\n`;
      doc += `**File**: [\`${item.path}\`](https://github.com/blueflyio/openstandardagents/blob/main/examples/${item.path})\n\n`;
      doc += `\`\`\`bash\nossa validate examples/${item.path}\n\`\`\`\n\n`;
    }
  }
  
  doc += `## Usage\n\n`;
  doc += `\`\`\`bash\n# Validate any example\nossa validate examples/<path>\n\n`;
  doc += `# Run an example\nossa run examples/<path>\n\`\`\`\n`;
  
  return doc;
}

console.log('🚀 Generating examples documentation...\n');

const examples = findYamlFiles(EXAMPLES_DIR);
console.log(`📁 Found ${examples.length} examples\n`);

const doc = generateDocs(examples);

mkdirSync(join(process.cwd(), 'website/content/docs/examples'), { recursive: true });
writeFileSync(OUTPUT_FILE, doc);

console.log(`✅ Generated: ${relative(process.cwd(), OUTPUT_FILE)}`);
console.log(`\n✨ Examples documentation generated successfully!`);
