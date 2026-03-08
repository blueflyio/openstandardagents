/**
 * OSSA CLI config file (e.g. ~/.ossa/config.json).
 * Values here override defaults; process.env overrides config file.
 * Use: ossa config set SKILLS_PATH /path/to/skills
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

const OSSA_DIR = process.env.OSSA_CONFIG_DIR || path.join(homedir(), '.ossa');
const CONFIG_FILE = process.env.OSSA_CONFIG_PATH || path.join(OSSA_DIR, 'config.json');

export type ConfigRecord = Record<string, string>;

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadRaw(): ConfigRecord {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const out: ConfigRecord = {};
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'string') out[k] = v;
        else if (v != null) out[k] = String(v);
      }
      return out;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveRaw(data: ConfigRecord): void {
  ensureDir(path.dirname(CONFIG_FILE));
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Config file path (for display).
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * Get a config value. Resolution: process.env[key] then config file.
 */
export function getConfigValue(key: string): string | undefined {
  const envVal = process.env[key];
  if (envVal !== undefined && envVal !== '') {
    return envVal;
  }
  const data = loadRaw();
  return data[key];
}

/**
 * Set a config value (writes to config file). Does not set process.env.
 */
export function setConfigValue(key: string, value: string): void {
  const data = loadRaw();
  data[key] = value;
  saveRaw(data);
}

/**
 * Remove a key from the config file.
 */
export function unsetConfigValue(key: string): boolean {
  const data = loadRaw();
  if (!(key in data)) return false;
  delete data[key];
  saveRaw(data);
  return true;
}

/**
 * List all keys and values from the config file (not env).
 */
export function listConfig(): ConfigRecord {
  return loadRaw();
}

/** Known keys documented in `ossa config --help`. */
export const KNOWN_KEYS = [
  'SKILLS_PATH',
  'BLUEFLY_SKILLS_MARKETPLACE',
  'BLUEFLY_SKILLS_CATALOG',
  'BLUEFLY_SKILLS_PATH',
  'OSSA_WEBAGENTS_API_URL',
  'OSSA_CONFIG_PATH',
  'MCP_URL',
  'GITLAB_URL',
  'GITLAB_TOKEN',
] as const;

/**
 * Default directory for skills add/list. Resolution: config SKILLS_PATH, then env SKILLS_PATH/BLUEFLY_SKILLS_PATH, then ~/.claude/skills.
 */
export function getSkillsPathDefault(): string {
  return (
    getConfigValue('SKILLS_PATH') ||
    getConfigValue('BLUEFLY_SKILLS_PATH') ||
    process.env.SKILLS_PATH ||
    process.env.BLUEFLY_SKILLS_PATH ||
    (process.env.HOME ? `${process.env.HOME}/.claude/skills` : '.claude/skills')
  );
}
