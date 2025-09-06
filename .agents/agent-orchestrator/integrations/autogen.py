"""
AutoGen integration for OSSA Orchestration Manager
Provides conversation management and group chat orchestration for AutoGen agents
"""

import asyncio
import json
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
import logging

# AutoGen imports (assuming autogen is available)
try:
    import autogen
    from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
    from autogen.agentchat import ConversableAgent
    AUTOGEN_AVAILABLE = True
except ImportError:
    # Fallback for when autogen is not installed
    AUTOGEN_AVAILABLE = False
    logging.warning("AutoGen not available. Install with: pip install pyautogen")

import requests
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


@dataclass
class OSSAAutoGenAgent:
    """OSSA-compliant AutoGen agent wrapper"""
    name: str
    role: str
    system_message: str
    ossa_spec: Dict[str, Any]
    autogen_agent: Optional[Any] = None
    capabilities: List[str] = None
    protocols: List[str] = None


class OSSAAutoGenOrchestrator:
    """OSSA-compliant orchestration for AutoGen multi-agent conversations"""
    
    def __init__(
        self, 
        orchestration_api_url: str = "http://localhost:3004/api/v1",
        api_key: Optional[str] = None
    ):
        if not AUTOGEN_AVAILABLE:
            raise ImportError("AutoGen is required. Install with: pip install pyautogen")
            
        self.orchestration_api_url = orchestration_api_url
        self.api_key = api_key
        self.headers = {"Content-Type": "application/json"}
        if api_key:
            self.headers["X-API-Key"] = api_key
            
        self.agents: Dict[str, OSSAAutoGenAgent] = {}
        self.group_chats: Dict[str, Any] = {}
        self.active_conversations: Dict[str, Any] = {}
    
    def register_ossa_agent(
        self, 
        name: str, 
        role: str, 
        system_message: str,
        llm_config: Dict[str, Any],
        capabilities: List[str] = None,
        protocols: List[str] = None
    ) -> OSSAAutoGenAgent:
        """Register an AutoGen agent with OSSA compliance"""
        
        # Generate OSSA spec for the agent
        ossa_spec = {
            "openapi": "3.1.0",
            "info": {
                "title": f"{role} Agent",
                "version": "1.0.0",
                "description": system_message,
                "x-openapi-ai-agents-standard": {
                    "version": "0.1.8",
                    "conformance_tier": "core"
                },
                "x-agent-metadata": {
                    "class": "conversational",
                    "category": "autogen",
                    "capabilities": capabilities or ["conversation", "reasoning"],
                    "protocols": protocols or ["openapi", "autogen"]
                },
                "x-autogen-integration": {
                    "agent_type": "ConversableAgent",
                    "conversation_enabled": True,
                    "group_chat_compatible": True
                }
            }
        }
        
        # Create AutoGen agent
        if "human" in role.lower() or "proxy" in role.lower():
            autogen_agent = UserProxyAgent(
                name=name,
                system_message=system_message,
                llm_config=llm_config,
                human_input_mode="NEVER",  # For automated orchestration
                max_consecutive_auto_reply=5,
                is_termination_msg=lambda x: x.get("content", "").find("TERMINATE") >= 0
            )
        else:
            autogen_agent = AssistantAgent(
                name=name,
                system_message=system_message,
                llm_config=llm_config,
                max_consecutive_auto_reply=5,
                is_termination_msg=lambda x: x.get("content", "").find("TERMINATE") >= 0
            )
        
        # Create OSSA agent wrapper
        ossa_agent = OSSAAutoGenAgent(
            name=name,
            role=role,
            system_message=system_message,
            ossa_spec=ossa_spec,
            autogen_agent=autogen_agent,
            capabilities=capabilities,
            protocols=protocols
        )
        
        self.agents[name] = ossa_agent
        
        # Register with OSSA orchestration manager
        self._register_with_orchestration_manager(ossa_agent)
        
        return ossa_agent
    
    def create_ossa_group_chat(
        self,
        chat_name: str,
        agents: List[str],
        orchestration_pattern: str = "sequential",
        max_round: int = 10,
        admin_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create OSSA-compliant AutoGen group chat"""
        
        # Validate agents exist
        chat_agents = []
        for agent_name in agents:
            if agent_name not in self.agents:
                raise ValueError(f"Agent {agent_name} not registered")
            chat_agents.append(self.agents[agent_name].autogen_agent)
        
        # Create AutoGen GroupChat
        group_chat = GroupChat(
            agents=chat_agents,
            messages=[],
            max_round=max_round,
            speaker_selection_method="auto" if orchestration_pattern == "auto" else "round_robin"
        )
        
        # Create GroupChatManager
        admin_agent = self.agents.get(admin_name) if admin_name else chat_agents[0]
        if isinstance(admin_agent, OSSAAutoGenAgent):
            admin_agent = admin_agent.autogen_agent
            
        manager = GroupChatManager(
            groupchat=group_chat,
            llm_config={"config_list": [{"model": "gpt-4", "api_key": "dummy"}]},  # Placeholder
            name=f"{chat_name}_manager"
        )
        
        # Store group chat info
        chat_info = {
            "name": chat_name,
            "group_chat": group_chat,
            "manager": manager,
            "agents": agents,
            "orchestration_pattern": orchestration_pattern,
            "ossa_compliant": True,
            "created_at": asyncio.get_event_loop().time()
        }
        
        self.group_chats[chat_name] = chat_info
        
        # Register group chat workflow with orchestration manager
        self._register_group_chat_workflow(chat_info)
        
        return chat_info
    
    def initiate_ossa_conversation(
        self,
        chat_name: str,
        message: str,
        sender: Optional[str] = None
    ) -> Dict[str, Any]:
        """Initiate OSSA-compliant AutoGen conversation"""
        
        if chat_name not in self.group_chats:
            raise ValueError(f"Group chat {chat_name} not found")
        
        chat_info = self.group_chats[chat_name]
        group_chat = chat_info["group_chat"]
        manager = chat_info["manager"]
        
        # Determine sender
        if sender and sender in self.agents:
            sender_agent = self.agents[sender].autogen_agent
        else:
            sender_agent = group_chat.agents[0]
        
        try:
            # Start conversation
            conversation_id = f"{chat_name}_{asyncio.get_event_loop().time():.0f}"
            
            # Initiate chat
            chat_result = sender_agent.initiate_chat(
                manager,
                message=message,
                clear_history=True
            )
            
            # Store conversation info
            conversation_info = {
                "id": conversation_id,
                "chat_name": chat_name,
                "initiator": sender,
                "initial_message": message,
                "result": chat_result,
                "ossa_compliant": True,
                "started_at": asyncio.get_event_loop().time()
            }
            
            self.active_conversations[conversation_id] = conversation_info
            
            # Report to orchestration manager
            self._report_conversation_result(conversation_info)
            
            return conversation_info
            
        except Exception as e:
            logger.error(f"Conversation initiation failed: {str(e)}")
            return {
                "error": str(e),
                "chat_name": chat_name,
                "sender": sender,
                "ossa_compliant": False
            }
    
    def get_conversation_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get OSSA-formatted conversation history"""
        
        if conversation_id not in self.active_conversations:
            return []
        
        conversation = self.active_conversations[conversation_id]
        chat_name = conversation["chat_name"]
        
        if chat_name not in self.group_chats:
            return []
        
        group_chat = self.group_chats[chat_name]["group_chat"]
        
        # Format messages for OSSA compliance
        formatted_messages = []
        for i, message in enumerate(group_chat.messages):
            formatted_message = {
                "id": i,
                "conversation_id": conversation_id,
                "timestamp": asyncio.get_event_loop().time(),
                "sender": message.get("name", "unknown"),
                "role": message.get("role", "assistant"),
                "content": message.get("content", ""),
                "ossa_metadata": {
                    "agent_type": "autogen",
                    "message_type": "conversation",
                    "compliance_checked": True
                }
            }
            formatted_messages.append(formatted_message)
        
        return formatted_messages
    
    def _register_with_orchestration_manager(self, ossa_agent: OSSAAutoGenAgent):
        """Register AutoGen agent with OSSA orchestration manager"""
        
        try:
            payload = {
                "name": ossa_agent.name,
                "version": "1.0.0",
                "endpoint": f"http://localhost:8000/agents/{ossa_agent.name.lower().replace(' ', '-')}",
                "capabilities": ossa_agent.capabilities or ["conversation", "reasoning"],
                "protocols": ossa_agent.protocols or ["openapi", "autogen"],
                "metadata": {
                    "role": ossa_agent.role,
                    "system_message": ossa_agent.system_message,
                    "autogen_agent": True,
                    "agent_type": type(ossa_agent.autogen_agent).__name__
                }
            }
            
            endpoint = f"{self.orchestration_api_url}/agents/register"
            response = requests.post(endpoint, json=payload, headers=self.headers)
            
            if response.status_code == 201:
                logger.info(f"AutoGen agent {ossa_agent.name} registered successfully")
            else:
                logger.warning(f"Failed to register AutoGen agent {ossa_agent.name}: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Agent registration failed: {str(e)}")
    
    def _register_group_chat_workflow(self, chat_info: Dict[str, Any]):
        """Register group chat as orchestrated workflow"""
        
        try:
            payload = {
                "pattern": "group_conversation",
                "agents": [{"role": agent_name} for agent_name in chat_info["agents"]],
                "workflow": {
                    "type": "autogen_group_chat",
                    "description": f"AutoGen group chat: {chat_info['name']}",
                    "max_rounds": chat_info.get("max_round", 10),
                    "orchestration_pattern": chat_info["orchestration_pattern"]
                },
                "priority": "normal"
            }
            
            endpoint = f"{self.orchestration_api_url}/orchestrate"
            response = requests.post(endpoint, json=payload, headers=self.headers)
            
            if response.status_code in [200, 202]:
                result = response.json()
                chat_info["workflow_id"] = result.get("workflow_id")
                logger.info(f"Group chat workflow registered: {result.get('workflow_id')}")
            
        except Exception as e:
            logger.error(f"Workflow registration failed: {str(e)}")
    
    def _report_conversation_result(self, conversation_info: Dict[str, Any]):
        """Report conversation results to orchestration manager"""
        
        try:
            if "workflow_id" in self.group_chats[conversation_info["chat_name"]]:
                workflow_id = self.group_chats[conversation_info["chat_name"]]["workflow_id"]
                
                # Report completion (simplified)
                payload = {
                    "status": "completed",
                    "result": {
                        "conversation_id": conversation_info["id"],
                        "message_count": len(conversation_info.get("result", {}).get("chat_history", [])),
                        "success": True
                    }
                }
                
                endpoint = f"{self.orchestration_api_url}/workflows/{workflow_id}/complete"
                requests.post(endpoint, json=payload, headers=self.headers)
                
        except Exception as e:
            logger.error(f"Result reporting failed: {str(e)}")


# Example usage
if __name__ == "__main__":
    if not AUTOGEN_AVAILABLE:
        print("AutoGen not available. Install with: pip install pyautogen")
        exit(1)
    
    # Initialize OSSA AutoGen orchestrator
    orchestrator = OSSAAutoGenOrchestrator(api_key="your-api-key")
    
    # LLM configuration
    llm_config = {
        "config_list": [
            {
                "model": "gpt-4",
                "api_key": "your-openai-api-key"
            }
        ],
        "temperature": 0.7
    }
    
    # Register OSSA-compliant AutoGen agents
    data_analyst = orchestrator.register_ossa_agent(
        name="data_analyst",
        role="Data Analyst",
        system_message="You are a data analyst. Analyze data and provide insights with clear explanations.",
        llm_config=llm_config,
        capabilities=["data_analysis", "statistical_modeling", "visualization"],
        protocols=["openapi", "autogen"]
    )
    
    report_writer = orchestrator.register_ossa_agent(
        name="report_writer",
        role="Report Writer",
        system_message="You are a report writer. Create comprehensive reports based on analysis results.",
        llm_config=llm_config,
        capabilities=["report_generation", "documentation", "synthesis"],
        protocols=["openapi", "autogen"]
    )
    
    user_proxy = orchestrator.register_ossa_agent(
        name="user_proxy",
        role="User Proxy",
        system_message="You represent the user and coordinate the analysis workflow.",
        llm_config=llm_config,
        capabilities=["workflow_coordination", "user_interaction"],
        protocols=["openapi", "autogen"]
    )
    
    # Create OSSA-compliant group chat
    chat_info = orchestrator.create_ossa_group_chat(
        chat_name="data_analysis_workflow",
        agents=["user_proxy", "data_analyst", "report_writer"],
        orchestration_pattern="sequential",
        max_round=10,
        admin_name="user_proxy"
    )
    
    # Initiate conversation
    conversation = orchestrator.initiate_ossa_conversation(
        chat_name="data_analysis_workflow",
        message="Please analyze the sales data from Q4 2024 and create a comprehensive report with insights and recommendations.",
        sender="user_proxy"
    )
    
    print(f"Conversation initiated successfully: {conversation['id']}")
    print(f"OSSA compliant: {conversation['ossa_compliant']}")
    
    # Get conversation history
    history = orchestrator.get_conversation_history(conversation["id"])
    print(f"Conversation history: {len(history)} messages")