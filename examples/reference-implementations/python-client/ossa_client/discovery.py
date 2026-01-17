"""
OSSA Discovery Operations

Client methods for discovering agents by taxonomy, capabilities, and compliance.
"""

from typing import Any, Dict, List, Optional
from .client import OSSAClient


class DiscoveryClient:
    """
    Discovery operations client for finding agents by various criteria.
    """

    def __init__(self, client: OSSAClient):
        self._client = client

    def list_taxonomies(self) -> Dict[str, Any]:
        """
        List available agent taxonomies.

        Returns:
            Available taxonomies with domains, subdomains, and capabilities
        """
        return self._client.request('GET', '/specification/taxonomies')

    def list_capabilities(self, domain: Optional[str] = None) -> Dict[str, Any]:
        """
        List available capabilities.

        Args:
            domain: Filter by domain

        Returns:
            Available capabilities with definitions and examples
        """
        query = {'domain': domain} if domain else None
        return self._client.request('GET', '/specification/capabilities', query=query)

    def get_capability(self, capability_name: str) -> Dict[str, Any]:
        """
        Get capability definition.

        Args:
            capability_name: Capability name

        Returns:
            Capability definition with schema and example agents
        """
        return self._client.request('GET', f'/specification/capabilities/{capability_name}')

    def list_compliance_profiles(self) -> Dict[str, Any]:
        """
        List available compliance profiles.

        Returns:
            Available compliance profiles (FedRAMP, HIPAA, SOC2, etc.)
        """
        return self._client.request('GET', '/specification/compliance')

    def get_compliance_profile(self, profile_id: str) -> Dict[str, Any]:
        """
        Get compliance profile details.

        Args:
            profile_id: Compliance profile ID

        Returns:
            Compliance profile requirements and agent count
        """
        return self._client.request('GET', f'/specification/compliance/{profile_id}')

    def discover_by_taxonomy(
        self,
        domain: str,
        subdomain: Optional[str] = None,
        capability: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Discover agents by taxonomy.

        Args:
            domain: Taxonomy domain
            subdomain: Taxonomy subdomain (optional)
            capability: Specific capability (optional)

        Returns:
            Agents matching the taxonomy criteria
        """
        query = {'domain': domain}
        if subdomain:
            query['subdomain'] = subdomain
        if capability:
            query['capability'] = capability

        return self._client.request('GET', '/agents/discover/taxonomy', query=query)

    def discover_by_compliance(self, profiles: List[str]) -> Dict[str, Any]:
        """
        Discover agents by compliance requirements.

        Args:
            profiles: List of compliance profile IDs

        Returns:
            Agents matching the compliance requirements
        """
        return self._client.request(
            'GET',
            '/agents/discover/compliance',
            query={'profiles': ','.join(profiles)},
        )

    def get_recommendations(
        self,
        use_case: str,
        requirements: Optional[Dict[str, Any]] = None,
        preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Get agent recommendations based on use case.

        Args:
            use_case: Description of the use case
            requirements: Requirements (compliance, budget, performance, integration)
            preferences: Preferences (verified_only, open_source_only, min_rating)

        Returns:
            Recommended agents with scores and reasoning
        """
        return self._client.request(
            'POST',
            '/agents/recommend',
            body={
                'use_case': use_case,
                'requirements': requirements,
                'preferences': preferences,
            },
        )

    def discover(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Advanced discovery with multiple filters.

        Args:
            filters: Discovery filters (domain, subdomain, capability, compliance,
                    min_rating, verified_only, has_dependencies, license)

        Returns:
            Agents matching all filter criteria
        """
        return self._client.request('POST', '/agents/discover', body=filters)
