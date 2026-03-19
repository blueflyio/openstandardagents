#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

const imageName = 'drupal-contributor';
const version = process.env.VERSION || 'latest';
const registry = process.env.REGISTRY || 'docker.io';
const fullImage = `${registry}/${imageName}:${version}`;

console.log(`Tagging image: ${fullImage}`);
run('docker', ['tag', `${imageName}:${version}`, fullImage]);

console.log(`Pushing image: ${fullImage}`);
run('docker', ['push', fullImage]);

console.log('Push complete');
console.log(`Image: ${fullImage}`);
