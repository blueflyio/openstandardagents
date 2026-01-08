#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const VERSION_FILE = path.join(process.cwd(), '.version.json');
const versionConfig = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));

const type = process.argv[2] || 'patch'; // major, minor, patch, rc

function bumpVersion(current: string, type: string): string {
  const rcMatch = current.match(/^(\d+)\.(\d+)\.(\d+)-RC$/);
  if (rcMatch) {
    if (type === 'release') {
      return `${rcMatch[1]}.${rcMatch[2]}.${rcMatch[3]}`;
    }
  }
  
  const match = current.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error(`Invalid version: ${current}`);
  
  const [, major, minor, patch] = match.map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'rc':
      return `${major}.${minor}.${patch + 1}-RC`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

const newVersion = bumpVersion(versionConfig.current, type);
versionConfig.latest_stable = versionConfig.current.replace('-RC', '');
versionConfig.current = newVersion;

fs.writeFileSync(VERSION_FILE, JSON.stringify(versionConfig, null, 2) + '\n');

// Create spec directory
const specDir = path.join(process.cwd(), 'spec', `v${newVersion}`);
if (!fs.existsSync(specDir)) {
  fs.mkdirSync(specDir, { recursive: true });
  console.log(`✅ Created spec directory: ${specDir}`);
}

// Run sync
execSync('npm run version:sync', { stdio: 'inherit' });

console.log(`✅ Bumped version: ${versionConfig.current} → ${newVersion}`);
console.log(`\nNext steps:`);
console.log(`1. Update schema: spec/v${newVersion}/ossa-${newVersion}.schema.json`);
console.log(`2. Commit: git add . && git commit -m "chore: bump version to ${newVersion}"`);
