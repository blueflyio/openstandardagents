/**
 * n8n Adapter Types
 */

export interface N8NNodeConfig {
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
}

export interface N8NWorkflowConfig {
  name: string;
  nodes: N8NNodeConfig[];
  connections: Record<
    string,
    Array<{ node: string; type: string; index: number }>
  >;
  settings: {
    executionOrder: 'v1' | 'v0';
  };
}
