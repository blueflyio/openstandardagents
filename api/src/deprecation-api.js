#!/usr/bin/env node

/**
 * OSSA Deprecation Management API v0.1.8
 * 
 * API-first deprecation management system for the LLM ecosystem.
 * Provides REST endpoints for script migration tracking, CLI command mapping,
 * and deprecation warning management.
 * 
 * This API exposes comprehensive deprecation management functionality
 * that can be consumed by CLI tools (agent-ops, agent-forge, agent-studio)
 * and external systems.
 */

import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.DEPRECATION_API_PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/v1', express.static(join(__dirname, '../openapi')));

// Data persistence layer (simple file-based for now)
const DATA_DIR = join(__dirname, '../../data');
const SCRIPTS_DB = join(DATA_DIR, 'deprecated-scripts.json');
const MIGRATIONS_DB = join(DATA_DIR, 'migrations.json');
const CLI_COMMANDS_DB = join(DATA_DIR, 'cli-commands.json');

// Initialize databases
function initializeDatabase() {
  if (!existsSync(DATA_DIR)) {
    require('fs').mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!existsSync(SCRIPTS_DB)) {
    writeFileSync(SCRIPTS_DB, JSON.stringify({ scripts: {}, metadata: { version: '0.1.8', created: new Date().toISOString() } }, null, 2));
  }
  
  if (!existsSync(MIGRATIONS_DB)) {
    writeFileSync(MIGRATIONS_DB, JSON.stringify({ migrations: {}, plans: {}, tracking: {} }, null, 2));
  }
  
  if (!existsSync(CLI_COMMANDS_DB)) {
    writeFileSync(CLI_COMMANDS_DB, JSON.stringify({ commands: {}, mappings: {} }, null, 2));
  }
}

// Database helpers
function loadDatabase(dbPath) {
  try {
    return JSON.parse(readFileSync(dbPath, 'utf8'));
  } catch (error) {
    console.error(`Error loading database ${dbPath}:`, error);
    return {};
  }
}

function saveDatabase(dbPath, data) {
  try {
    writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving database ${dbPath}:`, error);
    return false;
  }
}

// Generate unique IDs
function generateId(prefix = 'script') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validation helpers
function validateScript(scriptData) {
  const required = ['name', 'project', 'path', 'cliEquivalent'];
  const missing = required.filter(field => !scriptData[field]);
  
  if (missing.length > 0) {
    return { valid: false, errors: [`Missing required fields: ${missing.join(', ')}`] };
  }
  
  if (scriptData.phase && (scriptData.phase < 1 || scriptData.phase > 4)) {
    return { valid: false, errors: ['Phase must be between 1 and 4'] };
  }
  
  return { valid: true, errors: [] };
}

// API Routes

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '0.1.8',
    timestamp: new Date().toISOString(),
    api: 'OSSA Deprecation Management API'
  });
});

// Scripts management
app.get('/api/v1/deprecation/scripts', (req, res) => {
  try {
    const db = loadDatabase(SCRIPTS_DB);
    const scripts = Object.values(db.scripts || {});
    
    // Apply filters
    let filtered = scripts;
    
    if (req.query.project) {
      filtered = filtered.filter(s => s.project === req.query.project);
    }
    
    if (req.query.status) {
      filtered = filtered.filter(s => s.status === req.query.status);
    }
    
    if (req.query.phase) {
      const phase = parseInt(req.query.phase);
      filtered = filtered.filter(s => s.phase === phase);
    }
    
    res.json({
      scripts: filtered,
      total: scripts.length,
      filtered: filtered.length
    });
  } catch (error) {
    console.error('Error listing scripts:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve scripts',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/v1/deprecation/scripts', (req, res) => {
  try {
    const validation = validateScript(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid script data',
        details: { errors: validation.errors },
        timestamp: new Date().toISOString()
      });
    }
    
    const db = loadDatabase(SCRIPTS_DB);
    const scriptId = generateId('script');
    
    // Check for duplicates
    const existing = Object.values(db.scripts || {}).find(s => 
      s.name === req.body.name && s.project === req.body.project
    );
    
    if (existing) {
      return res.status(409).json({
        code: 'DUPLICATE_SCRIPT',
        message: 'Script already registered for this project',
        timestamp: new Date().toISOString()
      });
    }
    
    const script = {
      id: scriptId,
      ...req.body,
      status: 'warning',
      phase: req.body.phase || 1,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      usageCount: 0
    };
    
    db.scripts[scriptId] = script;
    
    if (saveDatabase(SCRIPTS_DB, db)) {
      res.status(201).json(script);
    } else {
      res.status(500).json({
        code: 'SAVE_ERROR',
        message: 'Failed to save script',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error registering script:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to register script',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/deprecation/scripts/:scriptId', (req, res) => {
  try {
    const db = loadDatabase(SCRIPTS_DB);
    const script = db.scripts?.[req.params.scriptId];
    
    if (!script) {
      return res.status(404).json({
        code: 'SCRIPT_NOT_FOUND',
        message: 'Script not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json(script);
  } catch (error) {
    console.error('Error getting script:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve script',
      timestamp: new Date().toISOString()
    });
  }
});

app.put('/api/v1/deprecation/scripts/:scriptId', (req, res) => {
  try {
    const db = loadDatabase(SCRIPTS_DB);
    const script = db.scripts?.[req.params.scriptId];
    
    if (!script) {
      return res.status(404).json({
        code: 'SCRIPT_NOT_FOUND',
        message: 'Script not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Update allowed fields
    const allowedUpdates = ['status', 'phase', 'cliEquivalent', 'description', 'migrationDeadline', 'tags'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    const updatedScript = {
      ...script,
      ...updates,
      lastModified: new Date().toISOString()
    };
    
    db.scripts[req.params.scriptId] = updatedScript;
    
    if (saveDatabase(SCRIPTS_DB, db)) {
      res.json(updatedScript);
    } else {
      res.status(500).json({
        code: 'SAVE_ERROR',
        message: 'Failed to update script',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating script:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to update script',
      timestamp: new Date().toISOString()
    });
  }
});

app.delete('/api/v1/deprecation/scripts/:scriptId', (req, res) => {
  try {
    const db = loadDatabase(SCRIPTS_DB);
    
    if (!db.scripts?.[req.params.scriptId]) {
      return res.status(404).json({
        code: 'SCRIPT_NOT_FOUND',
        message: 'Script not found',
        timestamp: new Date().toISOString()
      });
    }
    
    delete db.scripts[req.params.scriptId];
    
    if (saveDatabase(SCRIPTS_DB, db)) {
      res.status(204).send();
    } else {
      res.status(500).json({
        code: 'SAVE_ERROR',
        message: 'Failed to remove script',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error removing script:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to remove script',
      timestamp: new Date().toISOString()
    });
  }
});

// Migration status
app.get('/api/v1/migration/status', (req, res) => {
  try {
    const scriptsDb = loadDatabase(SCRIPTS_DB);
    const scripts = Object.values(scriptsDb.scripts || {});
    
    let filtered = scripts;
    if (req.query.project) {
      filtered = filtered.filter(s => s.project === req.query.project);
    }
    
    // Calculate overall statistics
    const totalScripts = filtered.length;
    const migratedScripts = filtered.filter(s => s.status === 'removed').length;
    const completionPercentage = totalScripts > 0 ? (migratedScripts / totalScripts) * 100 : 0;
    
    // Group by project
    const projectStats = {};
    filtered.forEach(script => {
      if (!projectStats[script.project]) {
        projectStats[script.project] = { total: 0, migrated: 0 };
      }
      projectStats[script.project].total++;
      if (script.status === 'removed') {
        projectStats[script.project].migrated++;
      }
    });
    
    const byProject = Object.entries(projectStats).map(([project, stats]) => ({
      project,
      totalScripts: stats.total,
      migratedScripts: stats.migrated,
      completionPercentage: stats.total > 0 ? (stats.migrated / stats.total) * 100 : 0
    }));
    
    // Group by phase
    const phaseStats = [1, 2, 3, 4].map(phase => {
      const phaseScripts = filtered.filter(s => s.phase === phase);
      return {
        phase,
        scriptCount: phaseScripts.length,
        description: getPhaseDescription(phase)
      };
    });
    
    res.json({
      overall: {
        totalScripts,
        migratedScripts,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        nextMilestone: calculateNextMilestone()
      },
      byProject,
      byPhase: phaseStats
    });
  } catch (error) {
    console.error('Error getting migration status:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve migration status',
      timestamp: new Date().toISOString()
    });
  }
});

function getPhaseDescription(phase) {
  const descriptions = {
    1: 'Warning Phase - Scripts show deprecation warnings',
    2: 'Redirect Phase - Scripts redirect to CLI commands',
    3: 'Error Phase - Scripts show errors and refuse to run',
    4: 'Removal Phase - Scripts are completely removed'
  };
  return descriptions[phase] || 'Unknown phase';
}

function calculateNextMilestone() {
  const now = new Date();
  const milestones = [
    new Date('2025-10-01'),
    new Date('2025-11-01'),
    new Date('2025-12-01'),
    new Date('2026-01-01')
  ];
  
  for (const milestone of milestones) {
    if (milestone > now) {
      return milestone.toISOString().split('T')[0];
    }
  }
  
  return null;
}

// Migration plan generation
app.get('/api/v1/migration/plan/:project', (req, res) => {
  try {
    const migrationDb = loadDatabase(MIGRATIONS_DB);
    const plan = migrationDb.plans?.[req.params.project];
    
    if (!plan) {
      return res.status(404).json({
        code: 'PLAN_NOT_FOUND',
        message: 'Migration plan not found for project',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Error getting migration plan:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve migration plan',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/v1/migration/plan/:project', (req, res) => {
  try {
    const project = req.params.project;
    const scriptsDb = loadDatabase(SCRIPTS_DB);
    const migrationDb = loadDatabase(MIGRATIONS_DB);
    
    // Get scripts for this project
    const projectScripts = Object.values(scriptsDb.scripts || {})
      .filter(s => s.project === project);
    
    if (projectScripts.length === 0) {
      return res.status(404).json({
        code: 'NO_SCRIPTS_FOUND',
        message: 'No scripts found for this project',
        timestamp: new Date().toISOString()
      });
    }
    
    // Generate migration steps
    const steps = projectScripts.map((script, index) => ({
      order: index + 1,
      description: `Migrate ${script.name} to CLI command: ${script.cliEquivalent}`,
      scriptId: script.id,
      cliCommand: script.cliEquivalent,
      estimatedTime: '15 minutes',
      dependencies: index === 0 ? [] : [projectScripts[index - 1].id]
    }));
    
    // Calculate estimated completion
    const estimatedHours = steps.length * 0.25; // 15 minutes per script
    const estimatedCompletion = new Date();
    estimatedCompletion.setTime(estimatedCompletion.getTime() + (estimatedHours * 60 * 60 * 1000));
    
    // Risk assessment
    const highRiskScripts = projectScripts.filter(s => s.usageCount > 10).length;
    const riskLevel = highRiskScripts > projectScripts.length * 0.3 ? 'high' : 
                     highRiskScripts > projectScripts.length * 0.1 ? 'medium' : 'low';
    
    const plan = {
      project,
      version: req.body.targetVersion || '0.1.8',
      created: new Date().toISOString(),
      steps,
      estimatedCompletion: estimatedCompletion.toISOString(),
      riskAssessment: {
        level: riskLevel,
        factors: [
          `${projectScripts.length} scripts to migrate`,
          `${highRiskScripts} high-usage scripts`,
          riskLevel === 'high' ? 'Extensive testing recommended' : 'Standard testing required'
        ]
      }
    };
    
    migrationDb.plans = migrationDb.plans || {};
    migrationDb.plans[project] = plan;
    
    if (saveDatabase(MIGRATIONS_DB, migrationDb)) {
      res.status(201).json(plan);
    } else {
      res.status(500).json({
        code: 'SAVE_ERROR',
        message: 'Failed to save migration plan',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error generating migration plan:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to generate migration plan',
      timestamp: new Date().toISOString()
    });
  }
});

// Migration validation
app.post('/api/v1/migration/validate', (req, res) => {
  try {
    const scriptsDb = loadDatabase(SCRIPTS_DB);
    const cliDb = loadDatabase(CLI_COMMANDS_DB);
    
    const scripts = Object.values(scriptsDb.scripts || {});
    let scriptsToValidate = scripts;
    
    // Filter by projects if specified
    if (req.body.projects && req.body.projects.length > 0) {
      scriptsToValidate = scripts.filter(s => req.body.projects.includes(s.project));
    }
    
    const issues = [];
    let validatedScripts = 0;
    
    scriptsToValidate.forEach(script => {
      let hasIssues = false;
      
      // Check if CLI equivalent exists
      if (!script.cliEquivalent) {
        issues.push({
          scriptId: script.id,
          issue: 'No CLI equivalent specified',
          severity: 'error',
          suggestion: 'Specify a CLI command that replaces this script'
        });
        hasIssues = true;
      }
      
      // Check if CLI command is actually available
      const cliCommand = Object.values(cliDb.commands || {})
        .find(cmd => script.cliEquivalent?.includes(cmd.command));
      
      if (script.cliEquivalent && !cliCommand) {
        issues.push({
          scriptId: script.id,
          issue: `CLI command '${script.cliEquivalent}' not found`,
          severity: 'warning',
          suggestion: 'Verify the CLI command exists or update the mapping'
        });
        hasIssues = true;
      }
      
      // Strict mode validation
      if (req.body.strict) {
        if (!script.migrationDeadline) {
          issues.push({
            scriptId: script.id,
            issue: 'No migration deadline set',
            severity: 'warning',
            suggestion: 'Set a migration deadline for proper planning'
          });
          hasIssues = true;
        }
        
        if (!script.description) {
          issues.push({
            scriptId: script.id,
            issue: 'No description provided',
            severity: 'warning',
            suggestion: 'Add a description explaining what the script does'
          });
          hasIssues = true;
        }
      }
      
      if (!hasIssues) {
        validatedScripts++;
      }
    });
    
    const recommendations = [];
    if (issues.length > 0) {
      recommendations.push('Review and fix identified issues before proceeding');
      recommendations.push('Ensure all CLI commands are properly documented');
      recommendations.push('Test CLI commands before marking scripts as migrated');
    }
    
    res.json({
      valid: issues.filter(i => i.severity === 'error').length === 0,
      summary: {
        totalScripts: scriptsToValidate.length,
        validatedScripts,
        missingCliEquivalents: scriptsToValidate.filter(s => !s.cliEquivalent).length
      },
      issues,
      recommendations
    });
  } catch (error) {
    console.error('Error validating migration:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to validate migration',
      timestamp: new Date().toISOString()
    });
  }
});

// CLI commands management
app.get('/api/v1/cli/commands', (req, res) => {
  try {
    const db = loadDatabase(CLI_COMMANDS_DB);
    const commands = Object.values(db.commands || {});
    
    let filtered = commands;
    if (req.query.tool) {
      filtered = filtered.filter(cmd => cmd.tool === req.query.tool);
    }
    
    const tools = [...new Set(commands.map(cmd => cmd.tool))];
    
    res.json({
      commands: filtered,
      tools
    });
  } catch (error) {
    console.error('Error listing CLI commands:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve CLI commands',
      timestamp: new Date().toISOString()
    });
  }
});

// CLI mapping
app.get('/api/v1/cli/mapping/:scriptId', (req, res) => {
  try {
    const scriptsDb = loadDatabase(SCRIPTS_DB);
    const cliDb = loadDatabase(CLI_COMMANDS_DB);
    
    const script = scriptsDb.scripts?.[req.params.scriptId];
    if (!script) {
      return res.status(404).json({
        code: 'SCRIPT_NOT_FOUND',
        message: 'Script not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Find CLI command details
    const cliCommand = Object.values(cliDb.commands || {})
      .find(cmd => script.cliEquivalent?.includes(cmd.command));
    
    const mapping = {
      scriptId: script.id,
      scriptPath: script.path,
      cliTool: cliCommand?.tool || 'unknown',
      cliCommand: script.cliEquivalent,
      usageExample: cliCommand?.usage || `Usage: ${script.cliEquivalent}`,
      migrationInstructions: [
        `Replace direct execution of ${script.name}`,
        `Use CLI command: ${script.cliEquivalent}`,
        'Update CI/CD pipelines and scripts',
        'Test thoroughly before removing old script'
      ]
    };
    
    res.json(mapping);
  } catch (error) {
    console.error('Error getting CLI mapping:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve CLI mapping',
      timestamp: new Date().toISOString()
    });
  }
});

// Warning generation
app.post('/api/v1/warnings/generate', (req, res) => {
  try {
    const scriptsDb = loadDatabase(SCRIPTS_DB);
    const scripts = Object.values(scriptsDb.scripts || {});
    
    let scriptsToProcess = scripts;
    
    // Filter by scriptIds if specified
    if (req.body.scriptIds && req.body.scriptIds.length > 0) {
      scriptsToProcess = scripts.filter(s => req.body.scriptIds.includes(s.id));
    }
    
    // Filter by projects if specified
    if (req.body.projects && req.body.projects.length > 0) {
      scriptsToProcess = scriptsToProcess.filter(s => req.body.projects.includes(s.project));
    }
    
    // Filter by phase if specified
    if (req.body.phase) {
      scriptsToProcess = scriptsToProcess.filter(s => s.phase === req.body.phase);
    }
    
    const results = {
      generated: 0,
      updated: 0,
      errors: [],
      warnings: []
    };
    
    scriptsToProcess.forEach(script => {
      try {
        const warningText = generateWarningText(script);
        
        // In a real implementation, this would update the actual script files
        // For now, we'll just track what would be generated
        results.warnings.push({
          scriptId: script.id,
          warningText,
          insertedAt: 'top of file'
        });
        
        results.generated++;
      } catch (error) {
        results.errors.push({
          scriptId: script.id,
          error: error.message
        });
      }
    });
    
    res.json(results);
  } catch (error) {
    console.error('Error generating warnings:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to generate warnings',
      timestamp: new Date().toISOString()
    });
  }
});

function generateWarningText(script) {
  const phaseMessages = {
    1: `⚠️ DEPRECATED: This script is deprecated. Use CLI instead: ${script.cliEquivalent}`,
    2: `⚠️ REDIRECTING: This script will redirect to CLI command: ${script.cliEquivalent}`,
    3: `❌ ERROR: This script is deprecated and will not run. Use: ${script.cliEquivalent}`,
    4: `❌ REMOVED: This script has been removed. Use: ${script.cliEquivalent}`
  };
  
  return phaseMessages[script.phase] || phaseMessages[1];
}

// Migration tracking
app.post('/api/v1/migration/track/:scriptId', (req, res) => {
  try {
    const scriptsDb = loadDatabase(SCRIPTS_DB);
    const migrationDb = loadDatabase(MIGRATIONS_DB);
    
    const script = scriptsDb.scripts?.[req.params.scriptId];
    if (!script) {
      return res.status(404).json({
        code: 'SCRIPT_NOT_FOUND',
        message: 'Script not found',
        timestamp: new Date().toISOString()
      });
    }
    
    const tracking = migrationDb.tracking = migrationDb.tracking || {};
    if (!tracking[req.params.scriptId]) {
      tracking[req.params.scriptId] = {
        scriptId: req.params.scriptId,
        timeline: [],
        currentStatus: 'pending',
        progress: 0
      };
    }
    
    const trackingEntry = tracking[req.params.scriptId];
    
    // Add timeline event
    trackingEntry.timeline.push({
      timestamp: new Date().toISOString(),
      event: req.body.event,
      notes: req.body.notes || ''
    });
    
    // Update status and progress
    const progressMap = {
      started: 25,
      completed: 100,
      failed: 0,
      postponed: 10
    };
    
    trackingEntry.currentStatus = req.body.event;
    trackingEntry.progress = progressMap[req.body.event] || trackingEntry.progress;
    
    if (saveDatabase(MIGRATIONS_DB, migrationDb)) {
      res.json(trackingEntry);
    } else {
      res.status(500).json({
        code: 'SAVE_ERROR',
        message: 'Failed to save migration tracking',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error tracking migration:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to track migration',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Initialize and start server
initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 OSSA Deprecation Management API v0.1.8 running on port ${PORT}`);
  console.log(`📖 OpenAPI documentation: http://localhost:${PORT}/api/v1/deprecation-management-api-v0.1.8.yaml`);
  console.log(`💡 Health check: http://localhost:${PORT}/api/v1/health`);
});

export default app;