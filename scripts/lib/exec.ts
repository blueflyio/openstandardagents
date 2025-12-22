#!/usr/bin/env node
/**
 * Command execution utilities
 * 
 * Follows DRY principles for command execution
 */

import { execSync } from 'child_process';

interface ExecOptions {
  encoding?: BufferEncoding;
  stdio?: 'inherit' | 'pipe' | 'ignore';
  cwd?: string;
}

/**
 * Execute command and return output (or void if stdio is 'inherit')
 */
export function execCommand(command: string, options: ExecOptions = {}): string {
  const { encoding = 'utf8', stdio = 'pipe', cwd } = options;
  
  try {
    if (stdio === 'inherit') {
      // When inheriting stdio, just execute - no output to return
      execSync(command, {
        stdio: 'inherit',
        cwd,
      });
      return ''; // Return empty string when inheriting
    }
    
    const output = execSync(command, {
      encoding: encoding as BufferEncoding,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd,
    });
    return typeof output === 'string' ? output : output.toString();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
    throw error;
  }
}
