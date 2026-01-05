/**
 * OSSA CLI: Providers command
 * Manage LLM provider configurations
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface Provider {
  api_key: string;
  model: string;
  priority: number;
  enabled: boolean;
}

interface ProvidersConfig {
  [key: string]: Provider;
}

const CONFIG_PATH = join(homedir(), '.ossa', 'providers.json');

function loadProviders(): ProvidersConfig {
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveProviders(providers: ProvidersConfig): void {
  const configDir = join(homedir(), '.ossa');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  writeFileSync(CONFIG_PATH, JSON.stringify(providers, null, 2));
}

async function manageProviders(options: any): Promise<void> {
  const providers = loadProviders();

  if (options.list) {
    listProviders(providers);
  } else if (options.add) {
    await addProvider(options.add, providers);
  } else if (options.remove) {
    removeProvider(options.remove, providers);
  } else if (options.setDefault) {
    setDefaultProvider(options.setDefault, providers);
  } else {
    listProviders(providers);
  }
}

function listProviders(providers: ProvidersConfig): void {
  if (Object.keys(providers).length === 0) {
    console.log('No providers configured');
    return;
  }

  console.log('\nConfigured Providers:');
  console.log('─'.repeat(60));

  for (const [name, provider] of Object.entries(providers)) {
    const status = provider.enabled ? '✅' : '❌';
    const defaultMarker = provider.priority === 1 ? ' (default)' : '';
    console.log(`${status} ${name}${defaultMarker}`);
    console.log(`   Model: ${provider.model}`);
    console.log(`   Priority: ${provider.priority}`);
    console.log('');
  }
}

async function addProvider(name: string, providers: ProvidersConfig): Promise<void> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string): Promise<string> => {
    return new Promise(resolve => readline.question(query, resolve));
  };

  const apiKey = await question(`Enter API key for ${name}: `);
  const model = await question(`Enter model (default: claude-sonnet-4-20250514): `) || 'claude-sonnet-4-20250514';
  const priority = parseInt(await question('Enter priority (1 = default, higher = fallback): ') || '2');

  providers[name] = {
    api_key: apiKey,
    model,
    priority,
    enabled: true
  };

  saveProviders(providers);
  readline.close();

  console.log(`✅ Added provider: ${name}`);
}

function removeProvider(name: string, providers: ProvidersConfig): void {
  if (!providers[name]) {
    console.error(`Provider ${name} not found`);
    process.exit(1);
  }

  delete providers[name];
  saveProviders(providers);

  console.log(`✅ Removed provider: ${name}`);
}

function setDefaultProvider(name: string, providers: ProvidersConfig): void {
  if (!providers[name]) {
    console.error(`Provider ${name} not found`);
    process.exit(1);
  }

  for (const provider of Object.values(providers)) {
    if (provider.priority === 1) {
      provider.priority = 2;
    }
  }

  providers[name].priority = 1;
  saveProviders(providers);

  console.log(`✅ Set default provider: ${name}`);
}

export { manageProviders };
