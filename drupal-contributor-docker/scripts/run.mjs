#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

const imageName = 'drupal-contributor';
const containerName = process.env.CONTAINER_NAME || 'drupal-contributor';
const port = process.env.PORT || '3000';

console.log(`Running container: ${containerName}`);
run('docker', [
  'run',
  '-d',
  '--name',
  containerName,
  '--restart',
  'unless-stopped',
  '-p',
  `${port}:3000`,
  '--env-file',
  '.env',
  `${imageName}:latest`,
]);

console.log('Container started');
console.log(`Name: ${containerName}`);
console.log(`Port: ${port}`);
