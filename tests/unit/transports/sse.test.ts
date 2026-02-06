/**
 * Tests for SSE Transport
 */

import { SSETransport, SSEStreamClient } from '../../../src/transports/sse';
import { API_VERSION } from '../../../src/version.js';

// Mock EventSource for testing
class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  readyState = MockEventSource.CONNECTING;
  url: string;
  withCredentials: boolean;

  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  private eventListeners = new Map<string, ((event: MessageEvent) => void)[]>();

  constructor(url: string, options?: EventSourceInit) {
    this.url = url;
    this.withCredentials = options?.withCredentials || false;

    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  addEventListener(
    type: string,
    listener: (event: MessageEvent) => void
  ): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  removeEventListener(
    type: string,
    listener: (event: MessageEvent) => void
  ): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  close(): void {
    this.readyState = MockEventSource.CLOSED;
  }

  simulateEvent(type: string, data: string, id?: string): void {
    const event = new MessageEvent(type, {
      data,
      lastEventId: id || '',
    });

    if (type === 'message' && this.onmessage) {
      this.onmessage(event);
    }

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }
}

// Replace global EventSource with mock
(global as any).EventSource = MockEventSource;

describe('SSETransport', () => {
  let transport: SSETransport;

  beforeEach(() => {
    transport = new SSETransport({
      url: 'https://test.example.com/events',
    });
  });

  afterEach(async () => {
    await transport.disconnect();
  });

  describe('Connection Management', () => {
    it('should connect to SSE endpoint', async () => {
      await transport.connect();
      expect(transport.isConnected()).toBe(true);
    });

    it('should build URL with channels', async () => {
      const channelTransport = new SSETransport({
        url: 'https://test.example.com/events',
        channels: ['content.published', 'user.login'],
      });

      await channelTransport.connect();

      const eventSource = (channelTransport as any)
        .eventSource as MockEventSource;
      expect(eventSource.url).toContain(
        'channels=content.published%2Cuser.login'
      );

      await channelTransport.disconnect();
    });

    it('should disconnect cleanly', async () => {
      await transport.connect();
      await transport.disconnect();
      expect(transport.isConnected()).toBe(false);
    });

    it('should emit connected event', async () => {
      const connectedPromise = new Promise<void>((resolve) => {
        transport.on('connected', resolve);
      });

      await transport.connect();
      await connectedPromise;
    });

    it('should get connection state', async () => {
      expect(transport.getState()).toBe('CLOSED');

      await transport.connect();
      expect(transport.getState()).toBe('OPEN');

      await transport.disconnect();
      expect(transport.getState()).toBe('CLOSED');
    });
  });

  describe('Message Receiving', () => {
    beforeEach(async () => {
      await transport.connect();
    });

    it('should receive message events', (done) => {
      let called = false;
      transport.on('message', (event) => {
        if (called) return;
        called = true;
        expect(event.type).toBe('message');
        expect(event.payload).toEqual({ channel: 'test', data: 'value' });
        done();
      });

      const eventSource = (transport as any).eventSource as MockEventSource;
      eventSource.simulateEvent(
        'message',
        JSON.stringify({
          type: 'message',
          id: 'msg-123',
          timestamp: new Date().toISOString(),
          payload: { channel: 'test', data: 'value' },
          metadata: { agentId: 'agent://test/agent-1' },
        }),
        'msg-123'
      );
    });

    it('should receive status events', (done) => {
      transport.on('status', (event) => {
        expect(event.type).toBe('status');
        expect(event.payload.status).toBe('healthy');
        done();
      });

      const eventSource = (transport as any).eventSource as MockEventSource;
      eventSource.simulateEvent(
        'status',
        JSON.stringify({
          type: 'status',
          id: 'status-123',
          timestamp: new Date().toISOString(),
          payload: { status: 'healthy', load: 0.5 },
          metadata: { agentId: 'agent://test/agent-1' },
        }),
        'status-123'
      );
    });

    it('should receive capability response events', (done) => {
      transport.on('capability_response', (event) => {
        expect(event.type).toBe('capability_response');
        expect(event.payload.capability).toBe('test_capability');
        done();
      });

      const eventSource = (transport as any).eventSource as MockEventSource;
      eventSource.simulateEvent(
        'capability_response',
        JSON.stringify({
          type: 'capability_response',
          id: 'resp-123',
          timestamp: new Date().toISOString(),
          payload: {
            capability: 'test_capability',
            result: { success: true },
          },
          metadata: {
            agentId: 'agent://test/agent-1',
            final: false,
          },
        }),
        'resp-123'
      );
    });

    it('should emit capability_complete when final is true', (done) => {
      transport.on('capability_complete', (event) => {
        expect(event.metadata.final).toBe(true);
        done();
      });

      const eventSource = (transport as any).eventSource as MockEventSource;
      eventSource.simulateEvent(
        'capability_response',
        JSON.stringify({
          type: 'capability_response',
          id: 'resp-final',
          timestamp: new Date().toISOString(),
          payload: {
            capability: 'test_capability',
            result: { success: true },
          },
          metadata: {
            agentId: 'agent://test/agent-1',
            final: true,
          },
        }),
        'resp-final'
      );
    });

    it('should track last event ID', async () => {
      const eventSource = (transport as any).eventSource as MockEventSource;
      eventSource.simulateEvent(
        'message',
        JSON.stringify({
          type: 'message',
          id: 'msg-123',
          timestamp: new Date().toISOString(),
          payload: {},
          metadata: { agentId: 'agent://test/agent-1' },
        }),
        'msg-123'
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(transport.getLastEventId()).toBe('msg-123');
    });
  });

  describe('Error Handling', () => {
    it('should emit error on connection failure', (done) => {
      transport.on('error', () => {
        done();
      });

      transport.connect().then(() => {
        const eventSource = (transport as any).eventSource as MockEventSource;
        if (eventSource.onerror) {
          eventSource.onerror(new Event('error'));
        }
      });
    });

    it('should handle parse errors gracefully', async () => {
      await transport.connect();

      const errorPromise = new Promise<void>((resolve) => {
        transport.on('error', (error) => {
          expect(error.message).toContain('Failed to parse');
          resolve();
        });
      });

      const eventSource = (transport as any).eventSource as MockEventSource;
      eventSource.simulateEvent('message', 'invalid json');

      await errorPromise;
    });
  });

  describe('Reconnection', () => {
    it('should emit reconnecting event', (done) => {
      jest.setTimeout(15000); // Increase timeout for reconnection
      const reconnectTransport = new SSETransport({
        url: 'https://test.example.com/events',
        reconnect: { enabled: true, maxAttempts: 3 },
      });

      let called = false;
      reconnectTransport.on('error', () => {}); // Prevent unhandled error
      reconnectTransport.on('reconnecting', (attempt) => {
        if (called) return;
        called = true;
        expect(attempt).toBe(1);
        reconnectTransport.disconnect();
        done();
      });

      reconnectTransport.connect().then(() => {
        const eventSource = (reconnectTransport as any)
          .eventSource as MockEventSource;
        eventSource.readyState = MockEventSource.CLOSED;
        if (eventSource.onerror) {
          eventSource.onerror(new Event('error'));
        }
      });
    });
  });
});

describe('SSEStreamClient', () => {
  let client: SSEStreamClient;

  beforeEach(() => {
    client = new SSEStreamClient('https://test.example.com', {
      token: 'test-token',
      type: 'bearer',
    });

    // Mock fetch
    (global as any).fetch = jest.fn();
  });

  describe('Streaming Capability Invocation', () => {
    it('should invoke capability and stream results', async () => {
      // Mock POST response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          streamId: 'stream-123',
          streamUrl: 'https://test.example.com/events/stream/stream-123',
        }),
      });

      let progressCount = 0;

      const resultPromise = client.invokeStreamingCapability(
        'analyze_content',
        { contentId: 'node-123' },
        {
          onProgress: () => {
            progressCount++;
          },
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 20));

      // Simulate progress events
      const transport = (client as any).transport as SSETransport;
      if (transport) {
        const eventSource = (transport as any).eventSource as MockEventSource;

        eventSource.simulateEvent(
          'capability_response',
          JSON.stringify({
            type: 'capability_response',
            id: 'resp-1',
            timestamp: new Date().toISOString(),
            payload: {
              capability: 'analyze_content',
              progress: { percent: 50 },
            },
            metadata: { agentId: 'agent://test/agent-1', final: false },
          })
        );

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Final result
        eventSource.simulateEvent(
          'capability_response',
          JSON.stringify({
            type: 'capability_response',
            id: 'resp-2',
            timestamp: new Date().toISOString(),
            payload: {
              capability: 'analyze_content',
              result: { sentiment: 'positive' },
            },
            metadata: { agentId: 'agent://test/agent-1', final: true },
          })
        );
      }

      const result = await resultPromise;
      expect(result).toEqual({ sentiment: 'positive' });
      expect(progressCount).toBeGreaterThan(0);
    });
  });

  describe('Event Subscription', () => {
    it('should subscribe to channels', async () => {
      const handler = jest.fn();
      const transport = await client.subscribe(['content.published'], handler);

      expect(transport).toBeDefined();
      expect(transport.isConnected()).toBe(true);

      await transport.disconnect();
    });

    it('should subscribe to status updates', async () => {
      const handler = jest.fn();
      const transport = await client.subscribeToStatus(handler);

      expect(transport).toBeDefined();
      expect(transport.isConnected()).toBe(true);

      await transport.disconnect();
    });
  });
});
