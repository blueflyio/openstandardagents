#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const VERSION_FILE = path.join(process.cwd(), '.version.json');
const PACKAGE_FILE = path.join(process.cwd(), 'package.json');

const versionConfig = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
const packageJson = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf-8'));

// Get current date in ISO format
const lastUpdated = new Date().toISOString().split('T')[0];

// Get spec version from version config
const specVersion = versionConfig.spec_version || versionConfig.current;

const replacements = {
  '{{VERSION}}': versionConfig.current,
  '{{VERSION_STABLE}}': versionConfig.latest_stable,
  '{{SPEC_VERSION}}': specVersion,
  '{{LAST_UPDATED}}': lastUpdated,
  '{{SPEC_PATH}}': versionConfig.spec_path.replace('{version}', versionConfig.current),
  '{{SCHEMA_FILE}}': versionConfig.schema_file.replace('{version}', versionConfig.current),
  '{{NPM_VERSION}}': packageJson.version,
};

async function processTemplates() {
  // Process multiple file patterns
  const patterns = [
    'website/content/docs/**/*.md',
    'docs/**/*.md',
    'examples/**/*.yml',
    'examples/**/*.yaml',
    'README.md',
  ];

  let totalProcessed = 0;

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      ignore: ['node_modules/**', 'dist/**', 'coverage/**'],
      nodir: true
    });

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
        console.log(`[PASS] Processed: ${file}`);
        totalProcessed++;
      }
    }
  }

  if (totalProcessed === 0) {
    console.log('[INFO]  No template placeholders found to process');
  } else {
    console.log(`\n[PASS] Processed ${totalProcessed} file(s) with version ${versionConfig.current}`);
  }
}

processTemplates().catch(err => {
  console.error('[FAIL] Error processing templates:', err);
  process.exit(1);
});
