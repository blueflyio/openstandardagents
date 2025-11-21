---
title: OSSA Agents in Python
description: How to organize and discover OSSA agents in Python packages
---

# OSSA Agents in Python

This guide explains how to organize and discover OSSA agents within Python packages using the standard `.agents/` folder structure.

## Folder Structure

### Package-Level Agents

```
my-python-package/
├── .agents/                    # Package-specific agents
│   └── package-agent/
│       ├── agent.ossa.yaml    # Required: OSSA manifest
│       └── README.md          # Recommended: Documentation
├── my_package/
│   └── __init__.py
└── setup.py
```

## Discovery

Python packages can include agents in their distribution, discoverable via `importlib` or package metadata. The OSSA Python integration automatically discovers and registers agents.

### Include Agents in Package

```python
# In setup.py
from setuptools import setup, find_packages

setup(
    name='my-python-package',
    packages=find_packages(),
    package_data={
        'my_package': ['.agents/**/*'],
    },
)
```

## Using Agents

### Load Agent

```python
# In my_package/__init__.py
from ossa import discover_agent

def get_agent():
    return discover_agent('package-agent', 'my_python_package')

# Use agent
agent = get_agent()
result = agent.process_task(data)
```

### Discover All Package Agents

```python
# Discover all agents in a package
from ossa import discover_package_agents

agents = discover_package_agents('my_python_package')
for agent in agents:
    # Use agent
    result = agent.process_task(data)
```

## Example: Package Agent

See [examples/python/package-with-agents/.agents/package-agent/](../../../../examples/python/package-with-agents/.agents/package-agent/) for a complete example.

## Best Practices

- **Include agents in package distribution** via `package_data`
- **Use package-level agents** for package-specific functionality
- **Include README.md** in each agent folder
- **Use taxonomy** to enable capability-based discovery
- **Use importlib** for agent discovery

## Related

- [Workspace Discovery](/docs/core-concepts/Workspace-Discovery)
- [Project Structure](/docs/core-concepts/Project-Structure)
- [Example: Python Package](../../../../examples/python/package-with-agents/)

