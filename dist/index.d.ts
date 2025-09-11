/**
 * OSSA Platform Entry Point
 * Production orchestration platform initialization
 */
import { OrchestratorPlatform } from './core/orchestrator/index.js';
import { OrchestrationAPIServer } from './api/orchestration/server.js';
import { PlatformCoordination } from './core/coordination/PlatformCoordination.js';
import { ComplianceEngine } from './core/compliance/ComplianceEngine.js';
import { OrchestratorConfig } from './types/index.js';
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
    complianceEngine: ComplianceEngine;
}>;
/**
 * Graceful shutdown handler
 */
export declare function shutdownOrchestratorPlatform(orchestrator: OrchestratorPlatform, apiServer: OrchestrationAPIServer): Promise<void>;
export { OrchestratorPlatform, OrchestrationAPIServer, PlatformCoordination, PRODUCTION_CONFIG, API_CONFIG };
export * from './types/index.js';
//# sourceMappingURL=index.d.ts.map