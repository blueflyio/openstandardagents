/**
 * WizardStateService — Headless wizard state machine
 *
 * Manages wizard sessions, step definitions, and state transitions
 * with ZERO TUI/inquirer dependencies. CLI, REST API, and MCP server
 * all consume this service.
 */

import { injectable, inject } from 'inversify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { ValidationService } from '../validation.service.js';
import { getApiVersion } from '../../utils/version.js';
import type { OssaAgent } from '../../types/index.js';
import { AGENT_TEMPLATES, getTemplateById } from '../../cli/wizard/data/templates.js';
import { LLM_PROVIDERS } from '../../cli/wizard/data/llm-providers.js';
import type { AgentTemplate } from '../../cli/wizard/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WizardMode = 'quick' | 'guided' | 'expert';
export type WizardKind = 'Agent' | 'Skill' | 'MCPServer';
export type FieldType = 'text' | 'select' | 'multiselect' | 'number' | 'boolean' | 'textarea';

export interface FieldDefinition {
  name: string;
  type: FieldType;
  label: string;
  description?: string;
  default?: unknown;
  required?: boolean;
  options?: Array<{ label: string; value: string; description?: string }>;
  validation?: z.ZodSchema;
}

export interface StepDefinition {
  id: string;
  title: string;
  description: string;
  fields: FieldDefinition[];
  validation: z.ZodSchema;
  condition?: (session: WizardSession) => boolean;
}

export interface WizardSession {
  id: string;
  currentStepIndex: number;
  completedSteps: string[];
  data: Record<string, unknown>;
  manifest: Partial<OssaAgent>;
  mode: WizardMode;
  kind: WizardKind;
  createdAt: number;
  updatedAt: number;
}

export interface StepResult {
  success: boolean;
  session: WizardSession;
  errors?: string[];
  nextStep?: StepDefinition | null;
}

export interface WizardCompleteResult {
  manifest: OssaAgent;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Step Definitions
// ---------------------------------------------------------------------------

function buildAgentSteps(): StepDefinition[] {
  const providerOptions = LLM_PROVIDERS.map((p) => ({
    label: p.name,
    value: p.id,
    description: `${p.models.length} models, ${p.pricingTier} tier`,
  }));

  return [
    {
      id: 'metadata',
      title: 'Basic Information',
      description: 'Agent name, version, and description',
      fields: [
        { name: 'name', type: 'text', label: 'Agent name', description: 'DNS-1123 format (lowercase, hyphens)', required: true, validation: z.string().min(1).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/) },
        { name: 'version', type: 'text', label: 'Version', default: '1.0.0', validation: z.string().regex(/^\d+\.\d+\.\d+/) },
        { name: 'description', type: 'textarea', label: 'Description', description: 'What does this agent do?', required: true },
      ],
      validation: z.object({
        name: z.string().min(1).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/),
        version: z.string().optional().default('1.0.0'),
        description: z.string().min(1),
      }),
    },
    {
      id: 'role',
      title: 'Agent Role',
      description: 'Define the system prompt / role for the agent',
      fields: [
        { name: 'role', type: 'textarea', label: 'System prompt', description: 'What role should this agent play?', required: true },
      ],
      validation: z.object({ role: z.string().min(1) }),
    },
    {
      id: 'llm',
      title: 'LLM Configuration',
      description: 'Choose the LLM provider and model',
      fields: [
        { name: 'llm_provider', type: 'select', label: 'Provider', options: providerOptions, required: true },
        { name: 'llm_model', type: 'text', label: 'Model ID', description: 'e.g. claude-sonnet-4-20250514' },
        { name: 'temperature', type: 'number', label: 'Temperature', default: 0.7 },
      ],
      validation: z.object({
        llm_provider: z.string().min(1),
        llm_model: z.string().optional(),
        temperature: z.number().min(0).max(2).optional().default(0.7),
      }),
    },
    {
      id: 'tools',
      title: 'Tools',
      description: 'Select tools for your agent',
      fields: [
        {
          name: 'tools',
          type: 'multiselect',
          label: 'Tool types',
          options: [
            { label: 'MCP Server', value: 'mcp', description: 'Model Context Protocol tools' },
            { label: 'Function call', value: 'function', description: 'Local function calls' },
            { label: 'HTTP API', value: 'http', description: 'HTTP endpoint integration' },
            { label: 'Browser', value: 'browser', description: 'Browser automation' },
            { label: 'A2A', value: 'a2a', description: 'Agent-to-agent communication' },
          ],
        },
      ],
      validation: z.object({ tools: z.array(z.string()).optional().default([]) }),
    },
    {
      id: 'safety',
      title: 'Safety Controls',
      description: 'Configure safety and content filtering',
      fields: [
        { name: 'content_filtering', type: 'boolean', label: 'Enable content filtering', default: true },
        { name: 'pii_detection', type: 'boolean', label: 'Enable PII detection', default: false },
      ],
      validation: z.object({
        content_filtering: z.boolean().optional().default(true),
        pii_detection: z.boolean().optional().default(false),
      }),
      condition: (session) => session.mode !== 'quick',
    },
    {
      id: 'autonomy',
      title: 'Autonomy Level',
      description: 'How autonomous should this agent be?',
      fields: [
        {
          name: 'autonomy_level',
          type: 'select',
          label: 'Autonomy level',
          options: [
            { label: 'Full', value: 'full', description: 'Agent acts independently' },
            { label: 'Assisted', value: 'assisted', description: 'Agent suggests, human approves' },
            { label: 'Supervised', value: 'supervised', description: 'Human oversees all actions' },
          ],
          default: 'assisted',
        },
      ],
      validation: z.object({
        autonomy_level: z.enum(['full', 'assisted', 'supervised']).optional().default('assisted'),
      }),
      condition: (session) => session.mode !== 'quick',
    },
    {
      id: 'observability',
      title: 'Observability',
      description: 'Tracing, metrics, and logging',
      fields: [
        { name: 'tracing_enabled', type: 'boolean', label: 'Enable tracing', default: true },
        { name: 'metrics_enabled', type: 'boolean', label: 'Enable metrics', default: true },
      ],
      validation: z.object({
        tracing_enabled: z.boolean().optional().default(true),
        metrics_enabled: z.boolean().optional().default(true),
      }),
      condition: (session) => session.mode === 'expert',
    },
    {
      id: 'extensions',
      title: 'Platform Extensions',
      description: 'Enable platform-specific extensions',
      fields: [
        {
          name: 'platforms',
          type: 'multiselect',
          label: 'Target platforms',
          options: [
            { label: 'Anthropic', value: 'anthropic' },
            { label: 'OpenAI', value: 'openai' },
            { label: 'LangChain', value: 'langchain' },
            { label: 'CrewAI', value: 'crewai' },
            { label: 'LangFlow', value: 'langflow' },
            { label: 'Cursor', value: 'cursor' },
          ],
        },
      ],
      validation: z.object({ platforms: z.array(z.string()).optional().default([]) }),
      condition: (session) => session.mode === 'expert',
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Review your agent manifest before completing',
      fields: [],
      validation: z.object({}),
    },
  ];
}

// ---------------------------------------------------------------------------
// Session TTL (30 minutes)
// ---------------------------------------------------------------------------
const SESSION_TTL_MS = 30 * 60 * 1000;

@injectable()
export class WizardStateService {
  private sessions = new Map<string, WizardSession>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    @inject(ValidationService) private validationService: ValidationService
  ) {
    // Cleanup expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
    // Allow process to exit without waiting for timer
    if (this.cleanupInterval?.unref) this.cleanupInterval.unref();
  }

  // -------------------------------------------------------------------------
  // Session lifecycle
  // -------------------------------------------------------------------------

  createSession(opts?: { mode?: WizardMode; kind?: WizardKind; template?: string }): WizardSession {
    const mode = opts?.mode ?? 'guided';
    const kind = opts?.kind ?? 'Agent';
    const id = uuidv4();

    let initialData: Record<string, unknown> = {};
    let initialManifest: Partial<OssaAgent> = { apiVersion: getApiVersion(), kind: 'Agent' };

    if (opts?.template) {
      const tmpl = getTemplateById(opts.template);
      if (tmpl) {
        initialManifest = JSON.parse(JSON.stringify(tmpl.manifest));
        initialData = {
          name: tmpl.manifest.metadata?.name ?? '',
          version: tmpl.manifest.metadata?.version ?? '1.0.0',
          description: tmpl.manifest.metadata?.description ?? '',
          role: tmpl.manifest.spec?.role ?? '',
        };
      }
    }

    const session: WizardSession = {
      id,
      currentStepIndex: 0,
      completedSteps: [],
      data: initialData,
      manifest: initialManifest,
      mode,
      kind,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): WizardSession | null {
    const s = this.sessions.get(id);
    if (!s) return null;
    if (Date.now() - s.updatedAt > SESSION_TTL_MS) {
      this.sessions.delete(id);
      return null;
    }
    return s;
  }

  deleteSession(id: string): boolean {
    return this.sessions.delete(id);
  }

  // -------------------------------------------------------------------------
  // Step navigation
  // -------------------------------------------------------------------------

  getSteps(session: WizardSession): StepDefinition[] {
    const all = this.getAllStepsForKind(session.kind);
    return all.filter((step) => !step.condition || step.condition(session));
  }

  getCurrentStep(session: WizardSession): StepDefinition | null {
    const steps = this.getSteps(session);
    return steps[session.currentStepIndex] ?? null;
  }

  submitStep(session: WizardSession, stepId: string, data: Record<string, unknown>): StepResult {
    const steps = this.getSteps(session);
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) {
      return { success: false, session, errors: [`Unknown step: ${stepId}`] };
    }

    const step = steps[stepIndex];

    // Validate data against step schema
    const parseResult = step.validation.safeParse(data);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`);
      return { success: false, session, errors };
    }

    // Merge data into session
    Object.assign(session.data, parseResult.data);
    if (!session.completedSteps.includes(stepId)) {
      session.completedSteps.push(stepId);
    }
    session.currentStepIndex = stepIndex + 1;
    session.updatedAt = Date.now();

    // Build partial manifest from accumulated data
    this.buildManifest(session);

    const nextStep = steps[session.currentStepIndex] ?? null;
    return { success: true, session, nextStep };
  }

  undo(session: WizardSession): StepResult {
    if (session.currentStepIndex <= 0) {
      return { success: false, session, errors: ['Already at first step'] };
    }
    session.currentStepIndex--;
    const steps = this.getSteps(session);
    const prevStep = steps[session.currentStepIndex];
    if (prevStep) {
      session.completedSteps = session.completedSteps.filter((id) => id !== prevStep.id);
    }
    session.updatedAt = Date.now();
    return { success: true, session, nextStep: prevStep ?? null };
  }

  async complete(session: WizardSession): Promise<WizardCompleteResult> {
    const manifest = this.buildManifest(session) as OssaAgent;
    const result = await this.validationService.validate(manifest);

    return {
      manifest,
      valid: result.valid,
      errors: (result.errors ?? []).map((e) =>
        typeof e === 'string' ? e : (e as { message?: string }).message ?? 'Validation error'
      ),
      warnings: result.warnings ?? [],
    };
  }

  // -------------------------------------------------------------------------
  // Templates
  // -------------------------------------------------------------------------

  getTemplates(): AgentTemplate[] {
    return AGENT_TEMPLATES;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private getAllStepsForKind(kind: WizardKind): StepDefinition[] {
    switch (kind) {
      case 'Agent':
        return buildAgentSteps();
      // Skill and MCPServer use a subset of agent steps for now
      case 'Skill':
        return buildAgentSteps().filter((s) =>
          ['metadata', 'role', 'tools', 'review'].includes(s.id)
        );
      case 'MCPServer':
        return buildAgentSteps().filter((s) =>
          ['metadata', 'tools', 'review'].includes(s.id)
        );
    }
  }

  private buildManifest(session: WizardSession): Partial<OssaAgent> {
    const d = session.data;
    const manifest: Partial<OssaAgent> = {
      apiVersion: getApiVersion(),
      kind: 'Agent',
      metadata: {
        name: (d.name as string) || 'unnamed-agent',
        version: (d.version as string) || '1.0.0',
        description: (d.description as string) || '',
      },
      spec: {
        role: (d.role as string) || '',
        ...(d.llm_provider
          ? {
              llm: {
                provider: d.llm_provider as string,
                model: (d.llm_model as string) || '',
                temperature: (d.temperature as number) ?? 0.7,
              },
            }
          : {}),
        tools: this.buildTools(d.tools as string[] | undefined),
      },
    };

    // Safety
    if (d.content_filtering || d.pii_detection) {
      (manifest.spec as Record<string, unknown>).safety = {
        ...(d.content_filtering ? { content_filtering: { enabled: true } } : {}),
        ...(d.pii_detection ? { pii_detection: { enabled: true } } : {}),
      };
    }

    // Autonomy
    if (d.autonomy_level && manifest.spec) {
      manifest.spec.autonomy = { level: d.autonomy_level as 'full' | 'assisted' | 'supervised' };
    }

    // Observability
    if (d.tracing_enabled || d.metrics_enabled) {
      if (manifest.spec) {
        manifest.spec.observability = {
          tracing: { enabled: !!d.tracing_enabled, exporter: 'otlp' },
          metrics: { enabled: !!d.metrics_enabled },
        };
      }
    }

    // Extensions
    const platforms = d.platforms as string[] | undefined;
    if (platforms?.length) {
      manifest.extensions = {};
      for (const p of platforms) {
        manifest.extensions[p] = { enabled: true };
      }
    }

    session.manifest = manifest;
    return manifest;
  }

  private buildTools(toolTypes?: string[]): Array<{ type: string; name?: string }> {
    if (!toolTypes?.length) return [];
    return toolTypes.map((type) => ({ type, name: `${type}_tool` }));
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.updatedAt > SESSION_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }
}
