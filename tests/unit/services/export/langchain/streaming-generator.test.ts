/**
 * Tests for LangChain Streaming Generator
 */

import {
  StreamingGenerator,
  type StreamingConfig,
} from '../../../../../src/services/export/langchain/streaming-generator.js';
import type { OssaAgent } from '../../../../../src/types/index.js';
import { API_VERSION } from '../../../src/version.js';

describe('StreamingGenerator', () => {
  let generator: StreamingGenerator;
  let mockManifest: OssaAgent;

  beforeEach(() => {
    generator = new StreamingGenerator();

    mockManifest = {
      ossaVersion: '0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'test-streaming-agent',
        version: '1.0.0',
        description: 'Test streaming agent',
      },
      spec: {
        role: 'Test agent with streaming',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
        },
        tools: [],
      },
    };
  });

  describe('generate', () => {
    it('should generate streaming.py with default config (SSE + WebSocket enabled)', () => {
      const result = generator.generate(mockManifest);

      expect(result).toContain('LangChain Streaming Support');
      expect(result).toContain('Server-Sent Events (SSE)');
      expect(result).toContain('WebSocket bidirectional streaming');
      expect(result).toContain('StreamingCallbackHandler');
      expect(result).toContain('def stream_sse(');
      expect(result).toContain('class ConnectionManager');
      expect(result).toContain('def get_streaming_config()');
    });

    it('should include SSE implementation when enabled', () => {
      const config: StreamingConfig = {
        sse: { enabled: true },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).toContain('async def stream_sse(');
      expect(result).toContain('def create_sse_endpoint(');
      expect(result).toContain('StreamingResponse');
      expect(result).toContain('media_type="text/event-stream"');
      expect(result).toContain('data: {json.dumps(event)}');
    });

    it('should exclude SSE implementation when disabled', () => {
      const config: StreamingConfig = {
        sse: { enabled: false },
        websocket: { enabled: false },
        a2a: { enabled: false },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).not.toContain('async def stream_sse(');
      expect(result).not.toContain('def create_sse_endpoint(');
      expect(result).not.toContain('StreamingResponse');
    });

    it('should include WebSocket implementation when enabled', () => {
      const config: StreamingConfig = {
        websocket: { enabled: true },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).toContain('class ConnectionManager');
      expect(result).toContain('async def stream_websocket(');
      expect(result).toContain('def create_websocket_endpoint(');
      expect(result).toContain('WebSocket');
      expect(result).toContain('await websocket.send_json(');
    });

    it('should exclude WebSocket implementation when disabled', () => {
      const config: StreamingConfig = {
        sse: { enabled: false },
        websocket: { enabled: false },
        a2a: { enabled: false },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).not.toContain('class ConnectionManager');
      expect(result).not.toContain('async def stream_websocket(');
      expect(result).not.toContain('await websocket.send_json(');
    });

    it('should include a2a implementation when enabled', () => {
      const config: StreamingConfig = {
        a2a: {
          enabled: true,
          mesh_url: 'http://mesh.example.com',
        },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).toContain('class A2AStreamingClient');
      expect(result).toContain('async def stream_a2a(');
      expect(result).toContain('http://mesh.example.com');
      expect(result).toContain(
        'await self.client.post(endpoint, json=payload)'
      );
    });

    it('should exclude a2a implementation when disabled', () => {
      const config: StreamingConfig = {
        sse: { enabled: false },
        websocket: { enabled: false },
        a2a: { enabled: false },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).not.toContain('class A2AStreamingClient');
      expect(result).not.toContain('async def stream_a2a(');
    });

    it('should use default mesh URL when not specified', () => {
      const config: StreamingConfig = {
        a2a: { enabled: true },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).toContain('http://localhost:8080');
    });

    it('should include get_streaming_config function', () => {
      const result = generator.generate(mockManifest);

      expect(result).toContain('def get_streaming_config() -> Dict[str, Any]:');
      expect(result).toContain('return {');
      expect(result).toContain('"sse_enabled":');
      expect(result).toContain('"websocket_enabled":');
      expect(result).toContain('"a2a_enabled":');
    });

    it('should reflect correct config in get_streaming_config', () => {
      const config: StreamingConfig = {
        sse: { enabled: false },
        websocket: { enabled: true },
        a2a: { enabled: true },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).toContain('"sse_enabled": False');
      expect(result).toContain('"websocket_enabled": True');
      expect(result).toContain('"a2a_enabled": True');
    });
  });

  describe('StreamingCallbackHandler', () => {
    it('should always include StreamingCallbackHandler class', () => {
      const result = generator.generate(mockManifest);

      expect(result).toContain(
        'class StreamingCallbackHandler(BaseCallbackHandler)'
      );
      expect(result).toContain(
        'def __init__(self, queue: asyncio.Queue, cost_tracker: Optional[Any] = None)'
      );
      expect(result).toContain('self.queue = queue');
      expect(result).toContain('self.tokens = []');
      expect(result).toContain('self.cost_tracker = cost_tracker');
    });

    it('should include on_llm_start callback', () => {
      const result = generator.generate(mockManifest);

      expect(result).toContain('def on_llm_start(');
      expect(result).toContain('serialized: Dict[str, Any]');
      expect(result).toContain('prompts: list[str]');
      expect(result).toContain('logger.info("LLM generation started")');
      expect(result).toContain('"type": "llm_start"');
    });

    it('should include on_llm_new_token callback', () => {
      const result = generator.generate(mockManifest);

      expect(result).toContain('def on_llm_new_token(self, token: str');
      expect(result).toContain('self.tokens.append(token)');
      expect(result).toContain('logger.debug(f"New token: {token}")');
      expect(result).toContain('"type": "token"');
      expect(result).toContain('"token": token');
    });

    it('should include on_llm_end callback', () => {
      const result = generator.generate(mockManifest);

      expect(result).toContain('def on_llm_end(self, response: LLMResult');
      expect(result).toContain('logger.info("LLM generation completed")');
      expect(result).toContain('"type": "llm_end"');
      expect(result).toContain('"full_response": "".join(self.tokens)');
      expect(result).toContain('"tokens": len(self.tokens)');
    });

    it('should include on_llm_error callback', () => {
      const result = generator.generate(mockManifest);

      expect(result).toContain('def on_llm_error(self, error: Exception');
      expect(result).toContain('logger.error(f"LLM error: {str(error)}"');
      expect(result).toContain('"type": "error"');
      expect(result).toContain('"error": str(error)');
      expect(result).toContain('"error_type": type(error).__name__');
    });

    it('should include on_tool_start callback', () => {
      const result = generator.generate(mockManifest);

      expect(result).toContain('def on_tool_start(');
      expect(result).toContain('serialized: Dict[str, Any]');
      expect(result).toContain('input_str: str');
      expect(result).toContain('tool_name = serialized.get("name", "unknown")');
      expect(result).toContain('logger.info(f"Tool \'{tool_name}\' started")');
      expect(result).toContain('"type": "tool_start"');
    });

    it('should include on_tool_end callback', () => {
      const result = generator.generate(mockManifest);

      expect(result).toContain('def on_tool_end(self, output: str');
      expect(result).toContain('logger.info("Tool execution completed")');
      expect(result).toContain('"type": "tool_end"');
      expect(result).toContain('"output": output');
    });

    it('should include on_tool_error callback', () => {
      const result = generator.generate(mockManifest);

      expect(result).toContain('def on_tool_error(self, error: Exception');
      expect(result).toContain('logger.error(f"Tool error: {str(error)}"');
      expect(result).toContain('"type": "tool_error"');
      expect(result).toContain('"error": str(error)');
    });
  });

  describe('Imports', () => {
    it('should include base imports', () => {
      const result = generator.generate(mockManifest);

      expect(result).toContain(
        'from typing import Any, Dict, AsyncIterator, Optional'
      );
      expect(result).toContain(
        'from langchain.callbacks.base import BaseCallbackHandler'
      );
      expect(result).toContain('from langchain.schema import LLMResult');
      expect(result).toContain('import asyncio');
      expect(result).toContain('import json');
      expect(result).toContain('import logging');
      expect(result).toContain('logger = logging.getLogger(__name__)');
    });

    it('should include SSE imports when enabled', () => {
      const config: StreamingConfig = {
        sse: { enabled: true },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).toContain(
        'from fastapi.responses import StreamingResponse'
      );
      expect(result).toContain(
        'from starlette.responses import EventSourceResponse'
      );
    });

    it('should exclude SSE imports when disabled', () => {
      const config: StreamingConfig = {
        sse: { enabled: false },
        websocket: { enabled: false },
        a2a: { enabled: false },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).not.toContain(
        'from fastapi.responses import StreamingResponse'
      );
      expect(result).not.toContain(
        'from starlette.responses import EventSourceResponse'
      );
    });

    it('should include WebSocket imports when enabled', () => {
      const config: StreamingConfig = {
        websocket: { enabled: true },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).toContain(
        'from fastapi import WebSocket, WebSocketDisconnect'
      );
      expect(result).toContain(
        'from websockets.exceptions import ConnectionClosed'
      );
    });

    it('should exclude WebSocket imports when disabled', () => {
      const config: StreamingConfig = {
        sse: { enabled: false },
        websocket: { enabled: false },
        a2a: { enabled: false },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).not.toContain(
        'from fastapi import WebSocket, WebSocketDisconnect'
      );
      expect(result).not.toContain(
        'from websockets.exceptions import ConnectionClosed'
      );
    });

    it('should include a2a imports when enabled', () => {
      const config: StreamingConfig = {
        a2a: { enabled: true },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).toContain('import httpx');
      expect(result).toContain('from datetime import datetime');
    });

    it('should exclude a2a imports when disabled', () => {
      const config: StreamingConfig = {
        sse: { enabled: false },
        websocket: { enabled: false },
        a2a: { enabled: false },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).not.toContain('import httpx');
      expect(result).not.toContain('from datetime import datetime');
    });
  });

  describe('Error Handling', () => {
    it('should include error handling in SSE stream', () => {
      const config: StreamingConfig = {
        sse: { enabled: true },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).toContain('try:');
      expect(result).toContain('except Exception as e:');
      expect(result).toContain('logger.error(f"SSE streaming error: {str(e)}"');
      expect(result).toContain("yield f\"data: {json.dumps({'type': 'error'");
    });

    it('should include error handling in WebSocket stream', () => {
      const config: StreamingConfig = {
        websocket: { enabled: true },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).toContain('except WebSocketDisconnect:');
      expect(result).toContain('logger.info(f"WebSocket client disconnected:');
      expect(result).toContain('manager.disconnect(session_id)');
      expect(result).toContain('except Exception as e:');
      expect(result).toContain('logger.error(f"WebSocket error: {str(e)}"');
    });

    it('should include error handling in a2a stream', () => {
      const config: StreamingConfig = {
        a2a: { enabled: true },
      };

      const result = generator.generate(mockManifest, config);

      expect(result).toContain('try:');
      expect(result).toContain('except Exception as e:');
      expect(result).toContain('logger.error(f"a2a streaming error: {str(e)}"');
      expect(result).toContain('return {');
      expect(result).toContain('"success": False');
      expect(result).toContain('"error": str(e)');
    });
  });

  describe('Module Documentation', () => {
    it('should include comprehensive module docstring', () => {
      const result = generator.generate(mockManifest);

      expect(result).toContain('"""');
      expect(result).toContain(
        'LangChain Streaming Support (Production Quality)'
      );
      expect(result).toContain('Features:');
      expect(result).toContain(
        '- Server-Sent Events (SSE) for real-time responses'
      );
      expect(result).toContain('- WebSocket bidirectional streaming');
      expect(result).toContain(
        '- LangChain callbacks for token-by-token streaming'
      );
      expect(result).toContain('- Agent-to-agent (a2a) streaming integration');
      expect(result).toContain('- Comprehensive error handling');
      expect(result).toContain('- Reconnection logic');
    });
  });
});
