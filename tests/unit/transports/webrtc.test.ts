/**
 * Tests for WebRTC Transport
 */

import { WebRTCTransport, InMemorySignalingServer } from '../../../src/transports/webrtc';
import { EventEmitter } from 'events';

// Mock RTCPeerConnection for testing
class MockRTCPeerConnection {
  connectionState: RTCPeerConnectionState = 'new';
  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  ondatachannel: ((event: RTCDataChannelEvent) => void) | null = null;

  private localDescription: RTCSessionDescriptionInit | null = null;
  private remoteDescription: RTCSessionDescriptionInit | null = null;
  private dataChannels: MockRTCDataChannel[] = [];

  constructor(public config: RTCConfiguration) {}

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    return {
      type: 'offer',
      sdp: 'mock-sdp-offer',
    };
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    return {
      type: 'answer',
      sdp: 'mock-sdp-answer',
    };
  }

  async setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
    this.localDescription = description;

    // Simulate ICE candidate gathering
    setTimeout(() => {
      if (this.onicecandidate) {
        this.onicecandidate({
          candidate: {
            candidate: 'mock-ice-candidate',
            sdpMid: '0',
            sdpMLineIndex: 0,
            toJSON: () => ({ candidate: 'mock-ice-candidate' }),
          } as RTCIceCandidate,
        } as RTCPeerConnectionIceEvent);
      }

      // Simulate connection
      setTimeout(() => {
        this.connectionState = 'connected';
        if (this.onconnectionstatechange) {
          this.onconnectionstatechange();
        }
      }, 10);
    }, 10);
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    this.remoteDescription = description;
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    // Mock implementation
  }

  createDataChannel(label: string, options?: RTCDataChannelInit): MockRTCDataChannel {
    const channel = new MockRTCDataChannel(label, options);
    this.dataChannels.push(channel);

    // Simulate channel opening after connection
    if (this.connectionState === 'connected') {
      setTimeout(() => channel.simulateOpen(), 10);
    }

    return channel;
  }

  close(): void {
    this.connectionState = 'closed';
    this.dataChannels.forEach((ch) => ch.close());
    if (this.onconnectionstatechange) {
      this.onconnectionstatechange();
    }
  }

  simulateDataChannel(label: string): MockRTCDataChannel {
    const channel = new MockRTCDataChannel(label);
    this.dataChannels.push(channel);

    if (this.ondatachannel) {
      this.ondatachannel({
        channel: channel as any,
      } as RTCDataChannelEvent);
    }

    setTimeout(() => channel.simulateOpen(), 10);
    return channel;
  }
}

class MockRTCDataChannel {
  readyState: RTCDataChannelState = 'connecting';
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  private sentMessages: string[] = [];

  constructor(public label: string, public options?: RTCDataChannelInit) {}

  send(data: string | ArrayBuffer): void {
    if (this.readyState !== 'open') {
      throw new Error('Data channel is not open');
    }

    this.sentMessages.push(typeof data === 'string' ? data : 'binary');
  }

  close(): void {
    this.readyState = 'closed';
    if (this.onclose) {
      this.onclose();
    }
  }

  simulateOpen(): void {
    this.readyState = 'open';
    if (this.onopen) {
      this.onopen();
    }
  }

  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  getLastMessage(): unknown {
    const last = this.sentMessages[this.sentMessages.length - 1];
    return last ? JSON.parse(last) : null;
  }
}

// Replace global RTCPeerConnection with mock
(global as any).RTCPeerConnection = MockRTCPeerConnection;

describe('WebRTCTransport', () => {
  let signalingServer: InMemorySignalingServer;
  let transport1: WebRTCTransport;
  let transport2: WebRTCTransport;
  let signaling1: EventEmitter;
  let signaling2: EventEmitter;

  beforeEach(() => {
    signalingServer = new InMemorySignalingServer();
    signaling1 = signalingServer.registerAgent('agent://test/agent-1');
    signaling2 = signalingServer.registerAgent('agent://test/agent-2');

    transport1 = new WebRTCTransport({
      agentId: 'agent://test/agent-1',
      remoteAgentId: 'agent://test/agent-2',
      signaling: signaling1,
    });

    transport2 = new WebRTCTransport({
      agentId: 'agent://test/agent-2',
      remoteAgentId: 'agent://test/agent-1',
      signaling: signaling2,
    });
  });

  afterEach(async () => {
    await transport1.close();
    await transport2.close();
    signalingServer.clear();
  });

  describe('Connection Establishment', () => {
    it('should create offer', async () => {
      const offerPromise = new Promise<void>((resolve) => {
        signaling2.on('message', (msg) => {
          if (msg.type === 'offer') {
            expect(msg.from).toBe('agent://test/agent-1');
            expect(msg.to).toBe('agent://test/agent-2');
            resolve();
          }
        });
      });

      await transport1.createOffer();
      await offerPromise;
    });

    it('should handle offer and create answer', async () => {
      const answerPromise = new Promise<void>((resolve) => {
        signaling1.on('message', (msg) => {
          if (msg.type === 'answer') {
            expect(msg.from).toBe('agent://test/agent-2');
            resolve();
          }
        });
      });

      await transport2.handleOffer('mock-sdp-offer');
      await answerPromise;
    });

    it('should exchange ICE candidates', async () => {
      const candidatePromise = new Promise<void>((resolve) => {
        signaling2.on('message', (msg) => {
          if (msg.type === 'ice-candidate') {
            expect(msg.candidate).toBeDefined();
            resolve();
          }
        });
      });

      await transport1.createOffer();
      await candidatePromise;
    });

    it('should establish connection', async () => {
      const connectedPromise = new Promise<void>((resolve) => {
        transport1.on('connected', resolve);
      });

      await transport1.createOffer();

      // Simulate connection state change
      const pc = (transport1 as any).peerConnection as MockRTCPeerConnection;
      await new Promise((resolve) => setTimeout(resolve, 30));

      await connectedPromise;
      expect(transport1.isConnected()).toBe(true);
    });
  });

  describe('Data Channel Management', () => {
    beforeEach(async () => {
      await transport1.createOffer();
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    it('should create data channels', () => {
      const channels = (transport1 as any).dataChannels as Map<string, MockRTCDataChannel>;
      expect(channels.size).toBeGreaterThan(0);
      expect(channels.has('control')).toBe(true);
    });

    it('should emit channel open events', (done) => {
      transport1.on('channel:open', (label) => {
        expect(label).toBeDefined();
        done();
      });
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      await transport1.createOffer();
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    it('should send message on data channel', async () => {
      await transport1.send('control', 'message', { test: 'data' });

      const channels = (transport1 as any).dataChannels as Map<string, MockRTCDataChannel>;
      const channel = channels.get('control');
      const message = channel!.getLastMessage() as any;

      expect(message.type).toBe('message');
      expect(message.payload).toEqual({ test: 'data' });
    });

    it('should throw error for non-existent channel', async () => {
      await expect(
        transport1.send('invalid', 'message', {})
      ).rejects.toThrow("Data channel 'invalid' not found");
    });

    it('should throw error when channel not open', async () => {
      const channels = (transport1 as any).dataChannels as Map<string, MockRTCDataChannel>;
      const channel = channels.get('control')!;
      channel.readyState = 'connecting';

      await expect(
        transport1.send('control', 'message', {})
      ).rejects.toThrow('not open');
    });
  });

  describe('Message Receiving', () => {
    beforeEach(async () => {
      await transport1.createOffer();
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    it('should receive and emit messages', (done) => {
      transport1.on('message', (message) => {
        expect(message.type).toBe('message');
        expect(message.payload).toEqual({ received: 'data' });
        done();
      });

      const channels = (transport1 as any).dataChannels as Map<string, MockRTCDataChannel>;
      const channel = channels.get('control')!;

      channel.simulateMessage(JSON.stringify({
        type: 'message',
        id: 'msg-123',
        timestamp: new Date().toISOString(),
        payload: { received: 'data' },
        metadata: { agentId: 'agent://test/agent-2' },
      }));
    });
  });

  describe('Capability Invocation', () => {
    beforeEach(async () => {
      await transport1.createOffer();
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    it('should invoke capability and receive response', async () => {
      const channels = (transport1 as any).dataChannels as Map<string, MockRTCDataChannel>;
      const channel = channels.get('control')!;

      const responsePromise = transport1.invokeCapability('test_capability', { input: 'data' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const call = channel.getLastMessage() as any;
      expect(call.type).toBe('capability_call');

      // Simulate response
      channel.simulateMessage(JSON.stringify({
        type: 'capability_response',
        id: 'resp-123',
        timestamp: new Date().toISOString(),
        payload: { result: 'success' },
        metadata: {
          agentId: 'agent://test/agent-2',
          correlationId: call.metadata.correlationId,
        },
      }));

      const result = await responsePromise;
      expect(result).toEqual({ result: 'success' });
    });

    it('should timeout on capability call', async () => {
      await expect(
        transport1.invokeCapability('test_capability', { input: 'data' }, {
          timeout: 100,
        })
      ).rejects.toThrow('Capability call timeout');
    });
  });

  describe('Chunked Messages', () => {
    beforeEach(async () => {
      await transport1.createOffer();
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    it('should chunk large messages', async () => {
      // Create a large payload
      const largePayload = 'x'.repeat(20000);

      await transport1.send('control', 'message', largePayload);

      const channels = (transport1 as any).dataChannels as Map<string, MockRTCDataChannel>;
      const channel = channels.get('control')!;
      const message = channel.getLastMessage() as any;

      expect(message.metadata.chunked).toBeDefined();
      expect(message.metadata.chunked.totalChunks).toBeGreaterThan(1);
    });

    it('should reassemble chunked messages', (done) => {
      const testPayload = 'large-payload';

      transport1.on('message', (message) => {
        expect(message.payload).toBe(testPayload);
        done();
      });

      // Simulate receiving chunks
      const channels = (transport1 as any).dataChannels as Map<string, MockRTCDataChannel>;
      const channel = channels.get('control')!;
      const messageId = 'chunked-msg-123';

      const fullMessage = {
        type: 'message',
        id: 'msg-123',
        timestamp: new Date().toISOString(),
        payload: testPayload,
        metadata: { agentId: 'agent://test/agent-2' },
      };

      const data = JSON.stringify(fullMessage);
      const chunk1 = data.slice(0, 10);
      const chunk2 = data.slice(10);

      channel.simulateMessage(JSON.stringify({
        type: 'message',
        payload: chunk1,
        metadata: {
          agentId: 'agent://test/agent-2',
          chunked: { chunkIndex: 0, totalChunks: 2, messageId },
        },
      }));

      channel.simulateMessage(JSON.stringify({
        type: 'message',
        payload: chunk2,
        metadata: {
          agentId: 'agent://test/agent-2',
          chunked: { chunkIndex: 1, totalChunks: 2, messageId },
        },
      }));
    });
  });

  describe('Connection State', () => {
    it('should get connection state', () => {
      expect(transport1.getConnectionState()).toBe('closed');
    });

    it('should emit connection state changes', (done) => {
      transport1.on('connectionstatechange', (state) => {
        if (state === 'connected') {
          done();
        }
      });

      transport1.createOffer();
    });
  });

  describe('Cleanup', () => {
    it('should close cleanly', async () => {
      await transport1.createOffer();
      await new Promise((resolve) => setTimeout(resolve, 30));

      await transport1.close();

      expect(transport1.isConnected()).toBe(false);
    });
  });
});

describe('InMemorySignalingServer', () => {
  let server: InMemorySignalingServer;

  beforeEach(() => {
    server = new InMemorySignalingServer();
  });

  afterEach(() => {
    server.clear();
  });

  it('should register agents', () => {
    const signaling = server.registerAgent('agent-1');
    expect(signaling).toBeInstanceOf(EventEmitter);
  });

  it('should route messages between agents', (done) => {
    const signaling1 = server.registerAgent('agent-1');
    const signaling2 = server.registerAgent('agent-2');

    signaling2.on('message', (msg) => {
      expect(msg.type).toBe('test');
      expect(msg.from).toBe('agent-1');
      done();
    });

    signaling1.emit('message', {
      type: 'test',
      from: 'agent-1',
      to: 'agent-2',
    });
  });

  it('should unregister agents', () => {
    const signaling = server.registerAgent('agent-1');
    server.unregisterAgent('agent-1');

    // Agent should no longer receive messages
    let received = false;
    signaling.on('message', () => {
      received = true;
    });

    const signaling2 = server.registerAgent('agent-2');
    signaling2.emit('message', { from: 'agent-2', to: 'agent-1' });

    expect(received).toBe(false);
  });

  it('should clear all agents', () => {
    server.registerAgent('agent-1');
    server.registerAgent('agent-2');
    server.clear();

    // Verify agents are cleared
    const signaling = server.registerAgent('agent-3');
    signaling.emit('message', { from: 'agent-3', to: 'agent-1' });
    // Should not throw
  });
});
