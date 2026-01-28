"""
OSSA Agent-to-Agent Messaging

Client methods for A2A messaging, webhooks, and event streaming.
"""

from typing import Any, Dict, Iterator, List, Optional
from .client import OSSAClient


class MessagingClient:
    """
    Messaging operations client for A2A communication.
    """

    def __init__(self, client: OSSAClient):
        self._client = client

    def send_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send an A2A message.

        Args:
            message: Message with from, to, type, capability, payload, and metadata

        Returns:
            Message ID and delivery status
        """
        return self._client.request('POST', '/messaging/send', body=message)

    def send_request(self, message: Dict[str, Any], timeout: int = 30000) -> Dict[str, Any]:
        """
        Send a request and wait for response (synchronous-style).

        Args:
            message: Message (without 'type' field)
            timeout: Timeout in milliseconds

        Returns:
            Request ID, response, and status
        """
        return self._client.request(
            'POST',
            '/messaging/request',
            body={**message, 'timeout': timeout},
        )

    def get_message_status(self, message_id: str) -> Dict[str, Any]:
        """
        Get message status.

        Args:
            message_id: Message ID

        Returns:
            Message status and delivery information
        """
        return self._client.request('GET', f'/messaging/messages/{message_id}')

    def broadcast(self, message: Dict[str, Any], filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Broadcast message to multiple agents.

        Args:
            message: Message to broadcast (without 'to' and 'type' fields)
            filters: Recipient filters (domain, capability, tags)

        Returns:
            Broadcast ID and recipient count
        """
        return self._client.request(
            'POST',
            '/messaging/broadcast',
            body={'message': message, 'filters': filters},
        )

    def register_webhook(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a webhook.

        Args:
            config: Webhook configuration (url, events, filters, headers, retry_config)

        Returns:
            Webhook ID and configuration
        """
        return self._client.request('POST', '/messaging/webhooks', body=config)

    def list_webhooks(self) -> Dict[str, Any]:
        """
        List registered webhooks.

        Returns:
            List of webhooks with their configurations
        """
        return self._client.request('GET', '/messaging/webhooks')

    def get_webhook(self, webhook_id: str) -> Dict[str, Any]:
        """
        Get webhook details.

        Args:
            webhook_id: Webhook ID

        Returns:
            Webhook configuration and stats
        """
        return self._client.request('GET', f'/messaging/webhooks/{webhook_id}')

    def update_webhook(self, webhook_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update webhook configuration.

        Args:
            webhook_id: Webhook ID
            config: Updated configuration

        Returns:
            Updated webhook configuration
        """
        return self._client.request('PUT', f'/messaging/webhooks/{webhook_id}', body=config)

    def delete_webhook(self, webhook_id: str) -> None:
        """
        Delete webhook.

        Args:
            webhook_id: Webhook ID
        """
        self._client.request('DELETE', f'/messaging/webhooks/{webhook_id}')

    def subscribe(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """
        Subscribe to agent events.

        Args:
            subscription: Subscription config (agent, events, filters, delivery_mode, config)

        Returns:
            Subscription ID and status
        """
        return self._client.request('POST', '/messaging/subscriptions', body=subscription)

    def list_subscriptions(self) -> Dict[str, Any]:
        """
        List event subscriptions.

        Returns:
            List of active subscriptions
        """
        return self._client.request('GET', '/messaging/subscriptions')

    def poll_events(
        self,
        subscription_id: str,
        limit: Optional[int] = None,
        since: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Poll for events (for polling-mode subscriptions).

        Args:
            subscription_id: Subscription ID
            limit: Maximum events to return
            since: Return events since this cursor

        Returns:
            Events list and pagination info
        """
        query = {}
        if limit:
            query['limit'] = limit
        if since:
            query['since'] = since

        return self._client.request('GET', f'/messaging/subscriptions/{subscription_id}/poll', query=query)

    def stream_events(self, options: Optional[Dict[str, Any]] = None) -> Iterator[Dict[str, Any]]:
        """
        Stream events using Server-Sent Events (SSE).

        Args:
            options: Stream options (agent, event_types, from_timestamp, batch_size)

        Yields:
            Agent events as they arrive

        Note:
            This is a basic implementation. For production use, consider using
            a dedicated SSE library like `sseclient-py`.
        """
        import json

        params = {}
        if options:
            if 'agent' in options:
                params['publisher'] = options['agent']['publisher']
                params['name'] = options['agent']['name']
            if 'event_types' in options:
                params['events'] = ','.join(options['event_types'])
            if 'from_timestamp' in options:
                params['from'] = options['from_timestamp']
            if 'batch_size' in options:
                params['batch_size'] = options['batch_size']

        url = self._client._build_url('/messaging/stream', params)
        headers = self._client._build_headers()

        import requests

        response = requests.get(url, headers=headers, stream=True, timeout=None)
        response.raise_for_status()

        buffer = ''
        for line in response.iter_lines(decode_unicode=True):
            if line:
                buffer += line + '\n'
                if line.startswith('data: '):
                    data = line[6:]
                    if data == '[DONE]':
                        return

                    try:
                        event = json.loads(data)
                        yield event
                    except json.JSONDecodeError:
                        continue
