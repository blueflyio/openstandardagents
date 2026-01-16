"""
LangChain ReAct Agent with Tools
This agent uses reasoning and action to solve problems with access to search and calculator tools.
"""

from langchain.agents import initialize_agent, AgentType, Tool
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.tools import tool

# Initialize LLM
llm = ChatOpenAI(
    model_name="gpt-4",
    temperature=0.7,
    max_tokens=2000
)

# Define tools
@tool
def search_web(query: str) -> str:
    """Search the web for information. Use this when you need to find current information or facts."""
    # Implementation would go here
    return f"Search results for: {query}"

@tool
def calculate(expression: str) -> str:
    """Calculate mathematical expressions. Use this for any math operations."""
    try:
        result = eval(expression)
        return f"Result: {result}"
    except Exception as e:
        return f"Error: {str(e)}"

@tool
def get_weather(location: str) -> str:
    """Get current weather for a location. Use this when asked about weather."""
    # Implementation would go here
    return f"Weather in {location}: Sunny, 72°F"

tools = [search_web, calculate, get_weather]

# Initialize memory
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

# Create ReAct agent
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    memory=memory,
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=5
)

# Example usage
if __name__ == "__main__":
    response = agent.run("What's the weather in San Francisco and what's 25 * 4?")
    print(response)
