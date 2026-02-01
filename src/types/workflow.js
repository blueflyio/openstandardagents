/**
 * OSSA Workflow Types
 * Type definitions for kind: Workflow - composition of Tasks and Agents
 */
import { getApiVersion } from '../utils/version.js';
/**
 * Type guard to check if manifest is a Workflow
 */
export function isOssaWorkflow(manifest) {
    return (typeof manifest === 'object' &&
        manifest !== null &&
        'kind' in manifest &&
        manifest.kind === 'Workflow');
}
/**
 * Create an empty Workflow manifest with defaults
 */
export function createWorkflowManifest(name, options) {
    return {
        apiVersion: getApiVersion(),
        kind: 'Workflow',
        metadata: {
            name,
            version: '1.0.0',
            ...options?.metadata,
        },
        spec: {
            steps: [],
            ...options?.spec,
        },
        extensions: options?.extensions,
    };
}
/**
 * Helper to create a workflow step
 */
export function createStep(id, kind, options) {
    return {
        id,
        kind,
        ...options,
    };
}
/**
 * Helper to create an expression reference
 * @example expr('steps.fetch.output.content') => '${{ steps.fetch.output.content }}'
 */
export function expr(path) {
    return `\${{ ${path} }}`;
}
