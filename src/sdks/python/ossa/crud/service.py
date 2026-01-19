"""
Service Layer - Business Logic (SOLID: Single Responsibility)
"""

from typing import Dict, List, Optional, Any
from ..manifest import Manifest
from ..validator import validate_manifest, ValidationResult
from .repository import IAgentRepository


class AgentService:
    """Business logic layer (SOLID: Single Responsibility)"""
    
    def __init__(self, repository: IAgentRepository):
        self.repository = repository
    
    async def get_by_id(self, agent_id: str) -> Manifest:
        """Get agent by ID with validation"""
        agent = await self.repository.find_by_id(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")
        return agent
    
    async def list(self, filters: Optional[Dict[str, Any]] = None) -> List[Manifest]:
        """List all agents with optional filters"""
        return await self.repository.find_all(filters)
    
    async def create(self, manifest: Manifest) -> Manifest:
        """Create new agent with validation"""
        # Validate manifest
        validation = validate_manifest(manifest)
        if not validation.valid:
            raise ValueError(f"Invalid manifest: {validation.errors}")
        
        # Business logic here
        # TODO: Add agent-specific business logic
        
        return await self.repository.create(manifest)
    
    async def update(self, agent_id: str, manifest: Manifest) -> Manifest:
        """Update agent with validation"""
        # Validate manifest
        validation = validate_manifest(manifest)
        if not validation.valid:
            raise ValueError(f"Invalid manifest: {validation.errors}")
        
        # Business logic here
        # TODO: Add agent-specific business logic
        
        return await self.repository.update(agent_id, manifest)
    
    async def delete(self, agent_id: str) -> None:
        """Delete agent"""
        # Business logic here
        # TODO: Add agent-specific business logic (e.g., soft delete, cascade)
        
        deleted = await self.repository.delete(agent_id)
        if not deleted:
            raise ValueError(f"Agent {agent_id} not found")
