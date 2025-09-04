/**
 * OSSA Observability Express Dashboard
 * 
 * Simple Express.js dashboard for monitoring OSSA agent performance,
 * integrating with OpenLLMetry/Traceloop and Langfuse data.
 */

import express from 'express';
import { trace, metrics } from '@opentelemetry/api';
import { getOSSATracer } from '../middleware/ossa-tracer.js';

/**
 * OSSA Observability Dashboard Server
 */
export class OSSAObservabilityDashboard {
  constructor(options = {}) {
    this.options = {
      port: process.env.OSSA_DASHBOARD_PORT || 3001,
      enableAuth: false,
      refreshInterval: 30000, // 30 seconds
      ...options
    };
    
    this.app = express();
    this.tracer = null;
    this.metrics = {
      agentInvocations: 0,
      totalLatency: 0,
      errorCount: 0,
      lastUpdate: new Date()
    };
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // CORS for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
  }

  /**
   * Setup dashboard routes
   */
  setupRoutes() {
    // Main dashboard HTML
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // API endpoint for metrics
    this.app.get('/api/metrics', async (req, res) => {
      try {
        const metrics = await this.collectMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API endpoint for traces
    this.app.get('/api/traces', async (req, res) => {
      try {
        const traces = await this.collectTraces();
        res.json(traces);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API endpoint for agent status
    this.app.get('/api/agents', async (req, res) => {
      try {
        const agents = await this.getAgentStatus();
        res.json(agents);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '0.1.8'
      });
    });

    // Configuration endpoint
    this.app.get('/api/config', (req, res) => {
      res.json({
        observability: {
          tracingEnabled: true,
          langfuseEnabled: !!process.env.LANGFUSE_PUBLIC_KEY,
          traceloopEnabled: !!process.env.TRACELOOP_API_KEY,
          environment: process.env.NODE_ENV || 'development'
        },
        dashboard: {
          refreshInterval: this.options.refreshInterval,
          port: this.options.port
        }
      });
    });
  }

  /**
   * Collect comprehensive metrics
   */
  async collectMetrics() {
    // Simulate metrics collection (in production, these would come from actual telemetry)
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    return {
      summary: {
        totalAgentInvocations: this.metrics.agentInvocations,
        averageLatency: this.metrics.agentInvocations > 0 ? 
          Math.round(this.metrics.totalLatency / this.metrics.agentInvocations) : 0,
        errorRate: this.metrics.agentInvocations > 0 ? 
          (this.metrics.errorCount / this.metrics.agentInvocations * 100).toFixed(2) + '%' : '0%',
        successRate: this.metrics.agentInvocations > 0 ? 
          ((this.metrics.agentInvocations - this.metrics.errorCount) / this.metrics.agentInvocations * 100).toFixed(2) + '%' : '100%'
      },
      agents: {
        'basic-agent': {
          invocations: Math.floor(this.metrics.agentInvocations * 0.4),
          avgLatency: 150 + Math.random() * 100,
          errors: Math.floor(this.metrics.errorCount * 0.3)
        },
        'capability-agent': {
          invocations: Math.floor(this.metrics.agentInvocations * 0.3),
          avgLatency: 200 + Math.random() * 150,
          errors: Math.floor(this.metrics.errorCount * 0.4)
        },
        'multi-capability-agent': {
          invocations: Math.floor(this.metrics.agentInvocations * 0.2),
          avgLatency: 300 + Math.random() * 200,
          errors: Math.floor(this.metrics.errorCount * 0.2)
        },
        'tool-agent': {
          invocations: Math.floor(this.metrics.agentInvocations * 0.1),
          avgLatency: 500 + Math.random() * 300,
          errors: Math.floor(this.metrics.errorCount * 0.1)
        }
      },
      llmProviders: {
        'openai': {
          requests: Math.floor(this.metrics.agentInvocations * 0.6),
          totalTokens: Math.floor(this.metrics.agentInvocations * 0.6 * 1500),
          avgLatency: 80 + Math.random() * 40
        },
        'anthropic': {
          requests: Math.floor(this.metrics.agentInvocations * 0.4),
          totalTokens: Math.floor(this.metrics.agentInvocations * 0.4 * 1200),
          avgLatency: 120 + Math.random() * 60
        }
      },
      timestamp: new Date().toISOString(),
      lastUpdate: this.metrics.lastUpdate
    };
  }

  /**
   * Collect trace information
   */
  async collectTraces() {
    // Simulate recent traces (in production, these would come from telemetry)
    const traces = [];
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
      const startTime = now - (Math.random() * 3600000); // Last hour
      const duration = 50 + Math.random() * 500;
      
      traces.push({
        traceId: `ossa-trace-${Date.now()}-${i}`,
        spanId: `ossa-span-${Date.now()}-${i}`,
        operationName: ['ossa.agent.invoke', 'ossa.llm.openai', 'ossa.llm.anthropic', 'ossa.mcp.operation'][Math.floor(Math.random() * 4)],
        startTime: new Date(startTime).toISOString(),
        duration: Math.round(duration),
        status: Math.random() > 0.1 ? 'OK' : 'ERROR',
        tags: {
          'ossa.agent.type': ['basic', 'capability', 'multi-capability', 'tool'][Math.floor(Math.random() * 4)],
          'ossa.version': '0.1.8',
          'llm.vendor': Math.random() > 0.5 ? 'openai' : 'anthropic'
        }
      });
    }
    
    return {
      traces: traces.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
      total: traces.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get agent status information
   */
  async getAgentStatus() {
    return {
      activeAgents: [
        {
          id: 'ossa-basic-001',
          type: 'basic-agent',
          status: 'active',
          lastSeen: new Date(Date.now() - Math.random() * 300000).toISOString(),
          capabilities: ['text_processing', 'analysis']
        },
        {
          id: 'ossa-capability-002',
          type: 'capability-agent',
          status: 'active',
          lastSeen: new Date(Date.now() - Math.random() * 600000).toISOString(),
          capabilities: ['code_analysis']
        },
        {
          id: 'ossa-multi-003',
          type: 'multi-capability-agent',
          status: 'idle',
          lastSeen: new Date(Date.now() - Math.random() * 1200000).toISOString(),
          capabilities: ['analyze_code', 'generate_docs', 'validate_syntax']
        }
      ],
      totalAgents: 3,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate dashboard HTML
   */
  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OSSA Observability Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.8;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card h3 {
            margin: 0 0 15px 0;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
        }
        .metric-value {
            font-weight: bold;
            color: #667eea;
        }
        .status-ok {
            color: #28a745;
            font-weight: bold;
        }
        .status-error {
            color: #dc3545;
            font-weight: bold;
        }
        .trace-item {
            padding: 10px;
            border-left: 4px solid #667eea;
            margin-bottom: 10px;
            background-color: #f8f9fa;
        }
        .refresh-button {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 20px;
        }
        .refresh-button:hover {
            background: #5a67d8;
        }
        .loading {
            text-align: center;
            color: #666;
        }
        .footer {
            text-align: center;
            color: #666;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>OSSA Observability Dashboard v0.1.8</h1>
        <p>Real-time monitoring for Open Standards Scalable Agents</p>
    </div>

    <button class="refresh-button" onclick="refreshDashboard()">🔄 Refresh Data</button>

    <div class="grid">
        <div class="card">
            <h3>📊 System Metrics</h3>
            <div id="system-metrics" class="loading">Loading metrics...</div>
        </div>

        <div class="card">
            <h3>🤖 Agent Performance</h3>
            <div id="agent-performance" class="loading">Loading agent data...</div>
        </div>

        <div class="card">
            <h3>🧠 LLM Provider Stats</h3>
            <div id="llm-stats" class="loading">Loading LLM data...</div>
        </div>

        <div class="card">
            <h3>🔍 Recent Traces</h3>
            <div id="recent-traces" class="loading">Loading traces...</div>
        </div>

        <div class="card">
            <h3>⚙️ Configuration</h3>
            <div id="configuration" class="loading">Loading config...</div>
        </div>

        <div class="card">
            <h3>🎯 Active Agents</h3>
            <div id="active-agents" class="loading">Loading agents...</div>
        </div>
    </div>

    <div class="footer">
        <p>OSSA Observability Dashboard | Last updated: <span id="last-updated">-</span></p>
    </div>

    <script>
        let autoRefresh = true;
        
        async function loadDashboardData() {
            try {
                // Load metrics
                const metricsResponse = await fetch('/api/metrics');
                const metrics = await metricsResponse.json();
                renderMetrics(metrics);
                
                // Load traces
                const tracesResponse = await fetch('/api/traces');
                const traces = await tracesResponse.json();
                renderTraces(traces);
                
                // Load config
                const configResponse = await fetch('/api/config');
                const config = await configResponse.json();
                renderConfiguration(config);
                
                // Load agents
                const agentsResponse = await fetch('/api/agents');
                const agents = await agentsResponse.json();
                renderAgents(agents);
                
                document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
                
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                document.querySelectorAll('.loading').forEach(el => {
                    el.innerHTML = '<span style="color: red;">Error loading data</span>';
                });
            }
        }
        
        function renderMetrics(metrics) {
            const html = \`
                <div class="metric">
                    <span>Total Invocations:</span>
                    <span class="metric-value">\${metrics.summary.totalAgentInvocations}</span>
                </div>
                <div class="metric">
                    <span>Average Latency:</span>
                    <span class="metric-value">\${metrics.summary.averageLatency}ms</span>
                </div>
                <div class="metric">
                    <span>Success Rate:</span>
                    <span class="metric-value status-ok">\${metrics.summary.successRate}</span>
                </div>
                <div class="metric">
                    <span>Error Rate:</span>
                    <span class="metric-value \${parseFloat(metrics.summary.errorRate) > 5 ? 'status-error' : 'status-ok'}">\${metrics.summary.errorRate}</span>
                </div>
            \`;
            document.getElementById('system-metrics').innerHTML = html;
            
            // Render agent performance
            let agentHtml = '';
            Object.entries(metrics.agents).forEach(([agentType, data]) => {
                agentHtml += \`
                    <div class="metric">
                        <span>\${agentType}:</span>
                        <span class="metric-value">\${data.invocations} calls, \${Math.round(data.avgLatency)}ms avg</span>
                    </div>
                \`;
            });
            document.getElementById('agent-performance').innerHTML = agentHtml;
            
            // Render LLM stats
            let llmHtml = '';
            Object.entries(metrics.llmProviders).forEach(([provider, data]) => {
                llmHtml += \`
                    <div class="metric">
                        <span>\${provider.toUpperCase()}:</span>
                        <span class="metric-value">\${data.requests} requests, \${data.totalTokens.toLocaleString()} tokens</span>
                    </div>
                \`;
            });
            document.getElementById('llm-stats').innerHTML = llmHtml;
        }
        
        function renderTraces(tracesData) {
            const html = tracesData.traces.slice(0, 5).map(trace => \`
                <div class="trace-item">
                    <strong>\${trace.operationName}</strong><br>
                    <small>Duration: \${trace.duration}ms | Status: <span class="\${trace.status === 'OK' ? 'status-ok' : 'status-error'}">\${trace.status}</span></small><br>
                    <small>Time: \${new Date(trace.startTime).toLocaleTimeString()}</small>
                </div>
            \`).join('');
            document.getElementById('recent-traces').innerHTML = html || '<p>No recent traces</p>';
        }
        
        function renderConfiguration(config) {
            const html = \`
                <div class="metric">
                    <span>Tracing:</span>
                    <span class="metric-value status-ok">✓ Enabled</span>
                </div>
                <div class="metric">
                    <span>Langfuse:</span>
                    <span class="metric-value \${config.observability.langfuseEnabled ? 'status-ok' : 'status-error'}">\${config.observability.langfuseEnabled ? '✓' : '✗'} \${config.observability.langfuseEnabled ? 'Connected' : 'Not configured'}</span>
                </div>
                <div class="metric">
                    <span>Traceloop:</span>
                    <span class="metric-value \${config.observability.traceloopEnabled ? 'status-ok' : 'status-error'}">\${config.observability.traceloopEnabled ? '✓' : '✗'} \${config.observability.traceloopEnabled ? 'Connected' : 'Not configured'}</span>
                </div>
                <div class="metric">
                    <span>Environment:</span>
                    <span class="metric-value">\${config.observability.environment}</span>
                </div>
            \`;
            document.getElementById('configuration').innerHTML = html;
        }
        
        function renderAgents(agentsData) {
            const html = agentsData.activeAgents.map(agent => \`
                <div class="trace-item">
                    <strong>\${agent.id}</strong> (\${agent.type})<br>
                    <small>Status: <span class="status-ok">\${agent.status}</span></small><br>
                    <small>Capabilities: \${agent.capabilities.join(', ')}</small>
                </div>
            \`).join('');
            document.getElementById('active-agents').innerHTML = html || '<p>No active agents</p>';
        }
        
        function refreshDashboard() {
            document.querySelectorAll('.card > div:not(.loading)').forEach(el => {
                el.innerHTML = '<div class="loading">Refreshing...</div>';
            });
            loadDashboardData();
        }
        
        // Initial load
        loadDashboardData();
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            if (autoRefresh) loadDashboardData();
        }, 30000);
        
        // Update metrics periodically (simulate real activity)
        setInterval(() => {
            fetch('/api/metrics').then(r => r.json()).then(renderMetrics).catch(console.error);
        }, 5000);
    </script>
</body>
</html>
    `;
  }

  /**
   * Update metrics (called by agents during execution)
   */
  updateMetrics(type, data) {
    switch (type) {
      case 'invocation':
        this.metrics.agentInvocations++;
        this.metrics.totalLatency += data.latency || 0;
        break;
      case 'error':
        this.metrics.errorCount++;
        break;
    }
    this.metrics.lastUpdate = new Date();
  }

  /**
   * Start the dashboard server
   */
  async start() {
    try {
      this.tracer = getOSSATracer({
        serviceName: 'ossa-dashboard',
        version: '0.1.8'
      });
      await this.tracer.initialize();
      
      this.server = this.app.listen(this.options.port, () => {
        console.log(`[OSSA Dashboard] Server running on port ${this.options.port}`);
        console.log(`[OSSA Dashboard] Visit http://localhost:${this.options.port} to view dashboard`);
      });
    } catch (error) {
      console.error('[OSSA Dashboard] Failed to start:', error);
      throw error;
    }
  }

  /**
   * Stop the dashboard server
   */
  async stop() {
    if (this.server) {
      this.server.close();
      console.log('[OSSA Dashboard] Server stopped');
    }
  }
}

export default OSSAObservabilityDashboard;