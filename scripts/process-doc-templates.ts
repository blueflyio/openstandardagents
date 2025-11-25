#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const VERSION_FILE = path.join(process.cwd(), '.version.json');
const versionConfig = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));

const replacements = {
  '{{VERSION}}': versionConfig.current,
  '{{VERSION_STABLE}}': versionConfig.latest_stable,
  '{{SPEC_PATH}}': versionConfig.spec_path.replace('{version}', versionConfig.current),
  '{{SCHEMA_FILE}}': versionConfig.schema_file.replace('{version}', versionConfig.current),
};

async function processTemplates() {
  const files = await glob('website/content/docs/**/*.md', { ignore: 'node_modules/**' });
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let updated = false;
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      if (content.includes(placeholder)) {
        content = content.replaceAll(placeholder, value);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(file, content);
      console.log(`✅ Processed: ${file}`);
    }
  }
}

processTemplates();
