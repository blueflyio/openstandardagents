"""CLI for running OSSA AgentScope agents."""
import argparse
import asyncio
import json
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="OSSA AgentScope Agent Runner")
    sub = parser.add_subparsers(dest="command")

    # Run agent from manifest
    run_cmd = sub.add_parser("run", help="Run an agent from an OSSA manifest")
    run_cmd.add_argument("manifest", type=Path, help="Path to agent.ossa.yaml")
    run_cmd.add_argument("--query", "-q", type=str, help="Initial query to send")
    run_cmd.add_argument("--interactive", "-i", action="store_true", help="Interactive mode")

    # Validate manifest
    val_cmd = sub.add_parser("validate", help="Validate an OSSA manifest for AgentScope compatibility")
    val_cmd.add_argument("manifest", type=Path, help="Path to agent.ossa.yaml")

    # Serve as HTTP API (for Drupal integration)
    serve_cmd = sub.add_parser("serve", help="Start HTTP API server for agent")
    serve_cmd.add_argument("manifest", type=Path, help="Path to agent.ossa.yaml")
    serve_cmd.add_argument("--host", default="127.0.0.1")
    serve_cmd.add_argument("--port", type=int, default=12310)

    args = parser.parse_args()

    if args.command == "run":
        asyncio.run(_run_agent(args))
    elif args.command == "validate":
        _validate_manifest(args)
    elif args.command == "serve":
        asyncio.run(_serve_agent(args))
    else:
        parser.print_help()


async def _run_agent(args):
    from .factory import create_agent_from_manifest
    from agentscope.message import Msg

    agent = await create_agent_from_manifest(str(args.manifest))
    print(f"Agent '{agent.name}' loaded successfully")

    if args.query:
        msg = Msg(name="user", content=args.query, role="user")
        response = await agent(msg)
        print(f"\n{agent.name}: {response.content}")

    if args.interactive or not args.query:
        print("Interactive mode (type 'quit' to exit)")
        while True:
            try:
                user_input = input("\nYou: ")
                if user_input.lower() in ("quit", "exit", "q"):
                    break
                msg = Msg(name="user", content=user_input, role="user")
                response = await agent(msg)
                print(f"\n{agent.name}: {response.content}")
            except (KeyboardInterrupt, EOFError):
                break
        print("\nGoodbye!")


def _validate_manifest(args):
    from .models import OSSAManifest
    import yaml

    with open(args.manifest) as f:
        data = yaml.safe_load(f)

    try:
        manifest = OSSAManifest.model_validate(data)
        print(f"VALID: {manifest.metadata.name} v{manifest.metadata.version}")
        print(f"  agentType: {manifest.metadata.agentType}")
        if manifest.extensions and manifest.extensions.agentscope:
            ext = manifest.extensions.agentscope
            print(f"  agent_class: {ext.agent_class.value}")
            print(f"  memory: {ext.memory_backend.value}")
        else:
            print("  WARNING: No extensions.agentscope block found")
    except Exception as e:
        print(f"INVALID: {e}", file=sys.stderr)
        sys.exit(1)


async def _serve_agent(args):
    """Start HTTP server that Drupal's AgentScopeProvider talks to."""
    try:
        from aiohttp import web
    except ImportError:
        print("Install aiohttp: pip install aiohttp", file=sys.stderr)
        sys.exit(1)

    from .factory import create_agent_from_manifest
    from agentscope.message import Msg

    agent = await create_agent_from_manifest(str(args.manifest))

    async def health(request):
        return web.json_response({"status": "healthy", "agent": agent.name})

    async def message(request):
        data = await request.json()
        msg = Msg(name="user", content=data.get("message", ""), role="user")
        response = await agent(msg)
        return web.json_response({
            "response": response.content if isinstance(response.content, str) else str(response.content),
            "agent": agent.name,
            "role": response.role,
        })

    async def info(request):
        return web.json_response({
            "name": agent.name,
            "type": "agentscope",
            "manifest": str(args.manifest),
        })

    app = web.Application()
    app.router.add_get("/api/v1/health", health)
    app.router.add_post("/api/v1/agent/message", message)
    app.router.add_get("/api/v1/agent/info", info)

    print(f"AgentScope server starting on {args.host}:{args.port}")
    print(f"Agent: {agent.name}")
    print(f"Endpoints:")
    print(f"  GET  /api/v1/health")
    print(f"  POST /api/v1/agent/message")
    print(f"  GET  /api/v1/agent/info")

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, args.host, args.port)
    await site.start()

    # Run forever
    await asyncio.Event().wait()


if __name__ == "__main__":
    main()
