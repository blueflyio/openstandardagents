#!/usr/bin/env node

/**
 * OSSA Validation Service
 * Background service that validates agents and communicates with agent_buildkit
 */

import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, existsSync, watchFile } from 'fs';
import { join, resolve } from 'path';
import * as yaml from 'js-yaml';
import chalk from 'chalk';

export interface ValidationConfig {
  agentBuildkitPath: string;
  watchDirectories: string[];
  validationInterval: number;
  communicationProtocol: 'http' | 'ipc' | 'websocket';
  port?: number;
}

export interface ValidationResult {
  valid: boolean;
  agentId: string;
  filePath: string;
  errors: ValidationError[];
  warnings: string[];
  ossaCompliance: boolean;
  schemaVersion: string;
  timestamp: string;
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error' | 'warning' | 'info';
}

export interface AgentBuildkitMessage {
  type: 'validation_result' | 'agent_status' | 'compliance_check';
  payload: any;
  timestamp: string;
  source: 'ossa';
}

/**
 * OSSA Validation Service
 * Monitors agent files and validates them against OSSA specification
 */
export class ValidationService extends EventEmitter {
  private config: ValidationConfig;
  private isRunning: boolean = false;
  private watchedFiles: Set<string> = new Set();
  private validationCache: Map<string, ValidationResult> = new Map();

  constructor(config: ValidationConfig) {
    super();
    this.config = config;
  }

  /**
   * Start the validation service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(chalk.yellow('⚠️ Validation service is already running'));
      return;
    }

    console.log(chalk.green('🚀 Starting OSSA Validation Service...'));
    this.isRunning = true;

    // Initialize file watchers
    this.setupFileWatchers();

    // Start periodic validation
    this.startPeriodicValidation();

    // Setup agent_buildkit communication
    await this.setupAgentBuildkitCommunication();

    console.log(chalk.green('✅ OSSA Validation Service started successfully'));
    this.emit('service:started');
  }

  /**
   * Stop the validation service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log(chalk.blue('🛑 Stopping OSSA Validation Service...'));
    this.isRunning = false;

    // Clean up watchers
    this.watchedFiles.clear();

    console.log(chalk.blue('✅ OSSA Validation Service stopped'));
    this.emit('service:stopped');
  }

  /**
   * Setup file watchers for agent manifests
   */
  private setupFileWatchers(): void {
    console.log(chalk.gray('📁 Setting up file watchers...'));

    this.config.watchDirectories.forEach((directory) => {
      if (!existsSync(directory)) {
        console.log(chalk.yellow(`⚠️ Watch directory does not exist: ${directory}`));
        return;
      }

      // Watch for .agent files
      this.watchAgentFiles(directory);
    });
  }

  /**
   * Watch for agent manifest files in a directory
   */
  private watchAgentFiles(directory: string): void {
    const glob = require('glob');
    const agentFiles = glob.sync(join(directory, '**/*.agent'), { absolute: true });

    agentFiles.forEach((filePath: string) => {
      if (!this.watchedFiles.has(filePath)) {
        this.watchedFiles.add(filePath);

        watchFile(filePath, (curr, prev) => {
          if (curr.mtime !== prev.mtime) {
            console.log(chalk.blue(`📝 Agent file changed: ${filePath}`));
            this.validateAgentFile(filePath);
          }
        });

        // Initial validation
        this.validateAgentFile(filePath);
      }
    });
  }

  /**
   * Validate a single agent file
   */
  private async validateAgentFile(filePath: string): Promise<ValidationResult> {
    console.log(chalk.gray(`🔍 Validating agent: ${filePath}`));

    try {
      const content = readFileSync(filePath, 'utf8');
      const agent = yaml.load(content) as any;

      const result: ValidationResult = {
        valid: true,
        agentId: agent.metadata?.name || 'unknown',
        filePath,
        errors: [],
        warnings: [],
        ossaCompliance: false,
        schemaVersion: agent.apiVersion || 'unknown',
        timestamp: new Date().toISOString()
      };

      // Validate OSSA compliance
      await this.validateOSSACompliance(agent, result);

      // Validate against JSON schema
      await this.validateAgainstSchema(agent, result);

      // Validate OpenAPI spec alignment
      await this.validateOpenAPIAlignment(agent, result);

      // Cache result
      this.validationCache.set(filePath, result);

      // Send to agent_buildkit
      await this.sendToAgentBuildkit({
        type: 'validation_result',
        payload: result,
        timestamp: new Date().toISOString(),
        source: 'ossa'
      });

      // Log result
      if (result.valid) {
        console.log(chalk.green(`✅ ${result.agentId}: Valid OSSA agent`));
      } else {
        console.log(chalk.red(`❌ ${result.agentId}: ${result.errors.length} errors`));
        result.errors.forEach((error) => {
          console.log(chalk.red(`   • ${error.message}`));
        });
      }

      this.emit('agent:validated', result);
      return result;
    } catch (error) {
      const result: ValidationResult = {
        valid: false,
        agentId: 'unknown',
        filePath,
        errors: [
          {
            code: 'PARSE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown parse error',
            path: filePath,
            severity: 'error'
          }
        ],
        warnings: [],
        ossaCompliance: false,
        schemaVersion: 'unknown',
        timestamp: new Date().toISOString()
      };

      console.log(chalk.red(`❌ Failed to parse agent file: ${filePath}`));
      this.emit('agent:validation_failed', result);
      return result;
    }
  }

  /**
   * Validate OSSA compliance
   */
  private async validateOSSACompliance(agent: any, result: ValidationResult): Promise<void> {
    // Check API version
    if (!agent.apiVersion || !agent.apiVersion.startsWith('@bluefly/ossa/')) {
      result.errors.push({
        code: 'INVALID_API_VERSION',
        message: 'apiVersion must start with "@bluefly/ossa/"',
        path: 'apiVersion',
        severity: 'error'
      });
      result.valid = false;
    }

    // Check required fields
    const requiredFields = ['apiVersion', 'kind', 'metadata', 'spec'];
    requiredFields.forEach((field) => {
      if (!agent[field]) {
        result.errors.push({
          code: 'MISSING_REQUIRED_FIELD',
          message: `Required field '${field}' is missing`,
          path: field,
          severity: 'error'
        });
        result.valid = false;
      }
    });

    // Check agent type alignment with OpenAPI
    const validTypes = ['worker', 'governor', 'critic', 'judge', 'observer'];
    if (agent.spec?.type && !validTypes.includes(agent.spec.type)) {
      result.errors.push({
        code: 'INVALID_AGENT_TYPE',
        message: `Agent type '${agent.spec.type}' is not valid. Must be one of: ${validTypes.join(', ')}`,
        path: 'spec.type',
        severity: 'error'
      });
      result.valid = false;
    }

    // If all checks pass, it's OSSA compliant
    if (result.errors.length === 0) {
      result.ossaCompliance = true;
    }
  }

  /**
   * Validate against JSON schema
   */
  private async validateAgainstSchema(agent: any, result: ValidationResult): Promise<void> {
    try {
      const Ajv = require('ajv');
      const ajv = new Ajv();

      // Load OSSA agent schema
      const schemaPath = resolve(__dirname, '../../api/schemas/agent-manifest.schema.json');
      if (existsSync(schemaPath)) {
        const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
        const validate = ajv.compile(schema);

        if (!validate(agent)) {
          validate.errors?.forEach((error: any) => {
            result.errors.push({
              code: 'SCHEMA_VALIDATION_ERROR',
              message: `${error.instancePath}: ${error.message}`,
              path: error.instancePath || 'root',
              severity: 'error'
            });
          });
          result.valid = false;
        }
      } else {
        result.warnings.push('OSSA agent schema not found - skipping schema validation');
      }
    } catch (error) {
      result.warnings.push(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate OpenAPI alignment
   */
  private async validateOpenAPIAlignment(agent: any, result: ValidationResult): Promise<void> {
    // Check if agent capabilities align with OpenAPI operations
    if (agent.spec?.capabilities?.operations) {
      const operations = agent.spec.capabilities.operations;

      // Warn if agent doesn't implement standard OSSA operations
      const standardOps = ['execute', 'health', 'capabilities', 'status'];
      const missingOps = standardOps.filter((op) => !operations.some((o: any) => o.name === op));

      if (missingOps.length > 0) {
        result.warnings.push(`Missing standard operations: ${missingOps.join(', ')}`);
      }
    }
  }

  /**
   * Start periodic validation of all cached agents
   */
  private startPeriodicValidation(): void {
    setInterval(() => {
      if (!this.isRunning) return;

      console.log(chalk.gray('🔄 Running periodic validation...'));
      this.watchedFiles.forEach((filePath) => {
        this.validateAgentFile(filePath);
      });
    }, this.config.validationInterval);
  }

  /**
   * Setup communication with agent_buildkit
   */
  private async setupAgentBuildkitCommunication(): Promise<void> {
    console.log(chalk.gray('🔗 Setting up agent_buildkit communication...'));

    switch (this.config.communicationProtocol) {
      case 'http':
        await this.setupHttpCommunication();
        break;
      case 'ipc':
        await this.setupIpcCommunication();
        break;
      case 'websocket':
        await this.setupWebSocketCommunication();
        break;
    }
  }

  /**
   * Setup HTTP communication with agent_buildkit
   */
  private async setupHttpCommunication(): Promise<void> {
    // Start HTTP server for agent_buildkit to call
    const express = require('express');
    const app = express();

    app.use(express.json());

    // Endpoint for agent_buildkit to get validation results
    app.get('/validation/agents', (req: any, res: any) => {
      const results = Array.from(this.validationCache.values());
      res.json({ results, timestamp: new Date().toISOString() });
    });

    // Endpoint for agent_buildkit to request specific agent validation
    app.post('/validation/validate', (req: any, res: any) => {
      const { agentPath } = req.body;
      if (agentPath && existsSync(agentPath)) {
        this.validateAgentFile(agentPath).then((result) => {
          res.json(result);
        });
      } else {
        res.status(400).json({ error: 'Invalid agent path' });
      }
    });

    const port = this.config.port || 3001;
    app.listen(port, () => {
      console.log(chalk.green(`🌐 HTTP validation server listening on port ${port}`));
    });
  }

  /**
   * Setup IPC communication with agent_buildkit
   */
  private async setupIpcCommunication(): Promise<void> {
    // TODO: Implement IPC communication
    console.log(chalk.yellow('⚠️ IPC communication not yet implemented'));
  }

  /**
   * Setup WebSocket communication with agent_buildkit
   */
  private async setupWebSocketCommunication(): Promise<void> {
    // TODO: Implement WebSocket communication
    console.log(chalk.yellow('⚠️ WebSocket communication not yet implemented'));
  }

  /**
   * Send message to agent_buildkit
   */
  private async sendToAgentBuildkit(message: AgentBuildkitMessage): Promise<void> {
    // For now, just emit the event - actual implementation depends on protocol
    this.emit('message:to_buildkit', message);
  }

  /**
   * Get validation status for all agents
   */
  public getValidationStatus(): ValidationResult[] {
    return Array.from(this.validationCache.values());
  }

  /**
   * Get validation status for specific agent
   */
  public getAgentValidation(agentId: string): ValidationResult | undefined {
    return Array.from(this.validationCache.values()).find((result) => result.agentId === agentId);
  }
}

/**
 * Default configuration
 */
export const defaultConfig: ValidationConfig = {
  agentBuildkitPath: '../agent_buildkit',
  watchDirectories: ['./.agents', '../agent_buildkit/agents', './agents'],
  validationInterval: 30000, // 30 seconds
  communicationProtocol: 'http',
  port: 3001
};

/**
 * Start validation service with CLI
 */
export async function startValidationService(config?: Partial<ValidationConfig>): Promise<ValidationService> {
  const finalConfig = { ...defaultConfig, ...config };
  const service = new ValidationService(finalConfig);

  await service.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log(chalk.blue('\n🛑 Received SIGINT, shutting down gracefully...'));
    await service.stop();
    process.exit(0);
  });

  return service;
}

// CLI entry point
if (require.main === module) {
  startValidationService().catch((error) => {
    console.error(chalk.red('❌ Failed to start validation service:'), error);
    process.exit(1);
  });
}
