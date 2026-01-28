"""
OpenAI Swarm: Customer Service Triage Agent

This is a typical OpenAI Swarm implementation of a customer service triage system.
The triage agent routes customer requests to specialized agents (sales or refunds).

Swarm Documentation: https://github.com/openai/swarm
"""

from swarm import Swarm, Agent
from typing import Dict, Any

# Initialize Swarm client
client = Swarm()

# ============================================================================
# Transfer Functions (Swarm's handoff mechanism)
# ============================================================================

def transfer_to_sales_agent():
    """Transfer conversation to the sales agent."""
    return sales_agent


def transfer_to_refunds_agent():
    """Transfer conversation to the refunds agent."""
    return refunds_agent


# ============================================================================
# Agent Functions (Tools/Capabilities)
# ============================================================================

def execute_order(product_id: str, quantity: int = 1) -> str:
    """
    Execute a product order.

    Args:
        product_id: The product identifier
        quantity: Number of items to order (default: 1)

    Returns:
        Order confirmation message
    """
    # Simulated order processing
    total_price = quantity * 99.99  # Simplified pricing
    return f"Order confirmed! {quantity}x {product_id} for ${total_price:.2f}"


def process_refund(item_id: str, reason: str) -> str:
    """
    Process a refund request.

    Args:
        item_id: The item identifier to refund
        reason: Reason for the refund

    Returns:
        Refund confirmation message
    """
    # Simulated refund processing
    return f"Refund processed for item {item_id}. Reason: {reason}. Refund ID: REF-{item_id}-001"


# ============================================================================
# Agent Definitions
# ============================================================================

# Triage Agent - Entry point, routes to specialized agents
triage_agent = Agent(
    name="Customer Service Triage Agent",
    instructions="""You are a friendly customer service triage agent.

Your role is to:
1. Greet customers warmly
2. Understand their request or issue
3. Route them to the appropriate specialist:
   - Sales Agent: For product inquiries, purchases, or general questions
   - Refunds Agent: For returns, refunds, or order issues

Be concise and efficient in your routing.""",
    functions=[transfer_to_sales_agent, transfer_to_refunds_agent]
)

# Sales Agent - Handles purchases and product questions
sales_agent = Agent(
    name="Sales Agent",
    instructions="""You are a knowledgeable sales agent.

Your role is to:
1. Answer product questions
2. Help customers make purchases
3. Provide recommendations
4. Execute orders when customers are ready

Be helpful and enthusiastic about our products!""",
    functions=[execute_order, transfer_to_refunds_agent]
)

# Refunds Agent - Handles returns and refunds
refunds_agent = Agent(
    name="Refunds Agent",
    instructions="""You are an empathetic refunds specialist.

Your role is to:
1. Listen to customer concerns
2. Process refund requests
3. Explain refund policies clearly
4. Resolve issues with care

Be understanding and process refunds quickly.""",
    functions=[process_refund, transfer_to_sales_agent]
)


# ============================================================================
# Usage Examples
# ============================================================================

def run_customer_service_example():
    """Run example customer service conversations."""

    # Example 1: Customer wants to make a purchase
    print("=" * 80)
    print("Example 1: Sales Inquiry")
    print("=" * 80)

    messages = [{"role": "user", "content": "I want to buy your premium widget"}]
    response = client.run(
        agent=triage_agent,
        messages=messages,
        context_variables={"user_id": "USER123", "account_type": "premium"}
    )

    print(f"Agent: {response.agent.name}")
    print(f"Response: {response.messages[-1]['content']}")

    # Example 2: Customer wants a refund
    print("\n" + "=" * 80)
    print("Example 2: Refund Request")
    print("=" * 80)

    messages = [{"role": "user", "content": "I need a refund for order #12345"}]
    response = client.run(
        agent=triage_agent,
        messages=messages,
        context_variables={"user_id": "USER456", "account_type": "standard"}
    )

    print(f"Agent: {response.agent.name}")
    print(f"Response: {response.messages[-1]['content']}")

    # Example 3: Multi-turn conversation with handoffs
    print("\n" + "=" * 80)
    print("Example 3: Multi-turn Conversation")
    print("=" * 80)

    messages = [
        {"role": "user", "content": "Hi, I have a question about your products"}
    ]
    response = client.run(
        agent=triage_agent,
        messages=messages
    )
    print(f"Agent: {response.agent.name}")
    print(f"Response: {response.messages[-1]['content']}")

    # Continue conversation
    messages.append(response.messages[-1])
    messages.append({"role": "user", "content": "Actually, I want to order 3 premium widgets"})
    response = client.run(
        agent=response.agent,  # Continue with current agent
        messages=messages
    )
    print(f"Agent: {response.agent.name}")
    print(f"Response: {response.messages[-1]['content']}")


def run_streaming_example():
    """Example with streaming responses."""
    print("\n" + "=" * 80)
    print("Example 4: Streaming Response")
    print("=" * 80)

    messages = [{"role": "user", "content": "Tell me about your products"}]

    stream = client.run(
        agent=triage_agent,
        messages=messages,
        stream=True
    )

    print("Streaming response: ", end="", flush=True)
    for chunk in stream:
        if "content" in chunk:
            print(chunk["content"], end="", flush=True)
    print()


# ============================================================================
# Key Swarm Limitations Demonstrated Here
# ============================================================================

# 1. PYTHON ONLY: This code only runs in Python, can't deploy to other runtimes
# 2. NO DECLARATIVE CONFIG: Agent logic mixed with code, hard to version control
# 3. NO OBSERVABILITY: No built-in metrics, tracing, or monitoring
# 4. NO AUTHENTICATION: Must manually handle auth and permissions
# 5. NO RATE LIMITING: No built-in cost controls or rate limits
# 6. EXPERIMENTAL: Not production-ready according to OpenAI
# 7. MANUAL TESTING: No built-in testing framework
# 8. NO GOVERNANCE: No compliance, audit, or policy enforcement

# See after-triage-agent.ossa.yaml for OSSA equivalent with all these features!


if __name__ == "__main__":
    print("OpenAI Swarm - Customer Service Triage Example")
    print("=" * 80)
    print()

    # Run examples
    run_customer_service_example()
    run_streaming_example()

    print("\n" + "=" * 80)
    print("Migration to OSSA")
    print("=" * 80)
    print("See after-triage-agent.ossa.yaml for the OSSA equivalent.")
    print("OSSA provides:")
    print("  ✓ Declarative YAML configuration")
    print("  ✓ Deploy to any platform (Anthropic, OpenAI, LangChain, etc.)")
    print("  ✓ Built-in observability, auth, rate limiting")
    print("  ✓ Production-ready with governance and compliance")
    print("  ✓ 50% less code, 100% more features")
