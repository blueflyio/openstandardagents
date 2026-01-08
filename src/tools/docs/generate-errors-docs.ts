#!/usr/bin/env tsx
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SRC_DIR = join(process.cwd(), 'src');
const OUTPUT_FILE = join(process.cwd(), 'website/content/docs/errors/index.md');

interface ErrorInfo {
  code: string;
  message: string;
  file: string;
}

function findErrors(dir: string, errors: ErrorInfo[] = []): ErrorInfo[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      findErrors(fullPath, errors);
    } else if (entry.name.endsWith('.ts')) {
      const content = readFileSync(fullPath, 'utf-8');
      
      // Find throw new Error patterns
      const matches = content.matchAll(/throw new (\w+Error)\(['"`]([^'"`]+)['"`]\)/g);
      for (const match of matches) {
        errors.push({
          code: match[1],
          message: match[2],
          file: fullPath.replace(process.cwd(), '')
        });
      }
    }
  }
  
  return errors;
}

const errors = findErrors(SRC_DIR);
const byCode = errors.reduce((acc, err) => {
  if (!acc[err.code]) acc[err.code] = [];
  acc[err.code].push(err);
  return acc;
}, {} as Record<string, ErrorInfo[]>);

let doc = `# Error Reference

Common errors and solutions.

**Total Error Types**: ${Object.keys(byCode).length}

`;

for (const [code, instances] of Object.entries(byCode).sort()) {
  doc += `## ${code}\n\n`;
  
  const uniqueMessages = [...new Set(instances.map(e => e.message))];
  for (const msg of uniqueMessages) {
    doc += `### "${msg}"\n\n`;
    doc += `**Cause**: Check the error context for details\n\n`;
    doc += `**Solution**: \n`;
    doc += `\`\`\`bash\n# Enable debug mode\nDEBUG=* ossa <command>\n\`\`\`\n\n`;
  }
}

doc += `## Getting Help

- Check [Troubleshooting Guide](../troubleshooting/)
- Open an issue on [GitLab](https://gitlab.com/blueflyio/openstandardagents/-/issues)
`;

mkdirSync(join(process.cwd(), 'website/content/docs/errors'), { recursive: true });
writeFileSync(OUTPUT_FILE, doc);

console.log(`[PASS] Generated error reference: ${Object.keys(byCode).length} error types`);
