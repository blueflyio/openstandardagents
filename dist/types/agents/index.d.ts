/**
 * OSSA Agent Type Definitions
 */
export interface AgentCapability {
    domain: string;
    operations: string[];
    inputFormats?: string[];
    outputFormats?: string[];
}
export interface AgentProtocol {
    name: string;
    version: string;
    endpoint: string;
    authentication?: any;
    tls?: boolean;
}
export interface AgentConformance {
    level: 'bronze' | 'silver' | 'gold';
    auditLogging?: boolean;
    feedbackLoop?: boolean;
    propsTokens?: boolean;
    learningSignals?: boolean;
}
export interface AgentMetadata {
    name: string;
    version: string;
    description?: string;
    author?: string;
}
export interface AgentSpec {
    type: string;
    subtype?: string;
    capabilities: AgentCapability;
    protocols?: {
        supported: AgentProtocol[];
        preferred?: string;
    };
    conformance?: AgentConformance;
    performance?: any;
    budgets?: any;
}
export interface OSSAAgent {
    apiVersion: string;
    kind: string;
    metadata: AgentMetadata;
    spec: AgentSpec;
}
export interface AgentRegistry {
    agents: OSSAAgent[];
    version: string;
    timestamp: string;
}
//# sourceMappingURL=index.d.ts.map