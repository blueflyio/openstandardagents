"""
OSSA Python Client SDK

Complete SDK for interacting with the OSSA Registry and Core API.

Example:
    ```python
    from ossa_client import OSSA

    client = OSSA(bearer_token='ossa_tok_xxx')

    # Search for agents
    results = client.agents.search(domain='security', limit=10)

    # Get agent details
    agent = client.agents.get('blueflyio', 'security-scanner')

    # Send A2A message
    client.messaging.send_message({
        'from': {'publisher': 'myorg', 'name': 'my-agent'},
        'to': {'publisher': 'blueflyio', 'name': 'security-scanner'},
        'type': 'request',
        'capability': 'vulnerability-scan',
        'payload': {'target': 'https://example.com'}
    })
    ```
"""

from .client import OSSAClient, OSSAAPIError
from .agents import AgentClient
from .discovery import DiscoveryClient
from .messaging import MessagingClient

__version__ = '1.0.0'
__all__ = [
    'OSSA',
    'OSSAClient',
    'OSSAAPIError',
    'AgentClient',
    'DiscoveryClient',
    'MessagingClient',
]


class OSSA:
    """
    Main OSSA SDK class providing access to all API operations.

    Args:
        base_url: Base URL for the OSSA API (default: production registry)
        api_key: API key for authentication (optional)
        bearer_token: Bearer token for authentication (optional)
        timeout: Request timeout in seconds (default: 30)
        retries: Number of retries for failed requests (default: 3)
    """

    def __init__(
        self,
        base_url: str = 'https://registry.openstandardagents.org/api/v1',
        api_key: str | None = None,
        bearer_token: str | None = None,
        timeout: int = 30,
        retries: int = 3,
    ):
        self._client = OSSAClient(
            base_url=base_url,
            api_key=api_key,
            bearer_token=bearer_token,
            timeout=timeout,
            retries=retries,
        )

        self.agents = AgentClient(self._client)
        self.discovery = DiscoveryClient(self._client)
        self.messaging = MessagingClient(self._client)

    @property
    def client(self) -> OSSAClient:
        """Get the underlying client instance."""
        return self._client
