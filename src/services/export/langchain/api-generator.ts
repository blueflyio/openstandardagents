/**
 * FastAPI Server Generator
 *
 * Generates production-ready FastAPI server for LangChain agents
 * with /chat endpoint, health checks, and streaming support
 *
 * SOLID: Single Responsibility - API server generation
 * DRY: Reusable API templates
 */

import type { OssaAgent } from '../../../types/index.js';

export class ApiGenerator {
  /**
   * Generate FastAPI server code
   */
  generate(manifest: OssaAgent, port: number = 8000): string {
    const agentName = manifest.metadata?.name || 'agent';
    const description = manifest.metadata?.description || 'AI Agent API';
    const version = manifest.metadata?.version || '1.0.0';

    return `"""
FastAPI Server for ${agentName}

${description}

This server provides a REST API for the LangChain agent with:
- POST /chat - Send messages to the agent
- POST /chat/stream - Streaming chat responses
- GET /health - Health check endpoint
- GET /sessions - List active sessions
- DELETE /sessions/{session_id} - Clear session history

OpenAPI documentation available at /docs
"""

from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
import asyncio
import json
import os

from agent import create_agent, run
from memory import get_memory, clear_memory, get_all_sessions, delete_session
from streaming import stream_sse, stream_websocket, manager as ws_manager
from callbacks import get_cost_tracker, print_cost_summary

# FastAPI app
app = FastAPI(
    title="${agentName} API",
    description="${description}",
    version="${version}",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agent instance (singleton)
agent = create_agent()

# Session memories cache
session_memories: Dict[str, Any] = {}


# Request/Response Models

class ChatRequest(BaseModel):
    """Chat request payload"""
    message: str = Field(..., description="User message to send to the agent")
    session_id: Optional[str] = Field(
        default="default",
        description="Session ID for conversation context"
    )
    stream: Optional[bool] = Field(
        default=False,
        description="Enable streaming responses"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Hello! What can you help me with?",
                "session_id": "user-123",
                "stream": False,
            }
        }


class ChatResponse(BaseModel):
    """Chat response payload"""
    response: str = Field(..., description="Agent's response message")
    session_id: str = Field(..., description="Session ID")
    success: bool = Field(..., description="Whether the request succeeded")
    error: Optional[str] = Field(None, description="Error message if failed")
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional metadata (token usage, etc.)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "response": "I can help you with various tasks...",
                "session_id": "user-123",
                "success": True,
                "metadata": {
                    "tokens_used": 150,
                },
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    agent: str = Field(..., description="Agent name")
    version: str = Field(..., description="API version")


class SessionInfo(BaseModel):
    """Session information"""
    session_id: str = Field(..., description="Session identifier")
    message_count: Optional[int] = Field(None, description="Number of messages")


# Endpoints

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Send a message to the agent

    Args:
        request: Chat request with message and optional session ID

    Returns:
        Agent response with conversation context

    Raises:
        HTTPException: If agent execution fails
    """
    try:
        # Get or create session memory
        session_id = request.session_id or "default"

        if session_id not in session_memories:
            session_memories[session_id] = get_memory(session_id)

        memory = session_memories[session_id]

        # Run agent
        result = run(request.message)

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Agent execution failed"),
            )

        return ChatResponse(
            response=result.get("output", ""),
            session_id=session_id,
            success=True,
            metadata={
                "tokens_used": result.get("tokens_used"),
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream chat responses from the agent via SSE with real-time cost tracking

    Args:
        request: Chat request with message and session ID

    Returns:
        Server-sent events stream with agent response tokens and cost information
    """
    try:
        session_id = request.session_id or "default"
        cost_tracker = get_cost_tracker()

        # Use the streaming module's SSE implementation
        return StreamingResponse(
            stream_sse(request.message, agent, session_id, cost_tracker),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
                "Access-Control-Allow-Origin": "*",
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Streaming error: {str(e)}"
        )


@app.websocket("/chat/ws")
async def chat_websocket(websocket: WebSocket, session_id: str = "default"):
    """
    WebSocket endpoint for bidirectional streaming with cancellation support

    Args:
        websocket: WebSocket connection
        session_id: Session identifier for conversation context

    WebSocket Message Format (Client -> Server):
        {
            "type": "message",  # or "cancel"
            "message": "user message text"
        }

    WebSocket Message Format (Server -> Client):
        {
            "type": "token",  # or "llm_start", "llm_end", "done", "error", "cancelled"
            "token": "response token",
            "token_count": 42,
            "cost": 0.00123
        }
    """
    await stream_websocket(websocket, agent, session_id)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """
    Health check endpoint

    Returns:
        Service health status
    """
    return HealthResponse(
        status="healthy",
        agent="${agentName}",
        version="${version}",
    )


@app.get("/sessions", response_model=List[SessionInfo])
async def list_sessions() -> List[SessionInfo]:
    """
    List all active sessions

    Returns:
        List of session IDs with metadata
    """
    try:
        sessions = get_all_sessions()
        return [
            SessionInfo(session_id=session_id)
            for session_id in sessions
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list sessions: {str(e)}",
        )


@app.delete("/sessions/{session_id}")
async def clear_session(session_id: str) -> JSONResponse:
    """
    Clear conversation history for a session

    Args:
        session_id: Session identifier to clear

    Returns:
        Success confirmation
    """
    try:
        if session_id in session_memories:
            clear_memory(session_memories[session_id], session_id)
            del session_memories[session_id]

        delete_session(session_id)

        return JSONResponse(
            content={
                "status": "success",
                "message": f"Session {session_id} cleared",
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear session: {str(e)}",
        )


@app.get("/cost-summary")
async def get_cost_summary():
    """
    Get cost tracking summary for the current session

    Returns:
        Token usage and cost information
    """
    cost_tracker = get_cost_tracker()
    return cost_tracker.get_summary()


@app.post("/cost-summary/reset")
async def reset_cost_summary():
    """
    Reset cost tracking counters

    Returns:
        Confirmation message
    """
    cost_tracker = get_cost_tracker()
    cost_tracker.reset()
    return {"status": "success", "message": "Cost tracking reset"}


@app.get("/")
async def root():
    """
    API root endpoint

    Returns:
        Welcome message with links to documentation
    """
    return {
        "message": "Welcome to ${agentName} API",
        "version": "${version}",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
        "endpoints": {
            "chat": "/chat",
            "stream_sse": "/chat/stream",
            "stream_ws": "/chat/ws",
            "cost_summary": "/cost-summary",
        }
    }


# Run server
if __name__ == "__main__":
    port = int(os.getenv("API_PORT", ${port}))
    host = os.getenv("API_HOST", "0.0.0.0")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
    )
`;
  }
}
