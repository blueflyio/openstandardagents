/**
 * Workspace Orchestrator Service
 * Main entry point for the enterprise workspace orchestration service
 */

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { OrchestrationRequest, OrchestrationResponse, WorkspaceOrchestrator } from './orchestrator';

const app = express();
const PORT = parseInt(process.env.PORT || '3004', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize orchestrator
const orchestrator = new WorkspaceOrchestrator();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'workspace-orchestrator',
        version: '1.0.0'
    });
});

// Discover agents endpoint
app.post('/api/v1/discover', async (req, res) => {
    try {
        const { workspace_path } = req.body;
        const agents = await orchestrator.discoverAgents(workspace_path || process.cwd());

        res.json({
            success: true,
            agents,
            total_agents: agents.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});

// Orchestrate endpoint
app.post('/api/v1/orchestrate', async (req, res) => {
    try {
        const request: OrchestrationRequest = req.body;

        if (!request.question) {
            return res.status(400).json({
                success: false,
                error: 'Question is required',
                timestamp: new Date().toISOString()
            });
        }

        const response: OrchestrationResponse = await orchestrator.orchestrate(request);

        res.json({
            success: true,
            data: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});

// Get orchestration stats
app.get('/api/v1/stats', (req, res) => {
    try {
        const stats = orchestrator.getOrchestrationStats();

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});

// Update agent performance
app.post('/api/v1/agents/:agentId/performance', (req, res) => {
    try {
        const { agentId } = req.params;
        const { performance_score } = req.body;

        if (typeof performance_score !== 'number' || performance_score < 0 || performance_score > 1) {
            return res.status(400).json({
                success: false,
                error: 'Performance score must be a number between 0 and 1',
                timestamp: new Date().toISOString()
            });
        }

        orchestrator.updateAgentPerformance(agentId, performance_score);

        res.json({
            success: true,
            message: `Updated performance for agent ${agentId}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});

// Update agent availability
app.post('/api/v1/agents/:agentId/availability', (req, res) => {
    try {
        const { agentId } = req.params;
        const { status } = req.body;

        if (!['online', 'offline', 'busy'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Status must be one of: online, offline, busy',
                timestamp: new Date().toISOString()
            });
        }

        orchestrator.updateAgentAvailability(agentId, status);

        res.json({
            success: true,
            message: `Updated availability for agent ${agentId} to ${status}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});

// Get discovered agents
app.get('/api/v1/agents', (req, res) => {
    try {
        const agents = orchestrator.getDiscoveredAgents();

        res.json({
            success: true,
            agents,
            total_agents: agents.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Workspace Orchestrator Service running on http://0.0.0.0:${PORT}`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log(`   - Health: GET http://localhost:${PORT}/health`);
    console.log(`   - Discover Agents: POST http://localhost:${PORT}/api/v1/discover`);
    console.log(`   - Orchestrate: POST http://localhost:${PORT}/api/v1/orchestrate`);
    console.log(`   - Stats: GET http://localhost:${PORT}/api/v1/stats`);
    console.log(`   - Agents: GET http://localhost:${PORT}/api/v1/agents`);
    console.log(`   - Update Performance: POST http://localhost:${PORT}/api/v1/agents/:agentId/performance`);
    console.log(`   - Update Availability: POST http://localhost:${PORT}/api/v1/agents/:agentId/availability`);
});

export { OrchestrationRequest, OrchestrationResponse, WorkspaceOrchestrator };

