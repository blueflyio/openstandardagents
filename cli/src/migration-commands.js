#!/usr/bin/env node

/**
 * Agent-Ops CLI Migration Commands v0.1.0
 * 
 * CLI integration for agent-ops to manage deprecation and migration
 * through the OSSA Deprecation Management API.
 * 
 * Commands:
 * - ops migration status - Show migration progress across ecosystem
 * - ops migration plan [project] - Generate migration plan for projects
 * - ops migration validate - Validate all deprecated scripts have CLI equivalents
 * - ops migration track [script] - Track individual script migration status
 */

import { Command } from 'commander';
import axios from 'axios';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// API Configuration
const API_BASE_URL = process.env.DEPRECATION_API_URL || 'http://localhost:4001/api/v1';
const API_TIMEOUT = 30000; // 30 seconds

// Configure axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'agent-ops-cli/0.1.0'
  }
});

// Utility functions
function formatTable(headers, rows) {
  const columnWidths = headers.map((header, index) => 
    Math.max(
      header.length,
      ...rows.map(row => String(row[index] || '').length)
    )
  );
  
  const separator = '+' + columnWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
  const headerRow = '|' + headers.map((header, index) => 
    ` ${header.padEnd(columnWidths[index])} `
  ).join('|') + '|';
  
  const dataRows = rows.map(row => 
    '|' + row.map((cell, index) => 
      ` ${String(cell || '').padEnd(columnWidths[index])} `
    ).join('|') + '|'
  );
  
  return [separator, headerRow, separator, ...dataRows, separator].join('\n');
}

function formatPercentage(value) {
  return `${Math.round(value * 100) / 100}%`;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

async function handleApiError(error, command) {
  console.error(`❌ Error executing ${command}:`);
  
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    console.error(`   Status: ${status}`);
    console.error(`   Message: ${data.message || 'Unknown error'}`);
    
    if (data.details) {
      console.error(`   Details: ${JSON.stringify(data.details, null, 2)}`);
    }
  } else if (error.request) {
    console.error('   Network error: Unable to reach deprecation management API');
    console.error(`   Check if the API is running on ${API_BASE_URL}`);
  } else {
    console.error(`   Error: ${error.message}`);
  }
  
  process.exit(1);
}

// Command implementations

/**
 * ops migration status - Show migration progress across ecosystem
 */
async function migrationStatus(options) {
  try {
    console.log('📊 Fetching migration status...\n');
    
    const params = {};
    if (options.project) {
      params.project = options.project;
    }
    
    const response = await api.get('/migration/status', { params });
    const status = response.data;
    
    console.log('🎯 Overall Migration Status');
    console.log('─'.repeat(50));
    console.log(`Total Scripts: ${status.overall.totalScripts}`);
    console.log(`Migrated: ${status.overall.migratedScripts}`);
    console.log(`Completion: ${formatPercentage(status.overall.completionPercentage)}`);
    console.log(`Next Milestone: ${formatDate(status.overall.nextMilestone)}`);
    
    if (status.byProject && status.byProject.length > 0) {
      console.log('\n📁 By Project:');
      console.log('─'.repeat(50));
      
      const projectHeaders = ['Project', 'Total', 'Migrated', 'Progress'];
      const projectRows = status.byProject.map(p => [
        p.project,
        p.totalScripts,
        p.migratedScripts,
        formatPercentage(p.completionPercentage)
      ]);
      
      console.log(formatTable(projectHeaders, projectRows));
    }
    
    if (status.byPhase && status.byPhase.length > 0) {
      console.log('\n🔄 By Phase:');
      console.log('─'.repeat(50));
      
      const phaseHeaders = ['Phase', 'Scripts', 'Description'];
      const phaseRows = status.byPhase.map(p => [
        p.phase,
        p.scriptCount,
        p.description.slice(0, 60) + (p.description.length > 60 ? '...' : '')
      ]);
      
      console.log(formatTable(phaseHeaders, phaseRows));
    }
    
    console.log('\n✅ Migration status retrieved successfully');
    
  } catch (error) {
    await handleApiError(error, 'migration status');
  }
}

/**
 * ops migration plan [project] - Generate migration plan for projects
 */
async function migrationPlan(project, options) {
  if (!project) {
    console.error('❌ Error: Project name is required');
    console.log('   Usage: ops migration plan <project-name>');
    process.exit(1);
  }
  
  try {
    console.log(`📋 Generating migration plan for project: ${project}\n`);
    
    const requestBody = {};
    if (options.targetVersion) {
      requestBody.targetVersion = options.targetVersion;
    }
    if (options.includeRisk !== undefined) {
      requestBody.includeRiskAssessment = options.includeRisk;
    }
    if (options.prioritizeUsage !== undefined) {
      requestBody.prioritizeByUsage = options.prioritizeUsage;
    }
    
    const response = await api.post(`/migration/plan/${project}`, requestBody);
    const plan = response.data;
    
    console.log(`🎯 Migration Plan for ${plan.project}`);
    console.log('─'.repeat(50));
    console.log(`Version: ${plan.version}`);
    console.log(`Created: ${new Date(plan.created).toLocaleString()}`);
    console.log(`Estimated Completion: ${new Date(plan.estimatedCompletion).toLocaleString()}`);
    
    if (plan.steps && plan.steps.length > 0) {
      console.log('\n📝 Migration Steps:');
      console.log('─'.repeat(50));
      
      const stepHeaders = ['Step', 'Description', 'CLI Command', 'Est. Time'];
      const stepRows = plan.steps.map(step => [
        step.order,
        step.description.slice(0, 40) + (step.description.length > 40 ? '...' : ''),
        step.cliCommand.slice(0, 30) + (step.cliCommand.length > 30 ? '...' : ''),
        step.estimatedTime
      ]);
      
      console.log(formatTable(stepHeaders, stepRows));
    }
    
    if (plan.riskAssessment) {
      console.log('\n⚠️  Risk Assessment:');
      console.log('─'.repeat(50));
      console.log(`Risk Level: ${plan.riskAssessment.level.toUpperCase()}`);
      
      if (plan.riskAssessment.factors) {
        plan.riskAssessment.factors.forEach(factor => {
          console.log(`  • ${factor}`);
        });
      }
    }
    
    // Save plan to file if requested
    if (options.save) {
      const filename = `migration-plan-${project}-${Date.now()}.json`;
      writeFileSync(filename, JSON.stringify(plan, null, 2));
      console.log(`\n💾 Migration plan saved to: ${filename}`);
    }
    
    console.log('\n✅ Migration plan generated successfully');
    
  } catch (error) {
    await handleApiError(error, 'migration plan');
  }
}

/**
 * ops migration validate - Validate all deprecated scripts have CLI equivalents
 */
async function migrationValidate(options) {
  try {
    console.log('🔍 Validating migration completeness...\n');
    
    const requestBody = {};
    if (options.projects) {
      requestBody.projects = options.projects.split(',').map(p => p.trim());
    }
    if (options.strict !== undefined) {
      requestBody.strict = options.strict;
    }
    
    const response = await api.post('/migration/validate', requestBody);
    const validation = response.data;
    
    console.log('🎯 Validation Results');
    console.log('─'.repeat(50));
    console.log(`Overall Valid: ${validation.valid ? '✅ YES' : '❌ NO'}`);
    console.log(`Total Scripts: ${validation.summary.totalScripts}`);
    console.log(`Validated: ${validation.summary.validatedScripts}`);
    console.log(`Missing CLI Equivalents: ${validation.summary.missingCliEquivalents}`);
    
    if (validation.issues && validation.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      console.log('─'.repeat(50));
      
      const issueHeaders = ['Script ID', 'Severity', 'Issue', 'Suggestion'];
      const issueRows = validation.issues.map(issue => [
        issue.scriptId.slice(0, 15) + '...',
        issue.severity.toUpperCase(),
        issue.issue.slice(0, 30) + (issue.issue.length > 30 ? '...' : ''),
        issue.suggestion.slice(0, 40) + (issue.suggestion.length > 40 ? '...' : '')
      ]);
      
      console.log(formatTable(issueHeaders, issueRows));
      
      // Group issues by severity
      const errorCount = validation.issues.filter(i => i.severity === 'error').length;
      const warningCount = validation.issues.filter(i => i.severity === 'warning').length;
      const criticalCount = validation.issues.filter(i => i.severity === 'critical').length;
      
      console.log(`\n📊 Issue Summary: ${criticalCount} critical, ${errorCount} errors, ${warningCount} warnings`);
    }
    
    if (validation.recommendations && validation.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      console.log('─'.repeat(50));
      
      validation.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    if (validation.valid) {
      console.log('\n✅ All scripts are ready for migration');
    } else {
      console.log('\n❌ Issues found that must be addressed before migration');
      process.exit(1);
    }
    
  } catch (error) {
    await handleApiError(error, 'migration validate');
  }
}

/**
 * ops migration track [script] - Track individual script migration status
 */
async function migrationTrack(scriptId, event, options) {
  if (!scriptId) {
    console.error('❌ Error: Script ID is required');
    console.log('   Usage: ops migration track <script-id> [event]');
    process.exit(1);
  }
  
  try {
    if (event) {
      // Update tracking with new event
      console.log(`📝 Tracking migration event for script: ${scriptId}\n`);
      
      const requestBody = {
        event,
        notes: options.notes || '',
        completedSteps: options.completed ? options.completed.split(',').map(s => s.trim()) : [],
        remainingWork: options.remaining ? options.remaining.split(',').map(s => s.trim()) : []
      };
      
      const response = await api.post(`/migration/track/${scriptId}`, requestBody);
      const tracking = response.data;
      
      console.log('✅ Tracking event recorded successfully');
      console.log(`   Current Status: ${tracking.currentStatus}`);
      console.log(`   Progress: ${formatPercentage(tracking.progress)}`);
      
    } else {
      // Get tracking status
      console.log(`📊 Getting migration tracking for script: ${scriptId}\n`);
      
      const response = await api.get(`/deprecation/scripts/${scriptId}`);
      const script = response.data;
      
      console.log('📄 Script Information:');
      console.log('─'.repeat(50));
      console.log(`Name: ${script.name}`);
      console.log(`Project: ${script.project}`);
      console.log(`Status: ${script.status}`);
      console.log(`Phase: ${script.phase}`);
      console.log(`CLI Equivalent: ${script.cliEquivalent || 'Not set'}`);
      
      // Try to get detailed tracking information
      try {
        const migrationResponse = await api.get('/migration/status');
        const migrationData = migrationResponse.data;
        
        // This would typically show detailed tracking info
        // For now, show basic migration context
        console.log(`\nMigration Context: Part of ${script.project} migration`);
        
      } catch (trackingError) {
        console.log('\nℹ️  Detailed tracking information not available');
      }
    }
    
  } catch (error) {
    await handleApiError(error, 'migration track');
  }
}

// Create command structure for agent-ops integration
export function createMigrationCommands() {
  const migrationCommand = new Command('migration')
    .description('Deprecation and migration management commands')
    .configureHelp({ 
      sortSubcommands: true,
      subcommandTerm: 'command'
    });

  // ops migration status
  migrationCommand
    .command('status')
    .description('Show migration progress across ecosystem')
    .option('-p, --project <name>', 'Filter by project name')
    .action(migrationStatus);

  // ops migration plan [project]
  migrationCommand
    .command('plan <project>')
    .description('Generate migration plan for projects')
    .option('--target-version <version>', 'Target version for migration', '0.1.8')
    .option('--include-risk', 'Include risk assessment in plan')
    .option('--prioritize-usage', 'Prioritize by script usage patterns')
    .option('--save', 'Save plan to JSON file')
    .action(migrationPlan);

  // ops migration validate
  migrationCommand
    .command('validate')
    .description('Validate all deprecated scripts have CLI equivalents')
    .option('--projects <list>', 'Comma-separated list of projects to validate')
    .option('--strict', 'Enable strict validation mode')
    .action(migrationValidate);

  // ops migration track [script]
  migrationCommand
    .command('track <scriptId> [event]')
    .description('Track individual script migration status')
    .option('--notes <text>', 'Add notes to the tracking event')
    .option('--completed <steps>', 'Comma-separated list of completed steps')
    .option('--remaining <work>', 'Comma-separated list of remaining work')
    .action(migrationTrack);

  return migrationCommand;
}

// CLI help and usage information
export const migrationHelp = `
AGENT-OPS MIGRATION COMMANDS v0.1.0

These commands integrate with the OSSA Deprecation Management API to provide
comprehensive migration tracking and management capabilities.

CONFIGURATION:
  Set DEPRECATION_API_URL environment variable to change API endpoint
  Default: http://localhost:4001/api/v1

EXAMPLES:
  ops migration status                     # Show overall migration status
  ops migration status -p ossa            # Show status for OSSA project only
  ops migration plan ossa --save           # Generate and save migration plan
  ops migration validate --strict          # Strict validation of all scripts
  ops migration track script_123 started  # Mark script migration as started
  ops migration track script_123          # Get script tracking information

API ENDPOINTS USED:
  GET /migration/status                    # Migration progress overview
  POST /migration/plan/:project            # Generate migration plans
  POST /migration/validate                 # Validate migration readiness
  POST /migration/track/:scriptId          # Track migration events
  GET /deprecation/scripts/:scriptId       # Get script details

For more information: https://ossa.agents/docs/api/deprecation-management
`;

export default { createMigrationCommands, migrationHelp };