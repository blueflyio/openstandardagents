#!/usr/bin/env node
/**
 * OAAS Validation Server
 * Validates OpenAPI AI Agents Standard compliance
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3003;
const FASTAPI_GATEWAY = process.env.FASTAPI_GATEWAY_URL || 'http://fastapi-gateway:8000';
const VALIDATION_MODE = process.env.VALIDATION_MODE || 'strict';

app.use(express.json({ limit: '10mb' }));

/**
 * Load OAAS schemas for validation
 */
async function loadSchemas() {
    try {
        const schemasDir = path.join(__dirname, 'schemas');
        const schemas = {};
        
        const files = await fs.readdir(schemasDir);
        for (const file of files.filter(f => f.endsWith('.yml'))) {
            const content = await fs.readFile(path.join(schemasDir, file), 'utf8');
            schemas[file.replace('.yml', '')] = content;
        }
        
        console.log(`📋 Loaded ${Object.keys(schemas).length} OAAS schemas`);
        return schemas;
        
    } catch (error) {
        console.error('❌ Failed to load schemas:', error.message);
        return {};
    }
}

/**
 * Validate OAAS agent structure
 */
function validateOAASAgent(agent) {
    const errors = [];
    const warnings = [];
    
    // Check required fields
    if (!agent.apiVersion) {
        errors.push('Missing required field: apiVersion');
    } else if (agent.apiVersion !== 'open-standards-scalable-agents/v0.1.2') {
        errors.push(`Invalid apiVersion: ${agent.apiVersion}. Expected: open-standards-scalable-agents/v0.1.2`);
    }
    
    if (!agent.kind) {
        errors.push('Missing required field: kind');
    } else if (agent.kind !== 'Agent') {
        errors.push(`Invalid kind: ${agent.kind}. Expected: Agent`);
    }
    
    if (!agent.metadata) {
        errors.push('Missing required field: metadata');
    } else {
        const meta = agent.metadata;
        
        if (!meta.name) {
            errors.push('Missing required field: metadata.name');
        } else if (!/^[a-z0-9-]+$/.test(meta.name)) {
            errors.push('metadata.name must contain only lowercase letters, numbers, and hyphens');
        }
        
        if (!meta.version) {
            errors.push('Missing required field: metadata.version');
        } else if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(meta.version)) {
            errors.push('metadata.version must follow semantic versioning (e.g., 1.0.0)');
        }
    }
    
    if (!agent.spec) {
        errors.push('Missing required field: spec');
    } else {
        const spec = agent.spec;
        
        if (!spec.agent) {
            errors.push('Missing required field: spec.agent');
        }
        
        if (!spec.capabilities || !Array.isArray(spec.capabilities)) {
            errors.push('Missing required field: spec.capabilities (must be array)');
        } else if (spec.capabilities.length === 0) {
            errors.push('spec.capabilities must contain at least one capability');
        } else {
            spec.capabilities.forEach((cap, index) => {
                if (!cap.name) {
                    errors.push(`spec.capabilities[${index}].name is required`);
                } else if (!/^[a-z0-9_]+$/.test(cap.name)) {
                    errors.push(`spec.capabilities[${index}].name must be snake_case`);
                }
                
                if (!cap.description) {
                    errors.push(`spec.capabilities[${index}].description is required`);
                }
            });
        }
        
        // Framework validation
        if (spec.frameworks) {
            const validFrameworks = ['mcp', 'langchain', 'crewai', 'openai', 'anthropic'];
            Object.keys(spec.frameworks).forEach(framework => {
                if (!validFrameworks.includes(framework)) {
                    warnings.push(`Unknown framework: ${framework}`);
                }
            });
        }
        
        // API endpoints validation
        if (spec.api_endpoints) {
            spec.api_endpoints.forEach((endpoint, index) => {
                if (!/^\/[a-zA-Z0-9/_-]*$/.test(endpoint)) {
                    errors.push(`spec.api_endpoints[${index}] has invalid format: ${endpoint}`);
                }
            });
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        compliance_level: errors.length === 0 ? (warnings.length === 0 ? 'full' : 'partial') : 'failed'
    };
}

/**
 * Test FastAPI gateway compliance
 */
async function testGatewayCompliance() {
    try {
        console.log('🧪 Testing FastAPI Gateway OAAS compliance...');
        
        const tests = [];
        
        // Test 1: Check root endpoint for OAAS information
        try {
            const response = await fetch(`${FASTAPI_GATEWAY}/`);
            const data = await response.json();
            
            tests.push({
                name: 'Root endpoint OAAS info',
                passed: data.oaas_version === '0.1.1' && data.compliance === 'full',
                details: data.oaas_version ? `Found OAAS v${data.oaas_version}` : 'No OAAS version info'
            });
        } catch (error) {
            tests.push({
                name: 'Root endpoint OAAS info',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
        
        // Test 2: Check OpenAPI spec has OAAS extensions
        try {
            const response = await fetch(`${FASTAPI_GATEWAY}/api/v1/openapi.json`);
            const spec = await response.json();
            
            const hasOAASExtension = spec['x-openapi-ai-agents-standard'] !== undefined;
            tests.push({
                name: 'OpenAPI OAAS extensions',
                passed: hasOAASExtension,
                details: hasOAASExtension ? 'OAAS extensions found' : 'No OAAS extensions in OpenAPI spec'
            });
        } catch (error) {
            tests.push({
                name: 'OpenAPI OAAS extensions',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
        
        // Test 3: Check discovery endpoints
        try {
            const response = await fetch(`${FASTAPI_GATEWAY}/api/v1/agents/discover`);
            tests.push({
                name: 'Universal Agent Discovery Protocol (UADP)',
                passed: response.status === 200 || response.status === 404, // 404 is OK if no agents
                details: `Status: ${response.status} ${response.statusText}`
            });
        } catch (error) {
            tests.push({
                name: 'Universal Agent Discovery Protocol (UADP)',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
        
        // Test 4: Check health endpoint
        try {
            const response = await fetch(`${FASTAPI_GATEWAY}/health`);
            const health = await response.json();
            
            tests.push({
                name: 'Health check endpoint',
                passed: response.status === 200 && health.status,
                details: `Status: ${health.status || 'unknown'}`
            });
        } catch (error) {
            tests.push({
                name: 'Health check endpoint',
                passed: false,
                details: `Error: ${error.message}`
            });
        }
        
        const passed = tests.filter(t => t.passed).length;
        const total = tests.length;
        const score = Math.round((passed / total) * 100);
        
        return {
            gateway_url: FASTAPI_GATEWAY,
            compliance_score: score,
            tests_passed: passed,
            tests_total: total,
            tests,
            compliant: score >= 80
        };
        
    } catch (error) {
        return {
            gateway_url: FASTAPI_GATEWAY,
            compliance_score: 0,
            error: error.message,
            compliant: false
        };
    }
}

// API Endpoints

/**
 * Validate OAAS agent structure
 */
app.post('/api/v1/validate/agent', (req, res) => {
    const agent = req.body;
    
    if (!agent) {
        return res.status(400).json({
            error: 'Request body is required'
        });
    }
    
    const validation = validateOAASAgent(agent);
    
    res.json({
        validation_mode: VALIDATION_MODE,
        oaas_version: '0.1.1',
        ...validation,
        timestamp: new Date().toISOString()
    });
});

/**
 * Test gateway compliance
 */
app.get('/api/v1/test/gateway', async (req, res) => {
    const compliance = await testGatewayCompliance();
    res.json(compliance);
});

/**
 * Get validation schemas
 */
app.get('/api/v1/schemas', async (req, res) => {
    const schemas = await loadSchemas();
    res.json({
        oaas_version: '0.1.1',
        available_schemas: Object.keys(schemas),
        schemas
    });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'OAAS Validation Server',
        oaas_version: '0.1.1',
        validation_mode: VALIDATION_MODE,
        fastapi_gateway: FASTAPI_GATEWAY,
        uptime_seconds: process.uptime()
    });
});

/**
 * Service information
 */
app.get('/', (req, res) => {
    res.json({
        service: 'OAAS Validation Server',
        oaas_version: '0.1.1',
        validation_mode: VALIDATION_MODE,
        endpoints: {
            validate_agent: 'POST /api/v1/validate/agent',
            test_gateway: 'GET /api/v1/test/gateway',
            schemas: 'GET /api/v1/schemas',
            health: 'GET /health'
        },
        integration: {
            fastapi_gateway: FASTAPI_GATEWAY
        }
    });
});

// Startup
async function startup() {
    console.log('🛡️  Starting OAAS Validation Server');
    console.log(`📐 Validation mode: ${VALIDATION_MODE}`);
    console.log(`🎯 FastAPI Gateway: ${FASTAPI_GATEWAY}`);
    
    await loadSchemas();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 OAAS Validation Server running on http://0.0.0.0:${PORT}`);
        console.log('');
        console.log('📋 Available endpoints:');
        console.log(`   - Validate Agent: POST http://localhost:${PORT}/api/v1/validate/agent`);
        console.log(`   - Test Gateway: http://localhost:${PORT}/api/v1/test/gateway`);
        console.log(`   - Schemas: http://localhost:${PORT}/api/v1/schemas`);
        console.log(`   - Health: http://localhost:${PORT}/health`);
    });
}

startup().catch(console.error);