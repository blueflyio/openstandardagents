/**
 * Daemon WebSocket Server
 * Server-side WebSocket for Neural Forge browser clients.
 * Binds to 127.0.0.1 only (NIST SP 800-204B).
 *
 * @experimental This feature is experimental and may change without notice.
 */

import { randomUUID } from 'crypto';
import type http from 'http';
import { injectable } from 'inversify';
import { WebSocketServer, WebSocket } from 'ws';
import type {
  WebSocketEvent,
  WebSocketEventMetadata,
} from '../../transports/websocket.js';

/**
 * Extended event types for daemon-specific communication
 *
 * @experimental This feature is experimental and may change without notice.
 */
export type DaemonEventType =
  | 'message'
  | 'capability_call'
  | 'status_update'
  | 'error'
  | 'ack'
  | 'ping'
  | 'pong'
  | 'register'
  | 'file_changed'
  | 'manifest_updated'
  | 'execution_output'
  | 'workspace_state'
  | 'skill_catalog'
  | 'validation_result';

/**
 * Rate limiter state per session
 *
 * @experimental This feature is experimental and may change without notice.
 */
interface RateLimitState {
  count: number;
  windowStart: number;
}

/**
 * Connected client session
 *
 * @experimental This feature is experimental and may change without notice.
 */
interface ClientSession {
  sessionId: string;
  ws: WebSocket;
  authenticated: boolean;
  rateLimit: RateLimitState;
  connectedAt: string;
}

const MAX_MESSAGE_SIZE = 1_048_576; // 1MB
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 1_000; // 1000 messages per window
const PING_INTERVAL_MS = 30_000;

@injectable()
export class DaemonWebSocketServer {
  private wss: WebSocketServer | null = null;
  private sessions = new Map<string, ClientSession>();
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Attach to an existing HTTP server for WebSocket upgrade.
   * Binds to 127.0.0.1 only -- never 0.0.0.0.
   */
  attach(server: http.Server): void {
    this.wss = new WebSocketServer({
      noServer: true,
      maxPayload: MAX_MESSAGE_SIZE,
    });

    server.on('upgrade', (request, socket, head) => {
      // Enforce localhost-only binding at the connection level
      const remoteAddr = request.socket.remoteAddress;
      if (remoteAddr !== '127.0.0.1' && remoteAddr !== '::1' && remoteAddr !== '::ffff:127.0.0.1') {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      // Extract pairing token from Sec-WebSocket-Protocol header
      const protocols = request.headers['sec-websocket-protocol'];
      const token = typeof protocols === 'string'
        ? protocols.split(',').map(p => p.trim()).find(p => p.startsWith('pairing.'))
        : undefined;

      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      this.wss!.handleUpgrade(request, socket, head, (ws) => {
        this.handleConnection(ws, token);
      });
    });

    this.startPingInterval();
  }

  /**
   * Broadcast event to all authenticated clients
   */
  broadcast(event: WebSocketEvent): void {
    const data = JSON.stringify(event);
    for (const session of this.sessions.values()) {
      if (session.authenticated && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(data);
      }
    }
  }

  /**
   * Send event to a specific session
   */
  sendToSession(sessionId: string, event: WebSocketEvent): void {
    const session = this.sessions.get(sessionId);
    if (session && session.authenticated && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify(event));
    }
  }

  /**
   * List connected session IDs
   */
  getConnectedSessions(): string[] {
    const ids: string[] = [];
    for (const [id, session] of this.sessions) {
      if (session.authenticated && session.ws.readyState === WebSocket.OPEN) {
        ids.push(id);
      }
    }
    return ids;
  }

  /**
   * Graceful shutdown -- close all connections and stop the server
   */
  close(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    for (const session of this.sessions.values()) {
      session.ws.close(1001, 'Server shutting down');
    }
    this.sessions.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }

  /**
   * Handle a new WebSocket connection after upgrade
   */
  private handleConnection(ws: WebSocket, token: string): void {
    const sessionId = randomUUID();

    const session: ClientSession = {
      sessionId,
      ws,
      authenticated: false,
      rateLimit: { count: 0, windowStart: Date.now() },
      connectedAt: new Date().toISOString(),
    };

    // Validate pairing token asynchronously
    // For now, accept tokens that match the pairing.* protocol format.
    // PairingService integration will be wired when pairing.service.ts is available.
    if (token && token.startsWith('pairing.')) {
      session.authenticated = true;
      this.sessions.set(sessionId, session);

      // Send welcome event with sessionId
      this.sendEvent(ws, {
        type: 'ack' as WebSocketEvent['type'],
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        payload: { sessionId, status: 'connected' },
        metadata: { agentId: 'daemon' } as WebSocketEventMetadata,
      });
    } else {
      ws.close(4001, 'Invalid pairing token');
      return;
    }

    ws.on('message', (raw: Buffer) => {
      this.handleMessage(session, raw);
    });

    ws.on('close', () => {
      this.sessions.delete(sessionId);
    });

    ws.on('error', () => {
      this.sessions.delete(sessionId);
      ws.terminate();
    });

    ws.on('pong', () => {
      // Client responded to ping -- connection is alive
    });
  }

  /**
   * Handle incoming message with rate limiting and size validation
   */
  private handleMessage(session: ClientSession, raw: Buffer): void {
    if (!session.authenticated) {
      session.ws.close(4001, 'Not authenticated');
      return;
    }

    // Size check (redundant with maxPayload, but defense in depth)
    if (raw.length > MAX_MESSAGE_SIZE) {
      this.sendError(session.ws, 'MESSAGE_TOO_LARGE', `Message exceeds ${MAX_MESSAGE_SIZE} byte limit`);
      return;
    }

    // Rate limiting
    if (!this.checkRateLimit(session)) {
      this.sendError(session.ws, 'RATE_LIMITED', 'Exceeded 1000 messages/min');
      return;
    }

    let event: WebSocketEvent;
    try {
      event = JSON.parse(raw.toString());
    } catch {
      this.sendError(session.ws, 'INVALID_JSON', 'Failed to parse message');
      return;
    }

    // Handle ping/pong at protocol level
    if (event.type === 'ping') {
      this.sendEvent(session.ws, {
        type: 'pong' as WebSocketEvent['type'],
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: { agentId: 'daemon' } as WebSocketEventMetadata,
      });
      return;
    }

    // Acknowledge receipt
    this.sendEvent(session.ws, {
      type: 'ack' as WebSocketEvent['type'],
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      payload: { messageId: event.id, status: 'received' },
      metadata: { agentId: 'daemon' } as WebSocketEventMetadata,
    });
  }

  /**
   * Check and update rate limit for a session
   */
  private checkRateLimit(session: ClientSession): boolean {
    const now = Date.now();
    const rl = session.rateLimit;

    if (now - rl.windowStart > RATE_LIMIT_WINDOW_MS) {
      rl.count = 0;
      rl.windowStart = now;
    }

    rl.count++;
    return rl.count <= RATE_LIMIT_MAX;
  }

  /**
   * Send an error event to a client
   */
  private sendError(ws: WebSocket, code: string, message: string): void {
    this.sendEvent(ws, {
      type: 'error' as WebSocketEvent['type'],
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      payload: { code, message, retryable: false },
      metadata: { agentId: 'daemon' } as WebSocketEventMetadata,
    });
  }

  /**
   * Send a WebSocket event to a client
   */
  private sendEvent(ws: WebSocket, event: WebSocketEvent): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  /**
   * Periodic ping to detect dead connections
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      for (const [sessionId, session] of this.sessions) {
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.ping();
        } else {
          this.sessions.delete(sessionId);
        }
      }
    }, PING_INTERVAL_MS);
  }
}
