/**
 * OSSA Capability Commands
 * Commands for managing OSSA capability definitions
 */

import { Command } from 'commander';
import { capabilityCreateCommand } from './create.command.js';

export const capabilityCommandGroup = new Command('capability')
  .description('Manage OSSA capability definitions')
  .addCommand(capabilityCreateCommand);
