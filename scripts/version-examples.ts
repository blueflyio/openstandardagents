#!/usr/bin/env tsx
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const version = JSON.parse(readFileSync('package.json', 'utf-8')).version;
const examplesDir = 'examples';

console.log(`📝 Updating examples to version ${version}`);

let updated = 0;

function updateYamlFiles(dir: string) {
  const files = readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = join(dir, file.name);
    
    if (file.isDirectory()) {
      updateYamlFiles(fullPath);
    } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
      let content = readFileSync(fullPath, 'utf-8');
      const updated_content = content.replace(
        /apiVersion:\s*ossa\/v[\d.]+/g,
        `apiVersion: ossa/v${version}`
      );
      
      if (content !== updated_content) {
        writeFileSync(fullPath, updated_content);
        updated++;
      }
    }
  }
}

updateYamlFiles(examplesDir);
console.log(`✅ Updated ${updated} example files`);
