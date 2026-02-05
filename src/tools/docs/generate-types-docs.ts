#!/usr/bin/env tsx
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const TYPES_FILE = join(process.cwd(), 'src/types/index.ts');
const OUTPUT_FILE = join(
  process.cwd(),
  'website/content/docs/types-reference/index.md'
);

const content = readFileSync(TYPES_FILE, 'utf-8');

// Extract interfaces and types
const interfaces = content.match(/export interface \w+[^}]+}/gs) || [];
const types = content.match(/export type \w+ = [^;]+;/gs) || [];

let doc = `# TypeScript Types Reference

Auto-generated from \`src/types/index.ts\`

## Interfaces

`;

for (const iface of interfaces) {
  const name = iface.match(/interface (\w+)/)?.[1];
  if (name) {
    doc += `### ${name}\n\n\`\`\`typescript\n${iface}\n\`\`\`\n\n`;
  }
}

doc += `## Type Aliases\n\n`;

for (const type of types) {
  const name = type.match(/type (\w+)/)?.[1];
  if (name) {
    doc += `### ${name}\n\n\`\`\`typescript\n${type}\n\`\`\`\n\n`;
  }
}

doc += `## Usage

\`\`\`typescript
import { OSSAManifest, AgentSpec } from '@bluefly/openstandardagents';
\`\`\`
`;

mkdirSync(join(process.cwd(), 'website/content/docs/types-reference'), {
  recursive: true,
});
writeFileSync(OUTPUT_FILE, doc);

console.log(
  `✅ Generated types reference: ${interfaces.length} interfaces, ${types.length} types`
);
