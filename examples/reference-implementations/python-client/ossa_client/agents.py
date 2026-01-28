"""
OSSA Agent Operations

Client methods for agent discovery, publishing, and lifecycle management.
"""

from typing import Any, Dict, List, Optional
from .client import OSSAClient


class AgentClient:
    """
    Agent operations client for OSSA registry.

    Provides methods for searching, publishing, and managing agents.
    """

    def __init__(self, client: OSSAClient):
        self._client = client

    def search(
        self,
        q: Optional[str] = None,
        tag: Optional[str] = None,
        capability: Optional[str] = None,
        domain: Optional[str] = None,
        publisher: Optional[str] = None,
        license: Optional[str] = None,
        compliance: Optional[str] = None,
        verified: Optional[bool] = None,
        min_rating: Optional[float] = None,
        sort: str = 'relevance',
        limit: int = 20,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Search and list agents.

        Args:
            q: Full-text search query
            tag: Filter by tag
            capability: Filter by capability
            domain: Filter by domain
            publisher: Filter by publisher
            license: Filter by license (SPDX identifier)
            compliance: Filter by compliance profile
            verified: Only verified publishers
            min_rating: Minimum rating (1-5)
            sort: Sort order (downloads, rating, updated, created, relevance)
            limit: Results per page (max 100)
            offset: Pagination offset

        Returns:
            Search results with agents list and metadata
        """
        return self._client.request(
            'GET',
            '/agents',
            query={
                'q': q,
                'tag': tag,
                'capability': capability,
                'domain': domain,
                'publisher': publisher,
                'license': license,
                'compliance': compliance,
                'verified': verified,
                'min_rating': min_rating,
                'sort': sort,
                'limit': limit,
                'offset': offset,
            },
        )

    def publish(
        self,
        manifest: Dict[str, Any],
        package: Dict[str, Any],
        license: str,
        documentation: Optional[Dict[str, str]] = None,
        keywords: Optional[List[str]] = None,
        dependencies: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Publish a new agent or version.

        Args:
            manifest: OSSA agent manifest
            package: Package information (tarball_url, shasum, size_bytes)
            license: SPDX license identifier
            documentation: Documentation URLs (readme, changelog, repository)
            keywords: Agent keywords (max 20)
            dependencies: Agent dependencies

        Returns:
            Publish response with status and verification info
        """
        return self._client.request(
            'POST',
            '/agents',
            body={
                'manifest': manifest,
                'package': package,
                'license': license,
                'documentation': documentation,
                'keywords': keywords,
                'dependencies': dependencies,
            },
        )

    def get(self, publisher: str, name: str) -> Dict[str, Any]:
        """
        Get agent details (latest version).

        Args:
            publisher: Publisher identifier
            name: Agent name

        Returns:
            Agent details including metadata, stats, and versions
        """
        return self._client.request('GET', f'/agents/{publisher}/{name}')

    def get_version(self, publisher: str, name: str, version: str) -> Dict[str, Any]:
        """
        Get specific agent version.

        Args:
            publisher: Publisher identifier
            name: Agent name
            version: Semantic version

        Returns:
            Agent version details
        """
        return self._client.request('GET', f'/agents/{publisher}/{name}/{version}')

    def list_versions(self, publisher: str, name: str) -> Dict[str, Any]:
        """
        List all versions of an agent.

        Args:
            publisher: Publisher identifier
            name: Agent name

        Returns:
            List of agent versions with metadata
        """
        return self._client.request('GET', f'/agents/{publisher}/{name}/versions')

    def unpublish(
        self,
        publisher: str,
        name: str,
        version: str,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Unpublish a specific agent version.

        Args:
            publisher: Publisher identifier
            name: Agent name
            version: Semantic version
            reason: Reason for unpublishing

        Returns:
            Unpublish confirmation
        """
        body = {'reason': reason} if reason else None
        return self._client.request('DELETE', f'/agents/{publisher}/{name}/{version}', body=body)

    def deprecate(
        self,
        publisher: str,
        name: str,
        version: str,
        reason: str,
        replacement_version: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Deprecate a specific agent version.

        Args:
            publisher: Publisher identifier
            name: Agent name
            version: Semantic version to deprecate
            reason: Reason for deprecation
            replacement_version: Recommended replacement version

        Returns:
            Deprecation confirmation
        """
        return self._client.request(
            'POST',
            f'/agents/{publisher}/{name}/{version}/deprecate',
            body={
                'reason': reason,
                'replacement_version': replacement_version,
            },
        )

    def get_dependencies(
        self,
        publisher: str,
        name: str,
        version: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get agent dependencies.

        Args:
            publisher: Publisher identifier
            name: Agent name
            version: Specific version (default: latest)

        Returns:
            Dependencies with version resolution and dependency tree
        """
        query = {'version': version} if version else None
        return self._client.request('GET', f'/agents/{publisher}/{name}/dependencies', query=query)

    def get_stats(
        self,
        publisher: str,
        name: str,
        period: str = 'all',
    ) -> Dict[str, Any]:
        """
        Get agent download and usage statistics.

        Args:
            publisher: Publisher identifier
            name: Agent name
            period: Time period (day, week, month, year, all)

        Returns:
            Statistics including downloads and installs
        """
        return self._client.request('GET', f'/agents/{publisher}/{name}/stats', query={'period': period})
