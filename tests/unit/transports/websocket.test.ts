/**
 * Tests for WebSocket Transport
 */

import { WebSocketTransport } from '../../../src/transports/websocket';

// Mock CloseEvent for testing
class CloseEvent extends Event {
  code: number;
  reason: string;
  wasClean: boolean;

  constructor(
    type: string,
    init?: { code?: number; reason?: string; wasClean?: boolean }
  ) {
    super(type);
    this.code = init?.code || 1000;
    this.reason = init?.reason || '';
    this.wasClean = init?.wasClean !== undefined ? init.wasClean : true;
  }
}

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  private messageQueue: string[] = [];

  constructor(public url: string) {
    // Simulate async connection
    if (url.includes('invalid')) {
      // Fire error immediately for invalid URLs
      setTimeout(() => {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onerror) {
          // Use ErrorEvent for better Jest compatibility
          // Create an Event-like object that Jest can handle
          const errorEvent = Object.assign(new Event('error'), {
            message: 'Connection failed',
          });
          this.onerror(errorEvent);
        }
      }, 5);
    } else {
      setTimeout(() => {
        this.readyState = MockWebSocket.OPEN;
        if (this.onopen) {
          this.onopen(new Event('open'));
        }
      }, 10);
    }
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.messageQueue.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  getLastMessage(): unknown {
    const last = this.messageQueue[this.messageQueue.length - 1];
    return last ? JSON.parse(last) : null;
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('WebSocketTransport', () => {
  let transport: WebSocketTransport;

  beforeEach(() => {
    transport = new WebSocketTransport({
      url: 'wss://test.example.com/ws',
      agentId: 'agent://test/agent-1',
      capabilities: ['test_capability'],
    });
  });

  afterEach(async () => {
    await transport.disconnect();
    // Ensure all timers are cleared
    jest.clearAllTimers();
    // Wait for any pending async operations
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket server', async () => {
      await transport.connect();
      expect(transport.isConnected()).toBe(true);
    });

    it('should send registration on connect', async () => {
      const connectedPromise = new Promise<void>((resolve) => {
        transport.on('connected', resolve);
      });

      await transport.connect();
      await connectedPromise;

      const ws = (transport as any).ws as MockWebSocket;
      const registration = ws.getLastMessage() as any;

      expect(registration.type).toBe('register');
      expect(registration.payload.agentId).toBe('agent://test/agent-1');
      expect(registration.payload.capabilities).toEqual(['test_capability']);
    });

    it('should disconnect cleanly', async () => {
      await transport.connect();
      await transport.disconnect();
      expect(transport.isConnected()).toBe(false);
    });

    it('should emit disconnected event on close', async () => {
      await transport.connect();

      const disconnectPromise = new Promise<void>((resolve) => {
        transport.on('disconnected', resolve);
      });

      const ws = (transport as any).ws as MockWebSocket;
      ws.close();

      await disconnectPromise;
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      await transport.connect();
    });

    it('should send message event', async () => {
      await transport.send('message', { test: 'data' });

      const ws = (transport as any).ws as MockWebSocket;
      const message = ws.getLastMessage() as any;

      expect(message.type).toBe('message');
      expect(message.payload).toEqual({ test: 'data' });
      expect(message.metadata.agentId).toBe('agent://test/agent-1');
    });

    it('should send message with metadata', async () => {
      await transport.send(
        'message',
        { test: 'data' },
        {
          correlationId: 'test-correlation',
          priority: 'high',
          ttl: 60,
        }
      );

      const ws = (transport as any).ws as MockWebSocket;
      const message = ws.getLastMessage() as any;

      expect(message.metadata.correlationId).toBe('test-correlation');
      expect(message.metadata.priority).toBe('high');
      expect(message.metadata.ttl).toBe(60);
    });

    it('should queue messages when disconnected', async () => {
      await transport.disconnect();

      // Send message while disconnected
      await transport.send('message', { queued: true });

      // Messages should be queued
      const queue = (transport as any).messageQueue;
      expect(queue.length).toBeGreaterThan(0);
    });
  });

  describe('Message Receiving', () => {
    beforeEach(async () => {
      await transport.connect();
    });

    it('should receive and emit message events', (done) => {
      transport.on('message', (event) => {
        expect(event.type).toBe('message');
        expect(event.payload).toEqual({ received: 'data' });
        done();
      });

      const ws = (transport as any).ws as MockWebSocket;
      ws.simulateMessage(
        JSON.stringify({
          type: 'message',
          id: 'msg-123',
          timestamp: new Date().toISOString(),
          payload: { received: 'data' },
          metadata: { agentId: 'agent://test/agent-2' },
        })
      );
    });

    it('should handle ping/pong', async () => {
      const ws = (transport as any).ws as MockWebSocket;

      ws.simulateMessage(
        JSON.stringify({
          type: 'ping',
          id: 'ping-123',
          timestamp: new Date().toISOString(),
          payload: {},
          metadata: { agentId: 'server' },
        })
      );

      // Should respond with pong
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pong = ws.getLastMessage() as any;
      expect(pong.type).toBe('pong');
    });
  });

  describe('Capability Invocation', () => {
    beforeEach(async () => {
      await transport.connect();
    });

    it('should invoke capability and receive response', async () => {
      const ws = (transport as any).ws as MockWebSocket;

      // Start capability invocation
      const responsePromise = transport.invokeCapability('test_capability', {
        input: 'data',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Get the capability call message
      const call = ws.getLastMessage() as any;
      expect(call.type).toBe('capability_call');
      expect(call.payload.capability).toBe('test_capability');

      // Simulate response
      ws.simulateMessage(
        JSON.stringify({
          type: 'message',
          id: 'resp-123',
          timestamp: new Date().toISOString(),
          payload: { result: 'success' },
          metadata: {
            agentId: 'agent://test/agent-2',
            correlationId: call.metadata.correlationId,
          },
        })
      );

      const result = await responsePromise;
      expect(result).toEqual({ result: 'success' });
    });

    it('should timeout on capability call', async () => {
      await expect(
        transport.invokeCapability(
          'test_capability',
          { input: 'data' },
          {
            timeout: 100,
          }
        )
      ).rejects.toThrow('Capability call timeout');
    });
  });

  describe('Status Updates', () => {
    beforeEach(async () => {
      await transport.connect();
    });

    it('should send status update', async () => {
      await transport.sendStatus({
        status: 'healthy',
        load: 0.5,
        activeConnections: 10,
      });

      const ws = (transport as any).ws as MockWebSocket;
      const status = ws.getLastMessage() as any;

      expect(status.type).toBe('status_update');
      expect(status.payload.status).toBe('healthy');
      expect(status.payload.load).toBe(0.5);
    });
  });

  describe('Acknowledgments', () => {
    beforeEach(async () => {
      await transport.connect();
    });

    it('should wait for acknowledgment when requested', async () => {
      const ws = (transport as any).ws as MockWebSocket;

      const sendPromise = transport.send(
        'message',
        { test: 'data' },
        {
          waitForAck: true,
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      const message = ws.getLastMessage() as any;

      // Simulate ACK
      ws.simulateMessage(
        JSON.stringify({
          type: 'ack',
          id: 'ack-123',
          timestamp: new Date().toISOString(),
          payload: {
            messageId: message.id,
            status: 'received',
          },
          metadata: { agentId: 'server' },
        })
      );

      await expect(sendPromise).resolves.toBeUndefined();
    });

    it('should timeout waiting for acknowledgment', async () => {
      await expect(
        transport.send(
          'message',
          { test: 'data' },
          {
            waitForAck: true,
          }
        )
      ).rejects.toThrow('ACK timeout');
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      const errorTransport = new WebSocketTransport({
        url: 'wss://invalid.example.com/ws',
        agentId: 'agent://test/agent-1',
        capabilities: [],
      });

      let errorFired = false;
      errorTransport.on('error', () => {
        errorFired = true;
      });

      // Start connection - error should fire at 5ms, rejecting promise
      // Catch the promise rejection to prevent unhandled rejection
      const connectPromise = errorTransport.connect().catch(() => {
        // Expected rejection - handled
      });

      // Wait for error event to fire (mock fires at 5ms)
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Error should have been emitted
      expect(errorFired).toBe(true);

      // Wait for promise to settle
      await connectPromise;

      // Test passes if error event was emitted (connection error handling works)
    });

    it('should emit error events', (done) => {
      transport.on('error', (error) => {
        expect(error).toBeDefined();
        done();
      });

      transport.connect().then(() => {
        const ws = (transport as any).ws as MockWebSocket;
        ws.simulateMessage(
          JSON.stringify({
            type: 'error',
            id: 'err-123',
            timestamp: new Date().toISOString(),
            payload: {
              code: 'TEST_ERROR',
              message: 'Test error',
            },
            metadata: { agentId: 'server' },
          })
        );
      });
    });
  });
});
