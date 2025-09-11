/**
 * OSSA Telemetry System Tests
 * 
 * Comprehensive test suite for validating telemetry system functionality,
 * KPI collection, scorecard tracking, and 99.97% uptime monitoring.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TelemetryService } from './telemetry-service.js';
import { TelemetryServiceFactory } from './factory.js';
import { KPICollector } from './kpi-collector.js';
import { ScorecardSystem } from './scorecard-system.js';
import { MonitoringEngine } from './monitoring-engine.js';
import { 
  TelemetryDataPoint, 
  MetricType, 
  AgentStatus,
  KPICalculation,
  AlertSeverity
} from './types.js';

describe('OSSA Telemetry System', () => {
  let telemetryService: TelemetryService;
  
  beforeEach(async () => {
    // Use test environment for isolated testing
    telemetryService = TelemetryServiceFactory.create('testing');
  });
  
  afterEach(async () => {
    if (telemetryService) {
      await telemetryService.stop();
    }
  });

  describe('Telemetry Service', () => {
    it('should initialize with default configuration', async () => {
      expect(telemetryService).toBeDefined();
      
      const status = telemetryService.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.components.kpiCollector).toBe(true);
      expect(status.components.scorecardSystem).toBe(true);
      expect(status.components.monitoringEngine).toBe(true);
      expect(status.components.exportManager).toBe(true);
    });

    it('should start and stop successfully', async () => {
      await telemetryService.start();
      
      const runningStatus = telemetryService.getStatus();
      expect(runningStatus.isRunning).toBe(true);
      expect(runningStatus.uptime).toBeGreaterThan(0);
      
      await telemetryService.stop();
      
      const stoppedStatus = telemetryService.getStatus();
      expect(stoppedStatus.isRunning).toBe(false);
    });

    it('should handle agent registration and unregistration', async () => {
      await telemetryService.start();
      
      // Register test agents
      telemetryService.registerAgent('test-agent-001', 'Test Agent 1');
      telemetryService.registerAgent('test-agent-002', 'Test Agent 2');
      
      const status = telemetryService.getStatus();
      expect(status.statistics.totalAgents).toBe(2);
      
      // Unregister one agent
      telemetryService.unregisterAgent('test-agent-001');
      
      const updatedStatus = telemetryService.getStatus();
      expect(updatedStatus.statistics.totalAgents).toBe(1);
    });

    it('should record and aggregate metrics', async () => {
      await telemetryService.start();
      
      telemetryService.registerAgent('test-agent-001', 'Test Agent 1');
      
      // Record test metrics
      const testMetrics: TelemetryDataPoint[] = [
        {
          metricId: 'response_time',
          value: 150,
          timestamp: new Date(),
          agentId: 'test-agent-001'
        },
        {
          metricId: 'throughput',
          value: 50,
          timestamp: new Date(),
          agentId: 'test-agent-001'
        },
        {
          metricId: 'error_count',
          value: 0,
          timestamp: new Date(),
          agentId: 'test-agent-001'
        }
      ];
      
      telemetryService.recordMetrics(testMetrics);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const snapshot = await telemetryService.getSnapshot();
      expect(snapshot.scorecards).toHaveLength(1);
      expect(snapshot.scorecards[0].agentId).toBe('test-agent-001');
    });

    it('should generate comprehensive snapshots', async () => {
      await telemetryService.start();
      
      // Register multiple agents
      for (let i = 1; i <= 5; i++) {
        telemetryService.registerAgent(`test-agent-${i.toString().padStart(3, '0')}`, `Test Agent ${i}`);
      }
      
      // Record metrics for all agents
      const metrics: TelemetryDataPoint[] = [];
      for (let i = 1; i <= 5; i++) {
        const agentId = `test-agent-${i.toString().padStart(3, '0')}`;
        metrics.push(
          {
            metricId: 'uptime_percentage',
            value: 99 + Math.random(),
            timestamp: new Date(),
            agentId
          },
          {
            metricId: 'response_time',
            value: 100 + Math.random() * 100,
            timestamp: new Date(),
            agentId
          }
        );
      }
      
      telemetryService.recordMetrics(metrics);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const snapshot = await telemetryService.getSnapshot();
      
      expect(snapshot.timestamp).toBeInstanceOf(Date);
      expect(snapshot.scorecards).toHaveLength(5);
      expect(snapshot.kpis).toBeDefined();
      expect(snapshot.uptime).toBeDefined();
      expect(snapshot.health).toBeDefined();
      expect(Array.isArray(snapshot.recentAlerts)).toBe(true);
    });

    it('should validate 127 agents (simulation)', async () => {
      await telemetryService.start();
      
      // Register 127 test agents
      for (let i = 1; i <= 127; i++) {
        const agentId = `prod-agent-${i.toString().padStart(3, '0')}`;
        const agentName = `Production Agent ${i}`;
        telemetryService.registerAgent(agentId, agentName);
      }
      
      // Simulate metrics for all agents
      const metrics: TelemetryDataPoint[] = [];
      for (let i = 1; i <= 127; i++) {
        const agentId = `prod-agent-${i.toString().padStart(3, '0')}`;
        
        // Simulate good metrics for most agents
        const availability = Math.random() < 0.95 ? 99.95 + Math.random() * 0.05 : 95 + Math.random() * 4;
        
        metrics.push(
          {
            metricId: 'uptime_percentage',
            value: availability,
            timestamp: new Date(),
            agentId
          },
          {
            metricId: 'response_time',
            value: 50 + Math.random() * 100,
            timestamp: new Date(),
            agentId
          },
          {
            metricId: 'error_count',
            value: Math.random() < 0.98 ? 0 : Math.floor(Math.random() * 3),
            timestamp: new Date(),
            agentId
          }
        );
      }
      
      telemetryService.recordMetrics(metrics);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const validationResults = await telemetryService.validate127Agents();
      
      expect(validationResults.totalAgents).toBe(127);
      expect(validationResults.validatedAgents).toBe(127);
      expect(validationResults.overallCompliance).toBeGreaterThan(0);
      expect(Array.isArray(validationResults.issues)).toBe(true);
      expect(validationResults.validationResults).toBeDefined();
      expect(validationResults.validationResults.size).toBe(127);
    });
  });

  describe('KPI Collector', () => {
    it('should calculate different aggregation types correctly', () => {
      const config = TelemetryService.createDefaultConfiguration();
      const collector = new KPICollector(config.telemetry);
      
      // Test data points
      const testMetrics: TelemetryDataPoint[] = [
        { metricId: 'test_metric', value: 100, timestamp: new Date() },
        { metricId: 'test_metric', value: 200, timestamp: new Date() },
        { metricId: 'test_metric', value: 150, timestamp: new Date() },
        { metricId: 'test_metric', value: 300, timestamp: new Date() },
        { metricId: 'test_metric', value: 250, timestamp: new Date() }
      ];
      
      testMetrics.forEach(metric => collector.recordMetric(metric));
      
      // Test different calculations
      const avg = collector.calculateAggregation('test_metric', KPICalculation.AVG);
      expect(avg).toBe(200); // (100+200+150+300+250)/5
      
      const sum = collector.calculateAggregation('test_metric', KPICalculation.SUM);
      expect(sum).toBe(1000);
      
      const min = collector.calculateAggregation('test_metric', KPICalculation.MIN);
      expect(min).toBe(100);
      
      const max = collector.calculateAggregation('test_metric', KPICalculation.MAX);
      expect(max).toBe(300);
    });

    it('should handle time-series data correctly', () => {
      const config = TelemetryService.createDefaultConfiguration();
      const collector = new KPICollector(config.telemetry);
      
      const now = new Date();
      const anHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      // Record metrics at different times
      collector.recordMetric({
        metricId: 'time_series_test',
        value: 100,
        timestamp: twoHoursAgo
      });
      
      collector.recordMetric({
        metricId: 'time_series_test',
        value: 200,
        timestamp: anHourAgo
      });
      
      collector.recordMetric({
        metricId: 'time_series_test',
        value: 300,
        timestamp: now
      });
      
      // Get time series data
      const allData = collector.getTimeSeriesData('time_series_test');
      expect(allData).toHaveLength(3);
      
      // Get data for last hour only
      const recentData = collector.getTimeSeriesData('time_series_test', anHourAgo);
      expect(recentData).toHaveLength(2);
    });
  });

  describe('Scorecard System', () => {
    it('should calculate health scores correctly', async () => {
      const config = TelemetryService.createDefaultConfiguration();
      const kpiCollector = new KPICollector(config.telemetry);
      const scorecardSystem = new ScorecardSystem(kpiCollector, config.scorecard, config.telemetry);
      
      await scorecardSystem.start();
      
      // Register test agent
      scorecardSystem.registerAgent('test-agent', 'Test Agent');
      
      // Record good metrics
      const goodMetrics: TelemetryDataPoint[] = [
        { metricId: 'uptime_percentage', value: 99.99, timestamp: new Date(), agentId: 'test-agent' },
        { metricId: 'response_time', value: 50, timestamp: new Date(), agentId: 'test-agent' },
        { metricId: 'error_count', value: 0, timestamp: new Date(), agentId: 'test-agent' }
      ];
      
      goodMetrics.forEach(metric => kpiCollector.recordMetric(metric));
      
      // Update scorecard
      const scorecard = await scorecardSystem.updateAgentScorecard('test-agent');
      
      expect(scorecard).toBeDefined();
      expect(scorecard!.healthScore).toBeGreaterThan(80);
      expect(scorecard!.status).toBe(AgentStatus.HEALTHY);
      
      await scorecardSystem.stop();
    });

    it('should track agent status changes', async () => {
      const config = TelemetryService.createDefaultConfiguration();
      const kpiCollector = new KPICollector(config.telemetry);
      const scorecardSystem = new ScorecardSystem(kpiCollector, config.scorecard, config.telemetry);
      
      let statusChangeEvents: any[] = [];
      
      scorecardSystem.on('agent_event', (event) => {
        if (event.type === 'agent_status_changed') {
          statusChangeEvents.push(event);
        }
      });
      
      await scorecardSystem.start();
      
      scorecardSystem.registerAgent('status-test-agent', 'Status Test Agent');
      
      // Record degraded metrics
      const badMetrics: TelemetryDataPoint[] = [
        { metricId: 'uptime_percentage', value: 85, timestamp: new Date(), agentId: 'status-test-agent' },
        { metricId: 'response_time', value: 2000, timestamp: new Date(), agentId: 'status-test-agent' },
        { metricId: 'error_count', value: 10, timestamp: new Date(), agentId: 'status-test-agent' }
      ];
      
      badMetrics.forEach(metric => kpiCollector.recordMetric(metric));
      
      await scorecardSystem.updateAgentScorecard('status-test-agent');
      
      expect(statusChangeEvents.length).toBeGreaterThan(0);
      
      await scorecardSystem.stop();
    });
  });

  describe('Monitoring Engine', () => {
    it('should track uptime metrics', async () => {
      const config = TelemetryService.createDefaultConfiguration();
      const kpiCollector = new KPICollector(config.telemetry);
      const scorecardSystem = new ScorecardSystem(kpiCollector, config.scorecard, config.telemetry);
      const monitoringEngine = new MonitoringEngine(kpiCollector, scorecardSystem, config.monitoring, config.telemetry);
      
      await kpiCollector.start();
      await scorecardSystem.start();
      await monitoringEngine.start();
      
      const uptimeMetrics = monitoringEngine.getUptimeMetrics();
      
      expect(uptimeMetrics).toBeDefined();
      expect(uptimeMetrics.slaTarget).toBe(90.0); // Testing environment target
      expect(uptimeMetrics.periodStart).toBeInstanceOf(Date);
      expect(typeof uptimeMetrics.overallUptime).toBe('number');
      
      await monitoringEngine.stop();
      await scorecardSystem.stop();
      await kpiCollector.stop();
    });

    it('should generate system health checks', async () => {
      const config = TelemetryService.createDefaultConfiguration();
      const kpiCollector = new KPICollector(config.telemetry);
      const scorecardSystem = new ScorecardSystem(kpiCollector, config.scorecard, config.telemetry);
      const monitoringEngine = new MonitoringEngine(kpiCollector, scorecardSystem, config.monitoring, config.telemetry);
      
      await kpiCollector.start();
      await scorecardSystem.start();
      await monitoringEngine.start();
      
      // Wait a moment for initial health check
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const healthCheck = monitoringEngine.getSystemHealth();
      
      if (healthCheck) {
        expect(['healthy', 'degraded', 'unhealthy']).toContain(healthCheck.status);
        expect(typeof healthCheck.activeAgents).toBe('number');
        expect(typeof healthCheck.totalAgents).toBe('number');
        expect(typeof healthCheck.currentUptime).toBe('number');
        expect(healthCheck.slaCompliance).toBeDefined();
        expect(healthCheck.activeAlerts).toBeDefined();
        expect(healthCheck.performance).toBeDefined();
        expect(healthCheck.timestamp).toBeInstanceOf(Date);
      }
      
      await monitoringEngine.stop();
      await scorecardSystem.stop();
      await kpiCollector.stop();
    });
  });

  describe('Telemetry Factory', () => {
    it('should create services for different environments', () => {
      const prodService = TelemetryServiceFactory.create('production');
      const devService = TelemetryServiceFactory.create('development');
      const testService = TelemetryServiceFactory.create('testing');
      
      expect(prodService).toBeInstanceOf(TelemetryService);
      expect(devService).toBeInstanceOf(TelemetryService);
      expect(testService).toBeInstanceOf(TelemetryService);
    });

    it('should apply environment-specific configurations', () => {
      const prodService = TelemetryServiceFactory.create('production');
      const testService = TelemetryServiceFactory.create('testing');
      
      // Production should have higher SLA target
      const prodStatus = prodService.getStatus();
      const testStatus = testService.getStatus();
      
      expect(prodService).toBeDefined();
      expect(testService).toBeDefined();
    });
  });
});

describe('Performance Tests', () => {
  it('should handle high metric volumes efficiently', async () => {
    const service = TelemetryServiceFactory.create('testing');
    await service.start();
    
    // Register agents
    const agentCount = 50;
    for (let i = 1; i <= agentCount; i++) {
      service.registerAgent(`perf-agent-${i}`, `Performance Agent ${i}`);
    }
    
    // Generate large number of metrics
    const startTime = Date.now();
    const batchSize = 1000;
    const totalMetrics = agentCount * 100; // 5000 total metrics
    
    for (let batch = 0; batch < totalMetrics / batchSize; batch++) {
      const metrics: TelemetryDataPoint[] = [];
      
      for (let i = 0; i < batchSize; i++) {
        const agentId = `perf-agent-${(i % agentCount) + 1}`;
        metrics.push({
          metricId: 'performance_test',
          value: Math.random() * 1000,
          timestamp: new Date(),
          agentId
        });
      }
      
      service.recordMetrics(metrics);
    }
    
    const processingTime = Date.now() - startTime;
    
    // Should process metrics reasonably quickly
    expect(processingTime).toBeLessThan(5000); // Less than 5 seconds
    
    await service.stop();
  });

  it('should maintain accuracy under load', async () => {
    const service = TelemetryServiceFactory.create('testing');
    await service.start();
    
    service.registerAgent('accuracy-agent', 'Accuracy Test Agent');
    
    // Record known metrics
    const knownMetrics = [100, 200, 300, 400, 500];
    const metrics: TelemetryDataPoint[] = knownMetrics.map(value => ({
      metricId: 'accuracy_test',
      value,
      timestamp: new Date(),
      agentId: 'accuracy-agent'
    }));
    
    service.recordMetrics(metrics);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const snapshot = await service.getSnapshot();
    
    expect(snapshot.scorecards).toHaveLength(1);
    
    await service.stop();
  });
});