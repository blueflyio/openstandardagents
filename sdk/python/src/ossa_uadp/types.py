"""UADP protocol types as Pydantic models."""
from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field

TrustTier = Literal["official", "verified-signature", "signed", "community", "experimental"]
PeerStatus = Literal["healthy", "degraded", "unreachable"]


class UadpEndpoints(BaseModel):
    skills: str | None = None
    agents: str | None = None
    federation: str | None = None
    validate: str | None = None

    class Config:
        extra = "allow"


class UadpManifest(BaseModel):
    protocol_version: str
    node_name: str
    node_description: str | None = None
    contact: str | None = None
    endpoints: UadpEndpoints
    capabilities: list[str] | None = None
    public_key: str | None = None
    ossa_versions: list[str] | None = None


class OssaMetadata(BaseModel):
    name: str
    version: str | None = None
    description: str | None = None
    uri: str | None = None
    category: str | None = None
    trust_tier: TrustTier | None = None
    created: str | None = None
    updated: str | None = None

    class Config:
        extra = "allow"


class OssaSkill(BaseModel):
    apiVersion: str = Field(alias="apiVersion")
    kind: Literal["Skill"] = "Skill"
    metadata: OssaMetadata
    spec: dict | None = None

    class Config:
        populate_by_name = True
        extra = "allow"


class OssaAgent(BaseModel):
    apiVersion: str = Field(alias="apiVersion")
    kind: Literal["Agent"] = "Agent"
    metadata: OssaMetadata
    spec: dict | None = None

    class Config:
        populate_by_name = True
        extra = "allow"


class PaginationMeta(BaseModel):
    total: int
    page: int
    limit: int
    node_name: str


class PaginatedResponse[T](BaseModel):
    data: list[T]
    meta: PaginationMeta


class Peer(BaseModel):
    url: str
    name: str
    status: PeerStatus = "healthy"
    last_synced: str | None = None
    skill_count: int | None = None
    agent_count: int | None = None


class FederationResponse(BaseModel):
    protocol_version: str
    node_name: str
    peers: list[Peer]


class ValidationResult(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class ListParams(BaseModel):
    search: str | None = None
    category: str | None = None
    trust_tier: TrustTier | None = None
    page: int = 1
    limit: int = 20
