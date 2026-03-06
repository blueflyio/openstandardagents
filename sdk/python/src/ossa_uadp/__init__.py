"""Universal AI Discovery Protocol (UADP) SDK for Python."""
from .types import (
    UadpManifest, OssaSkill, OssaAgent, OssaMetadata,
    PaginationMeta, PaginatedResponse, Peer, FederationResponse,
    ValidationResult, ListParams, TrustTier, PeerStatus,
)
from .client import UadpClient, UadpError
from .validate import validate_manifest, validate_response

__version__ = "0.1.0"
__all__ = [
    "UadpClient", "UadpError",
    "UadpManifest", "OssaSkill", "OssaAgent", "OssaMetadata",
    "PaginationMeta", "PaginatedResponse", "Peer", "FederationResponse",
    "ValidationResult", "ListParams", "TrustTier", "PeerStatus",
    "validate_manifest", "validate_response",
]
