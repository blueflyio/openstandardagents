/**
 * TDDAI Integration Service
 * Connects TDDAI framework to OpenAPI AI Agents Standard
 */

const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const winston = require('winston');

class TDDAIIntegration {
  constructor() {
    this.tddaiPath = process.env.TDDAI_PATH || '';
    this.tddaiPort = process.env.TDDAI_PORT || 3001;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'tddai-integration' },
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });

    this.activeOrchestrations = new Map();
  }

  /**
   * Initialize TDDAI integration
   */
  async initialize() {
    try {
      // Check if TDDAI is available
      const isAvailable = await this.checkTDDAIAvailability();
      if (!isAvailable) {
        throw new Error('TDDAI not available - please ensure TDDAI is installed and running');
      }

      this.logger.info('TDDAI integration initialized successfully');
      return true;
    } catch (error) {
      this.logger.error('TDDAI integration failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if TDDAI is available and responsive
   */
  async checkTDDAIAvailability() {
    try {
      // Try to ping TDDAI MCP server
      const response = await axios.get(`http://localhost:${this.tddaiPort}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      // If HTTP fails, try to check if tddai command is available
      return new Promise((resolve) => {
        const tddai = spawn('tddai', ['--version'], { stdio: 'pipe' });
        tddai.on('close', (code) => {
          resolve(code === 0);
        });
        tddai.on('error', () => {
          resolve(false);
        });
      });
    }
  }

  /**
   * Execute agent orchestration using TDDAI
   */
  async executeOrchestration(orchestrationRequest) {
    const { orchestration_pattern, agents, token_budget, domain, compliance_level } = orchestrationRequest;
    
    this.logger.info(`Starting TDDAI orchestration with pattern: ${orchestration_pattern}`);

    try {
      const orchestrationId = `tddai_orch_${Date.now()}`;
      
      // Map OpenAPI request to TDDAI command structure
      const tddaiCommand = this.buildTDDAICommand(orchestrationRequest);
      
      // Execute TDDAI command
      const tddaiProcess = await this.executeTDDAICommand(tddaiCommand);
      
      // Store orchestration tracking
      this.activeOrchestrations.set(orchestrationId, {
        process: tddaiProcess,
        request: orchestrationRequest,
        startTime: new Date(),
        status: 'running'
      });

      return {
        orchestration_id: orchestrationId,
        status: 'running',
        agents_deployed: agents.length,
        tddai_process_id: tddaiProcess.pid,
        estimated_completion_time: new Date(Date.now() + this.estimateCompletionTime(orchestration_pattern)).toISOString()
      };

    } catch (error) {
      this.logger.error('TDDAI orchestration failed:', error);
      throw new Error(`Orchestration failed: ${error.message}`);
    }
  }

  /**
   * Build TDDAI command from OpenAPI orchestration request
   */
  buildTDDAICommand(request) {
    const { orchestration_pattern, agents, domain } = request;

    // Map orchestration patterns to TDDAI commands
    const patternMap = {
      'diagnostic_first': 'agents orchestrate --pattern=diagnostic',
      'parallel_validation': 'agents orchestrate --pattern=parallel',
      'magentic_orchestration': 'agents orchestrate --pattern=dynamic',
      'adaptive': 'agents orchestrate --pattern=adaptive'
    };

    let baseCommand = patternMap[orchestration_pattern] || 'agents orchestrate';

    // Add agent specifications
    const agentSpecs = agents.map(agent => `${agent.type}:${agent.capabilities.join(',')}`).join(';');
    baseCommand += ` --agents="${agentSpecs}"`;

    // Add domain if specified
    if (domain) {
      baseCommand += ` --domain=${domain}`;
    }

    return baseCommand;
  }

  /**
   * Execute TDDAI command
   */
  async executeTDDAICommand(command) {
    return new Promise((resolve, reject) => {
      const args = command.split(' ').slice(1); // Remove 'tddai' from command
      const tddai = spawn('tddai', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: this.tddaiPath
      });

      let stdout = '';
      let stderr = '';

      tddai.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      tddai.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      tddai.on('close', (code) => {
        if (code === 0) {
          resolve(tddai);
        } else {
          reject(new Error(`TDDAI command failed with code ${code}: ${stderr}`));
        }
      });

      tddai.on('error', (error) => {
        reject(new Error(`Failed to start TDDAI: ${error.message}`));
      });

      // Return process for tracking
      resolve(tddai);
    });
  }

  /**
   * Get orchestration status
   */
  getOrchestrationStatus(orchestrationId) {
    const orchestration = this.activeOrchestrations.get(orchestrationId);
    
    if (!orchestration) {
      throw new Error(`Orchestration ${orchestrationId} not found`);
    }

    const { process, request, startTime, status } = orchestration;
    const runtime = Date.now() - startTime.getTime();

    return {
      orchestration_id: orchestrationId,
      status: process.killed ? 'completed' : status,
      runtime_ms: runtime,
      agents: request.agents.map(agent => ({
        agent_type: agent.type,
        status: 'active', // Simplified - in real implementation, query actual status
        capabilities: agent.capabilities
      })),
      progress: Math.min(95, Math.floor(runtime / 1000) * 5), // Simulate progress
      estimated_completion: new Date(startTime.getTime() + this.estimateCompletionTime(request.orchestration_pattern)).toISOString()
    };
  }

  /**
   * Stop orchestration
   */
  async stopOrchestration(orchestrationId) {
    const orchestration = this.activeOrchestrations.get(orchestrationId);
    
    if (!orchestration) {
      throw new Error(`Orchestration ${orchestrationId} not found`);
    }

    const { process } = orchestration;
    
    if (!process.killed) {
      process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise((resolve) => {
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
          resolve();
        }, 5000);
      });
    }

    // Update status
    orchestration.status = 'stopped';
    this.logger.info(`Orchestration ${orchestrationId} stopped`);

    return {
      orchestration_id: orchestrationId,
      status: 'stopped',
      stopped_at: new Date().toISOString()
    };
  }

  /**
   * Establish MCP bridge to TDDAI
   */
  async establishMCPBridge(bridgeRequest) {
    const { agent_endpoint, mcp_version, tools, resources } = bridgeRequest;

    try {
      // Connect to TDDAI MCP server
      const mcpResponse = await axios.post(`http://localhost:${this.tddaiPort}/mcp/connect`, {
        client_endpoint: agent_endpoint,
        version: mcp_version,
        tools: tools,
        resources: resources
      }, {
        timeout: 10000
      });

      const bridgeId = `tddai_mcp_${Date.now()}`;

      this.logger.info(`MCP bridge established: ${bridgeId} -> TDDAI`);

      return {
        success: true,
        bridge_id: bridgeId,
        status: 'active',
        tddai_connection: mcpResponse.data,
        tools_available: mcpResponse.data.tools?.length || 0,
        resources_available: mcpResponse.data.resources?.length || 0
      };

    } catch (error) {
      this.logger.error('MCP bridge failed:', error.message);
      throw new Error(`MCP bridge establishment failed: ${error.message}`);
    }
  }

  /**
   * Perform token preflight using TDDAI token optimizer
   */
  async performTokenPreflight(preflightRequest) {
    const { text, model, encoding, optimization_level } = preflightRequest;

    try {
      // Use TDDAI token optimizer
      const response = await axios.post(`http://localhost:${this.tddaiPort}/api/tokens/optimize`, {
        content: text,
        model: model,
        encoding: encoding,
        strategy: optimization_level
      }, {
        timeout: 10000
      });

      const result = response.data;

      return {
        approved: result.compressed_tokens <= (preflightRequest.budget_constraints?.max_tokens || 128000),
        token_count: result.compressed_tokens,
        encoding_used: encoding,
        estimated_cost: result.estimated_cost,
        optimization: {
          applied: true,
          original_tokens: result.original_tokens,
          compressed_tokens: result.compressed_tokens,
          compression_ratio: result.compression_ratio,
          techniques: result.techniques_applied
        },
        tddai_optimization: true
      };

    } catch (error) {
      // Fallback to basic estimation if TDDAI optimizer not available
      this.logger.warn('TDDAI token optimizer not available, using fallback');
      
      const estimatedTokens = Math.ceil(text.length / 4);
      return {
        approved: estimatedTokens <= 128000,
        token_count: estimatedTokens,
        encoding_used: encoding,
        estimated_cost: estimatedTokens * 0.00001,
        optimization: {
          applied: false,
          original_tokens: estimatedTokens,
          compressed_tokens: estimatedTokens,
          compression_ratio: 1.0,
          techniques: ['none']
        },
        tddai_optimization: false
      };
    }
  }

  /**
   * Estimate completion time based on orchestration pattern
   */
  estimateCompletionTime(pattern) {
    const timeMap = {
      'diagnostic_first': 15 * 60 * 1000, // 15 minutes
      'parallel_validation': 10 * 60 * 1000, // 10 minutes
      'magentic_orchestration': 20 * 60 * 1000, // 20 minutes
      'adaptive': 25 * 60 * 1000 // 25 minutes
    };

    return timeMap[pattern] || 15 * 60 * 1000;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Stop all active orchestrations
    for (const [orchestrationId, orchestration] of this.activeOrchestrations) {
      if (!orchestration.process.killed) {
        orchestration.process.kill('SIGTERM');
      }
    }
    
    this.activeOrchestrations.clear();
    this.logger.info('TDDAI integration cleanup completed');
  }
}

module.exports = TDDAIIntegration;