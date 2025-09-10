/**
 * OSSA Basic Tier Compliance Tests
 * 
 * These tests validate that an agent implementation meets
 * the minimum requirements for OSSA Basic tier compliance.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

describe('OSSA Basic Tier Compliance', () => {
  let agentManifest;
  let ajv;
  let manifestSchema;

  beforeAll(async () => {
    // Initialize JSON Schema validator
    ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    // Load the agent manifest schema
    const schemaPath = path.join(__dirname, '../../../schemas/agent-manifest.schema.json');
    manifestSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    ajv.addSchema(manifestSchema, 'agent-manifest');
  });

  beforeEach(() => {
    // Load agent manifest from test agent directory
    const manifestPath = process.env.AGENT_PATH 
      ? path.join(process.env.AGENT_PATH, 'agent.yml')
      : path.join(__dirname, '../../fixtures/basic-agent/agent.yml');
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Agent manifest not found at ${manifestPath}`);
    }

    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    agentManifest = yaml.load(manifestContent);
  });

  describe('Manifest Requirements', () => {
    test('must have valid agent.yml manifest', () => {
      expect(agentManifest).toBeDefined();
      expect(typeof agentManifest).toBe('object');
    });

    test('must conform to OSSA v0.1.8 schema', () => {
      const validate = ajv.getSchema('agent-manifest');
      const valid = validate(agentManifest);
      
      if (!valid) {
        console.error('Schema validation errors:', validate.errors);
      }
      
      expect(valid).toBe(true);
    });

    test('must specify OSSA version 0.1.8', () => {
      expect(agentManifest.ossa).toBe('0.1.8');
    });

    test('must have required metadata fields', () => {
      expect(agentManifest.metadata).toBeDefined();
      expect(agentManifest.metadata.name).toMatch(/^[a-z][a-z0-9-]*[a-z0-9]$/);
      expect(agentManifest.metadata.version).toMatch(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/);
      expect(agentManifest.metadata.description).toBeDefined();
      expect(agentManifest.metadata.description.length).toBeGreaterThanOrEqual(10);
    });

    test('must have valid spec section', () => {
      expect(agentManifest.spec).toBeDefined();
      expect(['basic', 'advanced', 'enterprise']).toContain(agentManifest.spec.conformance_tier);
      expect(['integration', 'workflow', 'cognitive', 'system']).toContain(agentManifest.spec.class);
      expect(['assistant', 'tool', 'service', 'orchestrator']).toContain(agentManifest.spec.category);
    });

    test('must have at least one primary capability', () => {
      expect(agentManifest.spec.capabilities).toBeDefined();
      expect(agentManifest.spec.capabilities.primary).toBeDefined();
      expect(Array.isArray(agentManifest.spec.capabilities.primary)).toBe(true);
      expect(agentManifest.spec.capabilities.primary.length).toBeGreaterThanOrEqual(1);
    });

    test('must specify at least one protocol', () => {
      expect(agentManifest.spec.protocols).toBeDefined();
      expect(Array.isArray(agentManifest.spec.protocols)).toBe(true);
      expect(agentManifest.spec.protocols.length).toBeGreaterThanOrEqual(1);
      
      agentManifest.spec.protocols.forEach(protocol => {
        expect(protocol.name).toBeDefined();
        expect(protocol.version).toBeDefined();
        expect(typeof protocol.required).toBe('boolean');
      });
    });

    test('must have security configuration', () => {
      expect(agentManifest.spec.security).toBeDefined();
      expect(agentManifest.spec.security.authentication).toBeDefined();
      expect(Array.isArray(agentManifest.spec.security.authentication)).toBe(true);
      expect(agentManifest.spec.security.authentication.length).toBeGreaterThanOrEqual(1);
      
      const validAuthMethods = ['api_key', 'oauth2', 'basic', 'jwt', 'mutual_tls'];
      agentManifest.spec.security.authentication.forEach(method => {
        expect(validAuthMethods).toContain(method);
      });
      
      expect(agentManifest.spec.security.authorization).toBeDefined();
      expect(['none', 'rbac', 'abac', 'custom']).toContain(agentManifest.spec.security.authorization);
      
      expect(agentManifest.spec.security.encryption).toBeDefined();
      expect(agentManifest.spec.security.encryption.at_rest).toBeDefined();
      expect(agentManifest.spec.security.encryption.in_transit).toBeDefined();
    });
  });

  describe('Directory Structure Requirements', () => {
    test('must have required directory structure', () => {
      const agentPath = process.env.AGENT_PATH || path.join(__dirname, '../../fixtures/basic-agent');
      
      const requiredDirs = [
        'config',
        'data', 
        'integrations',
        'schemas',
        '_roadmap',
        'behaviors',
        'handlers',
        'training-modules'
      ];

      requiredDirs.forEach(dir => {
        const dirPath = path.join(agentPath, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
        expect(fs.statSync(dirPath).isDirectory()).toBe(true);
      });
    });

    test('must have roadmap metadata', () => {
      const agentPath = process.env.AGENT_PATH || path.join(__dirname, '../../fixtures/basic-agent');
      const roadmapMetaPath = path.join(agentPath, '_roadmap', 'roadmap_meta.json');
      
      expect(fs.existsSync(roadmapMetaPath)).toBe(true);
      
      const roadmapMeta = JSON.parse(fs.readFileSync(roadmapMetaPath, 'utf8'));
      expect(roadmapMeta.name).toBe(agentManifest.metadata.name);
      expect(roadmapMeta.version).toBe(agentManifest.metadata.version);
    });
  });

  describe('Communication Protocol Requirements', () => {
    test('must support OSSA message format', () => {
      // This would typically test actual agent endpoints
      // For now, we verify the manifest declares message format support
      const hasMessageProtocol = agentManifest.spec.protocols.some(p => 
        p.name === 'ossa-message' || p.name === 'http' || p.name === 'https'
      );
      expect(hasMessageProtocol).toBe(true);
    });
  });

  describe('Health Check Requirements', () => {
    test('must declare health check endpoint', () => {
      if (agentManifest.spec.endpoints) {
        expect(agentManifest.spec.endpoints.health).toBeDefined();
        expect(typeof agentManifest.spec.endpoints.health).toBe('string');
      }
    });
  });
});