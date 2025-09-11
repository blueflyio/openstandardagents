#!/usr/bin/env python3
"""
OSSA OpenAI Agent Bridge
Provides Python bridge for OpenAI's agent SDK
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from agents import Agent, Runner, Handoff
import uvicorn
import os
import json
from datetime import datetime
import asyncio

app = FastAPI(title="OSSA OpenAI Agent Bridge", version="0.1.0")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agent registry
agents = {}
agent_sessions = {}

class AgentSpawnRequest(BaseModel):
    name: str
    model: str = "gpt-4o"
    instructions: str = "You are a helpful assistant"
    tools: Optional[List[Dict[str, Any]]] = None
    temperature: float = 0.7
    max_tokens: Optional[int] = None

class AgentRunRequest(BaseModel):
    agent_id: str
    message: str
    stream: bool = False

class HandoffRequest(BaseModel):
    from_agent: str
    to_agent: str
    context: str

class AgentResponse(BaseModel):
    agent_id: str
    response: str
    handoff: Optional[str] = None
    usage: Optional[Dict[str, int]] = None

@app.post("/agents/spawn", response_model=Dict[str, str])
async def spawn_agent(request: AgentSpawnRequest):
    """Spawn a new OpenAI agent using the SDK"""
    try:
        agent_id = f"openai-{request.name}-{len(agents)}"
        
        # Create agent with SDK
        agent = Agent(
            name=request.name,
            instructions=request.instructions,
            model=request.model,
            tools=request.tools or []
        )
        
        # Store agent instance
        agents[agent_id] = {
            "agent": agent,
            "name": request.name,
            "model": request.model,
            "instructions": request.instructions,
            "created_at": datetime.now().isoformat(),
            "total_runs": 0
        }
        
        return {
            "agent_id": agent_id,
            "status": "spawned",
            "model": request.model
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agents/{agent_id}/run", response_model=AgentResponse)
async def run_agent(agent_id: str, request: AgentRunRequest):
    """Run an agent with a message using the SDK"""
    if agent_id not in agents:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    agent_data = agents[agent_id]
    agent = agent_data["agent"]
    
    try:
        # Run agent synchronously (for simplicity in API)
        result = Runner.run_sync(
            agent,
            request.message,
            stream=request.stream
        )
        
        # Update agent stats
        agents[agent_id]["total_runs"] += 1
        
        return AgentResponse(
            agent_id=agent_id,
            response=result.final_output if hasattr(result, 'final_output') else str(result),
            handoff=result.handoff.to_agent if hasattr(result, 'handoff') and result.handoff else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agents/handoff", response_model=AgentResponse)
async def handoff_between_agents(request: HandoffRequest):
    """Handle handoff between agents"""
    if request.from_agent not in agents or request.to_agent not in agents:
        raise HTTPException(status_code=404, detail="One or both agents not found")
    
    try:
        to_agent = agents[request.to_agent]["agent"]
        
        # Create handoff
        handoff = Handoff(
            from_agent=request.from_agent,
            to_agent=request.to_agent,
            context=request.context
        )
        
        # Run the receiving agent with handoff context
        result = Runner.run_sync(
            to_agent,
            f"Handoff from {request.from_agent}: {request.context}"
        )
        
        return AgentResponse(
            agent_id=request.to_agent,
            response=result.final_output if hasattr(result, 'final_output') else str(result),
            handoff=request.from_agent
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agents/list")
async def list_agents():
    """List all spawned agents with their stats"""
    return {
        "agents": [
            {
                "id": agent_id,
                "name": agent_data["name"],
                "model": agent_data["model"],
                "created_at": agent_data["created_at"],
                "total_runs": agent_data["total_runs"]
            }
            for agent_id, agent_data in agents.items()
        ]
    }

@app.get("/agents/{agent_id}/info")
async def get_agent_info(agent_id: str):
    """Get information about an agent"""
    if agent_id not in agents:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    agent_data = agents[agent_id]
    return {
        "agent_id": agent_id,
        "name": agent_data["name"],
        "model": agent_data["model"],
        "instructions": agent_data["instructions"],
        "created_at": agent_data["created_at"],
        "total_runs": agent_data["total_runs"]
    }

@app.delete("/agents/{agent_id}")
async def terminate_agent(agent_id: str):
    """Terminate an agent and clean up resources"""
    if agent_id not in agents:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    del agents[agent_id]
    if agent_id in agent_sessions:
        del agent_sessions[agent_id]
    
    return {"status": "terminated", "agent_id": agent_id}

@app.post("/orchestrate/multi-agent")
async def orchestrate_multi_agent(agents_config: List[AgentSpawnRequest], task: str):
    """Orchestrate multiple agents to complete a task"""
    spawned_agents = []
    
    # Spawn all agents
    for config in agents_config:
        agent_response = await spawn_agent(config)
        spawned_agents.append(agent_response["agent_id"])
    
    # Execute task with agent coordination
    results = []
    current_context = task
    
    for i, agent_id in enumerate(spawned_agents):
        run_request = AgentRunRequest(
            agent_id=agent_id,
            message=current_context
        )
        
        response = await run_agent(agent_id, run_request)
        results.append({
            "agent_id": agent_id,
            "response": response.response
        })
        
        # Handle handoffs if needed
        if response.handoff and i < len(spawned_agents) - 1:
            current_context = f"Handoff from {agent_id}: {response.response}"
        else:
            current_context = f"Previous agent output: {response.response}\n\nYour task: Continue processing this information."
    
    return {
        "task": task,
        "agents": spawned_agents,
        "results": results
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agents_count": len(agents),
        "api_key_configured": bool(os.getenv("OPENAI_API_KEY"))
    }

if __name__ == "__main__":
    port = int(os.getenv("OSSA_PYTHON_BRIDGE_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)