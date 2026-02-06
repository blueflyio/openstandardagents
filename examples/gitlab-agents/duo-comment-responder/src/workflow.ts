import type { GitLabClient } from './gitlab-client.js';
import type { LLMClient } from './llm-client.js';
import type { Logger } from 'pino';
import type { WebhookEvent, WorkflowContext } from './types.js';

export interface WorkflowExecutorConfig {
  gitlabClient: GitLabClient;
  llmClient: LLMClient;
  logger: Logger;
}

export class WorkflowExecutor {
  private gitlabClient: GitLabClient;
  private llmClient: LLMClient;
  private logger: Logger;

  constructor(config: WorkflowExecutorConfig) {
    this.gitlabClient = config.gitlabClient;
    this.llmClient = config.llmClient;
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
      // Step 1: Parse Duo's Comment
      this.logger.info('Executing step: Parse Duo's Comment');
      // TODO: Implement parse


      // Step 2: Fetch MR Context
      this.logger.info('Executing step: Fetch MR Context');
      context.outputs.fetch-context = await Promise.all([
        this.gitlabClient.getMRFiles(context.variables.PROJECT_ID, context.variables.MR_IID),
        this.gitlabClient.getMRDiff(context.variables.PROJECT_ID, context.variables.MR_IID)
      ]);


      // Step 3: Analyze with LLM
      this.logger.info('Executing step: Analyze with LLM');
      const prompt = `GitLab Duo commented:
"${duoSuggestion}"

MR Files Changed:
${JSON.stringify(mrFiles, null, 2)}

MR Diff:
${JSON.stringify(mrDiff, null, 2)}

Tasks:
1. Do you agree with Duo's suggestion? Why or why not?
2. If valid, what's the fix?
3. Draft a response comment
4. If code change needed, generate the updated code

Respond in JSON:
{
  "agree": boolean,
  "reasoning": "string",
  "response_comment": "string (markdown formatted)",
  "has_code_fix": boolean,
  "code_changes": [
    {
      "file_path": "string",
      "action": "update",
      "content": "string"
    }
  ],
  "commit_message": "string (if has_code_fix)"
}
`;
      context.outputs.analyze-suggestion = await this.llmClient.invokeJSON(prompt);


      // Step 4: Post Response Comment
      this.logger.info('Executing step: Post Response Comment');
      context.outputs.post-response = await this.gitlabClient.postMRComment(
        context.variables.PROJECT_ID, context.variables.MR_IID, context.variables.analysis.response_comment, context.variables.DUO_COMMENT_ID
      );


      // Step 5: Apply Code Fix
      this.logger.info('Executing step: Apply Code Fix');
      if (analysis.has_code_fix === true) {
      context.outputs.apply-fix = await this.gitlabClient.createCommit(
        context.variables.PROJECT_ID, context.variables.CI_COMMIT_REF_NAME, context.variables.analysis.commit_message, context.variables.analysis.code_changes
      );
      }


      // Step 6: Notify About Fix
      this.logger.info('Executing step: Notify About Fix');
      if (commitCreated !== null) {
      context.outputs.post-fix-notification = await this.gitlabClient.postMRComment(
        context.variables.PROJECT_ID, context.variables.MR_IID, "✅ Fix applied in commit ${commitCreated.short_id}\n\nSee: [${commitCreated.short_id}](${CI_PROJECT_URL}/-/commit/${commitCreated.id})\n\n@GitLabDuo Please review the changes.\n"
      );
      }


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
