/**
 * OSSA Platform Entry Point
 * Production orchestration platform initialization
 */
import { OrchestratorPlatform } from './core/orchestrator';
import { OrchestrationAPIServer } from './api/orchestration/server';
import { PlatformCoordination } from './core/coordination/PlatformCoordination';
import { OrchestratorConfig } from './types';
declare const PRODUCTION_CONFIG: OrchestratorConfig;
declare const API_CONFIG: {
    port: number;
    host: string;
    cors: boolean;
    auth: {
        enabled: boolean;
        type: "jwt";
    };
    rateLimit: {
        enabled: boolean;
        requests: number;
        window: number;
    };
};
/**
 * Initialize ORCHESTRATOR-PLATFORM in production mode
 */
export declare function initializeOrchestratorPlatform(): Promise<{
    orchestrator: OrchestratorPlatform;
    apiServer: OrchestrationAPIServer;
    coordination: PlatformCoordination;
}>;
/**
 * Graceful shutdown handler
 */
export declare function shutdownOrchestratorPlatform(orchestrator: OrchestratorPlatform, apiServer: OrchestrationAPIServer): Promise<void>;
export { OrchestratorPlatform, OrchestrationAPIServer, PlatformCoordination, PRODUCTION_CONFIG, API_CONFIG };
export * from './types';
//# sourceMappingURL=index.d.ts.map