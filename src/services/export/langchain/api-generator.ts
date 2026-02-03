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
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
import asyncio
import json
import os

from agent import create_agent, run
from memory import get_memory, clear_memory, get_all_sessions, delete_session

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
    Stream chat responses from the agent

    Args:
        request: Chat request with message and session ID

    Returns:
        Server-sent events stream with agent response chunks
    """
    async def generate():
        try:
            session_id = request.session_id or "default"

            # For streaming, we'd need to use LangChain's streaming capabilities
            # This is a simplified version
            result = run(request.message)

            if result.get("success"):
                # Stream response word by word
                words = result.get("output", "").split()
                for word in words:
                    yield f"data: {json.dumps({'chunk': word + ' '})}\n\n"
                    await asyncio.sleep(0.05)  # Simulate streaming delay

                yield f"data: {json.dumps({'done': True})}\n\n"
            else:
                yield f"data: {json.dumps({'error': result.get('error', 'Unknown error')})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )


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
