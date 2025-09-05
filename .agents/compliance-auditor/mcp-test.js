#!/usr/bin/env node

/**
 * MCP Tool Call Simulation Test
 * Tests the compliance auditor agent's MCP capabilities
 */

const http = require('http');

class MCPTestClient {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MCP-Test-Client/1.0'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = {
              statusCode: res.statusCode,
              headers: res.headers,
              data: body ? JSON.parse(body) : null
            };
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async testMCPCapabilities() {
    console.log('🔧 Testing MCP Capabilities Endpoint...');
    try {
      const result = await this.makeRequest('/mcp');
      if (result.statusCode === 200) {
        console.log('✅ MCP capabilities endpoint working');
        console.log(`📋 Available tools: ${result.data.tools.length}`);
        result.data.tools.forEach(tool => {
          console.log(`   - ${tool.name}: ${tool.description}`);
        });
        return true;
      } else {
        console.log(`❌ MCP endpoint failed: ${result.statusCode}`);
        return false;
      }
    } catch (error) {
      console.error('❌ MCP capabilities test failed:', error.message);
      return false;
    }
  }

  async simulateMCPToolCall(toolName, params) {
    console.log(`🛠️  Simulating MCP tool call: ${toolName}`);
    
    // Map MCP tool calls to REST API endpoints
    const toolEndpointMap = {
      'compliance_check': '/compliance/check',
      'risk_assessment': '/risk/assess',
      'audit_report': '/reports',
      'framework_mapping': '/audit',
      'evidence_validation': '/audit',
      'continuous_monitoring': '/audit'
    };

    const endpoint = toolEndpointMap[toolName];
    if (!endpoint) {
      console.log(`⚠️  No endpoint mapping for tool: ${toolName}`);
      return false;
    }

    try {
      const result = await this.makeRequest(endpoint, 'POST', params);
      if (result.statusCode >= 200 && result.statusCode < 300) {
        console.log(`✅ MCP tool call "${toolName}" successful`);
        console.log('📊 Response:', JSON.stringify(result.data, null, 2));
        return true;
      } else {
        console.log(`❌ MCP tool call "${toolName}" failed: ${result.statusCode}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ MCP tool call "${toolName}" error:`, error.message);
      return false;
    }
  }

  async runTestSuite() {
    console.log('🚀 Starting MCP Tool Call Test Suite\n');

    const results = {
      mcpCapabilities: false,
      complianceCheck: false,
      riskAssessment: false,
      passed: 0,
      total: 3
    };

    // Test MCP capabilities endpoint
    results.mcpCapabilities = await this.testMCPCapabilities();
    if (results.mcpCapabilities) results.passed++;
    console.log('');

    // Test compliance_check tool
    const complianceParams = {
      framework: 'nist_ai_rmf',
      target_system: 'ossa-compliance-auditor',
      scope: ['GOVERN', 'MAP'],
      evidence_collection: true
    };
    results.complianceCheck = await this.simulateMCPToolCall('compliance_check', complianceParams);
    if (results.complianceCheck) results.passed++;
    console.log('');

    // Test risk_assessment tool
    const riskParams = {
      system_description: 'OSSA compliance auditor with MCP integration',
      use_case: 'Enterprise compliance validation and reporting',
      data_sources: ['audit_logs', 'system_configs'],
      stakeholders: ['compliance_team', 'security_team'],
      assessment_type: 'periodic'
    };
    results.riskAssessment = await this.simulateMCPToolCall('risk_assessment', riskParams);
    if (results.riskAssessment) results.passed++;
    console.log('');

    // Summary
    console.log('📋 Test Summary:');
    console.log(`✅ Passed: ${results.passed}/${results.total} tests`);
    console.log(`❌ Failed: ${results.total - results.passed}/${results.total} tests`);
    
    if (results.passed === results.total) {
      console.log('🎉 All MCP tests passed! Agent is ready for production.');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Check the deployment.');
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MCPTestClient();
  tester.runTestSuite().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = MCPTestClient;