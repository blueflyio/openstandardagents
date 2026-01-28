"""
CRUD Operations for OSSA Agents
Repository, Service, Controller layers following SOLID principles
"""

from .repository import IAgentRepository, AgentRepository
from .service import AgentService
from .controller import AgentController

__all__ = [
    'IAgentRepository',
    'AgentRepository',
    'AgentService',
    'AgentController',
]
