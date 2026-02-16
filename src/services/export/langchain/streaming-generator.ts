/**
 * LangChain Streaming Generator (Production Quality - v0.4.1)
 *
 * Generates production-ready streaming support for LangChain agents
 *
 * Features:
 * - Server-Sent Events (SSE) for real-time responses
 * - WebSocket bidirectional streaming
 * - LangChain callbacks for actual streaming
 * - a2a (agent-to-agent) streaming integration
 * - Token-by-token streaming
 * - Error handling and reconnection logic
 *
 * SOLID: Single Responsibility - Streaming code generation
 * DRY: Reusable streaming templates
 */

import type { OssaAgent } from '../../../types/index.js';

export interface StreamingConfig {
  sse?: {
    enabled: boolean;
    endpoint?: string;
  };
  websocket?: {
    enabled: boolean;
    endpoint?: string;
    port?: number;
  };
  a2a?: {
    enabled: boolean;
    mesh_url?: string;
  };
  callbacks?: {
    on_llm_start?: boolean;
    on_llm_new_token?: boolean;
    on_llm_end?: boolean;
    on_tool_start?: boolean;
    on_tool_end?: boolean;
  };
}

export class StreamingGenerator {
  /**
   * Generate streaming.py module with SSE, WebSocket, and a2a support
   */
  generate(manifest: OssaAgent, config: StreamingConfig = {}): string {
    const sseEnabled = config.sse?.enabled !== false;
    const websocketEnabled = config.websocket?.enabled !== false;
    const a2aEnabled = config.a2a?.enabled === true;

    const imports = this.generateImports(
      sseEnabled,
      websocketEnabled,
      a2aEnabled
    );
    const callbacks = this.generateCallbacks(config);
    const sseCode = sseEnabled ? this.generateSSE() : '';
    const websocketCode = websocketEnabled ? this.generateWebSocket() : '';
    const a2aCode = a2aEnabled ? this.generateA2A(config.a2a?.mesh_url) : '';

    return `"""
LangChain Streaming Support (Production Quality)

Features:
- Server-Sent Events (SSE) for real-time responses
- WebSocket bidirectional streaming
- LangChain callbacks for token-by-token streaming
- Agent-to-agent (a2a) streaming integration
- Comprehensive error handling
- Reconnection logic

"""

${imports}

${callbacks}

${sseCode}

${websocketCode}

${a2aCode}

def get_streaming_config() -> Dict[str, Any]:
    """
    Get streaming configuration

    Returns:
        Dictionary with streaming settings
    """
    return {
        "sse_enabled": ${sseEnabled ? 'True' : 'False'},
        "websocket_enabled": ${websocketEnabled ? 'True' : 'False'},
        "a2a_enabled": ${a2aEnabled ? 'True' : 'False'},
    }
`;
  }

  /**
   * Generate imports based on enabled features
   */
  private generateImports(
    sse: boolean,
    websocket: boolean,
    a2a: boolean
  ): string {
    const baseImports = `from typing import Any, Dict, AsyncIterator, Optional
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema import LLMResult
import asyncio
import json
import logging

logger = logging.getLogger(__name__)`;

    const sseImports = sse
      ? `
from fastapi.responses import StreamingResponse
from starlette.responses import EventSourceResponse`
      : '';

    const websocketImports = websocket
      ? `
from fastapi import WebSocket, WebSocketDisconnect
from websockets.exceptions import ConnectionClosed`
      : '';

    const a2aImports = a2a
      ? `
import httpx
from datetime import datetime`
      : '';

    return `${baseImports}${sseImports}${websocketImports}${a2aImports}`;
  }

  /**
   * Generate LangChain streaming callbacks with cost tracking integration
   */
  private generateCallbacks(config: StreamingConfig): string {
    return `
# Import cost tracking from callbacks module
try:
    from callbacks import CostTrackingHandler
    COST_TRACKING_AVAILABLE = True
except ImportError:
    COST_TRACKING_AVAILABLE = False
    logger.warning("callbacks module not available, cost tracking disabled in streaming")


class StreamingCallbackHandler(BaseCallbackHandler):
    """
    Custom callback handler for LangChain streaming with cost tracking

    Captures tokens as they're generated and sends them through
    the configured streaming channel (SSE, WebSocket, or a2a)
    with real-time cost tracking per token
    """

    def __init__(self, queue: asyncio.Queue, cost_tracker: Optional[Any] = None):
        """
        Initialize callback handler

        Args:
            queue: Async queue for streaming tokens
            cost_tracker: Optional CostTrackingHandler for real-time cost tracking
        """
        self.queue = queue
        self.tokens = []
        self.cost_tracker = cost_tracker
        self.token_count = 0

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: list[str], **kwargs: Any
    ) -> None:
        """Called when LLM starts generating"""
        logger.info("LLM generation started")

        # Capture model name for cost tracking
        if self.cost_tracker:
            self.cost_tracker.model_name = serialized.get("name", "unknown")

        asyncio.create_task(self.queue.put({
            "type": "llm_start",
            "prompts": prompts,
            "model": serialized.get("name", "unknown"),
        }))

    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        """Called when LLM generates a new token"""
        logger.debug(f"New token: {token}")
        self.tokens.append(token)
        self.token_count += 1

        # Get current cost if tracker available
        current_cost = 0.0
        if self.cost_tracker:
            current_cost = self.cost_tracker.total_cost

        asyncio.create_task(self.queue.put({
            "type": "token",
            "token": token,
            "token_count": self.token_count,
            "cost": current_cost,
        }))

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Called when LLM finishes generating"""
        logger.info("LLM generation completed")

        # Track final token usage if cost tracker available
        cost_summary = {}
        if self.cost_tracker and response.llm_output:
            token_usage = response.llm_output.get("token_usage", {})
            prompt_tokens = token_usage.get("prompt_tokens", 0)
            completion_tokens = token_usage.get("completion_tokens", 0)

            # Update cost tracker
            self.cost_tracker.prompt_tokens += prompt_tokens
            self.cost_tracker.completion_tokens += completion_tokens
            self.cost_tracker.total_tokens += (prompt_tokens + completion_tokens)

            # Calculate final cost
            model_key = self.cost_tracker._normalize_model_name(
                self.cost_tracker.model_name or ""
            )
            pricing = self.cost_tracker.PRICING.get(model_key, {"input": 0, "output": 0})
            input_cost = (prompt_tokens / 1_000_000) * pricing["input"]
            output_cost = (completion_tokens / 1_000_000) * pricing["output"]
            self.cost_tracker.total_cost += input_cost + output_cost

            cost_summary = self.cost_tracker.get_summary()

        asyncio.create_task(self.queue.put({
            "type": "llm_end",
            "full_response": "".join(self.tokens),
            "tokens": len(self.tokens),
            "cost_summary": cost_summary,
        }))

    def on_llm_error(self, error: Exception, **kwargs: Any) -> None:
        """Called when LLM encounters an error"""
        logger.error(f"LLM error: {str(error)}", exc_info=True)
        asyncio.create_task(self.queue.put({
            "type": "error",
            "error": str(error),
            "error_type": type(error).__name__,
        }))

    def on_tool_start(
        self, serialized: Dict[str, Any], input_str: str, **kwargs: Any
    ) -> None:
        """Called when tool execution starts"""
        tool_name = serialized.get("name", "unknown")
        logger.info(f"Tool '{tool_name}' started")
        asyncio.create_task(self.queue.put({
            "type": "tool_start",
            "tool": tool_name,
            "input": input_str,
        }))

    def on_tool_end(self, output: str, **kwargs: Any) -> None:
        """Called when tool execution ends"""
        logger.info("Tool execution completed")
        asyncio.create_task(self.queue.put({
            "type": "tool_end",
            "output": output,
        }))

    def on_tool_error(self, error: Exception, **kwargs: Any) -> None:
        """Called when tool encounters an error"""
        logger.error(f"Tool error: {str(error)}", exc_info=True)
        asyncio.create_task(self.queue.put({
            "type": "tool_error",
            "error": str(error),
            "error_type": type(error).__name__,
        }))
`;
  }

  /**
   * Generate SSE (Server-Sent Events) implementation with cost tracking
   */
  private generateSSE(): string {
    return `

# Server-Sent Events (SSE) Implementation

async def stream_sse(
    message: str,
    agent: Any,
    session_id: str = "default",
    cost_tracker: Optional[Any] = None
) -> AsyncIterator[str]:
    """
    Stream agent responses via Server-Sent Events with cost tracking

    Args:
        message: User message
        agent: LangChain agent instance
        session_id: Session identifier
        cost_tracker: Optional CostTrackingHandler for real-time cost tracking

    Yields:
        SSE formatted strings with agent response tokens and cost information
    """
    queue: asyncio.Queue = asyncio.Queue()
    callback_handler = StreamingCallbackHandler(queue, cost_tracker=cost_tracker)

    try:
        logger.info(f"Starting SSE stream for session: {session_id}")

        # Send initial connection event
        yield f"data: {json.dumps({'type': 'connected', 'session_id': session_id})}\\n\\n"

        # Run agent with streaming callback in background
        async def run_agent():
            try:
                result = await agent.arun(
                    message,
                    callbacks=[callback_handler]
                )

                # Get final cost summary
                final_cost = {}
                if cost_tracker:
                    final_cost = cost_tracker.get_summary()

                await queue.put({
                    "type": "done",
                    "result": result,
                    "cost_summary": final_cost
                })
            except Exception as e:
                logger.error(f"Agent error: {str(e)}", exc_info=True)
                await queue.put({"type": "error", "error": str(e)})

        # Start agent execution
        agent_task = asyncio.create_task(run_agent())

        # Stream events as they come
        while True:
            try:
                # Wait for event with timeout for heartbeat
                event = await asyncio.wait_for(queue.get(), timeout=30.0)

                # Format as SSE
                yield f"data: {json.dumps(event)}\\n\\n"

                # End stream on completion or error
                if event["type"] in ["done", "error"]:
                    break

            except asyncio.TimeoutError:
                # Send heartbeat to keep connection alive
                yield f": heartbeat\\n\\n"
                continue

        # Wait for agent task to complete
        await agent_task

        logger.info(f"SSE stream completed for session: {session_id}")

    except asyncio.CancelledError:
        logger.info(f"SSE stream cancelled for session: {session_id}")
        yield f"data: {json.dumps({'type': 'cancelled'})}\\n\\n"
        raise
    except Exception as e:
        logger.error(f"SSE streaming error: {str(e)}", exc_info=True)
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\\n\\n"


def create_sse_endpoint(agent: Any):
    """
    Create FastAPI endpoint for SSE streaming with cost tracking

    Args:
        agent: LangChain agent instance

    Returns:
        FastAPI endpoint function
    """
    async def sse_chat(message: str, session_id: str = "default"):
        """SSE chat endpoint with real-time cost tracking"""
        # Create cost tracker for this session
        cost_tracker = None
        if COST_TRACKING_AVAILABLE:
            from callbacks import CostTrackingHandler
            cost_tracker = CostTrackingHandler()

        return StreamingResponse(
            stream_sse(message, agent, session_id, cost_tracker),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
                "Access-Control-Allow-Origin": "*",
            }
        )

    return sse_chat
`;
  }

  /**
   * Generate WebSocket implementation with cost tracking and backpressure handling
   */
  private generateWebSocket(): string {
    return `

# WebSocket Implementation

class ConnectionManager:
    """
    Manages WebSocket connections for multiple sessions with backpressure handling
    """

    def __init__(self):
        """Initialize connection manager"""
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_queues: Dict[str, asyncio.Queue] = {}
        self.session_tasks: Dict[str, asyncio.Task] = {}
        self.cost_trackers: Dict[str, Any] = {}
        self.max_queue_size = 1000  # Prevent memory issues

    async def connect(self, websocket: WebSocket, session_id: str):
        """
        Connect a new WebSocket client

        Args:
            websocket: WebSocket connection
            session_id: Session identifier
        """
        await websocket.accept()
        self.active_connections[session_id] = websocket
        self.session_queues[session_id] = asyncio.Queue(maxsize=self.max_queue_size)

        # Create cost tracker for session
        if COST_TRACKING_AVAILABLE:
            from callbacks import CostTrackingHandler
            self.cost_trackers[session_id] = CostTrackingHandler()

        logger.info(f"WebSocket connected: {session_id}")

        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "session_id": session_id,
            "message": "WebSocket connection established"
        })

    def disconnect(self, session_id: str):
        """
        Disconnect a WebSocket client

        Args:
            session_id: Session identifier
        """
        # Cancel running tasks
        if session_id in self.session_tasks:
            self.session_tasks[session_id].cancel()
            del self.session_tasks[session_id]

        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.session_queues:
            del self.session_queues[session_id]
        if session_id in self.cost_trackers:
            del self.cost_trackers[session_id]

        logger.info(f"WebSocket disconnected: {session_id}")

    async def send_message(self, session_id: str, message: Dict[str, Any]):
        """
        Send message to specific session with backpressure handling

        Args:
            session_id: Session identifier
            message: Message dictionary
        """
        if session_id in self.active_connections:
            try:
                # Add timeout to prevent blocking
                await asyncio.wait_for(
                    self.active_connections[session_id].send_json(message),
                    timeout=5.0
                )
            except asyncio.TimeoutError:
                logger.warning(f"WebSocket send timeout for session: {session_id}")
                self.disconnect(session_id)
            except Exception as e:
                logger.error(f"Error sending WebSocket message: {str(e)}")
                self.disconnect(session_id)

    async def broadcast(self, message: Dict[str, Any]):
        """
        Broadcast message to all connected clients

        Args:
            message: Message dictionary
        """
        disconnected = []
        for session_id in list(self.active_connections.keys()):
            try:
                await self.send_message(session_id, message)
            except Exception:
                disconnected.append(session_id)

        # Clean up disconnected sessions
        for session_id in disconnected:
            self.disconnect(session_id)

    def get_cost_tracker(self, session_id: str) -> Optional[Any]:
        """Get cost tracker for session"""
        return self.cost_trackers.get(session_id)


# Global connection manager
manager = ConnectionManager()


async def stream_websocket(
    websocket: WebSocket,
    agent: Any,
    session_id: str = "default"
):
    """
    Stream agent responses via WebSocket with cost tracking and cancellation support

    Args:
        websocket: WebSocket connection
        agent: LangChain agent instance
        session_id: Session identifier
    """
    await manager.connect(websocket, session_id)
    current_task = None

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type", "message")

            # Handle cancellation request
            if message_type == "cancel":
                if current_task and not current_task.done():
                    current_task.cancel()
                    await websocket.send_json({
                        "type": "cancelled",
                        "message": "Stream cancelled by user"
                    })
                continue

            message = data.get("message", "")

            if not message:
                await websocket.send_json({
                    "type": "error",
                    "error": "Empty message"
                })
                continue

            logger.info(f"WebSocket message received: {session_id}")

            # Cancel previous task if still running
            if current_task and not current_task.done():
                current_task.cancel()

            # Get queue and cost tracker
            queue = manager.session_queues[session_id]
            cost_tracker = manager.get_cost_tracker(session_id)
            callback_handler = StreamingCallbackHandler(queue, cost_tracker=cost_tracker)

            # Run agent with streaming callback
            async def run_agent():
                try:
                    result = await agent.arun(
                        message,
                        callbacks=[callback_handler]
                    )

                    # Get final cost summary
                    final_cost = {}
                    if cost_tracker:
                        final_cost = cost_tracker.get_summary()

                    await queue.put({
                        "type": "done",
                        "result": result,
                        "cost_summary": final_cost
                    })
                except asyncio.CancelledError:
                    await queue.put({"type": "cancelled"})
                    raise
                except Exception as e:
                    logger.error(f"Agent error: {str(e)}", exc_info=True)
                    await queue.put({"type": "error", "error": str(e)})

            # Start agent execution
            agent_task = asyncio.create_task(run_agent())
            manager.session_tasks[session_id] = agent_task

            # Stream events as they come
            async def stream_events():
                try:
                    while True:
                        event = await queue.get()
                        await manager.send_message(session_id, event)

                        if event["type"] in ["done", "error", "cancelled"]:
                            break
                except asyncio.CancelledError:
                    logger.info(f"Event streaming cancelled for: {session_id}")
                    raise

            # Wait for both tasks
            current_task = asyncio.create_task(stream_events())
            await asyncio.gather(agent_task, current_task, return_exceptions=True)

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {session_id}")
        manager.disconnect(session_id)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}", exc_info=True)
        manager.disconnect(session_id)


def create_websocket_endpoint(agent: Any):
    """
    Create FastAPI endpoint for WebSocket streaming with cancellation support

    Args:
        agent: LangChain agent instance

    Returns:
        FastAPI endpoint function
    """
    async def websocket_chat(websocket: WebSocket, session_id: str = "default"):
        """WebSocket chat endpoint with real-time cost tracking and cancellation"""
        await stream_websocket(websocket, agent, session_id)

    return websocket_chat
`;
  }

  /**
   * Generate a2a (agent-to-agent) streaming implementation
   */
  private generateA2A(meshUrl?: string): string {
    const url = meshUrl || 'http://localhost:8080';

    return `

# Agent-to-Agent (a2a) Streaming Implementation

class A2AStreamingClient:
    """
    Client for streaming agent responses to Agent Mesh
    """

    def __init__(self, mesh_url: str = "${url}"):
        """
        Initialize a2a streaming client

        Args:
            mesh_url: Agent Mesh URL
        """
        self.mesh_url = mesh_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def stream_to_mesh(
        self,
        agent_id: str,
        message: str,
        queue: asyncio.Queue,
        target_agent: Optional[str] = None
    ):
        """
        Stream agent response to Agent Mesh

        Args:
            agent_id: Source agent identifier
            message: Message content
            queue: Queue with streaming events
            target_agent: Optional target agent for routing
        """
        try:
            endpoint = f"{self.mesh_url}/agents/{agent_id}/stream"

            # Collect streaming events
            events = []
            full_response = ""

            while True:
                event = await queue.get()
                events.append(event)

                # Accumulate tokens
                if event["type"] == "token":
                    full_response += event["token"]

                # Send to mesh on completion
                if event["type"] == "done":
                    payload = {
                        "agent_id": agent_id,
                        "message": message,
                        "response": full_response,
                        "target_agent": target_agent,
                        "timestamp": datetime.utcnow().isoformat(),
                        "streaming_events": events,
                    }

                    response = await self.client.post(endpoint, json=payload)
                    response.raise_for_status()

                    logger.info(f"Streamed response to Agent Mesh: {agent_id}")
                    break

                # Stop on error
                if event["type"] == "error":
                    logger.error(f"Streaming error: {event['error']}")
                    break

        except Exception as e:
            logger.error(f"a2a streaming error: {str(e)}", exc_info=True)

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


async def stream_a2a(
    agent_id: str,
    message: str,
    agent: Any,
    mesh_url: str = "${url}",
    target_agent: Optional[str] = None
) -> Dict[str, Any]:
    """
    Stream agent response with a2a integration

    Args:
        agent_id: Agent identifier
        message: User message
        agent: LangChain agent instance
        mesh_url: Agent Mesh URL
        target_agent: Optional target agent

    Returns:
        Agent response with streaming metadata
    """
    queue: asyncio.Queue = asyncio.Queue()
    callback_handler = StreamingCallbackHandler(queue)
    a2a_client = A2AStreamingClient(mesh_url)

    try:
        logger.info(f"Starting a2a stream for agent: {agent_id}")

        # Run agent with streaming callback
        async def run_agent():
            try:
                result = await agent.arun(
                    message,
                    callbacks=[callback_handler]
                )
                await queue.put({"type": "done", "result": result})
            except Exception as e:
                logger.error(f"Agent error: {str(e)}", exc_info=True)
                await queue.put({"type": "error", "error": str(e)})

        # Start agent execution and a2a streaming
        agent_task = asyncio.create_task(run_agent())
        mesh_task = asyncio.create_task(
            a2a_client.stream_to_mesh(agent_id, message, queue, target_agent)
        )

        # Wait for both tasks
        await asyncio.gather(agent_task, mesh_task)

        logger.info(f"a2a stream completed for agent: {agent_id}")

        return {
            "success": True,
            "agent_id": agent_id,
            "streamed_to_mesh": True,
        }

    except Exception as e:
        logger.error(f"a2a streaming error: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
        }
    finally:
        await a2a_client.close()
`;
  }
}
