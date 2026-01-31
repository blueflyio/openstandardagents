/**
 * Agents Command Group
 * CRUD operations for agent management
 *
 * Commands:
 * - ossa agents list - List all agents
 * - ossa agents show <name> - Show agent details
 * - ossa agents delete <name> - Delete agent
 *
 * SOLID: Single Responsibility - Agent management commands
 * DRY: Reusable command structure
 */

import { Command } from 'commander';
import { agentsListCommand } from './agents/list.command.js';
import { agentsShowCommand } from './agents/show.command.js';
import { agentsDeleteCommand } from './agents/delete.command.js';

export const agentsCommand = new Command('agents')
  .description('Manage OSSA agents (list, show, delete)')
  .addCommand(agentsListCommand)
  .addCommand(agentsShowCommand)
  .addCommand(agentsDeleteCommand);
