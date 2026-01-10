# WebRTC Transport Protocol for Peer-to-Peer Agents

## Overview

WebRTC (Web Real-Time Communication) enables direct peer-to-peer communication between OSSA agents, bypassing centralized servers after initial connection setup. This specification defines how agents use WebRTC for low-latency, high-throughput agent-to-agent communication.

## Architecture

```
Agent A ──────WebRTC P2P Data Channel────── Agent B
   │                                             │
   └─────────Signaling Server─────────────────┘
         (Only for connection setup)
```

WebRTC provides:

- **Peer-to-peer data channels** - Direct agent-to-agent communication
- **NAT traversal** - Works across firewalls and NAT
- **Built-in encryption** - DTLS encryption by default
- **Multiple channels** - Multiplexed streams over single connection
- **Ordered/Unordered delivery** - Configure per channel

## Connection Establishment

### 1. Signaling Phase

Agents exchange connection metadata via signaling server (WebSocket, HTTP, etc.):

```typescript
// Agent A creates offer
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:turn.example.com:3478',
      username: 'agent-a',
      credential: 'secret'
    }
  ]
});

const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

// Send offer to Agent B via signaling server
signaling.send({
  type: 'offer',
  from: 'agent://example.com/agent-a',
  to: 'agent://example.com/agent-b',
  sdp: offer.sdp
});

// Agent B receives offer and creates answer
peerConnection.setRemoteDescription(offer);
const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);

// Send answer back to Agent A
signaling.send({
  type: 'answer',
  from: 'agent://example.com/agent-b',
  to: 'agent://example.com/agent-a',
  sdp: answer.sdp
});
```

### 2. ICE Candidate Exchange

Agents exchange network connectivity information:

```typescript
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    signaling.send({
      type: 'ice-candidate',
      from: agentId,
      to: remoteAgentId,
      candidate: event.candidate
    });
  }
};

// Receive ICE candidates from remote agent
signaling.on('ice-candidate', async (data) => {
  await peerConnection.addIceCandidate(data.candidate);
});
```

### 3. Data Channel Creation

```typescript
// Agent A creates data channel
const dataChannel = peerConnection.createDataChannel('ossa-channel', {
  ordered: true,           // Ordered delivery
  maxRetransmits: 3        // Retry failed messages
});

dataChannel.onopen = () => {
  console.log('Data channel open');
  // Channel ready for messaging
};

// Agent B receives data channel
peerConnection.ondatachannel = (event) => {
  const dataChannel = event.channel;
  setupDataChannelHandlers(dataChannel);
};
```

## Message Format

### OSSA WebRTC Message

```typescript
interface WebRTCMessage {
  type: 'message' | 'capability_call' | 'capability_response' | 'status' | 'error';
  id: string;                    // Unique message ID
  timestamp: string;              // ISO 8601 timestamp
  payload: unknown;               // Message-specific data
  metadata: {
    agentId: string;              // Sender agent URI
    channelId?: string;           // Data channel identifier
    correlationId?: string;       // Request/response matching
    priority?: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number;                 // Time-to-live in seconds
    chunked?: {                   // For large messages
      chunkIndex: number;
      totalChunks: number;
      messageId: string;
    };
  };
}
```

### Sending Messages

```typescript
const sendMessage = (channel: RTCDataChannel, message: WebRTCMessage) => {
  if (channel.readyState !== 'open') {
    throw new Error('Data channel not open');
  }

  const data = JSON.stringify(message);
  const maxSize = 16 * 1024; // 16KB chunks

  if (data.length > maxSize) {
    // Chunk large messages
    sendChunkedMessage(channel, message);
  } else {
    channel.send(data);
  }
};
```

### Receiving Messages

```typescript
dataChannel.onmessage = (event) => {
  try {
    const message: WebRTCMessage = JSON.parse(event.data);

    if (message.metadata.chunked) {
      handleChunkedMessage(message);
    } else {
      processMessage(message);
    }
  } catch (error) {
    console.error('Failed to process message:', error);
  }
};
```

## Channel Types

### 1. Reliable Ordered Channel

For critical messages requiring guaranteed delivery:

```typescript
const reliableChannel = peerConnection.createDataChannel('reliable', {
  ordered: true,
  maxPacketLifeTime: undefined,
  maxRetransmits: undefined  // Infinite retries
});
```

Use for: Capability calls, critical events, state synchronization

### 2. Unreliable Unordered Channel

For high-frequency, low-latency updates:

```typescript
const unreliableChannel = peerConnection.createDataChannel('unreliable', {
  ordered: false,
  maxRetransmits: 0  // No retries
});
```

Use for: Real-time telemetry, status updates, metrics

### 3. Partial Reliability Channel

For time-sensitive data with some retry:

```typescript
const partialChannel = peerConnection.createDataChannel('partial', {
  ordered: true,
  maxRetransmits: 3
});
```

Use for: Events that can tolerate some loss, progress updates

## Multiplexing

Create multiple logical channels over single peer connection:

```typescript
// Control channel - reliable
const controlChannel = pc.createDataChannel('control', {
  ordered: true,
  negotiated: true,
  id: 0
});

// Data channel - unreliable
const dataChannel = pc.createDataChannel('data', {
  ordered: false,
  negotiated: true,
  id: 1
});

// Events channel - partial reliability
const eventsChannel = pc.createDataChannel('events', {
  ordered: true,
  maxRetransmits: 3,
  negotiated: true,
  id: 2
});
```

## Message Chunking

Handle large messages (>16KB):

```typescript
const sendChunkedMessage = (
  channel: RTCDataChannel,
  message: WebRTCMessage
) => {
  const data = JSON.stringify(message);
  const chunkSize = 16 * 1024;
  const totalChunks = Math.ceil(data.length / chunkSize);
  const messageId = uuid();

  for (let i = 0; i < totalChunks; i++) {
    const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
    const chunkMessage: WebRTCMessage = {
      ...message,
      payload: chunk,
      metadata: {
        ...message.metadata,
        chunked: {
          chunkIndex: i,
          totalChunks,
          messageId
        }
      }
    };

    channel.send(JSON.stringify(chunkMessage));
  }
};

const handleChunkedMessage = (chunk: WebRTCMessage) => {
  const { messageId, chunkIndex, totalChunks } = chunk.metadata.chunked!;

  if (!chunks.has(messageId)) {
    chunks.set(messageId, { parts: [], received: 0 });
  }

  const message = chunks.get(messageId)!;
  message.parts[chunkIndex] = chunk.payload;
  message.received++;

  if (message.received === totalChunks) {
    const fullData = message.parts.join('');
    const fullMessage = JSON.parse(fullData);
    processMessage(fullMessage);
    chunks.delete(messageId);
  }
};
```

## Signaling Protocol

### Signaling Server API

```typescript
interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'error';
  from: string;              // Sender agent URI
  to: string;                // Recipient agent URI
  sessionId?: string;        // WebRTC session ID
  sdp?: string;              // SDP offer/answer
  candidate?: RTCIceCandidate;
  error?: {
    code: string;
    message: string;
  };
}

// Signaling via WebSocket
signaling.on('message', async (msg: SignalingMessage) => {
  switch (msg.type) {
    case 'offer':
      await handleOffer(msg.sdp);
      break;
    case 'answer':
      await handleAnswer(msg.sdp);
      break;
    case 'ice-candidate':
      await pc.addIceCandidate(msg.candidate);
      break;
  }
});
```

## NAT Traversal

### STUN Servers

For discovering public IP addresses:

```typescript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}
```

### TURN Servers

For relaying when direct P2P fails:

```typescript
{
  iceServers: [
    {
      urls: 'turn:turn.example.com:3478',
      username: 'agent-credentials',
      credential: 'secret-token'
    }
  ],
  iceCandidatePoolSize: 10
}
```

### ICE Strategy

```typescript
const config: RTCConfiguration = {
  iceServers: [...],
  iceTransportPolicy: 'all',      // Try all candidates
  bundlePolicy: 'max-bundle',     // Bundle media/data
  rtcpMuxPolicy: 'require'        // Multiplex RTCP
};
```

## Connection Management

### Connection State Monitoring

```typescript
peerConnection.onconnectionstatechange = () => {
  switch (peerConnection.connectionState) {
    case 'connected':
      console.log('Peer-to-peer connection established');
      break;
    case 'disconnected':
      console.log('Connection lost, attempting reconnect...');
      reconnect();
      break;
    case 'failed':
      console.error('Connection failed');
      cleanup();
      break;
    case 'closed':
      console.log('Connection closed');
      break;
  }
};
```

### Reconnection Strategy

```typescript
const reconnect = async () => {
  const maxAttempts = 5;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      await establishConnection();
      return;
    } catch (error) {
      attempt++;
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      await sleep(delay);
    }
  }

  console.error('Failed to reconnect after', maxAttempts, 'attempts');
};
```

### Keep-Alive

Send periodic heartbeats to maintain connection:

```typescript
const heartbeatInterval = setInterval(() => {
  if (dataChannel.readyState === 'open') {
    dataChannel.send(JSON.stringify({
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    }));
  }
}, 30000);
```

## Security

### Encryption

- **DTLS** - Data channels encrypted by default (mandatory)
- **SRTP** - Media streams encrypted
- **No plaintext** - All data encrypted in transit

### Authentication

Authenticate agents before establishing P2P connection:

```typescript
// Include signed token in signaling
const offer = {
  type: 'offer',
  from: agentId,
  to: remoteAgentId,
  sdp: localDescription.sdp,
  auth: {
    token: await signJWT({ agentId, timestamp: Date.now() }),
    publicKey: agentPublicKey
  }
};

// Verify token on receiving end
const verifyOffer = async (offer) => {
  const valid = await verifyJWT(offer.auth.token, offer.auth.publicKey);
  if (!valid) {
    throw new Error('Invalid authentication token');
  }
};
```

### Permissions

Restrict P2P connections using allowlists:

```typescript
const allowedPeers = new Set([
  'agent://example.com/agent-1',
  'agent://example.com/agent-2'
]);

signaling.on('offer', (offer) => {
  if (!allowedPeers.has(offer.from)) {
    signaling.send({
      type: 'error',
      to: offer.from,
      error: { code: 'UNAUTHORIZED', message: 'Peer not allowed' }
    });
    return;
  }

  handleOffer(offer);
});
```

## Performance Optimization

### Buffer Management

```typescript
dataChannel.bufferedAmountLowThreshold = 65536; // 64KB

dataChannel.onbufferedamountlow = () => {
  // Resume sending after backpressure
  resumeSending();
};

const sendWithBackpressure = (data: string) => {
  if (dataChannel.bufferedAmount > 1024 * 1024) {
    // Buffer full, pause sending
    return false;
  }

  dataChannel.send(data);
  return true;
};
```

### Binary Data

For maximum performance, use binary instead of JSON:

```typescript
// Send binary
const buffer = new ArrayBuffer(1024);
const view = new Uint8Array(buffer);
// ... populate buffer ...
dataChannel.binaryType = 'arraybuffer';
dataChannel.send(buffer);

// Receive binary
dataChannel.onmessage = (event) => {
  if (event.data instanceof ArrayBuffer) {
    const view = new Uint8Array(event.data);
    processBinaryMessage(view);
  }
};
```

## Use Cases

### 1. Agent Mesh Networking

Direct agent-to-agent communication in distributed system:

```typescript
// Each agent maintains P2P connections to neighbors
const neighbors = ['agent://a', 'agent://b', 'agent://c'];
const connections = new Map<string, RTCPeerConnection>();

neighbors.forEach(async (neighbor) => {
  const pc = await createPeerConnection(neighbor);
  connections.set(neighbor, pc);
});
```

### 2. Large Data Transfer

Transfer large datasets between agents without server:

```typescript
// Agent A sends large file to Agent B
const fileChannel = pc.createDataChannel('file-transfer', {
  ordered: true
});

fileChannel.onopen = () => {
  sendFile(fileChannel, largeDataset);
};
```

### 3. Real-time Collaboration

Low-latency state synchronization:

```typescript
const stateChannel = pc.createDataChannel('state-sync', {
  ordered: false,
  maxRetransmits: 0
});

// Send state updates immediately
stateChannel.send(JSON.stringify({
  type: 'state_update',
  payload: getCurrentState()
}));
```

## Compatibility

- WebRTC API support: Chrome, Firefox, Safari, Edge
- Node.js: Use `node-webrtc` or `werift` libraries
- Transport: UDP (preferred), TCP fallback
- Protocols: DTLS, SRTP, SCTP
- Codecs: Opus, VP8/VP9, H.264 (for future media support)

## References

- [WebRTC Specification](https://www.w3.org/TR/webrtc/)
- [RTCDataChannel API](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel)
- [WebRTC for Node.js](https://github.com/node-webrtc/node-webrtc)
- [OSSA Signaling Protocol](../signaling.md)
