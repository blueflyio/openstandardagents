"""A2A Protocol server for AgentScope agents.

Exposes an AgentScope agent as a discoverable A2A endpoint per Google's
Agent-to-Agent protocol specification.

Usage:
    python -m adapters.agentscope.a2a_server examples/agentscope/react-assistant/agent.ossa.yaml --port 12311
"""
import argparse
import asyncio
import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from aiohttp import web
except ImportError:
    print("Install aiohttp: pip install aiohttp", file=sys.stderr)
    sys.exit(1)


class A2AServer:
    """A2A protocol server backed by an AgentScope agent."""

    def __init__(self, agent, manifest: dict):
        self.agent = agent
        self.manifest = manifest
        self.tasks: dict[str, dict] = {}
        self._build_agent_card()

    def _build_agent_card(self) -> None:
        """Build A2A agent card from OSSA manifest."""
        a2a_config = self.manifest.get("protocols", {}).get("a2a", {})
        card_config = a2a_config.get("agent_card", {})
        capabilities = a2a_config.get("capabilities", {})

        self.agent_card = {
            "name": card_config.get("name", self.manifest["metadata"]["name"]),
            "description": card_config.get("description", self.manifest["metadata"].get("description", "")),
            "url": a2a_config.get("endpoint", ""),
            "version": self.manifest["metadata"].get("version", "1.0.0"),
            "capabilities": {
                "streaming": capabilities.get("streaming", False),
                "pushNotifications": capabilities.get("pushNotifications", False),
                "stateTransitionHistory": capabilities.get("stateTransitionHistory", False),
            },
            "skills": card_config.get("skills", []),
            "provider": {
                "organization": self.manifest["metadata"].get("identity", {}).get("publisher", {}).get("name", "Unknown"),
            },
        }

    async def handle_well_known(self, request: web.Request) -> web.Response:
        """Serve .well-known/agent.json for A2A discovery."""
        return web.json_response(self.agent_card)

    async def handle_tasks_send(self, request: web.Request) -> web.Response:
        """Handle A2A tasks/send endpoint."""
        data = await request.json()
        task_id = data.get("id", str(uuid.uuid4()))
        message = data.get("message", {})

        # Extract text from A2A message parts
        parts = message.get("parts", [])
        text_parts = [p.get("text", "") for p in parts if p.get("type") == "text"]
        user_message = "\n".join(text_parts) or str(parts)

        # Create task record
        self.tasks[task_id] = {
            "id": task_id,
            "status": {"state": "working"},
            "history": [message],
        }

        try:
            from agentscope.message import Msg
            msg = Msg(name="user", content=user_message, role="user")
            response = await self.agent(msg)

            response_text = response.content if isinstance(response.content, str) else str(response.content)

            result_message = {
                "role": "agent",
                "parts": [{"type": "text", "text": response_text}],
            }

            self.tasks[task_id]["status"] = {"state": "completed"}
            self.tasks[task_id]["history"].append(result_message)

            return web.json_response({
                "id": task_id,
                "status": {"state": "completed"},
                "result": result_message,
                "history": self.tasks[task_id]["history"],
            })
        except Exception as e:
            self.tasks[task_id]["status"] = {"state": "failed", "error": str(e)}
            return web.json_response(
                {"id": task_id, "status": {"state": "failed", "error": str(e)}},
                status=500,
            )

    async def handle_tasks_get(self, request: web.Request) -> web.Response:
        """Get task status by ID."""
        data = await request.json()
        task_id = data.get("id")
        if task_id not in self.tasks:
            return web.json_response({"error": "Task not found"}, status=404)
        return web.json_response(self.tasks[task_id])

    def create_app(self) -> web.Application:
        app = web.Application()
        app.router.add_get("/.well-known/agent.json", self.handle_well_known)
        app.router.add_post("/tasks/send", self.handle_tasks_send)
        app.router.add_post("/tasks/get", self.handle_tasks_get)
        return app


async def main_async(manifest_path: str, host: str, port: int):
    import yaml
    from .factory import create_agent_from_manifest

    with open(manifest_path) as f:
        manifest = yaml.safe_load(f)

    agent = await create_agent_from_manifest(manifest_path)
    server = A2AServer(agent, manifest)
    app = server.create_app()

    print(f"A2A Server for '{agent.name}'")
    print(f"  Agent Card: http://{host}:{port}/.well-known/agent.json")
    print(f"  Tasks:      http://{host}:{port}/tasks/send")
    print(f"  Skills:     {[s.get('name') for s in server.agent_card.get('skills', [])]}")

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host, port)
    await site.start()
    await asyncio.Event().wait()


def main():
    parser = argparse.ArgumentParser(description="A2A Protocol Server for AgentScope agents")
    parser.add_argument("manifest", type=Path, help="Path to agent.ossa.yaml")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=12311)
    args = parser.parse_args()
    asyncio.run(main_async(str(args.manifest), args.host, args.port))


if __name__ == "__main__":
    main()
