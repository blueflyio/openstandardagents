"""MCP Server that wraps an AgentScope agent as MCP tools.

Exposes the agent's capabilities as MCP tools so IDEs like Claude Code,
Cursor, and VS Code can interact with AgentScope agents via MCP protocol.

Usage:
    python -m adapters.agentscope.mcp_server examples/agentscope/react-assistant/agent.ossa.yaml

This starts an MCP server (stdio transport) that provides:
    - agent_chat: Send a message to the agent and get a response
    - agent_info: Get agent metadata and capabilities
    - agent_tools: List tools available to the agent
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any


async def create_mcp_server(manifest_path: str):
    """Create an MCP server wrapping an AgentScope agent."""
    try:
        from mcp.server import Server
        from mcp.server.stdio import stdio_server
        from mcp.types import Tool, TextContent
    except ImportError:
        print("Install MCP SDK: pip install mcp", file=sys.stderr)
        sys.exit(1)

    from .factory import create_agent_from_manifest
    from agentscope.message import Msg

    agent = await create_agent_from_manifest(manifest_path)
    server = Server("ossa-agentscope")

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        tools = [
            Tool(
                name="agent_chat",
                description=f"Chat with the '{agent.name}' AgentScope agent. The agent has access to its own tools and memory.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "description": "Message to send to the agent",
                        },
                    },
                    "required": ["message"],
                },
            ),
            Tool(
                name="agent_info",
                description=f"Get metadata and capabilities of the '{agent.name}' agent",
                inputSchema={
                    "type": "object",
                    "properties": {},
                },
            ),
        ]

        # If agent has a toolkit, expose its tool list
        if hasattr(agent, "toolkit") and agent.toolkit:
            tools.append(Tool(
                name="agent_tools",
                description="List all tools available to this agent",
                inputSchema={
                    "type": "object",
                    "properties": {},
                },
            ))

        return tools

    @server.call_tool()
    async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
        if name == "agent_chat":
            msg = Msg(name="user", content=arguments["message"], role="user")
            response = await agent(msg)
            content = response.content if isinstance(response.content, str) else str(response.content)
            return [TextContent(type="text", text=content)]

        elif name == "agent_info":
            info = {
                "name": agent.name,
                "type": "agentscope",
                "sys_prompt": getattr(agent, "sys_prompt", "N/A")[:200],
            }
            if hasattr(agent, "toolkit") and agent.toolkit:
                info["tools_count"] = len(agent.toolkit.tools)
                info["tool_names"] = list(agent.toolkit.tools.keys())
            return [TextContent(type="text", text=json.dumps(info, indent=2))]

        elif name == "agent_tools":
            if hasattr(agent, "toolkit") and agent.toolkit:
                tool_info = []
                for tname, tfunc in agent.toolkit.tools.items():
                    tool_info.append({
                        "name": tname,
                        "description": getattr(tfunc, "description", "No description"),
                    })
                return [TextContent(type="text", text=json.dumps(tool_info, indent=2))]
            return [TextContent(type="text", text="No tools available")]

        return [TextContent(type="text", text=f"Unknown tool: {name}")]

    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)


def main():
    parser = argparse.ArgumentParser(description="MCP Server for AgentScope agents")
    parser.add_argument("manifest", type=Path, help="Path to agent.ossa.yaml")
    args = parser.parse_args()
    asyncio.run(create_mcp_server(str(args.manifest)))


if __name__ == "__main__":
    main()
