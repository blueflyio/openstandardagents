"""
Controller Layer - HTTP Handling (SOLID: Single Responsibility)
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Depends
from ..manifest import Manifest, load_manifest
from .service import AgentService
from .repository import AgentRepository


router = APIRouter(prefix="/api/v1/agents", tags=["agents"])


# Dependency injection
def get_service() -> AgentService:
    repository = AgentRepository()
    return AgentService(repository)


@router.get("/", response_model=List[Dict[str, Any]])
async def list_agents(
    filters: Optional[Dict[str, Any]] = None,
    service: AgentService = Depends(get_service)
):
    """List all agents"""
    try:
        agents = await service.list(filters)
        return [agent.dict() for agent in agents]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}", response_model=Dict[str, Any])
async def get_agent(
    agent_id: str,
    service: AgentService = Depends(get_service)
):
    """Get agent by ID"""
    try:
        agent = await service.get_by_id(agent_id)
        return agent.dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=Dict[str, Any], status_code=201)
async def create_agent(
    manifest_data: Dict[str, Any],
    service: AgentService = Depends(get_service)
):
    """Create new agent"""
    try:
        manifest = Manifest(**manifest_data)
        agent = await service.create(manifest)
        return agent.dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{agent_id}", response_model=Dict[str, Any])
async def update_agent(
    agent_id: str,
    manifest_data: Dict[str, Any],
    service: AgentService = Depends(get_service)
):
    """Update agent"""
    try:
        manifest = Manifest(**manifest_data)
        agent = await service.update(agent_id, manifest)
        return agent.dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: str,
    service: AgentService = Depends(get_service)
):
    """Delete agent"""
    try:
        await service.delete(agent_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AgentController:
    """Controller class for programmatic use"""
    
    def __init__(self, service: AgentService):
        self.service = service
    
    async def get_by_id(self, agent_id: str) -> Manifest:
        return await self.service.get_by_id(agent_id)
    
    async def list(self, filters: Optional[Dict[str, Any]] = None) -> List[Manifest]:
        return await self.service.list(filters)
    
    async def create(self, manifest: Manifest) -> Manifest:
        return await self.service.create(manifest)
    
    async def update(self, agent_id: str, manifest: Manifest) -> Manifest:
        return await self.service.update(agent_id, manifest)
    
    async def delete(self, agent_id: str) -> None:
        await self.service.delete(agent_id)
