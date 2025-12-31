#!/usr/bin/env npx tsx
/**
 * Sync All Data from Sources
 *
 * Run: npx tsx lib/data/sync-all.ts
 *
 * This fetches all data from source repositories and updates local files.
 * Used by CI and for local development.
 */

import path from 'path';
import { fetchExamples, saveExamples } from './fetch-examples';
import { fetchVersions, saveVersions, generateVersionTs } from './fetch-versions';

async function main() {
  const cwd = process.cwd();
  console.log('🔄 Syncing all data from sources...\n');

  // 1. Fetch and save examples
  console.log('📦 Fetching examples...');
  try {
    const examples = await fetchExamples();
    await saveExamples(examples, path.join(cwd, 'public/examples.json'));
    console.log(`✅ Saved ${examples.length} examples\n`);
  } catch (error) {
    console.error('❌ Failed to fetch examples:', error);
    // Don't fail - examples.json might already exist
  }

  // 2. Fetch and save versions
  console.log('📦 Fetching versions...');
  try {
    const versions = await fetchVersions();
    await saveVersions(versions, path.join(cwd, 'lib/versions.json'));
    await generateVersionTs(versions, path.join(cwd, 'lib/version.ts'));
    console.log(`✅ Saved ${versions.all.length} versions\n`);
  } catch (error) {
    console.error('❌ Failed to fetch versions:', error);
    // Don't fail - versions.json might already exist
  }

  // 3. Validate required files exist
  console.log('🔍 Validating required files...');
  const fs = await import('fs/promises');
  const requiredFiles = [
    'public/examples.json',
    'lib/versions.json',
    'lib/release-highlights.json',
    'lib/version.ts',
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(cwd, file);
    try {
      await fs.access(fullPath);
      console.log(`  ✅ ${file}`);
    } catch {
      console.warn(`  ⚠️  ${file} - MISSING (may cause build issues)`);
    }
  }

  console.log('\n✨ Sync complete!');
}

main().catch((error) => {
  console.error('Sync failed:', error);
  process.exit(1);
});
