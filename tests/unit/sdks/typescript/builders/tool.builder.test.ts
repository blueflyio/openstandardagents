/**
 * Tests for ToolBuilder
 */

import { describe, it, expect } from '@jest/globals';
import { ToolBuilder } from '../../../../../src/sdks/typescript/builders/tool.builder.js';

describe('ToolBuilder', () => {
  describe('MCP Tools', () => {
    it('should build MCP tool with server and args', () => {
      const tool = ToolBuilder.mcp('filesystem')
        .server('npx -y @modelcontextprotocol/server-filesystem')
        .args(['./'])
        .description('File system access')
        .build();

      expect(tool.name).toBe('filesystem');
      expect(tool.description).toBe('File system access');
      expect((tool as any).type).toBe('mcp');
      expect(tool.parameters?.server).toBe(
        'npx -y @modelcontextprotocol/server-filesystem'
      );
      expect(tool.parameters?.args).toEqual(['./']);
    });

    it('should build MCP tool with environment variables', () => {
      const tool = ToolBuilder.mcp('database')
        .server('npx db-server')
        .env({ DB_HOST: 'localhost', DB_PORT: '5432' })
        .build();

      expect(tool.parameters?.env).toEqual({
        DB_HOST: 'localhost',
        DB_PORT: '5432',
      });
    });
  });

  describe('Webhook Tools', () => {
    it('should build webhook tool', () => {
      const tool = ToolBuilder.webhook('github-webhook')
        .url('https://api.example.com/webhook')
        .events(['push', 'pull_request'])
        .secret('my-secret')
        .build();

      expect(tool.name).toBe('github-webhook');
      expect((tool as any).type).toBe('webhook');
      expect(tool.parameters?.url).toBe('https://api.example.com/webhook');
      expect(tool.parameters?.events).toEqual(['push', 'pull_request']);
      expect(tool.parameters?.secret).toBe('my-secret');
    });
  });

  describe('Schedule Tools', () => {
    it('should build schedule tool with cron', () => {
      const tool = ToolBuilder.schedule('daily-report')
        .cron('0 9 * * *')
        .timezone('America/New_York')
        .description('Daily report generation')
        .build();

      expect(tool.name).toBe('daily-report');
      expect((tool as any).type).toBe('schedule');
      expect(tool.parameters?.cron).toBe('0 9 * * *');
      expect(tool.parameters?.timezone).toBe('America/New_York');
    });
  });

  describe('HTTP Tools', () => {
    it('should build HTTP tool with method and headers', () => {
      const tool = ToolBuilder.http('api-call')
        .url('https://api.example.com/data')
        .httpMethod('POST')
        .headers({ 'Content-Type': 'application/json' })
        .body({ key: 'value' })
        .auth({ type: 'bearer', token: 'secret' })
        .build();

      expect(tool.name).toBe('api-call');
      expect((tool as any).type).toBe('http');
      expect(tool.parameters?.url).toBe('https://api.example.com/data');
      expect(tool.handler?.method).toBe('POST');
      expect(tool.parameters?.headers).toEqual({
        'Content-Type': 'application/json',
      });
      expect(tool.parameters?.body).toEqual({ key: 'value' });
      expect(tool.parameters?.auth).toEqual({ type: 'bearer', token: 'secret' });
    });
  });

  describe('API Tools', () => {
    it('should build API tool', () => {
      const tool = ToolBuilder.api('rest-api')
        .endpoint('https://api.example.com/v1')
        .build();

      expect(tool.name).toBe('rest-api');
      expect((tool as any).type).toBe('api');
      expect(tool.handler?.endpoint).toBe('https://api.example.com/v1');
    });
  });

  describe('Function Tools', () => {
    it('should build function tool', () => {
      const tool = ToolBuilder.function('calculate')
        .runtime('nodejs')
        .capability('math')
        .parameters({ operation: 'add' })
        .build();

      expect(tool.name).toBe('calculate');
      expect((tool as any).type).toBe('function');
      expect(tool.handler?.runtime).toBe('nodejs');
      expect(tool.handler?.capability).toBe('math');
      expect(tool.parameters?.operation).toBe('add');
    });
  });

  describe('Agent-to-Agent Tools', () => {
    it('should build a2a tool', () => {
      const tool = ToolBuilder.a2a('delegate')
        .endpoint('http://agent-mesh:3005/agents/worker')
        .build();

      expect(tool.name).toBe('delegate');
      expect((tool as any).type).toBe('a2a');
      expect(tool.handler?.endpoint).toBe(
        'http://agent-mesh:3005/agents/worker'
      );
    });
  });

  describe('Kubernetes Tools', () => {
    it('should build Kubernetes tool', () => {
      const tool = ToolBuilder.kubernetes('deploy')
        .capability('deployment')
        .parameters({ namespace: 'production' })
        .build();

      expect(tool.name).toBe('deploy');
      expect((tool as any).type).toBe('kubernetes');
      expect(tool.handler?.capability).toBe('deployment');
      expect(tool.parameters?.namespace).toBe('production');
    });
  });

  describe('Custom Tools', () => {
    it('should build custom tool', () => {
      const tool = ToolBuilder.custom('my-custom-tool')
        .description('Custom tool')
        .parameter('customParam', 'customValue')
        .build();

      expect(tool.name).toBe('my-custom-tool');
      expect((tool as any).type).toBe('custom');
      expect(tool.description).toBe('Custom tool');
      expect(tool.parameters?.customParam).toBe('customValue');
    });
  });

  describe('Error Handling', () => {
    it('should throw error if name is missing', () => {
      const builder = ToolBuilder.mcp('');
      expect(() => builder.build()).toThrow();
    });
  });

  describe('Fluent API', () => {
    it('should support method chaining', () => {
      const tool = ToolBuilder.mcp('test')
        .server('test-server')
        .args(['arg1', 'arg2'])
        .description('Test description')
        .runtime('nodejs')
        .capability('test-capability')
        .build();

      expect(tool.name).toBe('test');
      expect(tool.description).toBe('Test description');
    });

    it('should support parameter method for adding single parameters', () => {
      const tool = ToolBuilder.custom('test')
        .parameter('key1', 'value1')
        .parameter('key2', 'value2')
        .parameter('key3', { nested: 'object' })
        .build();

      expect(tool.parameters?.key1).toBe('value1');
      expect(tool.parameters?.key2).toBe('value2');
      expect(tool.parameters?.key3).toEqual({ nested: 'object' });
    });
  });
});
