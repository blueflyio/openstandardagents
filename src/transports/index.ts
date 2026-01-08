/**
 * OSSA Web-Native Transport Protocols
 * Export all transport implementations
 */

// WebSocket Transport
export {
  WebSocketTransport,
  type WebSocketEvent,
  type WebSocketEventType,
  type WebSocketEventMetadata,
  type WebSocketTransportConfig,
  type RegistrationPayload,
  type CapabilityCallPayload,
  type StatusUpdatePayload,
  type ErrorPayload,
  type AckPayload,
} from './websocket';

// SSE Transport
export {
  SSETransport,
  SSEStreamClient,
  type SSEEvent,
  type SSEEventType,
  type SSEEventMetadata,
  type SSETransportConfig,
  type SSEStatusPayload,
  type SSECapabilityResponsePayload,
  type SSEErrorPayload,
} from './sse';

// WebRTC Transport
export {
  WebRTCTransport,
  InMemorySignalingServer,
  type WebRTCMessage,
  type WebRTCMessageType,
  type WebRTCMessageMetadata,
  type WebRTCTransportConfig,
  type SignalingMessage,
  type SignalingMessageType,
  type DataChannelConfig,
} from './webrtc';
