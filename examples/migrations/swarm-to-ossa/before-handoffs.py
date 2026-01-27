"""
OpenAI Swarm: Advanced Handoff Patterns

This example demonstrates various handoff patterns in OpenAI Swarm:
1. Conditional handoffs
2. Bidirectional handoffs (agents can transfer back and forth)
3. Context preservation across handoffs
4. Handoff with state changes

Swarm Documentation: https://github.com/openai/swarm
"""

from swarm import Swarm, Agent
from typing import Dict, Any, Optional

# Initialize Swarm client
client = Swarm()

# ============================================================================
# Shared State (simulated database)
# ============================================================================

conversation_state = {
    "order_id": None,
    "customer_tier": "standard",
    "issue_resolved": False,
    "escalation_count": 0
}

# ============================================================================
# Transfer Functions with Context
# ============================================================================

def transfer_to_order_verification():
    """Transfer to order verification agent to validate order details."""
    print("[HANDOFF] → Order Verification Agent")
    return order_verification_agent


def transfer_to_payment_processing():
    """Transfer to payment processing agent after order verification."""
    print("[HANDOFF] → Payment Processing Agent")
    return payment_processing_agent


def transfer_to_fulfillment():
    """Transfer to fulfillment agent after payment is processed."""
    print("[HANDOFF] → Fulfillment Agent")
    return fulfillment_agent


def transfer_to_supervisor():
    """Escalate to supervisor for complex issues."""
    global conversation_state
    conversation_state["escalation_count"] += 1
    print(f"[ESCALATION] → Supervisor (Escalation #{conversation_state['escalation_count']})")
    return supervisor_agent


def transfer_back_to_sales():
    """Return customer to sales agent."""
    print("[HANDOFF] ← Sales Agent")
    return sales_agent


# ============================================================================
# Conditional Transfer Functions
# ============================================================================

def conditional_transfer_payment(context_variables: Dict[str, Any]):
    """
    Conditionally transfer to payment based on order total.
    High-value orders go to supervisor for approval.
    """
    order_total = context_variables.get("order_total", 0)

    if order_total > 10000:
        print(f"[CONDITIONAL] High-value order (${order_total}) → Supervisor")
        return supervisor_agent
    else:
        print(f"[CONDITIONAL] Standard order (${order_total}) → Payment Processing")
        return payment_processing_agent


# ============================================================================
# Agent Functions
# ============================================================================

def verify_order(order_id: str, customer_id: str) -> str:
    """Verify order details and customer eligibility."""
    global conversation_state
    conversation_state["order_id"] = order_id

    # Simulated verification
    return f"Order {order_id} verified for customer {customer_id}. Ready for payment."


def process_payment(payment_method: str, amount: float) -> str:
    """Process payment for the order."""
    # Simulated payment processing
    return f"Payment of ${amount:.2f} processed via {payment_method}. Transaction ID: TXN-{payment_method}-001"


def schedule_fulfillment(order_id: str, delivery_address: str) -> str:
    """Schedule order fulfillment and delivery."""
    # Simulated fulfillment
    return f"Order {order_id} scheduled for delivery to {delivery_address}. Expected delivery: 3-5 business days."


def approve_order(order_id: str, approval_note: str) -> str:
    """Supervisor approves high-value orders."""
    return f"Order {order_id} approved by supervisor. Note: {approval_note}"


# ============================================================================
# Agent Definitions with Handoff Patterns
# ============================================================================

# Sales Agent - Entry point
sales_agent = Agent(
    name="Sales Agent",
    instructions="""You are a sales agent helping customers place orders.

When a customer wants to order:
1. Collect order details (items, quantities)
2. Calculate order total
3. Transfer to Order Verification Agent to validate the order

Be friendly and helpful!""",
    functions=[transfer_to_order_verification]
)

# Order Verification Agent
order_verification_agent = Agent(
    name="Order Verification Agent",
    instructions="""You verify order details and customer eligibility.

Process:
1. Verify the order details provided by the customer
2. Check customer eligibility
3. Transfer to Payment Processing Agent when verification is complete

If there are issues with the order, transfer back to Sales Agent.""",
    functions=[verify_order, transfer_to_payment_processing, transfer_back_to_sales]
)

# Payment Processing Agent
payment_processing_agent = Agent(
    name="Payment Processing Agent",
    instructions="""You handle payment processing for orders.

Process:
1. Collect payment information
2. Process the payment securely
3. Transfer to Fulfillment Agent when payment is successful

For high-value orders (>$10,000), escalate to Supervisor for approval first.
If payment fails, transfer back to Sales Agent.""",
    functions=[process_payment, transfer_to_fulfillment, transfer_to_supervisor, transfer_back_to_sales]
)

# Fulfillment Agent
fulfillment_agent = Agent(
    name="Fulfillment Agent",
    instructions="""You handle order fulfillment and delivery.

Process:
1. Schedule order fulfillment
2. Arrange delivery
3. Provide tracking information

Mark the issue as resolved when delivery is scheduled.""",
    functions=[schedule_fulfillment, transfer_back_to_sales]
)

# Supervisor Agent - Handles escalations
supervisor_agent = Agent(
    name="Supervisor Agent",
    instructions="""You are a supervisor handling escalated cases.

Your role:
1. Review escalated orders (especially high-value ones)
2. Approve or modify orders as needed
3. Resolve complex customer issues

You can transfer to any other agent as needed.""",
    functions=[
        approve_order,
        transfer_to_payment_processing,
        transfer_to_fulfillment,
        transfer_back_to_sales
    ]
)

# ============================================================================
# Usage Examples
# ============================================================================

def example_simple_handoff():
    """Example 1: Simple linear handoff flow."""
    print("\n" + "=" * 80)
    print("Example 1: Simple Handoff Flow (Sales → Verification → Payment → Fulfillment)")
    print("=" * 80)

    messages = [
        {"role": "user", "content": "I want to order 2 premium widgets for $500 total"}
    ]

    context_variables = {
        "customer_id": "CUST123",
        "customer_tier": "premium",
        "order_total": 500
    }

    # Start with sales agent
    response = client.run(
        agent=sales_agent,
        messages=messages,
        context_variables=context_variables
    )

    print(f"Current Agent: {response.agent.name}")
    print(f"Response: {response.messages[-1]['content']}")

    # Continue to verification
    messages = response.messages
    messages.append({"role": "user", "content": "Yes, verify the order please"})

    response = client.run(
        agent=response.agent,
        messages=messages,
        context_variables=context_variables
    )

    print(f"Current Agent: {response.agent.name}")
    print(f"Response: {response.messages[-1]['content']}")


def example_conditional_handoff():
    """Example 2: Conditional handoff based on order value."""
    print("\n" + "=" * 80)
    print("Example 2: Conditional Handoff (High-Value Order → Supervisor)")
    print("=" * 80)

    messages = [
        {"role": "user", "content": "I want to place a large enterprise order worth $15,000"}
    ]

    context_variables = {
        "customer_id": "CUST456",
        "customer_tier": "enterprise",
        "order_total": 15000
    }

    response = client.run(
        agent=sales_agent,
        messages=messages,
        context_variables=context_variables
    )

    print(f"Current Agent: {response.agent.name}")
    print(f"Context: {context_variables}")


def example_bidirectional_handoff():
    """Example 3: Bidirectional handoff (agent can go back)."""
    print("\n" + "=" * 80)
    print("Example 3: Bidirectional Handoff (Payment fails → Back to Sales)")
    print("=" * 80)

    messages = [
        {"role": "user", "content": "My payment failed, what should I do?"}
    ]

    context_variables = {
        "customer_id": "CUST789",
        "payment_failed": True
    }

    # Start at payment processing agent
    response = client.run(
        agent=payment_processing_agent,
        messages=messages,
        context_variables=context_variables
    )

    print(f"Current Agent: {response.agent.name}")
    print(f"Response: {response.messages[-1]['content']}")


def example_context_preservation():
    """Example 4: Context preservation across handoffs."""
    print("\n" + "=" * 80)
    print("Example 4: Context Preservation Across Handoffs")
    print("=" * 80)

    initial_context = {
        "customer_id": "CUST999",
        "customer_tier": "premium",
        "order_total": 750,
        "order_items": ["widget-pro", "widget-plus"],
        "delivery_address": "123 Main St, City, State 12345"
    }

    messages = [
        {"role": "user", "content": "I'm ready to complete my order"}
    ]

    response = client.run(
        agent=sales_agent,
        messages=messages,
        context_variables=initial_context
    )

    print(f"Initial Context: {initial_context}")
    print(f"Current Agent: {response.agent.name}")
    print("Context is automatically preserved across all handoffs!")


# ============================================================================
# Swarm Handoff Limitations
# ============================================================================

def demonstrate_limitations():
    """Demonstrate limitations of Swarm's handoff system."""
    print("\n" + "=" * 80)
    print("Swarm Handoff Limitations")
    print("=" * 80)

    limitations = [
        "1. NO DECLARATIVE HANDOFF RULES: Handoffs are coded in functions, not declared",
        "2. NO CONDITIONAL SYNTAX: Must write Python code for conditions",
        "3. NO HANDOFF OBSERVABILITY: Can't track handoff metrics or patterns",
        "4. NO HANDOFF POLICIES: Can't enforce rules like 'max 3 handoffs'",
        "5. MANUAL CONTEXT MANAGEMENT: Must manually pass context_variables",
        "6. NO HANDOFF APPROVAL: Can't require approval for certain handoffs",
        "7. NO HANDOFF ROLLBACK: Can't undo a handoff if it was wrong",
        "8. HARD TO TEST: Handoff logic scattered across functions",
    ]

    for limitation in limitations:
        print(f"  ❌ {limitation}")

    print("\n  ✓ OSSA solves ALL of these with declarative handoff configuration!")
    print("  See after-handoffs.ossa.yaml for the solution.")


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    print("OpenAI Swarm - Advanced Handoff Patterns")
    print("=" * 80)

    # Run examples
    example_simple_handoff()
    example_conditional_handoff()
    example_bidirectional_handoff()
    example_context_preservation()
    demonstrate_limitations()

    print("\n" + "=" * 80)
    print("Migration to OSSA")
    print("=" * 80)
    print("See after-handoffs.ossa.yaml for declarative handoff configuration.")
    print("\nOSSA Benefits:")
    print("  ✓ Declarative handoff rules (YAML, not code)")
    print("  ✓ Conditional handoffs with expression syntax")
    print("  ✓ Automatic context propagation (no manual passing)")
    print("  ✓ Handoff observability (metrics, tracing, logging)")
    print("  ✓ Handoff policies (max handoffs, approval rules)")
    print("  ✓ Easy testing and validation")
