#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';

function waitForPort(host, port, label) {
  return new Promise((resolve) => {
    const attempt = () => {
      const socket = net.createConnection({ host, port });

      socket.on('connect', () => {
        socket.end();
        resolve();
      });

      socket.on('error', () => {
        console.log(`${label} is unavailable, retrying...`);
        setTimeout(attempt, 1000);
      });
    };

    attempt();
  });
}

function runNodeScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${scriptPath} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

const args = process.argv.slice(2);

if (process.env.POSTGRES_HOST) {
  console.log('Waiting for PostgreSQL...');
  await waitForPort(
    process.env.POSTGRES_HOST,
    Number.parseInt(process.env.POSTGRES_PORT || '5432', 10),
    'PostgreSQL'
  );
}

if (process.env.REDIS_HOST) {
  console.log('Waiting for Redis...');
  await waitForPort(
    process.env.REDIS_HOST,
    Number.parseInt(process.env.REDIS_PORT || '6379', 10),
    'Redis'
  );
}

const migrateScript = path.join(process.cwd(), 'scripts', 'migrate.mjs');
if (existsSync(migrateScript)) {
  console.log('Running database migrations...');
  await runNodeScript(migrateScript);
}

if (args.length === 0) {
  console.error('No command provided to entrypoint.');
  process.exit(1);
}

const child = spawn(args[0], args.slice(1), { stdio: 'inherit' });

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
