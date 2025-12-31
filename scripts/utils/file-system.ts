/**
 * File system utilities
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export const ensureDir = (path: string): void => {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
};

export const readJson = <T = unknown>(path: string): T => {
  return JSON.parse(readFileSync(path, 'utf-8'));
};

export const writeJson = (path: string, data: unknown, indent = 2): void => {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(data, null, indent), 'utf-8');
};
