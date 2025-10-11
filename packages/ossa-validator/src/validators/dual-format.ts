/**
 * Dual-Format Validator
 * Validates both agent.yml and openapi.yaml with cross-validation
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as yaml from 'yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import { OSSAAgent } from '@ossa/specification';
import { OpenAPIV3 } from 'openapi-types';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo[];
  conformance?: ConformanceResult;
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error';
  source: 'agent' | 'openapi' | 'cross-validation';
}

export interface ValidationWarning {
  path: string;
  message: string;
  severity: 'warning';
  source: 'agent' | 'openapi' | 'cross-validation';
}

export interface ValidationInfo {
  path: string;
  message: string;
  severity: 'info';
}

export interface ConformanceResult {
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  passed: boolean;
  requirements: Record<string, boolean>;
  missingRequirements: string[];
}

export class DualFormatValidator {
  private ajv: Ajv;
  private agentSchema: any;
  private openAPISchema: any;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true
    });
    addFormats(this.ajv);
  }

  async initialize(): Promise<void> {
    // Load schemas
    const schemaDir = path.join(__dirname, '../../../ossa-specification/schemas/v1.0');

    this.agentSchema = JSON.parse(
      await fs.readFile(path.join(schemaDir, 'agent-manifest.schema.json'), 'utf-8')
    );

    // Load OpenAPI schema (using built-in for now)
    this.openAPISchema = {
      type: 'object',
      required: ['openapi', 'info', 'paths'],
      properties: {
        openapi: { type: 'string', pattern: '^3\\.' },
        info: { type: 'object' },
        paths: { type: 'object' }
      }
    };
  }

  async validate(
    agentPath: string,
    openapiPath: string
  ): Promise<ValidationResult> {
    const results: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      info: []
    };

    try {
      // Step 1: Load and parse files
      const agent = await this.loadAgentManifest(agentPath);
      const openapi = await this.loadOpenAPISpec(openapiPath);

      // Step 2: Schema validation
      await this.validateAgentSchema(agent, results);
      await this.validateOpenAPISchema(openapi, results);

      // Step 3: Cross-validation
      if (results.errors.length === 0) {
        await this.validateCapabilityMapping(agent, openapi, results);
        await this.validateEndpointAlignment(agent, openapi, results);
        await this.validateMetadataConsistency(agent, openapi, results);
        await this.validateSecurityAlignment(agent, openapi, results);
      }

      // Step 4: Bridge validation
      if (agent.bridge && results.errors.length === 0) {
        await this.validateBridgeConfig(agent, openapi, results);
      }

      // Step 5: Conformance check
      if (results.errors.length === 0) {
        results.conformance = await this.checkConformance(agent, openapi);
      }

    } catch (error: any) {
      results.valid = false;
      results.errors.push({
        path: 'root',
        message: `Validation failed: ${error.message}`,
        severity: 'error',
        source: 'agent'
      });
    }

    results.valid = results.errors.length === 0;
    return results;
  }

  private async loadAgentManifest(agentPath: string): Promise<OSSAAgent> {
    const content = await fs.readFile(agentPath, 'utf-8');
    return yaml.parse(content) as OSSAAgent;
  }

  private async loadOpenAPISpec(openapiPath: string): Promise<OpenAPIV3.Document> {
    const content = await fs.readFile(openapiPath, 'utf-8');
    const ext = path.extname(openapiPath);

    if (ext === '.json') {
      return JSON.parse(content);
    } else {
      return yaml.parse(content);
    }
  }

  private async validateAgentSchema(
    agent: OSSAAgent,
    results: ValidationResult
  ): Promise<void> {
    const validate = this.ajv.compile(this.agentSchema);
    const valid = validate(agent);

    if (!valid && validate.errors) {
      for (const error of validate.errors) {
        results.errors.push({
          path: error.instancePath || 'root',
          message: error.message || 'Schema validation failed',
          severity: 'error',
          source: 'agent'
        });
      }
    }

    // Additional OSSA-specific validations
    if (agent.ossa !== '1.0') {
      results.warnings.push({
        path: 'ossa',
        message: `Using OSSA version ${agent.ossa}, latest is 1.0`,
        severity: 'warning',
        source: 'agent'
      });
    }

    if (!agent.agent.conformance) {
      results.info.push({
        path: 'agent.conformance',
        message: 'No conformance level specified, defaulting to bronze',
        severity: 'info'
      });
    }
  }

  private async validateOpenAPISchema(
    openapi: OpenAPIV3.Document,
    results: ValidationResult
  ): Promise<void> {
    const validate = this.ajv.compile(this.openAPISchema);
    const valid = validate(openapi);

    if (!valid && validate.errors) {
      for (const error of validate.errors) {
        results.errors.push({
          path: error.instancePath || 'root',
          message: error.message || 'OpenAPI validation failed',
          severity: 'error',
          source: 'openapi'
        });
      }
    }

    // Check for required endpoints based on conformance
    if (!openapi.paths['/health']) {
      results.warnings.push({
        path: 'paths',
        message: 'Missing /health endpoint (required for Silver conformance)',
        severity: 'warning',
        source: 'openapi'
      });
    }

    if (!openapi.paths['/metrics']) {
      results.warnings.push({
        path: 'paths',
        message: 'Missing /metrics endpoint (required for Silver conformance)',
        severity: 'warning',
        source: 'openapi'
      });
    }
  }

  private async validateCapabilityMapping(
    agent: OSSAAgent,
    openapi: OpenAPIV3.Document,
    results: ValidationResult
  ): Promise<void> {
    // Check that each capability has at least one endpoint
    for (const capability of agent.capabilities) {
      const hasEndpoint = this.findEndpointForCapability(capability, agent, openapi);

      if (!hasEndpoint) {
        results.errors.push({
          path: `capabilities.${capability}`,
          message: `Capability '${capability}' has no corresponding endpoint in agent.yml or OpenAPI`,
          severity: 'error',
          source: 'cross-validation'
        });
      }
    }

    // Check that capabilities in agent.yml API match declared capabilities
    for (const [endpoint, spec] of Object.entries(agent.api)) {
      const capabilities = Array.isArray(spec.capability)
        ? spec.capability
        : [spec.capability];

      for (const cap of capabilities) {
        if (!agent.capabilities.includes(cap)) {
          results.errors.push({
            path: `api.${endpoint}.capability`,
            message: `Endpoint references undeclared capability '${cap}'`,
            severity: 'error',
            source: 'cross-validation'
          });
        }
      }
    }
  }

  private async validateEndpointAlignment(
    agent: OSSAAgent,
    openapi: OpenAPIV3.Document,
    results: ValidationResult
  ): Promise<void> {
    // Check that agent.yml endpoints exist in OpenAPI
    for (const endpoint of Object.keys(agent.api)) {
      const [method, path] = this.parseEndpoint(endpoint);

      if (!this.endpointExistsInOpenAPI(method, path, openapi)) {
        results.errors.push({
          path: `api.${endpoint}`,
          message: `Endpoint '${endpoint}' defined in agent.yml but not found in OpenAPI`,
          severity: 'error',
          source: 'cross-validation'
        });
      }
    }

    // Warn about OpenAPI endpoints not in agent.yml
    for (const [pathStr, pathItem] of Object.entries(openapi.paths)) {
      if (!pathItem) continue;

      const methods = ['get', 'post', 'put', 'delete', 'patch'];
      for (const method of methods) {
        if ((pathItem as any)[method]) {
          const endpoint = `${method.toUpperCase()} ${pathStr}`;
          if (!agent.api[endpoint] && !this.isSystemEndpoint(pathStr)) {
            results.warnings.push({
              path: `paths.${pathStr}.${method}`,
              message: `Endpoint '${endpoint}' in OpenAPI but not mapped in agent.yml`,
              severity: 'warning',
              source: 'cross-validation'
            });
          }
        }
      }
    }
  }

  private async validateMetadataConsistency(
    agent: OSSAAgent,
    openapi: OpenAPIV3.Document,
    results: ValidationResult
  ): Promise<void> {
    // Check name consistency
    if (openapi.info.title &&
        openapi.info.title.toLowerCase() !== agent.agent.name.toLowerCase() &&
        !openapi.info.title.toLowerCase().includes(agent.agent.name.toLowerCase())) {
      results.warnings.push({
        path: 'metadata',
        message: `Agent name '${agent.agent.name}' doesn't match OpenAPI title '${openapi.info.title}'`,
        severity: 'warning',
        source: 'cross-validation'
      });
    }

    // Check version consistency
    if (openapi.info.version && openapi.info.version !== agent.agent.version) {
      results.errors.push({
        path: 'metadata.version',
        message: `Version mismatch: agent.yml has '${agent.agent.version}', OpenAPI has '${openapi.info.version}'`,
        severity: 'error',
        source: 'cross-validation'
      });
    }
  }

  private async validateSecurityAlignment(
    agent: OSSAAgent,
    openapi: OpenAPIV3.Document,
    results: ValidationResult
  ): Promise<void> {
    // For Gold/Platinum conformance, security must be defined
    const targetConformance = agent.agent.conformance || 'bronze';

    if (['gold', 'platinum'].includes(targetConformance)) {
      if (!openapi.components?.securitySchemes) {
        results.errors.push({
          path: 'components.securitySchemes',
          message: `Security schemes required for ${targetConformance} conformance`,
          severity: 'error',
          source: 'openapi'
        });
      }
    }
  }

  private async validateBridgeConfig(
    agent: OSSAAgent,
    openapi: OpenAPIV3.Document,
    results: ValidationResult
  ): Promise<void> {
    if (!agent.bridge) return;

    // Validate MCP bridge
    if (agent.bridge.mcp?.enabled) {
      if (!agent.bridge.mcp.tools || agent.bridge.mcp.tools.length === 0) {
        results.warnings.push({
          path: 'bridge.mcp.tools',
          message: 'MCP bridge enabled but no tools defined',
          severity: 'warning',
          source: 'agent'
        });
      }

      // Check tool-capability mapping
      for (const tool of agent.bridge.mcp.tools || []) {
        if (tool.capability && !agent.capabilities.includes(tool.capability)) {
          results.errors.push({
            path: `bridge.mcp.tools.${tool.name}`,
            message: `MCP tool references unknown capability '${tool.capability}'`,
            severity: 'error',
            source: 'cross-validation'
          });
        }
      }
    }

    // Count enabled bridges for conformance
    const bridgeCount = this.countEnabledBridges(agent.bridge);
    if (agent.agent.conformance === 'gold' && bridgeCount < 2) {
      results.warnings.push({
        path: 'bridge',
        message: `Gold conformance requires at least 2 bridges, found ${bridgeCount}`,
        severity: 'warning',
        source: 'agent'
      });
    }
  }

  private async checkConformance(
    agent: OSSAAgent,
    openapi: OpenAPIV3.Document
  ): Promise<ConformanceResult> {
    const targetLevel = agent.agent.conformance || 'bronze';
    const requirements: Record<string, boolean> = {};
    const missingRequirements: string[] = [];

    // Bronze requirements
    requirements['hasValidManifest'] = true; // Already validated
    requirements['hasOpenAPISpec'] = !!openapi;
    requirements['hasCapabilities'] = agent.capabilities.length > 0;
    requirements['hasDiscovery'] = !!agent.discover;

    // Silver requirements
    if (['silver', 'gold', 'platinum'].includes(targetLevel)) {
      requirements['hasMonitoring'] = !!agent.monitoring;
      requirements['hasHealthEndpoint'] = !!openapi.paths['/health'];
      requirements['hasMetricsEndpoint'] = !!openapi.paths['/metrics'];
      requirements['hasIOAwareness'] = agent.monitoring?.io_aware === true;
    }

    // Gold requirements
    if (['gold', 'platinum'].includes(targetLevel)) {
      requirements['hasBridgeSupport'] = this.countEnabledBridges(agent.bridge || {}) >= 2;
      requirements['hasPerformanceConfig'] = !!agent.performance;
      requirements['hasTracing'] = agent.monitoring?.traces?.enabled === true;
    }

    // Platinum requirements
    if (targetLevel === 'platinum') {
      requirements['hasMultipleBridges'] = this.countEnabledBridges(agent.bridge || {}) >= 4;
      requirements['hasAdvancedOptimization'] = !!(
        agent.performance?.token_optimization?.enabled ||
        agent.performance?.quantization?.enabled
      );
    }

    // Check missing requirements
    for (const [req, met] of Object.entries(requirements)) {
      if (!met) {
        missingRequirements.push(req);
      }
    }

    return {
      level: targetLevel,
      passed: missingRequirements.length === 0,
      requirements,
      missingRequirements
    };
  }

  // Helper methods
  private findEndpointForCapability(
    capability: string,
    agent: OSSAAgent,
    openapi: OpenAPIV3.Document
  ): boolean {
    // Check agent.yml api mapping
    for (const [endpoint, spec] of Object.entries(agent.api)) {
      const capabilities = Array.isArray(spec.capability)
        ? spec.capability
        : [spec.capability];
      if (capabilities.includes(capability)) {
        return true;
      }
    }

    // Check OpenAPI tags (often used for capability grouping)
    for (const [path, pathItem] of Object.entries(openapi.paths)) {
      if (!pathItem) continue;
      const methods = ['get', 'post', 'put', 'delete', 'patch'];
      for (const method of methods) {
        const operation = (pathItem as any)[method];
        if (operation?.tags?.includes(capability)) {
          return true;
        }
      }
    }

    return false;
  }

  private parseEndpoint(endpoint: string): [string, string] {
    const parts = endpoint.split(' ');
    if (parts.length === 2) {
      return [parts[0].toLowerCase(), parts[1]];
    }
    return ['get', endpoint];
  }

  private endpointExistsInOpenAPI(
    method: string,
    path: string,
    openapi: OpenAPIV3.Document
  ): boolean {
    const pathItem = openapi.paths[path];
    if (!pathItem) return false;
    return !!(pathItem as any)[method];
  }

  private isSystemEndpoint(path: string): boolean {
    const systemEndpoints = ['/health', '/metrics', '/ready', '/live'];
    return systemEndpoints.includes(path);
  }

  private countEnabledBridges(bridge: any): number {
    if (!bridge) return 0;

    let count = 0;
    if (bridge.mcp?.enabled) count++;
    if (bridge.a2a?.enabled) count++;
    if (bridge.openapi?.enabled) count++;
    if (bridge.langchain?.enabled) count++;
    if (bridge.crewai?.enabled) count++;
    if (bridge.autogen?.enabled) count++;

    return count;
  }
}