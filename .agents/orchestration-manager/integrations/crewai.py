"""
CrewAI integration for OSSA Orchestration Manager
Provides UADP-compliant agent coordination for CrewAI crews
"""

from typing import Dict, List, Optional, Any, Union
import json
import requests
from crewai import Agent, Crew, Task
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


class UADPDiscoveryTool(BaseTool):
    """CrewAI tool for Universal Agent Discovery Protocol (UADP)"""
    
    name: str = "uadp_discover"
    description: str = "Discover available agents using Universal Agent Discovery Protocol (UADP)"
    
    orchestration_api_url: str = Field(default="http://localhost:3004/api/v1")
    api_key: Optional[str] = Field(default=None)
    
    def _run(self, capabilities: Optional[List[str]] = None, protocols: Optional[List[str]] = None) -> str:
        """Discover agents with specified capabilities and protocols"""
        try:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["X-API-Key"] = self.api_key
            
            params = {}
            if capabilities:
                params["capabilities"] = capabilities
            if protocols:
                params["protocols"] = protocols
            
            endpoint = f"{self.orchestration_api_url}/agents/discover"
            response = requests.get(endpoint, params=params, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            agents = result.get("agents", [])
            
            if not agents:
                return "No agents found matching the specified criteria"
            
            # Format discovered agents for CrewAI
            agent_list = []
            for agent in agents:
                status = "🟢" if agent.get("health_status") == "healthy" else "🟡"
                tier = agent.get("performance_tier", "bronze").upper()
                caps = ", ".join(agent.get("capabilities", [])[:3])
                
                agent_list.append(f"{status} {agent.get('name')} ({tier}) - {caps}")
            
            return f"Discovered {len(agents)} agents:\n" + "\n".join(agent_list)
            
        except Exception as e:
            return f"Discovery failed: {str(e)}"


class OSSAOrchestrationTool(BaseTool):
    """CrewAI tool for OSSA-compliant multi-agent orchestration"""
    
    name: str = "ossa_orchestrate"
    description: str = "Orchestrate multiple agents using OSSA patterns (sequential, parallel, hybrid)"
    
    orchestration_api_url: str = Field(default="http://localhost:3004/api/v1")
    api_key: Optional[str] = Field(default=None)
    
    def _run(
        self, 
        pattern: str, 
        agent_roles: List[str], 
        workflow_description: str,
        priority: str = "normal"
    ) -> str:
        """Execute orchestrated workflow"""
        try:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["X-API-Key"] = self.api_key
            
            # Prepare orchestration request
            payload = {
                "pattern": pattern,
                "agents": [{"role": role, "requirements": {}} for role in agent_roles],
                "workflow": {"description": workflow_description},
                "priority": priority
            }
            
            endpoint = f"{self.orchestration_api_url}/orchestrate"
            response = requests.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            workflow_id = result.get("workflow_id")
            status = result.get("status")
            agents_assigned = result.get("agents_assigned", 0)
            
            return f"""🚀 Orchestration Initiated
Pattern: {pattern.upper()}
Workflow ID: {workflow_id}
Status: {status}
Agents Assigned: {agents_assigned}
Priority: {priority.upper()}"""
            
        except Exception as e:
            return f"Orchestration failed: {str(e)}"


class OSSACrewManager:
    """CrewAI manager with OSSA compliance and UADP discovery"""
    
    def __init__(self, api_key: Optional[str] = None, orchestration_url: str = "http://localhost:3004/api/v1"):
        self.api_key = api_key
        self.orchestration_url = orchestration_url
        self.headers = {"Content-Type": "application/json"}
        if api_key:
            self.headers["X-API-Key"] = api_key
    
    def create_ossa_compliant_crew(
        self,
        crew_name: str,
        agents_config: List[Dict[str, Any]],
        tasks_config: List[Dict[str, Any]]
    ) -> Crew:
        """Create CrewAI crew with OSSA compliance validation"""
        
        # Validate each agent against OSSA
        validated_agents = []
        for agent_config in agents_config:
            validated_agent = self._create_validated_agent(agent_config)
            validated_agents.append(validated_agent)
        
        # Create tasks with OSSA tools
        tasks = []
        for task_config in tasks_config:
            task = Task(
                description=task_config["description"],
                expected_output=task_config.get("expected_output", "Task completion"),
                tools=self._get_ossa_tools(),
                agent=validated_agents[task_config.get("agent_index", 0)]
            )
            tasks.append(task)
        
        # Create crew with OSSA orchestration
        crew = Crew(
            agents=validated_agents,
            tasks=tasks,
            verbose=True,
            memory=True,
            embedder={
                "provider": "openai",
                "config": {"model": "text-embedding-ada-002"}
            }
        )
        
        return crew
    
    def _create_validated_agent(self, agent_config: Dict[str, Any]) -> Agent:
        """Create agent with OSSA validation"""
        
        # Generate OSSA-compliant agent spec
        ossa_spec = {
            "openapi": "3.1.0",
            "info": {
                "title": agent_config["role"],
                "version": "1.0.0",
                "description": agent_config["goal"],
                "x-openapi-ai-agents-standard": {
                    "version": "0.1.3",
                    "conformance_tier": "core"
                },
                "x-agent-metadata": {
                    "class": "specialist",
                    "capabilities": agent_config.get("capabilities", []),
                    "protocols": ["openapi", "crewai"]
                }
            }
        }
        
        # Create CrewAI agent with OSSA tools
        agent = Agent(
            role=agent_config["role"],
            goal=agent_config["goal"],
            backstory=agent_config.get("backstory", ""),
            tools=self._get_ossa_tools(),
            verbose=True,
            allow_delegation=True,
            memory=True
        )
        
        # Attach OSSA spec to agent for validation
        agent.ossa_spec = ossa_spec
        
        return agent
    
    def _get_ossa_tools(self) -> List[BaseTool]:
        """Get OSSA-compliant tools for CrewAI agents"""
        return [
            UADPDiscoveryTool(api_key=self.api_key, orchestration_api_url=self.orchestration_url),
            OSSAOrchestrationTool(api_key=self.api_key, orchestration_api_url=self.orchestration_url)
        ]
    
    def register_crew_agents(self, crew: Crew) -> Dict[str, Any]:
        """Register all crew agents with OSSA orchestration manager"""
        registration_results = []
        
        for agent in crew.agents:
            try:
                # Prepare agent registration
                payload = {
                    "name": agent.role,
                    "version": "1.0.0",
                    "endpoint": f"http://localhost:8000/agents/{agent.role.lower().replace(' ', '-')}",
                    "capabilities": getattr(agent, 'ossa_spec', {}).get('info', {}).get('x-agent-metadata', {}).get('capabilities', []),
                    "protocols": ["openapi", "crewai"],
                    "metadata": {
                        "goal": agent.goal,
                        "backstory": agent.backstory,
                        "crew_ai_agent": True
                    }
                }
                
                endpoint = f"{self.orchestration_url}/agents/register"
                response = requests.post(endpoint, json=payload, headers=self.headers)
                response.raise_for_status()
                
                result = response.json()
                registration_results.append({
                    "agent_role": agent.role,
                    "agent_id": result.get("agent_id"),
                    "registered": result.get("registered", False)
                })
                
            except Exception as e:
                registration_results.append({
                    "agent_role": agent.role,
                    "registered": False,
                    "error": str(e)
                })
        
        return {
            "crew_registered": all(r["registered"] for r in registration_results),
            "agents": registration_results
        }
    
    def execute_ossa_workflow(
        self, 
        crew: Crew, 
        orchestration_pattern: str = "parallel",
        workflow_description: str = "CrewAI workflow execution"
    ) -> Dict[str, Any]:
        """Execute CrewAI crew with OSSA orchestration patterns"""
        
        try:
            # Register crew agents first
            registration = self.register_crew_agents(crew)
            
            if not registration["crew_registered"]:
                return {"success": False, "error": "Agent registration failed", "details": registration}
            
            # Prepare OSSA orchestration
            agent_roles = [agent.role for agent in crew.agents]
            
            orchestration_tool = OSSAOrchestrationTool(
                api_key=self.api_key, 
                orchestration_api_url=self.orchestration_url
            )
            
            # Initiate orchestration
            orchestration_result = orchestration_tool._run(
                pattern=orchestration_pattern,
                agent_roles=agent_roles,
                workflow_description=workflow_description,
                priority="normal"
            )
            
            # Execute CrewAI crew
            crew_result = crew.kickoff()
            
            return {
                "success": True,
                "orchestration_result": orchestration_result,
                "crew_result": str(crew_result),
                "registration": registration
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}


# Example usage
if __name__ == "__main__":
    # Initialize OSSA CrewAI manager
    ossa_manager = OSSACrewManager(api_key="your-api-key")
    
    # Define agents configuration
    agents_config = [
        {
            "role": "Data Analyst",
            "goal": "Analyze data and provide insights",
            "backstory": "Expert in data analysis with OSSA compliance",
            "capabilities": ["data_analysis", "statistical_modeling"]
        },
        {
            "role": "Report Writer",
            "goal": "Create comprehensive reports",
            "backstory": "Professional writer specializing in technical reports",
            "capabilities": ["report_generation", "documentation"]
        }
    ]
    
    # Define tasks configuration
    tasks_config = [
        {
            "description": "Analyze the provided dataset and identify key patterns",
            "expected_output": "Statistical analysis report with key insights",
            "agent_index": 0
        },
        {
            "description": "Create a comprehensive report based on the analysis",
            "expected_output": "Professional report with recommendations",
            "agent_index": 1
        }
    ]
    
    # Create OSSA-compliant crew
    crew = ossa_manager.create_ossa_compliant_crew(
        crew_name="Data Analysis Crew",
        agents_config=agents_config,
        tasks_config=tasks_config
    )
    
    # Execute with OSSA orchestration
    result = ossa_manager.execute_ossa_workflow(
        crew=crew,
        orchestration_pattern="sequential",
        workflow_description="Data analysis and reporting workflow"
    )
    
    print(f"Workflow executed successfully: {result['success']}")
    if result['success']:
        print(f"Orchestration: {result['orchestration_result']}")
        print(f"Result: {result['crew_result']}")
    else:
        print(f"Error: {result['error']}")