/**
 * Execution Utilities
 * 
 * DRY: Reusable command execution with proper error handling
 * Type-safe: Validates commands and handles errors
 */

import { execSync } from 'child_process';
import { z } from 'zod';

const CommandSchema = z.string().min(1);

interface ExecOptions {
  encoding?: BufferEncoding;
  stdio?: 'inherit' | 'pipe';
}

/**
 * Execute command with validation and error handling
 */
export function execCommand(
  command: string,
  options: ExecOptions = {}
): string {
  const validatedCommand = CommandSchema.parse(command);
  
  try {
    const result = execSync(validatedCommand, {
      encoding: options.encoding || 'utf8',
      stdio: options.stdio || 'pipe',
    });
    return result as string;
  } catch (error: any) {
    const message = error?.message || 'Command execution failed';
    throw new Error(`Command failed: ${validatedCommand}\n${message}`);
  }
}
