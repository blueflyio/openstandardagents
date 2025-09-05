#!/usr/bin/env node

/**
 * Enhanced OAAS Validation Script
 * Supports OSSA v0.1.2 migration and @bluefly/oaas integration
 */

import { EnhancedOAASValidator, validateWorkspaceCommand } from './services/dist/validators/EnhancedOAASValidator.js';
import { program } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure CLI
program
  .name('validate-oaas-enhanced')
  .description('Enhanced OAAS validation with OSSA v0.1.2 migration support')
  .version('0.1.1');

// Main validation command
program
  .command('validate')
  .description('Validate agents in current directory')
  .option('-w, --workspace <path>', 'Workspace path', process.cwd())
  .option('-s, --strict', 'Enable strict validation')
  .option('-m, --migrate', 'Migrate OSSA v0.1.2 to OAAS format')
  .option('-f, --format <format>', 'Output format (json|yaml|console)', 'console')
  .option('-o, --output <file>', 'Output file path')
  .option('--fix-errors', 'Attempt to fix validation errors')
  .action(async (options) => {
    try {
      console.log('🚀 Enhanced OAAS Validator');
      console.log('🔧 @bluefly/oaas integration enabled\n');

      const results = await validateWorkspaceCommand(options.workspace, options);
      
      // Exit with error if validation failed
      const hasErrors = results.agents.some(agent => !agent.valid);
      process.exit(hasErrors ? 1 : 0);
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  });

// Migration command
program
  .command('migrate')
  .description('Migrate OSSA v0.1.2 agents to OAAS format')
  .option('-w, --workspace <path>', 'Workspace path', process.cwd())
  .option('--dry-run', 'Show migration preview without making changes')
  .option('-o, --output <dir>', 'Output directory for migrated files')
  .action(async (options) => {
    try {
      console.log('🔄 OSSA to OAAS Migration Tool');
      console.log(`📁 Workspace: ${options.workspace}\n`);

      const validator = new EnhancedOAASValidator({
        migrateFromOSSA: true
      });

      const results = await validator.validateWorkspace(options.workspace);
      const migrationCandidates = results.agents.filter(
        agent => agent.ossaCompatibility?.migrationRequired
      );

      if (migrationCandidates.length === 0) {
        console.log('✅ No OSSA v0.1.2 agents found that need migration');
        return;
      }

      console.log(`🎯 Found ${migrationCandidates.length} agents ready for migration:`);
      migrationCandidates.forEach(agent => {
        console.log(`   • ${agent.metadata?.file || 'unknown'}`);
      });

      if (options.dryRun) {
        console.log('\n👀 Dry run complete - no files modified');
        console.log('Run without --dry-run to execute migration');
      } else {
        console.log('\n⚠️  Migration not yet implemented');
        console.log('Use TDDAI command: tddai migrate ossa-to-oaas');
      }

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  });

// TDDAI integration command
program
  .command('tddai-setup')
  .description('Setup TDDAI integration for agents')
  .option('-w, --workspace <path>', 'Workspace path', process.cwd())
  .action(async (options) => {
    try {
      console.log('🔧 TDDAI Integration Setup');
      console.log('Setting up enhanced OAAS validation for TDDAI...\n');

      const validator = new EnhancedOAASValidator();
      const results = await validator.validateWorkspace(options.workspace);

      console.log('📋 TDDAI Integration Status:');
      console.log(`   Ready: ${results.summary.tddai_ready}/${results.summary.total_agents}`);
      
      const needsSetup = results.agents.filter(agent => !agent.tddaiIntegration?.supported);
      if (needsSetup.length > 0) {
        console.log('\n🎯 Agents needing TDDAI setup:');
        needsSetup.forEach(agent => {
          console.log(`   • ${agent.metadata?.file || 'unknown'}`);
          agent.tddaiIntegration?.setupInstructions?.forEach(instruction => {
            console.log(`     - ${instruction}`);
          });
        });
      }

      console.log('\n🚀 Available TDDAI commands after setup:');
      console.log('   tddai agents validate [path]');
      console.log('   tddai agents spawn <name>');
      console.log('   tddai agents orchestrate [options]');
      console.log('   tddai golden deploy --target=oaas');

    } catch (error) {
      console.error('❌ TDDAI setup failed:', error.message);
      process.exit(1);
    }
  });

// Compliance check command  
program
  .command('compliance')
  .description('Check compliance with various agent standards')
  .option('-w, --workspace <path>', 'Workspace path', process.cwd())
  .option('--standard <standard>', 'Standard to check (ossa|oaas|all)', 'all')
  .action(async (options) => {
    try {
      console.log('📋 Agent Standards Compliance Check');
      console.log(`🎯 Standard: ${options.standard}\n`);

      const validator = new EnhancedOAASValidator({
        strict: true
      });

      const results = await validator.validateWorkspace(options.workspace);
      
      console.log('🏆 Compliance Summary:');
      console.log(`   OSSA v0.1.2: ${results.summary.format_breakdown.ossa_v0_1_2} agents`);
      console.log(`   OAAS v0.1.1: ${results.summary.format_breakdown.oaas_v0_1_1} agents`);
      console.log(`   Unknown format: ${results.summary.format_breakdown.unknown} agents`);
      
      console.log(`\n📊 Overall Compliance: ${results.summary.validation_rate}`);
      
      const complianceLevels = {};
      results.agents.forEach(agent => {
        const level = agent.compliance_level;
        complianceLevels[level] = (complianceLevels[level] || 0) + 1;
      });

      console.log('\n📈 Compliance Level Distribution:');
      Object.entries(complianceLevels).forEach(([level, count]) => {
        const emoji = level === 'enterprise' ? '🥇' : 
                     level === 'advanced' ? '🥈' : 
                     level === 'standard' ? '🥉' : '📝';
        console.log(`   ${emoji} ${level}: ${count} agents`);
      });

    } catch (error) {
      console.error('❌ Compliance check failed:', error.message);
      process.exit(1);
    }
  });

// Parse CLI arguments
program.parse();

// Default action if no command specified
if (!process.argv.slice(2).length) {
  console.log('🚀 Enhanced OAAS Validator v0.1.1');
  console.log('🔧 @bluefly/oaas integration enabled');
  console.log('\nUsage: validate-oaas-enhanced <command> [options]\n');
  program.outputHelp();
}