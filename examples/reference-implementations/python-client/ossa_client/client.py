"""
OSSA API Client

Main client for interacting with the OSSA registry and core API.
Provides authentication, request handling, and error management.
"""

import time
from typing import Any, Dict, Optional
from urllib.parse import urljoin, urlencode

import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry


class OSSAAPIError(Exception):
    """Exception raised for OSSA API errors."""

    def __init__(self, message: str, status_code: int, api_error: Dict[str, Any]):
        super().__init__(message)
        self.status_code = status_code
        self.api_error = api_error


class OSSAClient:
    """
    Low-level HTTP client for OSSA API.

    Handles authentication, retries, rate limiting, and error handling.
    """

    def __init__(
        self,
        base_url: str = 'https://registry.openstandardagents.org/api/v1',
        api_key: Optional[str] = None,
        bearer_token: Optional[str] = None,
        timeout: int = 30,
        retries: int = 3,
    ):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.bearer_token = bearer_token
        self.timeout = timeout
        self.retries = retries

        # Configure session with retry strategy
        self.session = requests.Session()

        retry_strategy = Retry(
            total=retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=['GET', 'POST', 'PUT', 'DELETE'],
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)

    def request(
        self,
        method: str,
        path: str,
        body: Optional[Dict[str, Any]] = None,
        query: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Any:
        """
        Make an authenticated API request.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            path: API endpoint path
            body: Request body (will be JSON encoded)
            query: Query parameters
            headers: Additional headers

        Returns:
            Response data (parsed JSON or None for 204)

        Raises:
            OSSAAPIError: If the request fails
        """
        url = self._build_url(path, query)
        request_headers = self._build_headers(headers)

        for attempt in range(self.retries + 1):
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    json=body,
                    headers=request_headers,
                    timeout=self.timeout,
                )

                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', 60))
                    if attempt < self.retries:
                        time.sleep(retry_after)
                        continue

                if not response.ok:
                    error_data = response.json() if response.content else {}
                    raise OSSAAPIError(
                        error_data.get('message', f'HTTP {response.status_code}'),
                        response.status_code,
                        error_data,
                    )

                # Handle 204 No Content
                if response.status_code == 204:
                    return None

                return response.json()

            except requests.RequestException as e:
                if attempt < self.retries:
                    time.sleep(2**attempt)  # Exponential backoff
                    continue
                raise OSSAAPIError(str(e), 0, {'error': 'request_failed', 'message': str(e)})

        raise OSSAAPIError('Request failed after retries', 0, {'error': 'max_retries_exceeded'})

    def _build_url(self, path: str, query: Optional[Dict[str, Any]] = None) -> str:
        """Build full URL with query parameters."""
        url = urljoin(self.base_url, path.lstrip('/'))

        if query:
            # Filter out None values
            filtered_query = {k: v for k, v in query.items() if v is not None}
            if filtered_query:
                url = f"{url}?{urlencode(filtered_query)}"

        return url

    def _build_headers(self, custom_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """Build request headers with authentication."""
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'ossa-python-client/1.0.0',
        }

        if custom_headers:
            headers.update(custom_headers)

        if self.bearer_token:
            headers['Authorization'] = f'Bearer {self.bearer_token}'
        elif self.api_key:
            headers['X-API-Key'] = self.api_key

        return headers

    def close(self):
        """Close the session and cleanup resources."""
        self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
