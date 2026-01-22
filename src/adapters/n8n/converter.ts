/**
 * n8n Converter
 * Converts OSSA workflow to n8n workflow JSON
 */

import type { OssaWorkflow } from '../../types/index.js';
import type { N8NWorkflowConfig, N8NNodeConfig } from './types.js';

export class N8NConverter {
  /**
   * Convert OSSA workflow to n8n workflow
   */
  convert(workflow: OssaWorkflow): N8NWorkflowConfig {
    const spec = workflow.spec as unknown as Record<string, unknown>;
    const steps = spec.steps as
      | Array<{
          name?: string;
          description?: string;
          agent?: string;
          task?: string;
        }>
      | undefined;

    const nodes: N8NNodeConfig[] = [];
    const connections: Record<
      string,
      Array<{ node: string; type: string; index: number }>
    > = {};

    // Start node
    nodes.push({
      name: 'Start',
      type: 'n8n-nodes-base.start',
      typeVersion: 1,
      position: [250, 300],
      parameters: {},
    });

    if (steps) {
      let yPosition = 400;
      let previousNode = 'Start';

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const nodeName = step.name || step.task || `Step ${i + 1}`;
        const nodeId = `node-${i + 1}`;

        nodes.push({
          name: nodeName,
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [450, yPosition],
          parameters: {
            mode: 'runOnceForAllItems',
            jsCode: `// ${step.description || step.task || ''}\nreturn items;`,
          },
        });

        connections[previousNode] = [
          {
            node: nodeId,
            type: 'main',
            index: 0,
          },
        ];

        previousNode = nodeId;
        yPosition += 150;
      }
    }

    return {
      name: workflow.metadata?.name || 'workflow',
      nodes,
      connections,
      settings: {
        executionOrder: 'v1',
      },
    };
  }

  /**
   * Generate n8n workflow JSON
   */
  generateJSON(workflow: OssaWorkflow): string {
    const config = this.convert(workflow);
    return JSON.stringify(
      {
        name: config.name,
        nodes: config.nodes,
        connections: config.connections,
        settings: config.settings,
        staticData: null,
        tags: [],
        triggerCount: 0,
        updatedAt: new Date().toISOString(),
        versionId: '1',
      },
      null,
      2
    );
  }
}
