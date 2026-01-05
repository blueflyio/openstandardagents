/**
 * OSSA CLI: Run command
 * Run an OSSA agent locally following TDD principles
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';

interface RunOptions {
  env?: string;
  port?: string;
  watch?: boolean;
  debug?: boolean;
}

async function runAgent(manifest: string, options: RunOptions): Promise<void> {
  const manifestPath = resolve(manifest);

  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const manifestContent = readFileSync(manifestPath, 'utf-8');
  const agentConfig = parseManifest(manifestContent);

  console.log(`Running agent: ${agentConfig.metadata.name}`);
  console.log(`Port: ${options.port || 3000}`);
  console.log(`Watch: ${options.watch ? 'enabled' : 'disabled'}`);

  if (options.env && existsSync(options.env)) {
    require('dotenv').config({ path: options.env });
    console.log(`Loaded environment from ${options.env}`);
  }

  const env = {
    ...process.env,
    OSSA_AGENT_NAME: agentConfig.metadata.name,
    OSSA_AGENT_NAMESPACE: agentConfig.metadata.namespace,
    PORT: options.port || '3000',
    DEBUG: options.debug ? 'true' : 'false'
  };

  const serverPath = resolve(__dirname, '../../server/index.js');
  
  if (!existsSync(serverPath)) {
    console.log('Starting agent server...');
    startAgentServer(agentConfig, env, options);
  } else {
    const server = spawn('node', [serverPath], {
      env,
      stdio: 'inherit',
      cwd: process.cwd()
    });

    server.on('error', (error) => {
      console.error('Failed to start agent:', error);
      process.exit(1);
    });

    process.on('SIGINT', () => {
      server.kill();
      process.exit(0);
    });
  }
}

function parseManifest(content: string): any {
  const lines = content.split('\n');
  const result: any = { metadata: {}, spec: {} };
  let currentSection = '';
  let currentKey = '';

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('metadata:')) {
      currentSection = 'metadata';
    } else if (trimmed.startsWith('spec:')) {
      currentSection = 'spec';
    } else if (trimmed.match(/^\w+:/)) {
      const match = trimmed.match(/^(\w+):\s*(.+)$/);
      if (match) {
        currentKey = match[1];
        const value = match[2].trim();
        if (currentSection === 'metadata') {
          result.metadata[currentKey] = value;
        } else if (currentSection === 'spec') {
          result.spec[currentKey] = value;
        }
      }
    }
  }

  return result;
}

function startAgentServer(agentConfig: any, env: NodeJS.ProcessEnv, options: RunOptions): void {
  console.log('Agent server implementation needed');
  console.log('Agent config:', JSON.stringify(agentConfig, null, 2));
  
  if (options.watch) {
    console.log('Watch mode: Restarting on file changes...');
  }
}

export { runAgent };
