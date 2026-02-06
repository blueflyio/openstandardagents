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
      // Step 1: Fetch MR Changes
      this.logger.info('Executing step: Fetch MR Changes');
      context.outputs.fetch-changes = await this.gitlabClient.getMRChanges(
        context.variables.PROJECT_ID, context.variables.MR_IID
      );


      // Step 2: Run Production-Grade Audit
      this.logger.info('Executing step: Run Production-Grade Audit');
      context.outputs.run-audit = await this.gitlabClient.runAudit(
        context.variables.PROJECT_ID, context.variables.MR_IID
      );


      // Step 3: Run Security Scan
      this.logger.info('Executing step: Run Security Scan');
      context.outputs.security-scan = await this.gitlabClient.runSecurityScan(
        context.variables.PROJECT_ID, context.variables.SOURCE_BRANCH
      );


      // Step 4: Comprehensive Code Review
      this.logger.info('Executing step: Comprehensive Code Review');
      const prompt = `Review this merge request:

Changes:
${JSON.stringify(changes, null, 2)}

Audit Results:
Score: ${auditResult.score}/100
Violations: ${auditResult.violations.length}

Security Scan:
${JSON.stringify(securityResult, null, 2)}

Provide comprehensive review in JSON:
{
  "summary": "Brief overview",
  "score": number (0-100),
  "blocking_issues": [
    {
      "severity": "critical",
      "category": "security|quality|architecture|performance",
      "file": "path",
      "line": number,
      "issue": "description",
      "suggestion": "how to fix"
    }
  ],
  "non_blocking_issues": [...],
  "improvements": [...],
  "positive_points": [...],
  "recommendation": "approve|changes_required|hold"
}
`;
      context.outputs.llm-review = await this.llmClient.invokeJSON(prompt);


      // Step 5: Post Review Comment
      this.logger.info('Executing step: Post Review Comment');
      context.outputs.post-review = await this.gitlabClient.postMRComment(
        context.variables.PROJECT_ID, context.variables.MR_IID, "## 🤖 Agent Review Summary\n\n**Production-Grade Score**: ${auditResult.score}/100\n\n**Recommendation**: ${review.recommendation === 'approve' ? '✅ Approve' : '⚠️ Changes Required'}\n\n### Summary\n${review.summary}\n\n${review.blocking_issues.length > 0 ? `\n### 🚫 Blocking Issues\n${review.blocking_issues.map(i => `\n**${i.severity.toUpperCase()}**: ${i.category}\n- File: \\`${i.file}:${i.line}\\`\n- Issue: ${i.issue}\n- Fix: ${i.suggestion}\n`).join('\\n')}\n` : ''}\n\n${review.non_blocking_issues.length > 0 ? `\n### ⚠️ Non-Blocking Issues\n${review.non_blocking_issues.map(i => `\n- **${i.category}**: ${i.issue} (\\`${i.file}\\`)\n`).join('\\n')}\n` : ''}\n\n${review.improvements.length > 0 ? `\n### 💡 Suggested Improvements\n${review.improvements.map(i => `- ${i}`).join('\\n')}\n` : ''}\n\n${review.positive_points.length > 0 ? `\n### ✅ Positive Points\n${review.positive_points.map(p => `- ${p}`).join('\\n')}\n` : ''}\n\n---\n🔗 [Full Audit Report](${CI_PROJECT_URL}/-/merge_requests/${MR_IID}/pipelines) | 🤖 Reviewed by: mr-reviewer\n"
      );


      // Step 6: Approve MR
      this.logger.info('Executing step: Approve MR');
      if (review.recommendation === 'approve' && review.blocking_issues.length === 0) {
      context.outputs.approve-mr = await this.gitlabClient.approveMR(
        context.variables.PROJECT_ID, context.variables.MR_IID
      );
      }


      // Step 7: Block MR
      this.logger.info('Executing step: Block MR');
      if (review.blocking_issues.length > 0) {
      context.outputs.block-mr = await this.gitlabClient.blockMR(
        context.variables.PROJECT_ID, context.variables.MR_IID, "Blocking issues found - see review comment"
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
