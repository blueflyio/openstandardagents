/**
 * OSSA v0.1.9 - Open Standards Scalable Agents
 * Pure Specification Standard Entry Point
 *
 * This package contains only specification files and type definitions.
 * Implementation details are available in the companion agent-buildkit repository.
 */
export declare const SPECIFICATION_FILES: {
    readonly acdl: "./api/acdl-specification.yml";
    readonly orchestration: "./api/orchestration.openapi.yml";
    readonly main: "./api/specification.openapi.yml";
    readonly voice: "./api/voice-agent-specification.yml";
    readonly agentManifestSchema: "./api/agent-manifest.schema.json";
    readonly workflowSchema: "./api/workflow.schema.json";
};
export * from './types/index.js';
export { SpecificationValidator } from './specification/validator.js';
export declare const OSSA_VERSION = "0.1.9";
export declare const SPECIFICATION_VERSION = "@bluefly/open-standards-scalable-agents@0.1.9";
export declare const PROJECT_URLS: {
    readonly repository: "https://gitlab.bluefly.io/llm/openapi-ai-agents-standard";
    readonly npm: "https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents";
    readonly issues: "https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues";
    readonly changelog: "https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/releases";
};
export declare const IMPLEMENTATION_REFS: {
    readonly referenceImplementation: "https://gitlab.bluefly.io/llm/agent_buildkit";
    readonly registryBridge: "https://gitlab.bluefly.io/llm/agent_buildkit/-/tree/main/src/registry";
    readonly examples: "https://gitlab.bluefly.io/llm/agent_buildkit/-/tree/main/examples";
};
//# sourceMappingURL=index.d.ts.map