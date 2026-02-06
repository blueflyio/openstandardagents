import type { GitLabClient } from './gitlab-client.js';

import type { Logger } from 'pino';
import type { WebhookEvent, WorkflowContext } from './types.js';

export interface WorkflowExecutorConfig {
  gitlabClient: GitLabClient;

  logger: Logger;
}

export class WorkflowExecutor {
  private gitlabClient: GitLabClient;

  private logger: Logger;

  constructor(config: WorkflowExecutorConfig) {
    this.gitlabClient = config.gitlabClient;

    this.logger = config.logger;
  }

  /**
   * Execute workflow
   */
  async execute(event: WebhookEvent): Promise<any> {
    const context: WorkflowContext = {
      event,
      variables: this.extractVariables(event),
      outputs: {},
    };

    this.logger.info({ context }, 'Starting workflow execution');

    try {
      // No workflow steps defined

      this.logger.info({ outputs: context.outputs }, 'Workflow completed');
      return context.outputs;
    } catch (error) {
      this.logger.error({ err: error }, 'Workflow execution failed');
      throw error;
    }
  }

  /**
   * Extract variables from webhook event
   */
  private extractVariables(event: WebhookEvent): Record<string, any> {
    return {
      PROJECT_ID: event.project?.id || event.project_id,
      MR_IID: event.merge_request?.iid || event.object_attributes?.iid,
      PIPELINE_ID: event.object_attributes?.id,
      COMMIT_SHA: event.object_attributes?.sha || event.commit?.id,
      REF: event.object_attributes?.ref || event.ref,
      SOURCE_BRANCH: event.merge_request?.source_branch,
      TARGET_BRANCH: event.merge_request?.target_branch,
      DUO_COMMENT_ID: event.object_attributes?.id,
      DUO_COMMENT_BODY: event.object_attributes?.note,
      // Add more as needed
    };
  }
}
