"""
OSSA v0.1.8 - CrewAI Agent Integration
Provides standardized CrewAI agent implementation for OSSA-compliant agents
"""

from typing import Any, Dict, List, Optional, Union
import yaml
import json
from datetime import datetime
from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool
from crewai.agent import Agent as CrewAgent
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
import logging


class OSSAAgentConfig(BaseModel):
    """OSSA Agent Configuration Model"""
    agent: Dict[str, Any]
    frameworks: Dict[str, Any]
    monitoring: Optional[Dict[str, Any]] = None
    security: Optional[Dict[str, Any]] = None
    compliance: Optional[Dict[str, Any]] = None


class OSSAComplianceTool(BaseTool):
    """Base tool with OSSA compliance tracking"""
    
    name: str = "ossa_compliance_tool"
    description: str = "OSSA compliant tool with audit logging"
    agent_id: Optional[str] = None
    compliance_config: Optional[Dict] = None
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.audit_log: List[Dict] = []
    
    def _run(self, *args, **kwargs) -> Any:
        """Execute tool with compliance logging"""
        self._log_execution('start', args, kwargs)
        
        try:
            result = self.execute_tool(*args, **kwargs)
            self._log_execution('success', args, kwargs, result)
            return result
        except Exception as e:
            self._log_execution('error', args, kwargs, error=str(e))
            raise
    
    def execute_tool(self, *args, **kwargs) -> Any:
        """Override this method in subclasses"""
        raise NotImplementedError("Subclasses must implement execute_tool")
    
    def _log_execution(self, status: str, args: tuple, kwargs: dict, result: Any = None, error: str = None):
        """Log tool execution for compliance"""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'tool_name': self.name,
            'agent_id': self.agent_id,
            'status': status,
            'args': str(args),
            'kwargs': {k: str(v) for k, v in kwargs.items()},
        }
        
        if result is not None:
            log_entry['result'] = str(result)[:1000]  # Truncate long results
        
        if error:
            log_entry['error'] = error
        
        self.audit_log.append(log_entry)
    
    def get_audit_log(self) -> List[Dict]:
        """Get audit log for compliance reporting"""
        return self.audit_log.copy()


class WebSearchTool(OSSAComplianceTool):
    """Web search tool with OSSA compliance"""
    
    name: str = "web_search"
    description: str = "Search the web for information"
    
    def execute_tool(self, query: str) -> str:
        """Execute web search"""
        # Implementation would integrate with search API
        return f"Web search results for: {query}"


class CodeAnalysisTool(OSSAComplianceTool):
    """Code analysis tool with OSSA compliance"""
    
    name: str = "code_analysis"
    description: str = "Analyze code for quality and security"
    
    def execute_tool(self, code: str, analysis_type: str = "general") -> str:
        """Execute code analysis"""
        return f"Code analysis ({analysis_type}): {len(code)} characters analyzed"


class DataProcessingTool(OSSAComplianceTool):
    """Data processing tool with OSSA compliance"""
    
    name: str = "data_processing"
    description: str = "Process and analyze data"
    
    def execute_tool(self, data: str, operation: str = "analyze") -> str:
        """Execute data processing"""
        return f"Data processing ({operation}): Processed {len(data)} characters"


class OSSACrewAIAgent:
    """OSSA v0.1.8 compliant CrewAI Agent"""
    
    def __init__(self, config: OSSAAgentConfig):
        self.config = config
        self.agent_config = config.agent
        self.crewai_config = config.frameworks.get('crewai', {})
        
        if not self.crewai_config.get('enabled', False):
            raise ValueError("CrewAI framework not enabled in agent configuration")
        
        self.tools: List[OSSAComplianceTool] = []
        self.agent: Optional[CrewAgent] = None
        self.crew: Optional[Crew] = None
        
        self._setup_tools()
        self._setup_agent()
    
    def _setup_tools(self) -> None:
        """Setup tools based on OSSA configuration"""
        tool_configs = self.crewai_config.get('tools', [])
        
        for tool_name in tool_configs:
            tool = self._create_tool(tool_name)
            if tool:
                self.tools.append(tool)
    
    def _create_tool(self, tool_name: str) -> Optional[OSSAComplianceTool]:
        """Create a tool based on its name"""
        tool_creators = {
            'web_search': lambda: WebSearchTool(
                agent_id=self.agent_config['id'],
                compliance_config=self.config.compliance
            ),
            'code_analysis': lambda: CodeAnalysisTool(
                agent_id=self.agent_config['id'],
                compliance_config=self.config.compliance
            ),
            'data_processing': lambda: DataProcessingTool(
                agent_id=self.agent_config['id'],
                compliance_config=self.config.compliance
            ),
        }
        
        creator = tool_creators.get(tool_name)
        if creator:
            return creator()
        
        # Check for custom tools
        return self._create_custom_tool(tool_name)
    
    def _create_custom_tool(self, tool_name: str) -> Optional[OSSAComplianceTool]:
        """Create custom tool - override in subclasses"""
        return None
    
    def _setup_agent(self) -> None:
        """Setup the CrewAI agent"""
        # Initialize LLM
        model_name = self.crewai_config.get('model', 'gpt-4')
        llm = ChatOpenAI(model=model_name, temperature=0.7)
        
        # Create agent
        self.agent = Agent(
            role=self.crewai_config.get('role', 'AI Assistant'),
            goal=self.crewai_config.get('goal', 'Help users accomplish their tasks'),
            backstory=self.crewai_config.get('backstory', 'An experienced AI assistant'),
            tools=self.tools,
            llm=llm,
            verbose=True,
            allow_delegation=False,
            max_iter=self.crewai_config.get('max_iterations', 10)
        )
    
    def create_task(self, description: str, expected_output: str = None) -> Task:
        """Create a task for the agent"""
        return Task(
            description=description,
            agent=self.agent,
            expected_output=expected_output or "Task completed successfully"
        )
    
    def execute_task(self, task_description: str, expected_output: str = None) -> Dict[str, Any]:
        """Execute a single task"""
        try:
            task = self.create_task(task_description, expected_output)
            
            # Create a temporary crew for this task
            crew = Crew(
                agents=[self.agent],
                tasks=[task],
                process=Process.sequential,
                verbose=True
            )
            
            start_time = datetime.utcnow()
            result = crew.kickoff()
            end_time = datetime.utcnow()
            
            # Collect audit logs from tools
            audit_logs = []
            for tool in self.tools:
                audit_logs.extend(tool.get_audit_log())
            
            return {
                'success': True,
                'result': result,
                'agent_id': self.agent_config['id'],
                'task_description': task_description,
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'duration_seconds': (end_time - start_time).total_seconds(),
                'audit_logs': audit_logs
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'agent_id': self.agent_config['id'],
                'task_description': task_description,
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def execute_crew(self, tasks: List[Dict[str, str]]) -> Dict[str, Any]:
        """Execute multiple tasks as a crew"""
        try:
            crew_tasks = []
            for task_config in tasks:
                task = self.create_task(
                    task_config['description'],
                    task_config.get('expected_output')
                )
                crew_tasks.append(task)
            
            crew = Crew(
                agents=[self.agent],
                tasks=crew_tasks,
                process=Process.sequential,
                verbose=True
            )
            
            start_time = datetime.utcnow()
            result = crew.kickoff()
            end_time = datetime.utcnow()
            
            # Collect audit logs from tools
            audit_logs = []
            for tool in self.tools:
                audit_logs.extend(tool.get_audit_log())
            
            return {
                'success': True,
                'result': result,
                'agent_id': self.agent_config['id'],
                'tasks_count': len(tasks),
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'duration_seconds': (end_time - start_time).total_seconds(),
                'audit_logs': audit_logs
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'agent_id': self.agent_config['id'],
                'tasks_count': len(tasks),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def get_capabilities(self) -> Dict[str, Any]:
        """Get agent capabilities"""
        return {
            'agent_id': self.agent_config['id'],
            'name': self.agent_config['name'],
            'version': self.agent_config['version'],
            'role': self.crewai_config.get('role'),
            'goal': self.crewai_config.get('goal'),
            'capabilities': self.agent_config.get('capabilities', {}),
            'tools': [tool.name for tool in self.tools],
            'max_iterations': self.crewai_config.get('max_iterations', 10),
            'compliance': self.config.compliance,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get agent health status"""
        return {
            'status': 'healthy',
            'agent_id': self.agent_config['id'],
            'agent_ready': self.agent is not None,
            'tools_available': len(self.tools),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def get_audit_logs(self) -> List[Dict]:
        """Get all audit logs from tools"""
        audit_logs = []
        for tool in self.tools:
            audit_logs.extend(tool.get_audit_log())
        return audit_logs


class OSSACrewManager:
    """Manager for multiple OSSA CrewAI agents"""
    
    def __init__(self):
        self.agents: Dict[str, OSSACrewAIAgent] = {}
    
    def add_agent(self, agent: OSSACrewAIAgent) -> None:
        """Add an agent to the crew"""
        agent_id = agent.agent_config['id']
        self.agents[agent_id] = agent
    
    def create_collaborative_crew(self, task_descriptions: List[str]) -> Dict[str, Any]:
        """Create a crew with multiple agents working together"""
        if not self.agents:
            return {
                'success': False,
                'error': 'No agents available',
                'timestamp': datetime.utcnow().isoformat()
            }
        
        try:
            # Create tasks and assign to agents
            all_agents = list(self.agents.values())
            tasks = []
            
            for i, task_desc in enumerate(task_descriptions):
                agent = all_agents[i % len(all_agents)]  # Round-robin assignment
                task = Task(
                    description=task_desc,
                    agent=agent.agent,
                    expected_output="Task completed successfully"
                )
                tasks.append(task)
            
            # Create collaborative crew
            crew = Crew(
                agents=[agent.agent for agent in all_agents],
                tasks=tasks,
                process=Process.sequential,
                verbose=True
            )
            
            start_time = datetime.utcnow()
            result = crew.kickoff()
            end_time = datetime.utcnow()
            
            # Collect audit logs from all agents
            audit_logs = []
            for agent in all_agents:
                audit_logs.extend(agent.get_audit_logs())
            
            return {
                'success': True,
                'result': result,
                'agents_involved': [agent.agent_config['id'] for agent in all_agents],
                'tasks_count': len(task_descriptions),
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'duration_seconds': (end_time - start_time).total_seconds(),
                'audit_logs': audit_logs
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }


class ExtendedOSSACrewAIAgent(OSSACrewAIAgent):
    """Extended OSSA CrewAI Agent for custom implementations"""
    
    def _create_custom_tool(self, tool_name: str) -> Optional[OSSAComplianceTool]:
        """Override this method to add custom tools"""
        return self.create_custom_tool_impl(tool_name)
    
    def create_custom_tool_impl(self, tool_name: str) -> Optional[OSSAComplianceTool]:
        """Implement custom tool creation"""
        raise NotImplementedError("Subclasses must implement create_custom_tool_impl")


def load_ossa_config(config_path: str) -> OSSAAgentConfig:
    """Load OSSA configuration from YAML file"""
    with open(config_path, 'r') as f:
        config_data = yaml.safe_load(f)
    
    return OSSAAgentConfig(**config_data)


def create_ossa_crewai_agent(config: Union[str, Dict, OSSAAgentConfig]) -> OSSACrewAIAgent:
    """Create OSSA CrewAI agent from configuration"""
    if isinstance(config, str):
        config = load_ossa_config(config)
    elif isinstance(config, dict):
        config = OSSAAgentConfig(**config)
    
    return OSSACrewAIAgent(config)


# Example usage:
if __name__ == "__main__":
    # Load configuration
    config = load_ossa_config("agent.yml")
    
    # Create agent
    agent = create_ossa_crewai_agent(config)
    
    # Execute single task
    result = agent.execute_task(
        "Analyze the current market trends for AI technology",
        "A comprehensive analysis report with key insights"
    )
    print(json.dumps(result, indent=2))
    
    # Get capabilities
    capabilities = agent.get_capabilities()
    print(json.dumps(capabilities, indent=2))