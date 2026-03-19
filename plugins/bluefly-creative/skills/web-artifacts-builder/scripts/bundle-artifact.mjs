#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, statSync, writeFileSync } from 'node:fs';

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

if (!existsSync('package.json')) {
  console.error('Error: No package.json found. Run this script from the project root.');
  process.exit(1);
}

if (!existsSync('index.html')) {
  console.error('Error: No index.html found in the project root.');
  process.exit(1);
}

console.log('Installing bundling dependencies...');
run('pnpm', [
  'add',
  '-D',
  'parcel',
  '@parcel/config-default',
  'parcel-resolver-tspaths',
  'html-inline',
]);

if (!existsSync('.parcelrc')) {
  console.log('Creating .parcelrc...');
  writeFileSync(
    '.parcelrc',
    `{
  "extends": "@parcel/config-default",
  "resolvers": ["parcel-resolver-tspaths", "..."]
}
`
  );
}

console.log('Cleaning previous build artifacts...');
rmSync('dist', { recursive: true, force: true });
rmSync('bundle.html', { force: true });

console.log('Building with Parcel...');
run('pnpm', ['exec', 'parcel', 'build', 'index.html', '--dist-dir', 'dist', '--no-source-maps']);

console.log('Inlining assets into bundle.html...');
const bundledHtml = execFileSync('pnpm', ['exec', 'html-inline', 'dist/index.html'], {
  encoding: 'utf8',
});
writeFileSync('bundle.html', bundledHtml);

const fileSize = formatFileSize(statSync('bundle.html').size);
console.log(`Bundle complete: bundle.html (${fileSize})`);
