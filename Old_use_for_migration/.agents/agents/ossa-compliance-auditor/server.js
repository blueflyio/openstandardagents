#!/usr/bin/env node

/**
 * OSSA v0.1.8 Compliance Auditor Agent Server
 * 
 * A lightweight deployment server for the compliance-auditor agent
 * Implements the OpenAPI 3.1.0 spec with MCP tool integration
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

class ComplianceAuditorServer {
  constructor() {
    this.startTime = Date.now();
    this.version = '1.1.0';
    this.agentId = `compliance-auditor-${Date.now()}`;
    this.mcpTools = this.loadMCPTools();
    this.capabilities = this.loadCapabilities();
  }

  loadMCPTools() {
    try {
      const mcpToolsPath = path.join(__dirname, 'mcp-tools.json');
      return JSON.parse(fs.readFileSync(mcpToolsPath, 'utf8'));
    } catch (error) {
      console.error('Failed to load MCP tools:', error.message);
      return { tools: [] };
    }
  }

  loadCapabilities() {
    return {
      name: "compliance-auditor",
      version: this.version,
      capabilities: {
        primary: [
          "compliance_auditing",
          "risk_assessment", 
          "control_validation",
          "audit_reporting",
          "framework_adaptation"
        ],
        secondary: [
          "evidence_collection",
          "gap_analysis",
          "remediation_tracking",
          "continuous_monitoring",
          "cross_framework_orchestration"
        ]
      },
      frameworks: {
        mcp: {
          enabled: true,
          version: "2024-11-05",
          tools: this.mcpTools.tools?.map(tool => tool.name) || []
        },
        langchain: { enabled: true, adapter_class: "ComplianceAuditorTool" },
        crewai: { enabled: true, role: "compliance_auditor" },
        autogen: { enabled: true, agent_type: "AssistantAgent" },
        openai: { enabled: true, assistant_type: "compliance_specialist" }
      }
    };
  }

  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      switch (path) {
        case '/health':
          this.handleHealth(req, res);
          break;
        case '/capabilities':
          this.handleCapabilities(req, res);
          break;
        case '/compliance/check':
          await this.handleComplianceCheck(req, res);
          break;
        case '/risk/assess':
          await this.handleRiskAssessment(req, res);
          break;
        case '/audit':
          await this.handleAudit(req, res);
          break;
        case '/reports':
          await this.handleReports(req, res);
          break;
        case '/mcp':
          this.handleMCP(req, res);
          break;
        case '/a2a/discover':
          this.handleAgentDiscovery(req, res);
          break;
        default:
          this.handleNotFound(req, res);
      }
    } catch (error) {
      console.error('Request handling error:', error);
      this.handleError(res, 500, 'internal_error', 'Internal server error');
    }
  }

  handleHealth(req, res) {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: uptime,
      dependencies: {
        mcp_tools: { status: 'healthy', latency_ms: 5 },
        config_files: { status: 'healthy', latency_ms: 2 },
        memory: { status: 'healthy', latency_ms: 1 }
      }
    };

    this.sendJSON(res, 200, health);
  }

  handleCapabilities(req, res) {
    this.sendJSON(res, 200, this.capabilities);
  }

  async handleComplianceCheck(req, res) {
    if (req.method !== 'POST') {
      return this.handleError(res, 405, 'method_not_allowed', 'Method not allowed');
    }

    const body = await this.getRequestBody(req);
    const { framework, target_system, scope = [], evidence_collection = true } = body;

    if (!framework || !target_system) {
      return this.handleError(res, 400, 'invalid_request', 'Missing required fields: framework, target_system');
    }

    // Simulate compliance check
    const result = {
      compliance_status: 'partially_compliant',
      compliance_score: 78.5,
      findings: [
        {
          control_id: `${framework}_001`,
          status: 'pass',
          evidence: 'Configuration files validated',
          gaps: [],
          recommendations: ['Maintain current configuration']
        },
        {
          control_id: `${framework}_002`,
          status: 'fail',
          evidence: 'Missing audit logs',
          gaps: ['Incomplete logging configuration'],
          recommendations: ['Implement comprehensive audit logging']
        }
      ],
      next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      audit_id: this.generateAuditId(),
      target_system,
      framework,
      timestamp: new Date().toISOString()
    };

    this.sendJSON(res, 200, result);
  }

  async handleRiskAssessment(req, res) {
    if (req.method !== 'POST') {
      return this.handleError(res, 405, 'method_not_allowed', 'Method not allowed');
    }

    const body = await this.getRequestBody(req);
    const { system_description, use_case, assessment_type = 'initial' } = body;

    if (!system_description || !use_case) {
      return this.handleError(res, 400, 'invalid_request', 'Missing required fields: system_description, use_case');
    }

    // Simulate risk assessment
    const result = {
      risk_level: 'limited',
      risk_score: 0.35,
      risk_categories: {
        bias_discrimination: 0.3,
        privacy_violation: 0.2,
        security_vulnerability: 0.4,
        safety_hazard: 0.1,
        transparency_lack: 0.6
      },
      mitigation_strategies: [
        {
          risk_area: 'transparency_lack',
          strategy: 'Implement explainable AI techniques',
          priority: 'high',
          timeline: '3 months'
        }
      ],
      regulatory_implications: {
        eu_ai_act_classification: 'limited_risk',
        iso_42001_requirements: ['Risk management plan', 'Monitoring procedures'],
        nist_rmf_functions: ['GOVERN', 'MAP', 'MEASURE']
      },
      assessment_id: this.generateAssessmentId(),
      timestamp: new Date().toISOString()
    };

    this.sendJSON(res, 200, result);
  }

  async handleAudit(req, res) {
    if (req.method === 'POST') {
      const body = await this.getRequestBody(req);
      const auditId = this.generateAuditId();
      
      const response = {
        audit_id: auditId,
        status: 'running',
        estimated_completion: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        progress: 25
      };

      this.sendJSON(res, 202, response);
    } else if (req.method === 'GET') {
      const parsedUrl = url.parse(req.url, true);
      const auditId = parsedUrl.query.auditId;
      
      if (!auditId) {
        return this.handleError(res, 400, 'missing_audit_id', 'auditId query parameter required');
      }

      const status = {
        audit_id: auditId,
        status: 'completed',
        progress: 100,
        started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        results: {
          overall_score: 82.3,
          framework_results: {
            iso_42001: { compliance_score: 85, status: 'compliant' },
            nist_ai_rmf: { compliance_score: 78, status: 'partially_compliant' }
          }
        }
      };

      this.sendJSON(res, 200, status);
    }
  }

  async handleReports(req, res) {
    if (req.method === 'GET') {
      const reports = {
        reports: [
          {
            id: 'report-001',
            title: 'Monthly Compliance Report',
            type: 'compliance',
            created_at: new Date().toISOString(),
            framework: 'iso_42001'
          }
        ],
        total_count: 1
      };
      this.sendJSON(res, 200, reports);
    } else if (req.method === 'POST') {
      const reportId = `report-${Date.now()}`;
      const response = {
        report_id: reportId,
        download_url: `http://${HOST}:${PORT}/reports/${reportId}/download`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      this.sendJSON(res, 201, response);
    }
  }

  handleMCP(req, res) {
    const mcpCapabilities = {
      protocol_version: this.mcpTools.version,
      server_info: this.mcpTools.server,
      tools: this.mcpTools.tools || []
    };
    this.sendJSON(res, 200, mcpCapabilities);
  }

  handleAgentDiscovery(req, res) {
    const discovery = {
      agent_id: this.agentId,
      name: 'compliance-auditor',
      capabilities: this.capabilities.capabilities.primary,
      endpoints: {
        health: `http://${HOST}:${PORT}/health`,
        capabilities: `http://${HOST}:${PORT}/capabilities`,
        compliance_check: `http://${HOST}:${PORT}/compliance/check`,
        risk_assess: `http://${HOST}:${PORT}/risk/assess`
      },
      health_check_interval: 30,
      last_seen: new Date().toISOString()
    };
    this.sendJSON(res, 200, discovery);
  }

  handleNotFound(req, res) {
    this.handleError(res, 404, 'not_found', 'Endpoint not found');
  }

  handleError(res, statusCode, error, message) {
    const errorResponse = {
      error,
      message,
      timestamp: new Date().toISOString(),
      request_id: this.generateRequestId()
    };
    this.sendJSON(res, statusCode, errorResponse);
  }

  async getRequestBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (error) {
          reject(new Error('Invalid JSON'));
        }
      });
      req.on('error', reject);
    });
  }

  sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  generateAuditId() {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAssessmentId() {
    return `assessment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  start() {
    const server = http.createServer((req, res) => this.handleRequest(req, res));
    
    server.listen(PORT, HOST, () => {
      console.log(`🚀 OSSA v0.1.8 Compliance Auditor Agent started`);
      console.log(`📍 Server: http://${HOST}:${PORT}`);
      console.log(`🔧 Health: http://${HOST}:${PORT}/health`);
      console.log(`📋 Capabilities: http://${HOST}:${PORT}/capabilities`);
      console.log(`🔍 MCP Tools: http://${HOST}:${PORT}/mcp`);
      console.log(`📊 Agent ID: ${this.agentId}`);
      console.log(`⏰ Started: ${new Date().toISOString()}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Shutting down gracefully...');
      server.close(() => process.exit(0));
    });
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const agent = new ComplianceAuditorServer();
  agent.start();
}

module.exports = ComplianceAuditorServer;