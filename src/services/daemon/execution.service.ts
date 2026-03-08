/**
 * Daemon Execution Service
 * Manages agent execution within the daemon process.
 * Extends the run command logic with concurrent execution tracking,
 * event streaming, timeout, and cancellation support.
 *
 * Keys are read from local .env — NEVER sent over WebSocket.
 * Max 3 concurrent executions to prevent resource exhaustion.
 *
 * @experimental This feature is experimental and may change without notice.
 */

import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { injectable } from 'inversify';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import { OpenAIAdapter } from '../../services/runtime/openai.adapter.js';
import { AnthropicAdapter } from '../../services/runtime/anthropic.adapter.js';
import type { OssaManifest } from '../../services/runtime/openai.adapter.js';
import { logger } from '../../utils/logger.js';

// Load .env for API keys (keys stay local, never sent over WS)
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch { /* .env loading is best-effort */ }

const MAX_CONCURRENT = 3;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Supported LLM runtime adapters
 *
 * @experimental This feature is experimental and may change without notice.
 */
export type RuntimeAdapter =
  | 'openai'
  | 'anthropic'
  | 'azure'
  | 'bedrock'
  | 'claude'
  | 'gemini'
  | 'mistral'
  | 'ollama';

const SUPPORTED_RUNTIMES: RuntimeAdapter[] = [
  'openai',
  'anthropic',
  'azure',
  'bedrock',
  'claude',
  'gemini',
  'mistral',
  'ollama',
];

/**
 * Execution state
 *
 * @experimental This feature is experimental and may change without notice.
 */
export interface Execution {
  id: string;
  manifestPath: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  output?: unknown;
  error?: string;
}

/**
 * Event emitted during execution
 *
 * @experimental This feature is experimental and may change without notice.
 */
export interface ExecutionEvent {
  type: 'stdout' | 'stderr' | 'tool_call' | 'tool_result' | 'completion' | 'error';
  executionId: string;
  data: string;
  timestamp: string;
}

/**
 * Runtime adapter environment variable mapping
 *
 * @experimental This feature is experimental and may change without notice.
 */
const RUNTIME_ENV_KEYS: Record<RuntimeAdapter, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  azure: 'AZURE_OPENAI_API_KEY',
  bedrock: 'AWS_ACCESS_KEY_ID',
  claude: 'ANTHROPIC_API_KEY',
  gemini: 'GOOGLE_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  ollama: '', // Ollama runs locally, no key needed
};

@injectable()
export class ExecutionService extends EventEmitter {
  private executions = new Map<string, Execution>();
  private abortControllers = new Map<string, AbortController>();
  private timeoutTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Start an agent execution.
   * Loads manifest, validates, selects runtime adapter, and runs.
   */
  async start(
    manifestPath: string,
    input?: unknown,
    runtime?: string,
    timeoutMs?: number,
  ): Promise<Execution> {
    // Enforce concurrency limit
    const running = this.getRunningExecutions();
    if (running.length >= MAX_CONCURRENT) {
      throw new Error(
        `Max concurrent executions (${MAX_CONCURRENT}) reached. ` +
        `Running: ${running.map((e) => e.id).join(', ')}`,
      );
    }

    // Resolve runtime adapter
    const selectedRuntime = (runtime || 'openai') as RuntimeAdapter;
    if (!SUPPORTED_RUNTIMES.includes(selectedRuntime)) {
      throw new Error(
        `Unsupported runtime '${selectedRuntime}'. ` +
        `Supported: ${SUPPORTED_RUNTIMES.join(', ')}`,
      );
    }

    // Check API key availability (from local .env, never over WS)
    const envKey = RUNTIME_ENV_KEYS[selectedRuntime];
    if (envKey && !process.env[envKey]) {
      throw new Error(
        `Missing API key: ${envKey} not set in environment. ` +
        `Add it to your .env file.`,
      );
    }

    const executionId = randomUUID();
    const execution: Execution = {
      id: executionId,
      manifestPath,
      status: 'running',
      startedAt: new Date(),
    };

    this.executions.set(executionId, execution);
    const abortController = new AbortController();
    this.abortControllers.set(executionId, abortController);

    // Set execution timeout
    const timeout = timeoutMs || DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => {
      this.handleTimeout(executionId);
    }, timeout);
    this.timeoutTimers.set(executionId, timer);

    // Run asynchronously — don't block the caller
    this.runExecution(executionId, manifestPath, input, selectedRuntime, abortController.signal)
      .catch((err) => {
        // Safety net for unhandled errors
        logger.error({ err, executionId }, 'Unhandled execution error');
      });

    return execution;
  }

  /**
   * Cancel a running execution
   */
  async cancel(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    const controller = this.abortControllers.get(executionId);
    if (controller) {
      controller.abort();
    }

    this.completeExecution(executionId, 'cancelled', undefined, 'Cancelled by user');
    return true;
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): Execution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all currently running executions
   */
  getRunningExecutions(): Execution[] {
    return Array.from(this.executions.values()).filter(
      (e) => e.status === 'running',
    );
  }

  /**
   * Register a callback for execution events on a specific execution
   */
  onExecutionEvent(
    executionId: string,
    callback: (event: ExecutionEvent) => void,
  ): void {
    const handler = (event: ExecutionEvent) => {
      if (event.executionId === executionId) {
        callback(event);
      }
    };
    this.on('execution_event', handler);

    // Auto-cleanup when execution completes
    const cleanup = (event: ExecutionEvent) => {
      if (
        event.executionId === executionId &&
        (event.type === 'completion' || event.type === 'error')
      ) {
        this.removeListener('execution_event', handler);
        this.removeListener('execution_event', cleanup);
      }
    };
    this.on('execution_event', cleanup);
  }

  /**
   * Get list of supported runtime adapters
   */
  getSupportedRuntimes(): RuntimeAdapter[] {
    return [...SUPPORTED_RUNTIMES];
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Execute the agent — load manifest, create adapter, run chat
   */
  private async runExecution(
    executionId: string,
    manifestPath: string,
    input: unknown,
    runtime: RuntimeAdapter,
    signal: AbortSignal,
  ): Promise<void> {
    try {
      // Load and validate manifest
      const manifestRepo = container.get(ManifestRepository);
      const validationService = container.get(ValidationService);

      const manifest = await manifestRepo.load(manifestPath);

      const validationResult = await validationService.validate(manifest);
      if (!validationResult.valid) {
        const errMsg = validationResult.errors
          .map((e: { message?: string }) => e.message || String(e))
          .join('; ');
        this.completeExecution(executionId, 'failed', undefined, `Validation failed: ${errMsg}`);
        return;
      }

      if (signal.aborted) return;

      // Create adapter based on selected runtime
      const adapter = this.createAdapter(runtime, manifest as OssaManifest);
      if (!adapter) {
        this.completeExecution(
          executionId,
          'failed',
          undefined,
          `Runtime '${runtime}' adapter not yet fully implemented`,
        );
        return;
      }

      adapter.initialize();

      this.emitEvent(executionId, 'stdout', `Agent loaded: ${manifest.metadata?.name || manifestPath}`);

      if (signal.aborted) return;

      // Run the chat with the provided input
      const userMessage = typeof input === 'string'
        ? input
        : input
          ? JSON.stringify(input)
          : 'Hello';

      // Wrap tool calls to emit events
      this.wrapToolEvents(adapter, executionId);

      const response = await adapter.chat(userMessage, {
        verbose: false,
        maxTurns: 10,
      });

      if (signal.aborted) return;

      this.completeExecution(executionId, 'completed', response);
    } catch (err) {
      if (signal.aborted) return;

      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, executionId }, 'Execution failed');
      this.completeExecution(executionId, 'failed', undefined, message);
    }
  }

  /**
   * Create the appropriate runtime adapter
   * Currently OpenAI and Anthropic are fully implemented.
   * Others return null (stub — adapters exist in src/services/runtime/).
   */
  private createAdapter(
    runtime: RuntimeAdapter,
    manifest: OssaManifest,
  ): OpenAIAdapter | AnthropicAdapter | null {
    switch (runtime) {
      case 'openai':
      case 'azure':
        return new OpenAIAdapter(manifest);
      case 'anthropic':
      case 'claude':
        return new AnthropicAdapter(
          manifest as import('../../services/runtime/anthropic.adapter.js').OssaManifest,
        );
      // Stub adapters — files exist but don't share a common interface yet.
      // When they implement initialize()/chat(), wire them here.
      case 'gemini':
      case 'mistral':
      case 'ollama':
      case 'bedrock':
        return null;
      default:
        return null;
    }
  }

  /**
   * Wrap adapter tool execution to emit tool_call / tool_result events.
   * Monkey-patches the adapter's executeTool if accessible, otherwise
   * relies on verbose output. This is a best-effort approach since
   * the adapters don't expose a hook interface yet.
   */
  private wrapToolEvents(
    adapter: OpenAIAdapter | AnthropicAdapter,
    executionId: string,
  ): void {
    // The adapters have private executeTool methods. We can't cleanly hook
    // into them without modifying the adapter classes. For now, we emit
    // a stdout event noting the adapter is running. Real tool-level events
    // will be added when adapters expose an event interface.
    this.emitEvent(executionId, 'stdout', 'Execution started');
  }

  /**
   * Handle execution timeout
   */
  private handleTimeout(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') return;

    const controller = this.abortControllers.get(executionId);
    if (controller) {
      controller.abort();
    }

    this.completeExecution(
      executionId,
      'failed',
      undefined,
      `Execution timed out after ${DEFAULT_TIMEOUT_MS / 1000}s`,
    );
  }

  /**
   * Mark an execution as completed/failed/cancelled and emit events
   */
  private completeExecution(
    executionId: string,
    status: 'completed' | 'failed' | 'cancelled',
    output?: unknown,
    error?: string,
  ): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = status;
    execution.completedAt = new Date();
    execution.output = output;
    execution.error = error;

    // Cleanup
    const timer = this.timeoutTimers.get(executionId);
    if (timer) {
      clearTimeout(timer);
      this.timeoutTimers.delete(executionId);
    }
    this.abortControllers.delete(executionId);

    // Emit terminal event
    if (status === 'completed') {
      this.emitEvent(
        executionId,
        'completion',
        typeof output === 'string' ? output : JSON.stringify(output),
      );
    } else {
      this.emitEvent(executionId, 'error', error || `Execution ${status}`);
    }
  }

  /**
   * Emit an execution event
   */
  private emitEvent(
    executionId: string,
    type: ExecutionEvent['type'],
    data: string,
  ): void {
    const event: ExecutionEvent = {
      type,
      executionId,
      data,
      timestamp: new Date().toISOString(),
    };
    this.emit('execution_event', event);
  }
}
