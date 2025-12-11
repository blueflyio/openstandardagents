#!/usr/bin/env node
/**
 * Fix hardcoded apiVersion in examples.json by replacing with current version
 * Run after fetch-examples.js
 */

const fs = require('fs');
const path = require('path');

// Read current version from lib/version.ts
function getCurrentVersion() {
  try {
    const versionTsPath = path.join(__dirname, '..', 'lib', 'version.ts');
    if (fs.existsSync(versionTsPath)) {
      const content = fs.readFileSync(versionTsPath, 'utf8');
      const match = content.match(/export const OSSA_VERSION = "([^"]+)"/);
      if (match) {
        return match[1];
      }
    }
  } catch (e) {
    console.error('Error reading version:', e);
  }
  return null;
}

const examplesPath = path.join(__dirname, '..', 'public', 'examples.json');
const version = getCurrentVersion();

if (!version) {
  console.error('Could not determine current version');
  process.exit(1);
}

console.log(`Replacing apiVersion in examples with ossa/v${version}...`);

const examples = JSON.parse(fs.readFileSync(examplesPath, 'utf8'));
let replaced = 0;

examples.forEach(example => {
  if (example.content) {
    // Replace all apiVersion: ossa/vX.X.X patterns
    const oldContent = example.content;
    example.content = example.content.replace(
      /apiVersion:\s*ossa\/v\d+\.\d+\.\d+/gi,
      `apiVersion: ossa/v${version}`
    );
    if (oldContent !== example.content) {
      replaced++;
    }
  }
});

fs.writeFileSync(examplesPath, JSON.stringify(examples, null, 2));
console.log(`✅ Replaced apiVersion in ${replaced} examples`);
