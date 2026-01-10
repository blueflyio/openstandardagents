#!/usr/bin/env tsx
/**
 * Cursor Agent Hook: Pre-Terminal Command Validation
 * 
 * Blocks dangerous commands and validates OSSA-specific workflows.
 */

interface HookContext {
  command: string;
}

const BLOCKED_COMMANDS = [
  /rm\s+-rf\s+\//, // Dangerous rm commands
  /dd\s+if=/, // Disk operations
  /mkfs/, // Filesystem operations
  /:\s*\{\s*:\s*\|/, // Fork bomb
  /LEFTHOOK=0/, // Bypassing hooks
];

const OSSA_REQUIRED_COMMANDS = [
  /^ddev\s+drush\s+cst/, // Must run before config work
];

export function preTerminal(context: HookContext): { allow: boolean; reason?: string } {
  const { command } = context;

  // Block dangerous commands
  for (const pattern of BLOCKED_COMMANDS) {
    if (pattern.test(command)) {
      return {
        allow: false,
        reason: `Blocked potentially dangerous command: ${command}`,
      };
    }
  }

  // Warn about config work without drush cst
  if (command.includes('drush') && !command.includes('cst') && !command.includes('drush cst')) {
    if (command.includes('config:') || command.includes('cim') || command.includes('cex')) {
      return {
        allow: true,
        reason: 'WARNING: Config work detected. Ensure you ran "ddev drush cst" first!',
      };
    }
  }

  return { allow: true };
}

