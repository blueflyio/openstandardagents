/**
 * GitLab Agent Generator
 * Generates complete agent packages with webhook handlers, API clients, and deployment configs
 */

import type { OssaAgent } from '../../types/index.js';

export interface AgentGenerationResult {
  success: boolean;
  files: Array<{
    path: string;
    content: string;
  }>;
  metadata?: {
    agentName: string;
    platform: string;
    hasWebhook: boolean;
    hasLLM: boolean;
    toolsCount: number;
  };
  error?: string;
}

export class GitLabAgentGenerator {
  /**
   * Generate complete GitLab agent package
   */
  async generate(manifest: OssaAgent): Promise<AgentGenerationResult> {
    try {
      const agentName = manifest.metadata?.name || 'agent';
      const files: Array<{ path: string; content: string }> = [];

      // Cast spec to include GitLab-specific properties
      const spec = manifest.spec as any;

      // Determine agent capabilities
      const hasWebhook = this.hasWebhookTrigger(manifest);
      const hasSchedule = this.hasScheduleTrigger(manifest);
      const hasLLM = !!spec.llm;
      const tools = spec.tools || [];

      // Generate all files
      files.push({
        path: 'src/index.ts',
        content: this.generateMainHandler(manifest),
      });

      files.push({
        path: 'src/gitlab-client.ts',
        content: this.generateGitLabClient(manifest),
      });

      if (hasLLM) {
        files.push({
          path: 'src/llm-client.ts',
          content: this.generateLLMClient(manifest),
        });
      }

      files.push({
        path: 'src/workflow.ts',
        content: this.generateWorkflowExecutor(manifest),
      });

      files.push({
        path: 'src/types.ts',
        content: this.generateTypes(manifest),
      });

      if (hasWebhook) {
        files.push({
          path: 'webhook-config.json',
          content: this.generateWebhookConfig(manifest),
        });
      }

      files.push({
        path: '.gitlab-ci.yml',
        content: this.generateCIConfig(manifest),
      });

      files.push({
        path: 'Dockerfile',
        content: this.generateDockerfile(manifest),
      });

      files.push({
        path: 'package.json',
        content: this.generatePackageJson(manifest),
      });

      files.push({
        path: 'tsconfig.json',
        content: this.generateTSConfig(),
      });

      files.push({
        path: '.env.example',
        content: this.generateEnvExample(manifest),
      });

      files.push({
        path: 'README.md',
        content: this.generateReadme(manifest),
      });

      return {
        success: true,
        files,
        metadata: {
          agentName,
          platform: 'gitlab',
          hasWebhook,
          hasLLM,
          toolsCount: tools.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate main webhook handler
   */
  private generateMainHandler(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'agent';
    const spec = manifest.spec as any;
    const hasLLM = !!spec.llm;
    const hasWebhook = this.hasWebhookTrigger(manifest);
    const webhookTrigger = spec.triggers?.find((t: any) => t.type === 'webhook');

    return `import express from 'express';
import pino from 'pino';
import { GitLabClient } from './gitlab-client.js';
${hasLLM ? "import { LLMClient } from './llm-client.js';" : ''}
import { WorkflowExecutor } from './workflow.js';
import type { WebhookEvent } from './types.js';

const app = express();
app.use(express.json());

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Initialize clients
const gitlabClient = new GitLabClient({
  token: process.env.GITLAB_API_TOKEN!,
  baseUrl: process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4',
});

${ hasLLM ? `const llmClient = new LLMClient({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: '${spec.llm?.model || 'claude-sonnet-4-5'}',
});` : ''}

const workflowExecutor = new WorkflowExecutor({
  gitlabClient,
${hasLLM ? '  llmClient,' : ''}
  logger,
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: '${agentName}' });
});

// Ready check endpoint
app.get('/ready', (req, res) => {
  res.json({ status: 'ready', agent: '${agentName}' });
});

${hasWebhook ? `// Webhook endpoint
app.post('/webhook/${agentName}', async (req, res) => {
  const event: WebhookEvent = req.body;

  // Validate webhook token
  const webhookToken = req.headers['x-gitlab-token'];
  if (webhookToken !== process.env.WEBHOOK_SECRET) {
    logger.warn({ event: event.object_kind }, 'Invalid webhook token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  logger.info({ event: event.object_kind }, 'Webhook received');

  try {
    // Check if event matches filter
    ${webhookTrigger?.filter ? `if (!matchesFilter(event, ${JSON.stringify(webhookTrigger.filter)})) {
      logger.info({ event: event.object_kind }, 'Event filtered out');
      return res.status(200).json({ skipped: true });
    }` : ''}

    // Execute workflow
    const result = await workflowExecutor.execute(event);

    logger.info({ result }, 'Workflow completed successfully');
    return res.status(200).json(result);
  } catch (error) {
    logger.error({ err: error }, 'Workflow execution failed');
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

function matchesFilter(event: WebhookEvent, filter: any): boolean {
  // Implement filter matching logic based on manifest
  ${webhookTrigger?.filter ? `
  if (filter.note_author && event.object_attributes?.author?.username !== filter.note_author) {
    return false;
  }

  if (filter.note_contains && Array.isArray(filter.note_contains)) {
    const noteBody = event.object_attributes?.note || '';
    const matches = filter.note_contains.some((keyword: string) =>
      noteBody.toLowerCase().includes(keyword.toLowerCase())
    );
    if (!matches) return false;
  }
  ` : ''}

  return true;
}` : ''}

const PORT = process.env.PORT || 9090;
app.listen(PORT, () => {
  logger.info(\`Agent '\${agentName}' listening on port \${PORT}\`);
});
`;
  }

  /**
   * Generate GitLab API client
   */
  private generateGitLabClient(manifest: OssaAgent): string {
    const spec = manifest.spec as any;
    const tools = spec.tools || [];

    return `import { Gitlab } from '@gitbeaker/rest';
import type { Logger } from 'pino';

export interface GitLabClientConfig {
  token: string;
  baseUrl?: string;
}

export class GitLabClient {
  private gitlab: InstanceType<typeof Gitlab>;

  constructor(config: GitLabClientConfig) {
    this.gitlab = new Gitlab({
      host: config.baseUrl || 'https://gitlab.com',
      token: config.token,
    });
  }

${tools.map((tool: any) => this.generateToolMethod(tool)).join('\n\n')}
}
`;
  }

  /**
   * Generate tool method implementation
   */
  private generateToolMethod(tool: any): string {
    const name = tool.name;
    const params = tool.parameters || {};
    const paramNames = Object.keys(params);

    switch (name) {
      case 'getMRFiles':
        return `  /**
   * Get files changed in merge request
   */
  async getMRFiles(projectId: string, mrIid: number) {
    return await this.gitlab.MergeRequests.changes(projectId, mrIid);
  }`;

      case 'getMRDiff':
        return `  /**
   * Get diff for merge request
   */
  async getMRDiff(projectId: string, mrIid: number) {
    return await this.gitlab.MergeRequests.diffs(projectId, mrIid);
  }`;

      case 'getFileContent':
        return `  /**
   * Get file content from repository
   */
  async getFileContent(projectId: string, filePath: string, ref: string) {
    const file = await this.gitlab.RepositoryFiles.show(projectId, filePath, ref);
    return Buffer.from(file.content, 'base64').toString('utf-8');
  }`;

      case 'postMRComment':
        return `  /**
   * Post comment to merge request
   */
  async postMRComment(projectId: string, mrIid: number, body: string, replyToId?: number) {
    return await this.gitlab.MergeRequestNotes.create(projectId, mrIid, body, {
      ...(replyToId && { reply_to: replyToId }),
    });
  }`;

      case 'createCommit':
        return `  /**
   * Create commit with changes
   */
  async createCommit(projectId: string, branch: string, message: string, actions: any[]) {
    return await this.gitlab.Commits.create(projectId, branch, message, actions);
  }`;

      case 'createBranch':
        return `  /**
   * Create new branch
   */
  async createBranch(projectId: string, branch: string, ref: string) {
    return await this.gitlab.Branches.create(projectId, branch, ref);
  }`;

      case 'createMR':
        return `  /**
   * Create merge request
   */
  async createMR(
    projectId: string,
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string
  ) {
    return await this.gitlab.MergeRequests.create(projectId, sourceBranch, targetBranch, title, {
      description,
    });
  }`;

      case 'approveMR':
        return `  /**
   * Approve merge request
   */
  async approveMR(projectId: string, mrIid: number) {
    return await this.gitlab.MergeRequestApprovals.approve(projectId, mrIid);
  }`;

      case 'getPipelineJobs':
        return `  /**
   * Get jobs for pipeline
   */
  async getPipelineJobs(projectId: string, pipelineId: number) {
    return await this.gitlab.Jobs.showPipelineJobs(projectId, pipelineId);
  }`;

      case 'getJobLog':
        return `  /**
   * Get job log output
   */
  async getJobLog(projectId: string, jobId: number) {
    return await this.gitlab.Jobs.showLog(projectId, jobId);
  }`;

      case 'createIssue':
        return `  /**
   * Create GitLab issue
   */
  async createIssue(
    projectId: string,
    title: string,
    description: string,
    labels: string[],
    severity: string
  ) {
    return await this.gitlab.Issues.create(projectId, {
      title,
      description,
      labels: labels.join(','),
    });
  }`;

      default:
        return `  /**
   * ${tool.description || name}
   */
  async ${name}(${paramNames.map(p => `${p}: any`).join(', ')}) {
    // TODO: Implement ${name}
    throw new Error('Not implemented: ${name}');
  }`;
    }
  }

  /**
   * Generate LLM client
   */
  private generateLLMClient(manifest: OssaAgent): string {
    const spec = manifest.spec as any;
    const llmConfig = spec.llm || {};

    return `import Anthropic from '@anthropic-ai/sdk';
import type { Logger } from 'pino';

export interface LLMClientConfig {
  apiKey: string;
  model?: string;
}

export class LLMClient {
  private anthropic: Anthropic;
  private model: string;

  constructor(config: LLMClientConfig) {
    this.anthropic = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model || '${llmConfig.model || 'claude-sonnet-4-5'}';
  }

  /**
   * Invoke LLM with prompt
   */
  async invoke(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: ${llmConfig.maxTokens || 8192},
      temperature: ${llmConfig.temperature || 0.3},
      system: systemPrompt || \`${llmConfig.systemPrompt || ''}\`,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    throw new Error('Unexpected response type from LLM');
  }

  /**
   * Invoke LLM and parse JSON response
   */
  async invokeJSON<T = any>(prompt: string, systemPrompt?: string): Promise<T> {
    const response = await this.invoke(prompt, systemPrompt);

    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/\`\`\`json\\n([\\s\\S]*?)\\n\`\`\`/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;

    return JSON.parse(jsonStr);
  }
}
`;
  }

  /**
   * Generate workflow executor
   */
  private generateWorkflowExecutor(manifest: OssaAgent): string {
    const spec = manifest.spec as any;
    const workflow = spec.workflow;
    const hasLLM = !!spec.llm;

    return `import type { GitLabClient } from './gitlab-client.js';
${hasLLM ? "import type { LLMClient } from './llm-client.js';" : ''}
import type { Logger } from 'pino';
import type { WebhookEvent, WorkflowContext } from './types.js';

export interface WorkflowExecutorConfig {
  gitlabClient: GitLabClient;
${hasLLM ? '  llmClient: LLMClient;' : ''}
  logger: Logger;
}

export class WorkflowExecutor {
  private gitlabClient: GitLabClient;
${hasLLM ? '  private llmClient: LLMClient;' : ''}
  private logger: Logger;

  constructor(config: WorkflowExecutorConfig) {
    this.gitlabClient = config.gitlabClient;
${hasLLM ? '    this.llmClient = config.llmClient;' : ''}
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
${workflow?.steps?.map((step: any, index: number) => this.generateStepExecution(step, index)).join('\n\n') || '      // No workflow steps defined'}

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
`;
  }

  /**
   * Generate step execution code
   */
  private generateStepExecution(step: any, index: number): string {
    const stepId = step.id || `step${index}`;
    const condition = step.condition;

    let code = `      // Step ${index + 1}: ${step.name || stepId}\n`;
    code += `      this.logger.info('Executing step: ${step.name || stepId}');\n`;

    if (condition) {
      code += `      if (${this.convertCondition(condition)}) {\n`;
    }

    switch (step.action) {
      case 'tool-invoke':
        code += `      context.outputs.${stepId} = await this.gitlabClient.${step.tool}(\n`;
        code += `        ${this.generateToolParams(step.params)}\n`;
        code += `      );\n`;
        break;

      case 'llm-invoke':
        code += `      const prompt = \`${step.input || ''}\`;\n`;
        code += `      context.outputs.${stepId} = await this.llmClient.invokeJSON(prompt);\n`;
        break;

      case 'parallel':
        code += `      context.outputs.${stepId} = await Promise.all([\n`;
        code += step.tasks?.map((task: any) =>
          `        this.gitlabClient.${task.tool}(${this.generateToolParams(task.params)})`
        ).join(',\n');
        code += `\n      ]);\n`;
        break;

      default:
        code += `      // TODO: Implement ${step.action}\n`;
    }

    if (condition) {
      code += `      }\n`;
    }

    return code;
  }

  /**
   * Convert condition string to JavaScript
   */
  private convertCondition(condition: string): string {
    // Simple variable replacement
    return condition
      .replace(/\${(\w+)}/g, 'context.outputs.$1')
      .replace(/===|!==|>|<|>=|<=/, (match) => match);
  }

  /**
   * Generate tool parameters
   */
  private generateToolParams(params: any): string {
    if (!params) return '';

    return Object.entries(params)
      .map(([key, value]) => {
        if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
          const varName = value.slice(2, -1);
          return `context.variables.${varName}`;
        }
        return JSON.stringify(value);
      })
      .join(', ');
  }

  /**
   * Generate types
   */
  private generateTypes(manifest: OssaAgent): string {
    return `export interface WebhookEvent {
  object_kind: string;
  project?: {
    id: string | number;
    name: string;
  };
  project_id?: string | number;
  merge_request?: {
    iid: number;
    source_branch: string;
    target_branch: string;
  };
  object_attributes?: any;
  commit?: any;
  ref?: string;
}

export interface WorkflowContext {
  event: WebhookEvent;
  variables: Record<string, any>;
  outputs: Record<string, any>;
}
`;
  }

  /**
   * Generate webhook configuration JSON
   */
  private generateWebhookConfig(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'agent';
    const spec = manifest.spec as any;
    const webhookTrigger = spec.triggers?.find((t: any) => t.type === 'webhook');
    const extensions = (manifest as any).extensions?.gitlab;

    return JSON.stringify({
      url: extensions?.webhook?.url || `http://api.blueflyagents.com/webhook/${agentName}`,
      token: '${WEBHOOK_SECRET}',
      enable_ssl_verification: extensions?.webhook?.ssl_verification ?? false,
      push_events: false,
      issues_events: webhookTrigger?.event === 'issues_events',
      merge_requests_events: webhookTrigger?.event === 'merge_requests_events' ||
                            webhookTrigger?.event === 'note_events',
      note_events: webhookTrigger?.event === 'note_events',
      pipeline_events: webhookTrigger?.event === 'pipeline_events',
      wiki_page_events: false,
    }, null, 2);
  }

  /**
   * Generate GitLab CI config
   */
  private generateCIConfig(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'agent';

    return `# GitLab CI/CD for ${agentName}
# Auto-generated from OSSA manifest

stages:
  - build
  - deploy

build:
  stage: build
  image: node:20-alpine
  script:
    - npm ci
    - npm run build
    - npm test
  artifacts:
    paths:
      - dist/
      - node_modules/
    expire_in: 1 hour

deploy:${agentName}:
  stage: deploy
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t registry.gitlab.com/$CI_PROJECT_PATH/${agentName}:latest .
    - docker push registry.gitlab.com/$CI_PROJECT_PATH/${agentName}:latest
    # Deploy to Kubernetes
    - kubectl set image deployment/${agentName} ${agentName}=registry.gitlab.com/$CI_PROJECT_PATH/${agentName}:latest -n agents
  only:
    - main
`;
  }

  /**
   * Generate Dockerfile
   */
  private generateDockerfile(manifest: OssaAgent): string {
    return `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

ENV NODE_ENV=production
ENV PORT=9090

EXPOSE 9090

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:9090/health || exit 1

CMD ["node", "dist/index.js"]
`;
  }

  /**
   * Generate package.json
   */
  private generatePackageJson(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'agent';
    const spec = manifest.spec as any;
    const hasLLM = !!spec.llm;

    return JSON.stringify({
      name: `@bluefly/${agentName}`,
      version: manifest.metadata?.version || '1.0.0',
      description: manifest.metadata?.description || '',
      type: 'module',
      main: 'dist/index.js',
      scripts: {
        build: 'tsc',
        start: 'node dist/index.js',
        dev: 'tsx watch src/index.ts',
        test: 'echo "No tests yet"',
      },
      dependencies: {
        express: '^4.18.2',
        '@gitbeaker/rest': '^40.0.0',
        ...(hasLLM && { '@anthropic-ai/sdk': '^0.32.1' }),
        pino: '^8.19.0',
        'pino-pretty': '^11.0.0',
      },
      devDependencies: {
        '@types/express': '^4.17.21',
        '@types/node': '^20.11.19',
        typescript: '^5.3.3',
        tsx: '^4.7.1',
      },
      engines: {
        node: '>=20.0.0',
      },
    }, null, 2);
  }

  /**
   * Generate TypeScript config
   */
  private generateTSConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ES2022',
        moduleResolution: 'node',
        lib: ['ES2022'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    }, null, 2);
  }

  /**
   * Generate .env.example
   */
  private generateEnvExample(manifest: OssaAgent): string {
    const spec = manifest.spec as any;
    const secrets = spec.security?.secrets || [];
    const hasLLM = !!spec.llm;

    let env = '# GitLab Agent Environment Variables\n\n';
    env += '# GitLab Configuration\n';
    env += 'GITLAB_API_TOKEN=glpat-your-token-here\n';
    env += 'GITLAB_API_URL=https://gitlab.com/api/v4\n';
    env += 'WEBHOOK_SECRET=your-webhook-secret\n\n';

    if (hasLLM) {
      env += '# LLM Configuration\n';
      env += 'ANTHROPIC_API_KEY=sk-ant-your-key-here\n\n';
    }

    env += '# Server Configuration\n';
    env += 'PORT=9090\n';
    env += 'NODE_ENV=production\n';
    env += 'LOG_LEVEL=info\n';

    return env;
  }

  /**
   * Generate README
   */
  private generateReadme(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'agent';
    const description = manifest.metadata?.description || '';
    const hasWebhook = this.hasWebhookTrigger(manifest);

    return `# ${agentName}

${description}

## Generated from OSSA Manifest

This agent was auto-generated from an OSSA v0.4.1 manifest using:

\`\`\`bash
ossa export agents/gitlab/${agentName}.ossa.yaml --platform gitlab-agent --output ./${agentName}
\`\`\`

## Installation

1. Install dependencies:

\`\`\`bash
npm install
\`\`\`

2. Copy \`.env.example\` to \`.env\` and fill in your credentials:

\`\`\`bash
cp .env.example .env
\`\`\`

3. Build the agent:

\`\`\`bash
npm run build
\`\`\`

4. Run the agent:

\`\`\`bash
npm start
\`\`\`

## Development

Run in development mode with hot reload:

\`\`\`bash
npm run dev
\`\`\`

## Deployment

### Docker

Build and run with Docker:

\`\`\`bash
docker build -t ${agentName} .
docker run -p 9090:9090 --env-file .env ${agentName}
\`\`\`

### Kubernetes

Deploy to Kubernetes:

\`\`\`bash
kubectl apply -f k8s/deployment.yaml
\`\`\`

${hasWebhook ? `## GitLab Webhook Configuration

Configure the webhook in your GitLab project:

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: \`http://api.blueflyagents.com/webhook/${agentName}\`
3. Set secret token (from .env WEBHOOK_SECRET)
4. Select events: ${this.getWebhookEvents(manifest).join(', ')}
5. Save webhook

Test the webhook:

\`\`\`bash
curl -X POST http://localhost:9090/webhook/${agentName} \\
  -H "Content-Type: application/json" \\
  -H "X-Gitlab-Token: your-secret" \\
  -d @test-event.json
\`\`\`
` : ''}

## Health Checks

- Health: \`GET /health\`
- Ready: \`GET /ready\`

## Monitoring

The agent exposes Prometheus metrics and OpenTelemetry traces.

## License

${manifest.metadata?.license || 'MIT'}
`;
  }

  /**
   * Check if manifest has webhook trigger
   */
  private hasWebhookTrigger(manifest: OssaAgent): boolean {
    const spec = manifest.spec as any;
    return !!spec.triggers?.some((t: any) => t.type === 'webhook');
  }

  /**
   * Check if manifest has schedule trigger
   */
  private hasScheduleTrigger(manifest: OssaAgent): boolean {
    const spec = manifest.spec as any;
    return !!spec.triggers?.some((t: any) => t.type === 'schedule');
  }

  /**
   * Get webhook events for manifest
   */
  private getWebhookEvents(manifest: OssaAgent): string[] {
    const spec = manifest.spec as any;
    const triggers = spec.triggers || [];
    const webhookTrigger = triggers.find((t: any) => t.type === 'webhook');
    if (!webhookTrigger) return [];

    const events: string[] = [];
    if (webhookTrigger.event === 'note_events') events.push('Comments');
    if (webhookTrigger.event === 'merge_requests_events') events.push('Merge requests');
    if (webhookTrigger.event === 'issues_events') events.push('Issues');
    if (webhookTrigger.event === 'pipeline_events') events.push('Pipelines');

    return events;
  }
}