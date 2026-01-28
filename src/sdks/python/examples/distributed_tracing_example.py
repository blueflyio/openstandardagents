#!/usr/bin/env python3
"""
OSSA Distributed Tracing Example

Demonstrates W3C Baggage usage for multi-agent correlation and tracing.

Scenario:
- User request comes to orchestrator agent
- Orchestrator delegates to analyzer agent
- Analyzer delegates to reviewer agent
- All agents share same trace context
- Parent-child relationships tracked
- Custom metadata propagated

This example shows:
1. Creating root trace context
2. Propagating context across HTTP boundaries
3. Creating child contexts for delegation
4. Extracting and using trace information
5. Multi-level agent chains
"""

from typing import Dict, Any
from ossa.tracing import (
    TraceContext,
    W3CBaggage,
    create_ossa_baggage,
    propagate_ossa_context,
)


def simulate_http_request(url: str, headers: Dict[str, str], data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simulates an HTTP request with trace context propagation.

    In real implementation, this would be:
    response = requests.post(url, headers=headers, json=data)
    """
    print(f"\n→ HTTP Request to {url}")
    print(f"  Headers: {headers}")
    print(f"  Data: {data}")

    # Extract baggage from headers
    incoming_context = TraceContext.from_headers(headers)

    print(f"  Trace ID: {incoming_context.correlation.trace_id}")
    print(f"  Correlation ID: {incoming_context.correlation.correlation_id}")

    # Simulate response with updated context
    return {
        "status": "success",
        "headers": incoming_context.headers,
        "data": {"result": "processed"}
    }


class OrchestratorAgent:
    """
    Orchestrator agent - coordinates multi-agent workflows.

    Responsibilities:
    - Receives user requests
    - Creates root trace context
    - Delegates to specialized agents
    - Aggregates results
    """

    def __init__(self, agent_id: str = "orchestrator"):
        self.agent_id = agent_id

    def handle_request(self, user_request: str, interaction_id: str) -> Dict[str, Any]:
        """
        Handle user request with full trace context.

        Args:
            user_request: User's request text
            interaction_id: Unique interaction identifier

        Returns:
            Response with trace context
        """
        print("=" * 80)
        print(f"ORCHESTRATOR: Handling request")
        print("=" * 80)

        # Create root trace context
        context = TraceContext.create(
            agent_id=self.agent_id,
            interaction_id=interaction_id,
            workflow_id="approval-workflow",
            tenant_id="tenant-001",
            environment="production",
            user_request=user_request
        )

        print(f"\n📋 Root Context Created:")
        print(f"  Agent ID: {context.correlation.agent_id}")
        print(f"  Interaction ID: {context.correlation.interaction_id}")
        print(f"  Trace ID: {context.correlation.trace_id}")
        print(f"  Span ID: {context.correlation.span_id}")
        print(f"  Workflow ID: {context.baggage.get_ossa_context().workflow_id}")

        # Delegate to analyzer
        analyzer_result = self._delegate_to_analyzer(context, user_request)

        # Aggregate results
        result = {
            "status": "completed",
            "trace_id": context.correlation.trace_id,
            "interaction_id": interaction_id,
            "workflow_id": "approval-workflow",
            "analyzer_result": analyzer_result,
        }

        print(f"\n✓ Orchestrator completed workflow")
        print(f"  Final Result: {result['status']}")

        return result

    def _delegate_to_analyzer(
        self,
        parent_context: TraceContext,
        request: str
    ) -> Dict[str, Any]:
        """Delegate to analyzer agent."""
        print(f"\n→ Delegating to Analyzer Agent")

        # Create child context for analyzer
        analyzer_context = parent_context.create_child_context(
            child_agent_id="analyzer",
            step="analysis",
            task="analyze_request"
        )

        print(f"  Child Context Created:")
        print(f"    Agent ID: {analyzer_context.correlation.agent_id}")
        print(f"    Parent Agent: {analyzer_context.baggage.get_ossa_context().parent_agent_id}")
        print(f"    Trace ID: {analyzer_context.correlation.trace_id} (same as parent)")
        print(f"    Span ID: {analyzer_context.correlation.span_id} (new)")

        # Simulate HTTP call to analyzer
        analyzer = AnalyzerAgent()
        result = analyzer.analyze(request, analyzer_context.headers)

        return result


class AnalyzerAgent:
    """
    Analyzer agent - analyzes requests and delegates to reviewer.

    Responsibilities:
    - Receives requests from orchestrator
    - Performs analysis
    - Delegates to reviewer for approval
    - Returns combined results
    """

    def __init__(self, agent_id: str = "analyzer"):
        self.agent_id = agent_id

    def analyze(self, request: str, headers: Dict[str, str]) -> Dict[str, Any]:
        """
        Analyze request with trace context from headers.

        Args:
            request: Request to analyze
            headers: HTTP headers with trace context

        Returns:
            Analysis result with trace context
        """
        print("\n" + "=" * 80)
        print(f"ANALYZER: Analyzing request")
        print("=" * 80)

        # Parse incoming trace context
        incoming_context = TraceContext.from_headers(headers)

        print(f"\n📋 Incoming Context:")
        print(f"  Trace ID: {incoming_context.correlation.trace_id}")
        print(f"  Parent Agent: {incoming_context.baggage.get_ossa_context().parent_agent_id}")

        # Perform analysis
        analysis = {
            "complexity": "medium",
            "estimated_time": "5 minutes",
            "requires_review": True
        }

        print(f"\n🔍 Analysis Results: {analysis}")

        # Delegate to reviewer if needed
        if analysis["requires_review"]:
            review_result = self._delegate_to_reviewer(incoming_context, analysis)
            analysis["review"] = review_result

        print(f"\n✓ Analyzer completed analysis")

        return {
            "analysis": analysis,
            "trace_id": incoming_context.correlation.trace_id,
            "analyzer_id": self.agent_id
        }

    def _delegate_to_reviewer(
        self,
        parent_context: TraceContext,
        analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Delegate to reviewer agent."""
        print(f"\n→ Delegating to Reviewer Agent")

        # Create child context for reviewer
        reviewer_context = parent_context.create_child_context(
            child_agent_id="reviewer",
            step="review",
            task="approve_analysis"
        )

        print(f"  Child Context Created:")
        print(f"    Agent ID: {reviewer_context.correlation.agent_id}")
        print(f"    Parent Agent: {reviewer_context.baggage.get_ossa_context().parent_agent_id}")
        print(f"    Trace ID: {reviewer_context.correlation.trace_id} (same as root)")
        print(f"    Span ID: {reviewer_context.correlation.span_id} (new)")

        # Simulate HTTP call to reviewer
        reviewer = ReviewerAgent()
        result = reviewer.review(analysis, reviewer_context.headers)

        return result


class ReviewerAgent:
    """
    Reviewer agent - reviews and approves analysis results.

    Responsibilities:
    - Receives analysis from analyzer
    - Performs review
    - Returns approval decision
    """

    def __init__(self, agent_id: str = "reviewer"):
        self.agent_id = agent_id

    def review(self, analysis: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
        """
        Review analysis with trace context from headers.

        Args:
            analysis: Analysis to review
            headers: HTTP headers with trace context

        Returns:
            Review result with trace context
        """
        print("\n" + "=" * 80)
        print(f"REVIEWER: Reviewing analysis")
        print("=" * 80)

        # Parse incoming trace context
        incoming_context = TraceContext.from_headers(headers)

        print(f"\n📋 Incoming Context:")
        print(f"  Trace ID: {incoming_context.correlation.trace_id}")
        print(f"  Parent Agent: {incoming_context.baggage.get_ossa_context().parent_agent_id}")
        print(f"  Workflow ID: {incoming_context.baggage.get_ossa_context().workflow_id}")

        # Perform review
        review = {
            "approved": True,
            "confidence": 0.95,
            "comments": "Analysis looks good"
        }

        print(f"\n✅ Review Results: {review}")
        print(f"\n✓ Reviewer completed review")

        return {
            "review": review,
            "trace_id": incoming_context.correlation.trace_id,
            "reviewer_id": self.agent_id
        }


def demonstrate_simple_propagation():
    """Demonstrate simple W3C Baggage propagation."""
    print("\n" + "=" * 80)
    print("DEMO: Simple W3C Baggage Propagation")
    print("=" * 80)

    # Create parent baggage
    parent_baggage = create_ossa_baggage(
        agent_id="parent-agent",
        interaction_id="int-123",
        workflow_id="simple-workflow",
        environment="demo"
    )

    print(f"\n📦 Parent Baggage:")
    parent_ctx = parent_baggage.get_ossa_context()
    print(f"  Agent ID: {parent_ctx.agent_id}")
    print(f"  Interaction ID: {parent_ctx.interaction_id}")
    print(f"  Trace ID: {parent_ctx.trace_id}")
    print(f"  Custom: {parent_ctx.custom}")

    # Propagate to child
    child_baggage = propagate_ossa_context(parent_baggage, "child-agent")

    print(f"\n📦 Child Baggage:")
    child_ctx = child_baggage.get_ossa_context()
    print(f"  Agent ID: {child_ctx.agent_id}")
    print(f"  Parent Agent ID: {child_ctx.parent_agent_id}")
    print(f"  Trace ID: {child_ctx.trace_id} (inherited)")
    print(f"  Span ID: {child_ctx.span_id} (new)")

    # Convert to HTTP headers
    headers = child_baggage.to_headers()
    print(f"\n🌐 HTTP Headers:")
    print(f"  {headers}")

    # Parse back
    parsed = W3CBaggage.parse(headers["baggage"])
    parsed_ctx = parsed.get_ossa_context()
    print(f"\n📋 Parsed Context:")
    print(f"  Agent ID: {parsed_ctx.agent_id}")
    print(f"  Parent Agent ID: {parsed_ctx.parent_agent_id}")


def demonstrate_multi_agent_workflow():
    """Demonstrate complete multi-agent workflow."""
    print("\n" + "=" * 80)
    print("DEMO: Multi-Agent Workflow with Trace Context")
    print("=" * 80)

    # Create orchestrator
    orchestrator = OrchestratorAgent()

    # Simulate user request
    result = orchestrator.handle_request(
        user_request="Please analyze and approve this document",
        interaction_id="user-session-456"
    )

    print("\n" + "=" * 80)
    print("WORKFLOW COMPLETE")
    print("=" * 80)
    print(f"\n📊 Final Result:")
    print(f"  Status: {result['status']}")
    print(f"  Trace ID: {result['trace_id']}")
    print(f"  Interaction ID: {result['interaction_id']}")
    print(f"  Workflow ID: {result['workflow_id']}")


def demonstrate_trace_hierarchy():
    """Demonstrate trace hierarchy visualization."""
    print("\n" + "=" * 80)
    print("DEMO: Trace Hierarchy Visualization")
    print("=" * 80)

    # Create root
    root = TraceContext.create(
        agent_id="root",
        interaction_id="int-789"
    )

    # Create children
    child1 = root.create_child_context(child_agent_id="child-1")
    child2 = root.create_child_context(child_agent_id="child-2")

    # Create grandchildren
    grandchild1 = child1.create_child_context(child_agent_id="grandchild-1")
    grandchild2 = child1.create_child_context(child_agent_id="grandchild-2")

    print(f"\n🌳 Trace Hierarchy:")
    print(f"  Root (trace_id: {root.correlation.trace_id[:8]}...)")
    print(f"  ├─ Child 1 (span_id: {child1.correlation.span_id[:8]}...)")
    print(f"  │  ├─ Grandchild 1 (span_id: {grandchild1.correlation.span_id[:8]}...)")
    print(f"  │  └─ Grandchild 2 (span_id: {grandchild2.correlation.span_id[:8]}...)")
    print(f"  └─ Child 2 (span_id: {child2.correlation.span_id[:8]}...)")

    print(f"\n✓ All contexts share same trace_id:")
    print(f"  Root:        {root.correlation.trace_id}")
    print(f"  Child 1:     {child1.correlation.trace_id}")
    print(f"  Grandchild 1: {grandchild1.correlation.trace_id}")
    print(f"  Child 2:     {child2.correlation.trace_id}")

    assert (
        root.correlation.trace_id ==
        child1.correlation.trace_id ==
        grandchild1.correlation.trace_id ==
        child2.correlation.trace_id
    )


def main():
    """Run all demonstrations."""
    print("\n" + "╔" + "=" * 78 + "╗")
    print("║" + " " * 20 + "OSSA Distributed Tracing Examples" + " " * 25 + "║")
    print("╚" + "=" * 78 + "╝")

    try:
        # Demo 1: Simple propagation
        demonstrate_simple_propagation()

        # Demo 2: Multi-agent workflow
        demonstrate_multi_agent_workflow()

        # Demo 3: Trace hierarchy
        demonstrate_trace_hierarchy()

        print("\n" + "=" * 80)
        print("✓ All demonstrations completed successfully!")
        print("=" * 80)

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
