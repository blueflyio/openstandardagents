/**
 * OSSA Task Types
 * Type definitions for kind: Task - deterministic workflow steps
 */
import { getApiVersion } from '../utils/version.js';
/**
 * Type guard to check if manifest is a Task
 */
export function isOssaTask(manifest) {
    return (typeof manifest === 'object' &&
        manifest !== null &&
        'kind' in manifest &&
        manifest.kind === 'Task');
}
/**
 * Create an empty Task manifest with defaults
 */
export function createTaskManifest(name, options) {
    return {
        apiVersion: getApiVersion(),
        kind: 'Task',
        metadata: {
            name,
            version: '1.0.0',
            ...options?.metadata,
        },
        spec: {
            execution: {
                type: 'deterministic',
                runtime: 'any',
                timeout_seconds: 300,
            },
            capabilities: [],
            ...options?.spec,
        },
        extensions: options?.extensions,
        runtime: options?.runtime,
    };
}
