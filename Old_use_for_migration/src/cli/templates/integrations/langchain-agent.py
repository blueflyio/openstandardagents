"""
OSSA v0.1.8 - LangChain Agent Integration
Provides standardized LangChain agent implementation for OSSA-compliant agents
"""

from typing import Any, Dict, List, Optional, Callable, Union
import yaml
import json
from datetime import datetime
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.agents.agent_types import AgentType
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema import AgentAction, AgentFinish
from langchain.tools import Tool
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field


class OSSAAgentConfig(BaseModel):
    """OSSA Agent Configuration Model"""
    agent: Dict[str, Any]
    frameworks: Dict[str, Any]
    monitoring: Optional[Dict[str, Any]] = None
    security: Optional[Dict[str, Any]] = None
    compliance: Optional[Dict[str, Any]] = None


class OSSACallbackHandler(BaseCallbackHandler):
    """OSSA-compliant callback handler for monitoring and compliance"""
    
    def __init__(self, agent_id: str, compliance_config: Optional[Dict] = None):
        self.agent_id = agent_id
        self.compliance_config = compliance_config or {}
        self.audit_log: List[Dict] = []
    
    def on_agent_action(self, action: AgentAction, **kwargs) -> None:
        """Log agent actions for compliance"""
        self._log_event({
            'event_type': 'agent_action',
            'action': action.tool,
            'input': str(action.tool_input),
            'timestamp': datetime.utcnow().isoformat(),
            'agent_id': self.agent_id
        })
    
    def on_agent_finish(self, finish: AgentFinish, **kwargs) -> None:
        """Log agent completion for compliance"""
        self._log_event({
            'event_type': 'agent_finish',
            'output': str(finish.return_values),
            'timestamp': datetime.utcnow().isoformat(),
            'agent_id': self.agent_id
        })
    
    def _log_event(self, event: Dict[str, Any]) -> None:
        """Add event to audit log"""
        self.audit_log.append(event)
        
        # If compliance frameworks require immediate logging
        if self.compliance_config.get('real_time_audit', False):
            self._send_to_compliance_system(event)
    
    def _send_to_compliance_system(self, event: Dict[str, Any]) -> None:
        """Send event to external compliance system"""
        # Implementation depends on compliance requirements
        pass
    
    def get_audit_log(self) -> List[Dict]:
        """Get audit log for compliance reporting"""
        return self.audit_log.copy()


class OSSALangChainAgent:
    """OSSA v0.1.8 compliant LangChain Agent"""
    
    def __init__(self, config: OSSAAgentConfig):
        self.config = config
        self.agent_config = config.agent
        self.langchain_config = config.frameworks.get('langchain', {})
        
        if not self.langchain_config.get('enabled', False):
            raise ValueError("LangChain framework not enabled in agent configuration")
        
        self.tools: List[Tool] = []
        self.agent_executor: Optional[AgentExecutor] = None
        self.callback_handler = OSSACallbackHandler(
            agent_id=self.agent_config['id'],
            compliance_config=config.compliance
        )
        
        self._setup_tools()
        self._setup_agent()
    
    def _setup_tools(self) -> None:
        """Setup tools based on OSSA configuration"""
        tool_configs = self.langchain_config.get('tools', [])
        
        for tool_name in tool_configs:
            tool = self._create_tool(tool_name)
            if tool:
                self.tools.append(tool)
    
    def _create_tool(self, tool_name: str) -> Optional[Tool]:
        """Create a tool based on its name"""
        tool_creators = {
            'web_search': self._create_web_search_tool,
            'calculator': self._create_calculator_tool,
            'code_executor': self._create_code_executor_tool,
            'file_reader': self._create_file_reader_tool,
            'api_caller': self._create_api_caller_tool,
        }
        
        creator = tool_creators.get(tool_name)
        if creator:
            return creator()
        
        # Check for custom tools
        return self._create_custom_tool(tool_name)
    
    def _create_web_search_tool(self) -> Tool:
        """Create web search tool"""
        def search(query: str) -> str:
            # Implementation would integrate with search API
            return f"Search results for: {query}"
        
        return Tool(
            name="web_search",
            description="Search the web for information",
            func=search
        )
    
    def _create_calculator_tool(self) -> Tool:
        """Create calculator tool"""
        def calculate(expression: str) -> str:
            try:
                # Safe evaluation of mathematical expressions
                result = eval(expression, {"__builtins__": {}}, {})
                return str(result)
            except Exception as e:
                return f"Error: {str(e)}"
        
        return Tool(
            name="calculator",
            description="Perform mathematical calculations",
            func=calculate
        )
    
    def _create_code_executor_tool(self) -> Tool:
        """Create code executor tool"""
        def execute_code(code: str) -> str:
            # This would be implemented with proper sandboxing
            return f"Code executed: {code[:100]}..."
        
        return Tool(
            name="code_executor",
            description="Execute code safely in a sandboxed environment",
            func=execute_code
        )
    
    def _create_file_reader_tool(self) -> Tool:
        """Create file reader tool"""
        def read_file(file_path: str) -> str:
            try:
                with open(file_path, 'r') as f:
                    return f.read()
            except Exception as e:
                return f"Error reading file: {str(e)}"
        
        return Tool(
            name="file_reader",
            description="Read files from the filesystem",
            func=read_file
        )
    
    def _create_api_caller_tool(self) -> Tool:
        """Create API caller tool"""
        def call_api(api_config: str) -> str:
            # Parse API configuration and make call
            return f"API call result for: {api_config}"
        
        return Tool(
            name="api_caller",
            description="Make API calls to external services",
            func=call_api
        )
    
    def _create_custom_tool(self, tool_name: str) -> Optional[Tool]:
        """Create custom tool - override in subclasses"""
        return None
    
    def _setup_agent(self) -> None:
        """Setup the LangChain agent"""
        # Initialize LLM
        model_name = self.langchain_config.get('model', 'gpt-4')
        llm = ChatOpenAI(
            model=model_name,
            temperature=0.7,
            callback_manager=CallbackManager([self.callback_handler])
        )
        
        # Setup memory
        memory_config = self.langchain_config.get('memory', {})
        memory = None
        if memory_config.get('type') == 'conversation_buffer':
            memory = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True,
                max_token_limit=memory_config.get('max_tokens', 2000)
            )
        
        # Create prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_message()),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ])
        
        # Create agent
        agent = create_openai_functions_agent(llm, self.tools, prompt)
        
        # Create agent executor
        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=memory,
            verbose=True,
            max_iterations=self.langchain_config.get('max_iterations', 10),
            callback_manager=CallbackManager([self.callback_handler])
        )
    
    def _get_system_message(self) -> str:
        """Get system message based on OSSA configuration"""
        agent_description = self.agent_config.get('description', '')
        capabilities = self.agent_config.get('capabilities', {})
        
        message = f"""You are {self.agent_config['name']}, an OSSA v0.1.8 compliant AI agent.

Description: {agent_description}

Your primary capabilities include:
"""
        
        for capability in capabilities.get('primary', []):
            message += f"- {capability['name']}: {capability['description']}\n"
        
        message += "\nYou must operate within compliance frameworks and maintain audit trails."
        
        return message
    
    def execute(self, input_text: str, **kwargs) -> Dict[str, Any]:
        """Execute agent with input"""
        if not self.agent_executor:
            raise RuntimeError("Agent not properly initialized")
        
        try:
            result = self.agent_executor.invoke({"input": input_text})
            
            return {
                'success': True,
                'result': result,
                'agent_id': self.agent_config['id'],
                'timestamp': datetime.utcnow().isoformat(),
                'audit_log': self.callback_handler.get_audit_log()
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'agent_id': self.agent_config['id'],
                'timestamp': datetime.utcnow().isoformat(),
                'audit_log': self.callback_handler.get_audit_log()
            }
    
    def get_capabilities(self) -> Dict[str, Any]:
        """Get agent capabilities"""
        return {
            'agent_id': self.agent_config['id'],
            'name': self.agent_config['name'],
            'version': self.agent_config['version'],
            'capabilities': self.agent_config.get('capabilities', {}),
            'tools': [tool.name for tool in self.tools],
            'compliance': self.config.compliance,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get agent health status"""
        return {
            'status': 'healthy',
            'agent_id': self.agent_config['id'],
            'tools_available': len(self.tools),
            'memory_configured': self.agent_executor.memory is not None if self.agent_executor else False,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def get_audit_log(self) -> List[Dict]:
        """Get compliance audit log"""
        return self.callback_handler.get_audit_log()


class ExtendedOSSALangChainAgent(OSSALangChainAgent):
    """Extended OSSA LangChain Agent for custom implementations"""
    
    def _create_custom_tool(self, tool_name: str) -> Optional[Tool]:
        """Override this method to add custom tools"""
        return self.create_custom_tool_impl(tool_name)
    
    def create_custom_tool_impl(self, tool_name: str) -> Optional[Tool]:
        """Implement custom tool creation"""
        raise NotImplementedError("Subclasses must implement create_custom_tool_impl")


def load_ossa_config(config_path: str) -> OSSAAgentConfig:
    """Load OSSA configuration from YAML file"""
    with open(config_path, 'r') as f:
        config_data = yaml.safe_load(f)
    
    return OSSAAgentConfig(**config_data)


def create_ossa_langchain_agent(config: Union[str, Dict, OSSAAgentConfig]) -> OSSALangChainAgent:
    """Create OSSA LangChain agent from configuration"""
    if isinstance(config, str):
        config = load_ossa_config(config)
    elif isinstance(config, dict):
        config = OSSAAgentConfig(**config)
    
    return OSSALangChainAgent(config)


# Example usage:
if __name__ == "__main__":
    # Load configuration
    config = load_ossa_config("agent.yml")
    
    # Create agent
    agent = create_ossa_langchain_agent(config)
    
    # Execute task
    result = agent.execute("Help me analyze some data")
    print(json.dumps(result, indent=2))
    
    # Get capabilities
    capabilities = agent.get_capabilities()
    print(json.dumps(capabilities, indent=2))