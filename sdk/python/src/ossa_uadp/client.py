"""UADP client for discovering and querying any UADP node."""
from __future__ import annotations
import httpx
from .types import (
    UadpManifest, OssaSkill, OssaAgent, PaginatedResponse,
    FederationResponse, ValidationResult, ListParams, Peer,
)


class UadpError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


class UadpClient:
    """Client for discovering and querying a UADP node.

    Usage::

        async with UadpClient("https://marketplace.example.com") as client:
            manifest = await client.discover()
            skills = await client.list_skills(search="code-review")
            print(skills.data)
    """

    def __init__(self, base_url: str, *, timeout: float = 10.0, headers: dict[str, str] | None = None):
        self.base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(
            timeout=timeout,
            headers={"Accept": "application/json", **(headers or {})},
        )
        self._manifest: UadpManifest | None = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        await self._client.aclose()

    async def discover(self) -> UadpManifest:
        """Fetch /.well-known/uadp.json and cache the manifest."""
        url = f"{self.base_url}/.well-known/uadp.json"
        resp = await self._client.get(url)
        if resp.status_code != 200:
            raise UadpError(f"Discovery failed: HTTP {resp.status_code}", resp.status_code)
        self._manifest = UadpManifest.model_validate(resp.json())
        return self._manifest

    async def get_manifest(self) -> UadpManifest:
        """Return cached manifest or discover."""
        if not self._manifest:
            await self.discover()
        return self._manifest  # type: ignore[return-value]

    async def list_skills(self, params: ListParams | None = None, **kwargs) -> PaginatedResponse[OssaSkill]:
        """List skills from the node."""
        manifest = await self.get_manifest()
        if not manifest.endpoints.skills:
            raise UadpError("Node does not expose a skills endpoint")
        p = params or ListParams(**kwargs)
        resp = await self._client.get(manifest.endpoints.skills, params=self._build_params(p))
        resp.raise_for_status()
        data = resp.json()
        return PaginatedResponse[OssaSkill].model_validate(data)

    async def list_agents(self, params: ListParams | None = None, **kwargs) -> PaginatedResponse[OssaAgent]:
        """List agents from the node."""
        manifest = await self.get_manifest()
        if not manifest.endpoints.agents:
            raise UadpError("Node does not expose an agents endpoint")
        p = params or ListParams(**kwargs)
        resp = await self._client.get(manifest.endpoints.agents, params=self._build_params(p))
        resp.raise_for_status()
        data = resp.json()
        return PaginatedResponse[OssaAgent].model_validate(data)

    async def get_federation(self) -> FederationResponse:
        """Get federation peers."""
        manifest = await self.get_manifest()
        if not manifest.endpoints.federation:
            raise UadpError("Node does not expose a federation endpoint")
        resp = await self._client.get(manifest.endpoints.federation)
        resp.raise_for_status()
        return FederationResponse.model_validate(resp.json())

    async def register_as_peer(self, my_url: str, my_name: str) -> dict:
        """Register this node as a federation peer."""
        manifest = await self.get_manifest()
        if not manifest.endpoints.federation:
            raise UadpError("Node does not expose a federation endpoint")
        resp = await self._client.post(
            manifest.endpoints.federation,
            json={"url": my_url, "name": my_name},
        )
        resp.raise_for_status()
        return resp.json()

    async def validate(self, manifest_str: str) -> ValidationResult:
        """Validate a manifest using the node's validation service."""
        node_manifest = await self.get_manifest()
        if not node_manifest.endpoints.validate:
            raise UadpError("Node does not expose a validation endpoint")
        resp = await self._client.post(
            node_manifest.endpoints.validate,
            json={"manifest": manifest_str},
        )
        resp.raise_for_status()
        return ValidationResult.model_validate(resp.json())

    @staticmethod
    def _build_params(p: ListParams) -> dict[str, str]:
        params: dict[str, str] = {}
        if p.search:
            params["search"] = p.search
        if p.category:
            params["category"] = p.category
        if p.trust_tier:
            params["trust_tier"] = p.trust_tier
        if p.page != 1:
            params["page"] = str(p.page)
        if p.limit != 20:
            params["limit"] = str(p.limit)
        return params
