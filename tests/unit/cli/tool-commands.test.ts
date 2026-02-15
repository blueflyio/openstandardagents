/**
 * Tool Commands Unit Tests
 * Test tool/create, tool/validate, and tool/list commands
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createTool,
  validateToolConfig,
  type Tool,
} from '../../../src/types/tool.js';

describe('Tool Type System', () => {
  describe('createTool', () => {
    it('should create an MCP tool', () => {
      const tool = createTool('mcp', 'filesystem', {
        server: 'npx @modelcontextprotocol/server-filesystem',
        description: 'Access local filesystem',
      });

      expect(tool.type).toBe('mcp');
      expect(tool.name).toBe('filesystem');
      expect(tool.server).toBe('npx @modelcontextprotocol/server-filesystem');
      expect(tool.description).toBe('Access local filesystem');
    });

    it('should create an HTTP tool', () => {
      const tool = createTool('http', 'api', {
        endpoint: 'https://api.example.com',
        auth: {
          type: 'bearer',
          credentials: '${API_TOKEN}',
        },
      });

      expect(tool.type).toBe('http');
      expect(tool.name).toBe('api');
      expect(tool.endpoint).toBe('https://api.example.com');
      expect(tool.auth?.type).toBe('bearer');
    });

    it('should create a schedule tool', () => {
      const tool = createTool('schedule', 'daily-report', {
        config: {
          schedule: '0 9 * * *',
          timezone: 'UTC',
        },
      });

      expect(tool.type).toBe('schedule');
      expect(tool.name).toBe('daily-report');
      expect(tool.config?.schedule).toBe('0 9 * * *');
    });

    it('should create a webhook tool', () => {
      const tool = createTool('webhook', 'github-push', {
        endpoint: 'https://api.github.com/webhooks',
        config: {
          events: ['push', 'pull_request'],
        },
      });

      expect(tool.type).toBe('webhook');
      expect(tool.name).toBe('github-push');
      expect(tool.endpoint).toBe('https://api.github.com/webhooks');
    });

    it('should create a kubernetes tool', () => {
      const tool = createTool('kubernetes', 'pod-manager', {
        config: {
          namespace: 'default',
          resource: 'pods',
        },
      });

      expect(tool.type).toBe('kubernetes');
      expect(tool.name).toBe('pod-manager');
      expect(tool.config?.namespace).toBe('default');
      expect(tool.config?.resource).toBe('pods');
    });

    it('should create a browser tool', () => {
      const tool = createTool('browser', 'web-scraper', {
        config: {
          headless: true,
          timeout: 30000,
        },
      });

      expect(tool.type).toBe('browser');
      expect(tool.name).toBe('web-scraper');
      expect(tool.config?.headless).toBe(true);
      expect(tool.config?.timeout).toBe(30000);
    });
  });

  describe('validateToolConfig', () => {
    it('should validate a complete MCP tool', () => {
      const tool: Tool = {
        type: 'mcp',
        name: 'filesystem',
        server: 'npx @modelcontextprotocol/server-filesystem',
        description: 'Access local filesystem',
      };

      const errors = validateToolConfig(tool);
      expect(errors).toHaveLength(0);
    });

    it('should require server for MCP tools', () => {
      const tool: Tool = {
        type: 'mcp',
        name: 'filesystem',
      };

      const errors = validateToolConfig(tool);
      expect(errors).toContain('MCP tools require a server command');
    });

    it('should require endpoint for HTTP tools', () => {
      const tool: Tool = {
        type: 'http',
        name: 'api',
      };

      const errors = validateToolConfig(tool);
      expect(errors).toContain('http tools require an endpoint URL');
    });

    it('should require endpoint for webhook tools', () => {
      const tool: Tool = {
        type: 'webhook',
        name: 'hook',
      };

      const errors = validateToolConfig(tool);
      expect(errors).toContain('webhook tools require an endpoint URL');
    });

    it('should require schedule in config for schedule tools', () => {
      const tool: Tool = {
        type: 'schedule',
        name: 'daily',
        config: {},
      };

      const errors = validateToolConfig(tool);
      expect(errors).toContain(
        'Schedule tools require a cron expression in config.schedule'
      );
    });

    it('should require namespace and resource for kubernetes tools', () => {
      const tool: Tool = {
        type: 'kubernetes',
        name: 'pods',
        config: {},
      };

      const errors = validateToolConfig(tool);
      expect(errors).toContain(
        'Kubernetes tools require namespace and resource in config'
      );
    });

    it('should validate tool with no type-specific requirements', () => {
      const tool: Tool = {
        type: 'function',
        name: 'my-function',
      };

      const errors = validateToolConfig(tool);
      expect(errors).toHaveLength(0);
    });

    it('should require type', () => {
      const tool = {
        name: 'test',
      } as any;

      const errors = validateToolConfig(tool);
      expect(errors).toContain('Tool type is required');
    });

    it('should require name', () => {
      const tool = {
        type: 'function',
      } as any;

      const errors = validateToolConfig(tool);
      expect(errors).toContain('Tool name is required');
    });
  });

  describe('Tool Types Coverage', () => {
    const allToolTypes = [
      'mcp',
      'browser',
      'kubernetes',
      'http',
      'api',
      'grpc',
      'function',
      'a2a',
      'webhook',
      'schedule',
      'pipeline',
      'workflow',
      'artifact',
      'git-commit',
      'ci-status',
      'comment',
      'library',
      'custom',
    ];

    allToolTypes.forEach((type) => {
      it(`should create ${type} tool`, () => {
        const tool = createTool(type as any, `test-${type}`);
        expect(tool.type).toBe(type);
        expect(tool.name).toBe(`test-${type}`);
      });
    });
  });
});

describe('Tool File I/O', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-tool-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should write and read tool configuration', () => {
    const tool = createTool('mcp', 'filesystem', {
      server: 'npx @modelcontextprotocol/server-filesystem',
      description: 'Access local filesystem',
    });

    const filePath = path.join(tempDir, 'tool.json');
    fs.writeFileSync(filePath, JSON.stringify(tool, null, 2));

    expect(fs.existsSync(filePath)).toBe(true);

    const loaded = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(loaded.type).toBe('mcp');
    expect(loaded.name).toBe('filesystem');
    expect(loaded.server).toBe('npx @modelcontextprotocol/server-filesystem');
  });

  it('should validate loaded tool configuration', () => {
    const tool = createTool('http', 'api', {
      endpoint: 'https://api.example.com',
    });

    const filePath = path.join(tempDir, 'tool.json');
    fs.writeFileSync(filePath, JSON.stringify(tool, null, 2));

    const loaded = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const errors = validateToolConfig(loaded);
    expect(errors).toHaveLength(0);
  });
});
