/**
 * Daemon SSE Endpoints
 * Server-Sent Events handlers for Neural Forge browser clients.
 * Streams real-time execution output, workspace changes, and daemon status.
 *
 * @experimental This feature is experimental and may change without notice.
 */

import { randomUUID } from 'crypto';
import type http from 'http';
import { injectable, inject } from 'inversify';
import type {
  SSEEvent,
  SSEEventMetadata,
  SSEEventType,
} from '../../transports/sse.js';
import { PairingService } from './pairing.service.js';

/** Execution event types streamed during agent runs */
export type ExecutionEventKind =
  | 'stdout'
  | 'stderr'
  | 'tool_call'
  | 'tool_result'
  | 'completion'
  | 'error';

/** Payload for execution stream events */
export interface ExecutionEventPayload {
  executionId: string;
  kind: ExecutionEventKind;
  data: string;
  timestamp: string;
}

/** Payload for workspace file change events */
export interface WorkspaceChangePayload {
  path: string;
  event: 'add' | 'change' | 'unlink';
  timestamp: string;
}

/** Payload for daemon status heartbeat */
export interface DaemonStatusPayload {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memoryUsageMB: number;
  activeConnections: number;
  timestamp: string;
}

const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

const STATUS_INTERVAL_MS = 5_000;

@injectable()
export class SSEEndpoints {
  private readonly startTime = Date.now();
  private activeConnections = 0;

  /** Event subscribers keyed by execution ID */
  private readonly executionListeners = new Map<string, Set<(data: ExecutionEventPayload) => void>>();

  /** Workspace change subscribers */
  private readonly workspaceListeners = new Set<(data: WorkspaceChangePayload) => void>();

  constructor(
    @inject(PairingService) private readonly pairing: PairingService,
  ) {}

  /**
   * Stream agent execution output (stdout, stderr, tool calls, completion).
   * Client connects to /sse/execution/:id?token=<pairing-token>
   */
  streamExecution(executionId: string, res: http.ServerResponse, token: string): void {
    if (!this.authenticate(token, res)) return;
    this.initSSE(res);

    const listener = (payload: ExecutionEventPayload): void => {
      this.sendEvent(res, {
        type: 'message' as SSEEventType,
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        payload,
        metadata: {
          agentId: 'daemon',
          streamId: executionId,
        } as SSEEventMetadata,
      });

      if (payload.kind === 'completion' || payload.kind === 'error') {
        res.end();
      }
    };

    if (!this.executionListeners.has(executionId)) {
      this.executionListeners.set(executionId, new Set());
    }
    this.executionListeners.get(executionId)!.add(listener);

    res.on('close', () => {
      this.executionListeners.get(executionId)?.delete(listener);
      if (this.executionListeners.get(executionId)?.size === 0) {
        this.executionListeners.delete(executionId);
      }
      this.activeConnections--;
    });
  }

  /**
   * Stream workspace file change events.
   * Client connects to /sse/workspace?token=<pairing-token>
   */
  streamWorkspace(res: http.ServerResponse, token: string): void {
    if (!this.authenticate(token, res)) return;
    this.initSSE(res);

    const listener = (payload: WorkspaceChangePayload): void => {
      this.sendEvent(res, {
        type: 'message' as SSEEventType,
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        payload,
        metadata: {
          agentId: 'daemon',
        } as SSEEventMetadata,
      });
    };

    this.workspaceListeners.add(listener);

    res.on('close', () => {
      this.workspaceListeners.delete(listener);
      this.activeConnections--;
    });
  }

  /**
   * Stream daemon health metrics every 5 seconds.
   * Client connects to /sse/status?token=<pairing-token>
   */
  streamStatus(res: http.ServerResponse, token: string): void {
    if (!this.authenticate(token, res)) return;
    this.initSSE(res);

    const interval = setInterval(() => {
      const mem = process.memoryUsage();
      const payload: DaemonStatusPayload = {
        status: 'healthy',
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        memoryUsageMB: Math.round(mem.heapUsed / 1024 / 1024),
        activeConnections: this.activeConnections,
        timestamp: new Date().toISOString(),
      };

      this.sendEvent(res, {
        type: 'status' as SSEEventType,
        id: randomUUID(),
        timestamp: payload.timestamp,
        payload,
        metadata: {
          agentId: 'daemon',
        } as SSEEventMetadata,
      });
    }, STATUS_INTERVAL_MS);

    res.on('close', () => {
      clearInterval(interval);
      this.activeConnections--;
    });
  }

  // -- Internal publish methods for other daemon services --

  /** Push an execution event to all listeners for the given execution ID */
  publishExecutionEvent(executionId: string, payload: ExecutionEventPayload): void {
    const listeners = this.executionListeners.get(executionId);
    if (listeners) {
      for (const fn of listeners) {
        fn(payload);
      }
    }
  }

  /** Push a workspace change event to all listeners */
  publishWorkspaceChange(payload: WorkspaceChangePayload): void {
    for (const fn of this.workspaceListeners) {
      fn(payload);
    }
  }

  // -- Private helpers --

  /** Validate pairing token; sends 401 and returns false if invalid */
  private authenticate(token: string, res: http.ServerResponse): boolean {
    if (!token || !this.pairing.verifyToken(token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid or missing pairing token' }));
      return false;
    }
    return true;
  }

  /** Write SSE headers and bump connection counter */
  private initSSE(res: http.ServerResponse): void {
    res.writeHead(200, SSE_HEADERS);
    this.activeConnections++;
  }

  /** Write a single SSE frame to the response */
  private sendEvent(res: http.ServerResponse, event: SSEEvent): void {
    if (res.writableEnded) return;
    res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\nid: ${event.id}\n\n`);
  }
}
