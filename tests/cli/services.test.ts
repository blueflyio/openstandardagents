import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { createServicesCommand } from '../../cli/src/commands/services';

// Mock API client
vi.mock('../../cli/src/api/client', () => ({
  apiClient: {
    getHealth: vi.fn(),
    getMetrics: vi.fn(),
    listAgents: vi.fn(),
    discoverAgents: vi.fn()
  }
}));

import { apiClient } from '../../cli/src/api/client';

describe('Services CLI Command', () => {
  let servicesCommand: Command;

  beforeEach(() => {
    vi.clearAllMocks();
    servicesCommand = createServicesCommand();
  });

  describe('services status', () => {
    it('should display service status', async () => {
      const mockHealthData = {
        status: 'healthy',
        version: '0.1.8',
        ossa_version: '0.1.8',
        uptime: 99.95,
        services: {
          agent_registry: 'healthy',
          discovery_engine: 'healthy',
          graphql_api: 'healthy'
        }
      };

      vi.mocked(apiClient.getHealth).mockResolvedValue({
        data: mockHealthData
      });

      // Capture console output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await servicesCommand.parseAsync(['node', 'cli', 'status']);

      expect(apiClient.getHealth).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('OSSA Platform Status')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Gateway (3000)')
      );

      consoleSpy.mockRestore();
    });

    it('should handle API error gracefully', async () => {
      vi.mocked(apiClient.getHealth).mockRejectedValue(
        new Error('Connection refused')
      );

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation();

      await servicesCommand.parseAsync(['node', 'cli', 'status']);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get service status:',
        'Connection refused'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });

  describe('services health', () => {
    it('should display detailed health information', async () => {
      const mockHealthData = {
        status: 'healthy',
        version: '0.1.8',
        services: {
          gateway: 'healthy',
          discovery: 'healthy',
          coordination: 'healthy',
          orchestration: 'degraded',
          monitoring: 'healthy'
        },
        timestamp: '2025-01-26T10:00:00Z'
      };

      vi.mocked(apiClient.getHealth).mockResolvedValue({
        data: mockHealthData
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await servicesCommand.parseAsync(['node', 'cli', 'health']);

      expect(apiClient.getHealth).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Health Check Results')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('services start', () => {
    it('should start services with --dev flag', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await servicesCommand.parseAsync(['node', 'cli', 'start', '--dev']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting OSSA services in development mode')
      );

      consoleSpy.mockRestore();
    });

    it('should start all services with --all flag', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await servicesCommand.parseAsync(['node', 'cli', 'start', '--all', '--dev']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting all services')
      );

      consoleSpy.mockRestore();
    });

    it('should start specific service', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await servicesCommand.parseAsync(['node', 'cli', 'start', 'gateway', '--dev']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting gateway service')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('services logs', () => {
    it('should display service logs', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await servicesCommand.parseAsync(['node', 'cli', 'logs', 'gateway']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Displaying logs for gateway')
      );

      consoleSpy.mockRestore();
    });

    it('should follow logs with -f flag', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await servicesCommand.parseAsync(['node', 'cli', 'logs', 'gateway', '-f']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Following logs for gateway')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('services metrics', () => {
    it('should display platform metrics', async () => {
      const mockMetrics = {
        timestamp: '2025-01-26T10:00:00Z',
        timeframe: '24h',
        agents: {
          total: 15,
          active: 12,
          by_tier: {
            core: 5,
            governed: 4,
            advanced: 3
          }
        },
        requests: {
          total: 1250,
          success_rate: 99.2,
          average_response_time: 145.5
        }
      };

      vi.mocked(apiClient.getMetrics).mockResolvedValue({
        data: mockMetrics
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await servicesCommand.parseAsync(['node', 'cli', 'metrics']);

      expect(apiClient.getMetrics).toHaveBeenCalledWith({ timeframe: '24h' });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Platform Metrics')
      );

      consoleSpy.mockRestore();
    });

    it('should accept custom timeframe', async () => {
      const mockMetrics = {
        timestamp: '2025-01-26T10:00:00Z',
        timeframe: '1h'
      };

      vi.mocked(apiClient.getMetrics).mockResolvedValue({
        data: mockMetrics
      });

      await servicesCommand.parseAsync(['node', 'cli', 'metrics', '--timeframe', '1h']);

      expect(apiClient.getMetrics).toHaveBeenCalledWith({ timeframe: '1h' });
    });
  });
});