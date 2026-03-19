#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

function capture(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const imageName = 'drupal-contributor';
const version = process.env.VERSION || 'latest';
const buildDate = new Date().toISOString();
const vcsRef = capture('git', ['rev-parse', '--short', 'HEAD']) || 'unknown';

console.log(`Building Docker image: ${imageName}:${version}`);
run('docker', [
  'build',
  '--target',
  'runtime',
  '--tag',
  `${imageName}:${version}`,
  '--tag',
  `${imageName}:latest`,
  '--build-arg',
  `BUILD_DATE=${buildDate}`,
  '--build-arg',
  `VCS_REF=${vcsRef}`,
  '--build-arg',
  `VERSION=${version}`,
  '.',
]);

const imageSize = capture('docker', [
  'images',
  `${imageName}:${version}`,
  '--format',
  '{{.Size}}',
]);

console.log('Build complete');
console.log(`Image: ${imageName}:${version}`);
if (imageSize) {
  console.log(`Size: ${imageSize}`);
}
