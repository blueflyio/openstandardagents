/**
 * OSSA Identity & Adapter Types
 *
 * Implements the "Adapter Envelope" pattern for platform-agnostic agents.
 * Separation of Concerns:
 * - Principal: Who the agent is (Abstract)
 * - Adapter: How the agent connects (Concrete)
 */
/**
 * Abstract Identity Principal
 * The portable definition of an agent's identity and permissions.
 */
export interface Principal {
    /** Abstract provider category (e.g., 'scm', 'cloud', 'database') */
    category: 'scm' | 'cloud' | 'database' | 'service';
    /** Abstract mode of operation */
    mode: 'app' | 'service_account' | 'user' | 'workload_identity';
    /** Abstract credential source reference */
    credentialSource: CredentialSource;
    /** Abstract policy definition */
    policy: {
        /** Abstract permission verbs (e.g., 'contents.read', 'cluster.admin') */
        permissions: string[];
        /** Scope of access (repos, resources, paths) */
        scope?: {
            resources?: string[];
            paths?: string[];
            namespaces?: string[];
        };
    };
    /** Security controls */
    controls?: {
        rotationPolicy?: {
            type: 'managed' | 'automatic' | 'manual';
            intervalDays?: number;
        };
        auditLogging?: boolean;
        envBindings?: string[];
    };
}
/**
 * Credential Source Definition
 * Unifies secrets, workload identity, and external brokers.
 */
export interface CredentialSource {
    type: 'secretRef' | 'workloadIdentity' | 'external' | 'env';
    /** Reference string (e.g., 'secrets://scm/github/token', 'env:GITHUB_TOKEN') */
    ref: string;
    /** Optional format hint */
    format?: 'json' | 'text' | 'base64';
}
/**
 * Adapter Configuration
 * Platform-specific implementation details.
 */
export interface Adapter {
    /** Adapter Type (e.g., 'scm.github', 'runtime.kagent') */
    type: string;
    /** Adapter Version */
    version: string;
    /**
     * Provider-specific configuration object.
     * Validated against the Adapter's specific JSON Schema.
     */
    config: Record<string, unknown>;
    /** Secrets required by this specific adapter instance */
    secrets?: Record<string, CredentialSource>;
}
/**
 * AI Generation Context
 * Context passed to the AI Architect for generation.
 */
export interface GenerationContext {
    intent: string;
    constraints?: {
        platform?: string[];
        compliance?: string[];
        budget?: string;
    };
    research_topics?: string[];
}
