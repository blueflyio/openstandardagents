/**
 * OSSA CLI Standardization Commands
 * 47-Project Agent Standardization System
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { OSSAStandardizer } from '../standardizer.js';

export function createStandardizeCommands(): Command {
  const cmd = new Command('standardize')
    .description('Agent standardization system (47 projects with .agents directories)');

  cmd.command('all')
    .description('Standardize all 47 projects with proper branching strategy')
    .option('-w, --workspace <path>', 'Workspace root path', '/Users/flux423/Sites/LLM')
    .option('--batch <name>', 'Process specific batch only (critical|integration|specialized)')
    .option('--dry-run', 'Show standardization plan without executing')
    .action(async (options) => {
      console.log(chalk.blue('🔧 OSSA v0.1.8 Agent Standardization System'));
      
      const standardizer = new OSSAStandardizer(options.workspace);
      
      if (options.dryRun) {
        console.log(chalk.blue('🔍 Dry run mode - discovering projects...'));
        const projects = await standardizer.discoverProjects();
        console.table(projects.map(p => ({
          Name: p.name,
          Type: p.type,
          Branch: p.currentBranch,
          'Existing Agents': p.existingAgents.length,
          'Needs Standardization': p.existingAgents.length === 0 ? '✅' : '⚠️'
        })));
      } else {
        await standardizer.standardizeAll();
      }
    });

  cmd.command('discover')
    .description('Discover and analyze all projects with .agents directories')
    .option('-w, --workspace <path>', 'Workspace root path', '/Users/flux423/Sites/LLM')
    .option('--format <type>', 'Output format (table|json|yaml)', 'table')
    .action(async (options) => {
      const standardizer = new OSSAStandardizer(options.workspace);
      const projects = await standardizer.discoverProjects();
      
      if (options.format === 'json') {
        console.log(JSON.stringify(projects, null, 2));
      } else if (options.format === 'yaml') {
        const yaml = await import('yaml');
        console.log(yaml.stringify(projects));
      } else {
        console.log(chalk.blue(`📋 Discovered ${projects.length} projects with .agents directories:\n`));
        
        // Group by type
        const byType = projects.reduce((acc, p) => {
          acc[p.type] = acc[p.type] || [];
          acc[p.type].push(p);
          return acc;
        }, {} as Record<string, typeof projects>);
        
        for (const [type, typeProjects] of Object.entries(byType)) {
          console.log(chalk.yellow.bold(`${type.toUpperCase()} (${typeProjects.length}):`));
          typeProjects.forEach(p => {
            const statusIcon = p.existingAgents.length > 0 ? '✅' : '⚠️';
            console.log(`  ${statusIcon} ${p.name} (${p.existingAgents.length} agents)`);
          });
          console.log('');
        }
        
        console.log(chalk.gray(`Total: ${projects.length} projects`));
        console.log(chalk.gray('Legend: ✅ Has agents, ⚠️ Needs standardization'));
      }
    });

  cmd.command('project')
    .description('Standardize specific project')
    .argument('<name>', 'Project name to standardize')
    .option('-w, --workspace <path>', 'Workspace root path', '/Users/flux423/Sites/LLM')
    .option('--dry-run', 'Show what would be changed')
    .action(async (projectName, options) => {
      console.log(chalk.blue(`🔧 Standardizing project: ${projectName}`));
      
      const standardizer = new OSSAStandardizer(options.workspace);
      const projects = await standardizer.discoverProjects();
      const project = projects.find(p => p.name === projectName);
      
      if (!project) {
        console.log(chalk.red(`❌ Project '${projectName}' not found`));
        console.log(chalk.gray('Available projects:'));
        projects.forEach(p => console.log(`  - ${p.name}`));
        return;
      }
      
      if (options.dryRun) {
        console.log(chalk.blue('🔍 Dry run mode - would standardize:'));
        console.log(`  Project: ${project.name}`);
        console.log(`  Type: ${project.type}`);
        console.log(`  Current Branch: ${project.currentBranch}`);
        console.log(`  Existing Agents: ${project.existingAgents.join(', ') || 'None'}`);
        console.log('  Actions:');
        console.log('    - Create feature branch');
        console.log('    - Generate standard agent structure');
        console.log('    - Clean up system files');
        console.log('    - Commit changes');
      } else {
        // Implement single project standardization
        console.log(chalk.yellow('Single project standardization not yet implemented.'));
        console.log(chalk.gray('Use: ossa standardize all --dry-run to see full plan'));
      }
    });

  return cmd;
}