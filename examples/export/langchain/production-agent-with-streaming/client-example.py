#!/usr/bin/env python3
"""
Enhanced Streaming Client Example

Demonstrates SSE and WebSocket streaming with real-time cost tracking,
cancellation support, and error handling.

Usage:
    python client-example.py sse "Hello, agent!"
    python client-example.py ws "Analyze this data"
"""

import asyncio
import json
import sys
from typing import Optional

import httpx
import websockets


async def stream_sse_example(message: str, session_id: str = "demo"):
    """
    Stream via Server-Sent Events with cost tracking

    Args:
        message: Message to send to agent
        session_id: Session identifier
    """
    print(f"🚀 Starting SSE stream for session: {session_id}")
    print(f"📝 Message: {message}\n")

    url = "http://localhost:8000/chat/stream"
    params = {"message": message, "session_id": session_id}

    total_tokens = 0
    total_cost = 0.0
    response_text = ""

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            async with client.stream("GET", url, params=params) as response:
                async for line in response.aiter_lines():
                    # SSE format: "data: {json}"
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            event_type = data.get("type")

                            if event_type == "connected":
                                print(f"✅ Connected: {data.get('session_id')}")

                            elif event_type == "llm_start":
                                print(f"🤖 Model: {data.get('model', 'unknown')}")
                                print("💬 Response: ", end="", flush=True)

                            elif event_type == "token":
                                # Real-time token streaming
                                token = data.get("token", "")
                                response_text += token
                                print(token, end="", flush=True)

                                # Update cost tracking
                                total_tokens = data.get("token_count", 0)
                                total_cost = data.get("cost", 0.0)

                            elif event_type == "tool_start":
                                tool = data.get("tool", "unknown")
                                print(f"\n\n🔧 Tool: {tool}")
                                print(f"   Input: {data.get('input', '')}")

                            elif event_type == "tool_end":
                                print(f"   ✅ Output: {data.get('output', '')}\n")

                            elif event_type == "llm_end":
                                print("\n")
                                cost_summary = data.get("cost_summary", {})
                                if cost_summary:
                                    print(f"\n📊 Token Usage:")
                                    print(f"   Total: {cost_summary.get('total_tokens', 0)}")
                                    print(f"   Prompt: {cost_summary.get('prompt_tokens', 0)}")
                                    print(f"   Completion: {cost_summary.get('completion_tokens', 0)}")
                                    print(f"   💰 Cost: ${cost_summary.get('total_cost', 0):.6f}")

                            elif event_type == "done":
                                print(f"\n✅ Complete!")
                                cost_summary = data.get("cost_summary", {})
                                if cost_summary:
                                    print(f"💰 Final Cost: ${cost_summary.get('total_cost', 0):.6f}")
                                break

                            elif event_type == "error":
                                print(f"\n❌ Error: {data.get('error', 'Unknown error')}")
                                break

                        except json.JSONDecodeError:
                            # Skip heartbeat or malformed messages
                            continue

                    elif line.startswith(":"):
                        # Heartbeat message - ignore
                        pass

        except httpx.ReadTimeout:
            print("\n⏰ Request timed out")
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")

    print(f"\n📈 Final Stats:")
    print(f"   Tokens: {total_tokens}")
    print(f"   Cost: ${total_cost:.6f}")
    print(f"   Length: {len(response_text)} characters")


async def stream_websocket_example(
    message: str,
    session_id: str = "demo",
    auto_cancel_after: Optional[float] = None
):
    """
    Stream via WebSocket with cancellation support

    Args:
        message: Message to send to agent
        session_id: Session identifier
        auto_cancel_after: Automatically cancel after N seconds (for demo)
    """
    print(f"🚀 Starting WebSocket stream for session: {session_id}")
    print(f"📝 Message: {message}\n")

    uri = f"ws://localhost:8000/chat/ws?session_id={session_id}"

    total_tokens = 0
    total_cost = 0.0
    response_text = ""
    cancel_task = None

    try:
        async with websockets.connect(uri) as websocket:
            # Send initial message
            await websocket.send(json.dumps({
                "type": "message",
                "message": message
            }))

            # Schedule auto-cancel if requested (for demo)
            if auto_cancel_after:
                async def auto_cancel():
                    await asyncio.sleep(auto_cancel_after)
                    print(f"\n⏰ Auto-cancelling after {auto_cancel_after}s...")
                    await websocket.send(json.dumps({"type": "cancel"}))

                cancel_task = asyncio.create_task(auto_cancel())

            # Receive streaming response
            while True:
                try:
                    response = await websocket.recv()
                    data = json.loads(response)
                    event_type = data.get("type")

                    if event_type == "connected":
                        print(f"✅ Connected: {data.get('session_id')}")

                    elif event_type == "llm_start":
                        print(f"🤖 Model: {data.get('model', 'unknown')}")
                        print("💬 Response: ", end="", flush=True)

                    elif event_type == "token":
                        # Real-time token streaming
                        token = data.get("token", "")
                        response_text += token
                        print(token, end="", flush=True)

                        # Update cost tracking
                        total_tokens = data.get("token_count", 0)
                        total_cost = data.get("cost", 0.0)

                        # Show cost every 50 tokens
                        if total_tokens % 50 == 0:
                            print(f"\n[{total_tokens} tokens, ${total_cost:.6f}]", end=" ", flush=True)

                    elif event_type == "tool_start":
                        tool = data.get("tool", "unknown")
                        print(f"\n\n🔧 Tool: {tool}")
                        print(f"   Input: {data.get('input', '')}")

                    elif event_type == "tool_end":
                        print(f"   ✅ Output: {data.get('output', '')}\n")

                    elif event_type == "done":
                        print("\n\n✅ Complete!")
                        cost_summary = data.get("cost_summary", {})
                        if cost_summary:
                            print(f"\n📊 Final Stats:")
                            print(f"   Total Tokens: {cost_summary.get('total_tokens', 0)}")
                            print(f"   Prompt: {cost_summary.get('prompt_tokens', 0)}")
                            print(f"   Completion: {cost_summary.get('completion_tokens', 0)}")
                            print(f"   💰 Cost: ${cost_summary.get('total_cost', 0):.6f}")
                        break

                    elif event_type == "cancelled":
                        print("\n\n🛑 Stream cancelled")
                        if cancel_task:
                            cancel_task.cancel()
                        break

                    elif event_type == "error":
                        print(f"\n❌ Error: {data.get('error', 'Unknown error')}")
                        break

                except websockets.exceptions.ConnectionClosed:
                    print("\n🔌 Connection closed")
                    break

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
    finally:
        if cancel_task and not cancel_task.done():
            cancel_task.cancel()

    print(f"\n📈 Session Stats:")
    print(f"   Tokens: {total_tokens}")
    print(f"   Cost: ${total_cost:.6f}")
    print(f"   Length: {len(response_text)} characters")


async def main():
    """Main entry point"""
    if len(sys.argv) < 3:
        print("Usage:")
        print("  python client-example.py sse 'Your message here'")
        print("  python client-example.py ws 'Your message here'")
        print("\nOptions:")
        print("  --cancel-after N  (WebSocket only) Auto-cancel after N seconds")
        sys.exit(1)

    stream_type = sys.argv[1].lower()
    message = sys.argv[2]

    # Parse optional cancel flag
    auto_cancel = None
    if "--cancel-after" in sys.argv:
        idx = sys.argv.index("--cancel-after")
        if idx + 1 < len(sys.argv):
            auto_cancel = float(sys.argv[idx + 1])

    if stream_type == "sse":
        await stream_sse_example(message)
    elif stream_type == "ws":
        await stream_websocket_example(message, auto_cancel_after=auto_cancel)
    else:
        print(f"❌ Invalid stream type: {stream_type}")
        print("   Must be 'sse' or 'ws'")
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(0)
