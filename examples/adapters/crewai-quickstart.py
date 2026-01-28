#!/usr/bin/env python3
"""
CrewAI Quick Start - Convert OSSA to CrewAI

This example shows how to load an OSSA manifest and convert it
to CrewAI agent format for use in CrewAI applications.
"""

import yaml
import json
from pathlib import Path

def parse_role_text(role_text: str, description: str = "") -> dict:
    """Parse OSSA role text into CrewAI components"""
    lines = [l.strip() for l in role_text.split('\n') if l.strip()]

    role = lines[0] if lines else "AI Assistant"
    goal = description or "Assist users with their queries"
    backstory = "An AI agent designed to help users effectively"

    # Look for specific patterns
    for line in lines:
        if line.lower().startswith('goal:'):
            goal = line.split(':', 1)[1].strip()
        elif line.lower().startswith('backstory:'):
            backstory = line.split(':', 1)[1].strip()
        elif line.lower().startswith('role:'):
            role = line.split(':', 1)[1].strip()

    return {"role": role, "goal": goal, "backstory": backstory}

def ossa_to_crewai(manifest: dict) -> dict:
    """Convert OSSA manifest to CrewAI agent format"""
    spec = manifest.get('spec', {})
    metadata = manifest.get('metadata', {})
    tools = spec.get('tools', [])

    # Parse role components
    role_text = spec.get('role', '')
    role_info = parse_role_text(role_text, metadata.get('description', ''))

    # Convert tools
    tool_names = [tool.get('name', 'unknown_tool') for tool in tools]

    return {
        "role": role_info['role'],
        "goal": role_info['goal'],
        "backstory": role_info['backstory'],
        "tools": tool_names,
        "verbose": True,
        "allow_delegation": False,
        "llm_model": spec.get('llm', {}).get('model', 'gpt-4')
    }

# Load OSSA manifest
manifest_path = Path('./examples/getting-started/02-agent-with-tools.ossa.yaml')
with open(manifest_path, 'r') as f:
    ossa_manifest = yaml.safe_load(f)

# Convert to CrewAI format
crewai_agent = ossa_to_crewai(ossa_manifest)

print('CrewAI Agent Configuration:')
print(json.dumps(crewai_agent, indent=2))

"""
Usage:

1. Install dependencies:
   pip install pyyaml crewai

2. Run this example:
   python examples/adapters/crewai-quickstart.py

3. Use the configuration in your CrewAI application:

   from crewai import Agent

   agent = Agent(
       role=crewai_agent['role'],
       goal=crewai_agent['goal'],
       backstory=crewai_agent['backstory'],
       tools=crewai_agent['tools'],
       verbose=True
   )
"""
