"""
Repository Layer - Data Access (SOLID: Single Responsibility)
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from ..manifest import Manifest


class IAgentRepository(ABC):
    """Repository interface (SOLID: Interface Segregation)"""
    
    @abstractmethod
    async def find_by_id(self, agent_id: str) -> Optional[Manifest]:
        """Find agent by ID"""
        pass
    
    @abstractmethod
    async def find_all(self, filters: Optional[Dict[str, Any]] = None) -> List[Manifest]:
        """Find all agents with optional filters"""
        pass
    
    @abstractmethod
    async def create(self, manifest: Manifest) -> Manifest:
        """Create new agent"""
        pass
    
    @abstractmethod
    async def update(self, agent_id: str, manifest: Manifest) -> Manifest:
        """Update agent"""
        pass
    
    @abstractmethod
    async def delete(self, agent_id: str) -> bool:
        """Delete agent"""
        pass
    
    @abstractmethod
    async def exists(self, agent_id: str) -> bool:
        """Check if agent exists"""
        pass


class AgentRepository(IAgentRepository):
    """
    In-Memory Repository (MVP)
    Production: Replace with database-backed repository
    """
    
    def __init__(self):
        self._storage: Dict[str, Manifest] = {}
    
    async def find_by_id(self, agent_id: str) -> Optional[Manifest]:
        return self._storage.get(agent_id)
    
    async def find_all(self, filters: Optional[Dict[str, Any]] = None) -> List[Manifest]:
        all_agents = list(self._storage.values())
        if filters:
            return [
                agent for agent in all_agents
                if all(
                    getattr(agent.metadata, key, None) == value
                    for key, value in filters.items()
                )
            ]
        return all_agents
    
    async def create(self, manifest: Manifest) -> Manifest:
        agent_id = manifest.metadata.name
        if agent_id in self._storage:
            raise ValueError(f"Agent {agent_id} already exists")
        self._storage[agent_id] = manifest
        return manifest
    
    async def update(self, agent_id: str, manifest: Manifest) -> Manifest:
        if agent_id not in self._storage:
            raise ValueError(f"Agent {agent_id} not found")
        self._storage[agent_id] = manifest
        return manifest
    
    async def delete(self, agent_id: str) -> bool:
        if agent_id in self._storage:
            del self._storage[agent_id]
            return True
        return False
    
    async def exists(self, agent_id: str) -> bool:
        return agent_id in self._storage
