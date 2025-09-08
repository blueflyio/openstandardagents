/**
 * OSSA Orchestra v0.1.8 - Main Entry Point
 * Advanced Multi-Agent Workflow Orchestration Platform
 */

export * from './core/types';
export * from './core/orchestrator';
export * from './agents/registry';
export * from './workflows/engine';
export * from './scaling/manager';
export * from './balancer/load-balancer';
export * from './compliance/validator';
export * from './utils/logger';
export * from './utils/metrics';
export * from './api/server';

import { OrchestraAPIServer } from './api/server';
import { Logger } from './utils/logger';

// Main function to start the orchestra
export async function startOrchestra(port: number = 3013): Promise<OrchestraAPIServer> {
  const logger = new Logger('Orchestra');
  
  try {
    logger.info('Starting OSSA Orchestra v0.1.8...');
    
    const server = new OrchestraAPIServer();
    await server.start(port);
    
    logger.info(`OSSA Orchestra started successfully on port ${port}`);
    
    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
    
    return server;
    
  } catch (error) {
    logger.error('Failed to start OSSA Orchestra:', error);
    throw error;
  }
}

// CLI entry point
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3013');
  startOrchestra(port).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}