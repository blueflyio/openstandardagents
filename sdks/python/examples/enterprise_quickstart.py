#!/usr/bin/env python3
"""
Enterprise Quick Start - OSSA Python SDK

This example demonstrates how enterprises can immediately start using
OSSA to define and manage AI agents in production.

Run this example:
    pip install ossa-sdk
    python enterprise_quickstart.py
"""

from pathlib import Path
from typing import List

from ossa import (
    AgentSpec,
    Autonomy,
    AutonomyLevel,
    LLMConfig,
    Metadata,
    Messaging,
    MessagingPubSub,
    OSSAKind,
    OSSAManifest,
    PIIDetection,
    RateLimit,
    Safety,
    Tool,
    export_manifest,
    validate_manifest,
)


def create_production_agent() -> OSSAManifest:
    """
    Create a production-ready agent with:
    - Safety controls (PII detection, rate limiting)
    - Tool integration
    - Autonomy controls
    - Messaging capabilities
    """
    manifest = OSSAManifest(
        apiVersion="ossa/v0.3.0",
        kind=OSSAKind.AGENT,
        metadata=Metadata(
            name="enterprise-support-agent",
            version="1.0.0",
            description="Production customer support agent with safety controls",
            labels={
                "team": "customer-success",
                "environment": "production",
                "compliance": "soc2",
                "cost-center": "support-automation",
            },
        ),
        spec=AgentSpec(
            role="""You are an enterprise customer support AI agent for Acme Corporation.

Your responsibilities:
1. Answer customer questions about our products and services
2. Escalate complex issues to human agents
3. Maintain professional and empathetic communication
4. Follow data privacy and compliance guidelines

Guidelines:
- Never share internal company information
- Always ask for clarification if uncertain
- Escalate to human if customer requests it
- Log all interactions for audit purposes

Available products: Widget Pro, Widget Enterprise, Widget Cloud""",
            llm=LLMConfig(
                provider="anthropic",
                model="claude-sonnet-4-20250514",
                temperature=0.3,  # Lower temperature for consistent responses
                max_tokens=4096,
            ),
            tools=[
                Tool(
                    name="knowledge-base",
                    type="mcp",
                    description="Search company knowledge base and documentation",
                    config={
                        "server": "knowledge-base-mcp",
                        "index": "support-docs",
                        "max_results": 5,
                    },
                ),
                Tool(
                    name="ticket-system",
                    type="api",
                    description="Create and update support tickets",
                    config={
                        "base_url": "https://tickets.acme.corp",
                        "auth": "Bearer ${TICKET_API_KEY}",
                    },
                ),
                Tool(
                    name="escalation",
                    type="function",
                    description="Escalate to human agent",
                    parameters={
                        "type": "object",
                        "properties": {
                            "reason": {"type": "string"},
                            "priority": {"type": "string", "enum": ["low", "medium", "high"]},
                            "context": {"type": "string"},
                        },
                        "required": ["reason", "priority"],
                    },
                ),
            ],
            safety=Safety(
                pii_detection=PIIDetection(
                    enabled=True,
                    redact=True,
                    patterns=[
                        r"\b\d{3}-\d{2}-\d{4}\b",  # SSN
                        r"\b\d{16}\b",  # Credit card
                        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",  # Email
                    ],
                ),
                rate_limits=RateLimit(
                    requests_per_minute=60,  # Max 60 requests per minute
                    requests_per_hour=1000,  # Max 1000 requests per hour
                    tokens_per_minute=100000,  # Budget control
                ),
                allowed_domains=[
                    "acme.corp",
                    "api.acme.corp",
                    "tickets.acme.corp",
                ],
                max_retries=3,
                timeout_seconds=30,
            ),
            autonomy=Autonomy(
                level=AutonomyLevel.MEDIUM,
                require_approval=[
                    "create_ticket",
                    "escalate_to_human",
                    "update_customer_record",
                ],
                auto_approve=[
                    "search_knowledge_base",
                    "send_response",
                ],
            ),
            messaging=Messaging(
                enabled=True,
                pubsub=MessagingPubSub(
                    subscribe=["customer.inquiry", "ticket.update"],
                    publish=["agent.response", "agent.escalation"],
                ),
            ),
        ),
    )

    return manifest


def create_data_processing_agent() -> OSSAManifest:
    """
    Create a data processing agent for batch operations.
    """
    return OSSAManifest(
        apiVersion="ossa/v0.3.0",
        kind=OSSAKind.AGENT,
        metadata=Metadata(
            name="data-enrichment-agent",
            version="1.0.0",
            description="Enriches customer data with AI-generated insights",
            labels={
                "team": "data-platform",
                "environment": "production",
                "cost-center": "analytics",
            },
        ),
        spec=AgentSpec(
            role="""You are a data enrichment agent that analyzes customer records
and generates insights for marketing and sales teams.

Your tasks:
1. Analyze customer interaction history
2. Generate sentiment scores
3. Identify upsell opportunities
4. Flag at-risk customers

Output format: Structured JSON with insights and confidence scores.""",
            llm=LLMConfig(
                provider="anthropic",
                model="claude-sonnet-4-20250514",
                temperature=0.1,  # Very low for deterministic output
                max_tokens=2048,
            ),
            safety=Safety(
                pii_detection=PIIDetection(enabled=True, redact=True),
                rate_limits=RateLimit(tokens_per_minute=50000),
            ),
        ),
    )


def validate_and_export_agents(agents: List[OSSAManifest], output_dir: Path) -> None:
    """
    Validate agents and export them to files.
    """
    output_dir.mkdir(exist_ok=True)

    for agent in agents:
        # Validate
        result = validate_manifest(agent, strict=True)

        if result.valid:
            print(f"✓ {agent.metadata.name} - Valid")

            # Export to YAML
            yaml_path = output_dir / f"{agent.metadata.name}.ossa.yaml"
            export_manifest(agent, format="yaml", output_path=yaml_path)
            print(f"  Exported to: {yaml_path}")

            # Also export to JSON for CI/CD pipelines
            json_path = output_dir / f"{agent.metadata.name}.json"
            export_manifest(agent, format="json", output_path=json_path)
            print(f"  JSON: {json_path}")

            if result.warnings:
                print("  Warnings:")
                for warning in result.warnings:
                    print(f"    - {warning}")
        else:
            print(f"✗ {agent.metadata.name} - Invalid")
            for error in result.errors:
                print(f"  - {error}")

        print()


def main() -> None:
    """
    Main function - Create and validate production agents.
    """
    print("=" * 70)
    print("Enterprise OSSA Python SDK - Quick Start")
    print("=" * 70)
    print()

    # Create production agents
    print("Creating production agents...")
    agents = [
        create_production_agent(),
        create_data_processing_agent(),
    ]
    print(f"Created {len(agents)} agents\n")

    # Validate and export
    output_dir = Path("./output/agents")
    print(f"Validating and exporting to: {output_dir}\n")
    validate_and_export_agents(agents, output_dir)

    # Summary
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print()
    print("✓ Agents created and validated")
    print("✓ YAML manifests exported (for deployment)")
    print("✓ JSON manifests exported (for CI/CD)")
    print()
    print("Next steps:")
    print("1. Review generated manifests in ./output/agents/")
    print("2. Customize agents for your use case")
    print("3. Deploy agents to your OSSA runtime")
    print("4. Monitor and iterate")
    print()
    print("Documentation: https://openstandardagents.org/docs")
    print("=" * 70)


if __name__ == "__main__":
    main()
