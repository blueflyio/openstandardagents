# Python Package with OSSA Agents

This example demonstrates how to organize OSSA agents within a Python package using the standard `.agents/` folder structure.

## Structure

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

## Agent Example

See `.agents/package-agent/` for a complete example of a data processing agent.

## Usage

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

### Use Agent in Code

```python
# In my_package/__init__.py
from ossa import discover_agent

def get_agent():
    return discover_agent('package-agent', 'my_python_package')

# Use agent
agent = get_agent()
result = agent.transform_data(data)
```

## Related

- [OSSA Python Integration Guide](../../../../website/content/docs/ecosystems/python-agents.md)
- [Workspace Discovery](../../../../website/content/docs/core-concepts/Workspace-Discovery.md)

