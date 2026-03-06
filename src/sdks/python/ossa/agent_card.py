"""
OSSA Agent Card - Generate .well-known/agent-card.json from OSSA manifests.

The agent card is a projection of the manifest for discovery (MCP, A2A).
Single source of truth: OSSA manifest; card is generated for registry and clients.

Separation of duties: This module only projects manifest data; it does not
define business rules. Schema: spec/v0.4/agent-card.schema.json
"""

import hashlib
from typing import Any, Optional

from .manifest import Manifest


def _get(data: dict[str, Any], *keys: str, default: Any = None) -> Any:
    for key in keys:
        data = data.get(key) if isinstance(data, dict) else None
        if data is None:
            return default
    return data


def _extract_capabilities(manifest: dict[str, Any]) -> list[str]:
    capabilities: list[str] = []
    labels = _get(manifest, "metadata", "labels") or {}
    if isinstance(labels.get("capability"), str):
        capabilities.extend(c.strip() for c in labels["capability"].split(","))
    for tag in manifest.get("metadata", {}).get("tags") or []:
        if tag and tag not in capabilities:
            capabilities.append(tag)
    spec_caps = (manifest.get("spec") or {}).get("capabilities") or []
    for cap in spec_caps:
        name = cap.get("id") or cap.get("name") if isinstance(cap, dict) else cap
        if name and name not in capabilities:
            capabilities.append(str(name))
    return capabilities


def _extract_token_efficiency_summary(manifest: dict[str, Any]) -> Optional[dict[str, Any]]:
    te = manifest.get("token_efficiency")
    if not te or not isinstance(te, dict):
        return None
    out: dict[str, Any] = {}
    if te.get("serialization_profile"):
        out["serializationProfile"] = te["serialization_profile"]
    if te.get("observation_format"):
        out["observationFormat"] = te["observation_format"]
    budget = te.get("budget")
    if isinstance(budget, dict) and budget.get("max_input_tokens") is not None:
        out["maxInputTokens"] = budget["max_input_tokens"]
    routing = te.get("routing")
    if isinstance(routing, dict) and isinstance(routing.get("cascade"), list):
        out["cascade"] = routing["cascade"]
    consolidation = te.get("consolidation")
    if isinstance(consolidation, dict) and consolidation.get("strategy"):
        out["consolidationStrategy"] = consolidation["strategy"]
    return out if out else None


def _extract_separation(manifest: dict[str, Any]) -> Optional[dict[str, Any]]:
    spec = manifest.get("spec") or {}
    access = spec.get("access")
    separation = spec.get("separation")
    if not access and not separation:
        return None
    out: dict[str, Any] = {}
    if isinstance(access, dict) and access.get("tier"):
        out["accessTier"] = access["tier"]
    if isinstance(separation, dict):
        if separation.get("role"):
            out["role"] = separation["role"]
        conflicts = separation.get("conflicts_with") or separation.get("conflictsWith")
        if isinstance(conflicts, list):
            out["conflictsWith"] = conflicts
    return out if out else None


def _extract_state(manifest: dict[str, Any]) -> Optional[dict[str, Any]]:
    spec = manifest.get("spec") or {}
    state_config = spec.get("state")
    if not state_config or not isinstance(state_config, dict):
        return None
    out: dict[str, Any] = {}
    if state_config.get("mode"):
        out["mode"] = state_config["mode"]
    storage = state_config.get("storage")
    if isinstance(storage, dict) and storage.get("type"):
        out["storageHint"] = storage["type"]
    if state_config.get("session_endpoint"):
        out["sessionEndpoint"] = state_config["session_endpoint"]
    if state_config.get("sessionEndpoint"):
        out["sessionEndpoint"] = state_config["sessionEndpoint"]
    checkpoint = state_config.get("checkpointing")
    if isinstance(checkpoint, dict):
        if checkpoint.get("interval_seconds") is not None:
            out["checkpointIntervalSeconds"] = checkpoint["interval_seconds"]
        if checkpoint.get("intervalSeconds") is not None:
            out["checkpointIntervalSeconds"] = checkpoint["intervalSeconds"]
    if isinstance(storage, dict) and storage.get("retention"):
        out["retention"] = storage["retention"]
    return out if out else None


def _extract_model(spec: dict[str, Any]) -> Optional[dict[str, Any]]:
    llm = spec.get("llm") or spec.get("model")
    if not llm or not isinstance(llm, dict):
        return None
    out: dict[str, Any] = {}
    if llm.get("provider"):
        out["provider"] = llm["provider"]
    if llm.get("model"):
        out["model"] = llm["model"]
    elif llm.get("name"):
        out["model"] = llm["name"]
    if llm.get("temperature") is not None:
        out["temperature"] = llm["temperature"]
    if llm.get("max_tokens") is not None:
        out["maxTokens"] = llm["max_tokens"]
    elif llm.get("maxTokens") is not None:
        out["maxTokens"] = llm["maxTokens"]
    return out if out else None


def compute_manifest_digest(content: str) -> str:
    """Compute SHA-256 digest of manifest content (UTF-8)."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def generate_agent_card(
    manifest: dict[str, Any] | Manifest,
    *,
    namespace: str = "default",
    uri: Optional[str] = None,
    endpoints: Optional[dict[str, str]] = None,
    manifest_ref: Optional[str] = None,
    manifest_digest: Optional[str] = None,
    manifest_content: Optional[str] = None,
    card_profile: str = "full",
) -> dict[str, Any]:
    """
    Generate an OSSA agent card (discovery payload) from a manifest.

    Args:
        manifest: OSSA manifest dict or Manifest instance.
        namespace: Agent namespace for URI (if uri not set).
        uri: Override agent URI (default uadp://{namespace}/{name}).
        endpoints: Optional {http?, grpc?, websocket?} URLs.
        manifest_ref: URL to full OSSA manifest.
        manifest_digest: Content digest (e.g. SHA-256). If not set and manifest_content given, computed.
        manifest_content: Raw manifest string to compute digest from.
        card_profile: minimal | discovery | full.

    Returns:
        Agent card dict conforming to spec/v0.4/agent-card.schema.json.
    """
    if hasattr(manifest, "to_dict"):
        data = manifest.to_dict()
    else:
        data = dict(manifest)

    name = (data.get("metadata") or {}).get("name") or "unnamed"
    version = (data.get("metadata") or {}).get("version") or "1.0.0"
    api_version = data.get("apiVersion") or "ossa/v0.4"
    resolved_uri = uri or f"uadp://{namespace}/{name}"

    transport = ["http"]
    if endpoints:
        if endpoints.get("grpc"):
            transport.append("grpc")
        if endpoints.get("websocket"):
            transport.append("websocket")

    card: dict[str, Any] = {
        "uri": resolved_uri,
        "name": name,
        "version": version,
        "ossaVersion": api_version,
        "capabilities": _extract_capabilities(data),
        "endpoints": endpoints or {},
        "transport": transport,
        "authentication": ["bearer"],
        "encryption": {"tlsRequired": True, "minTlsVersion": "1.2"},
    }

    spec = data.get("spec") or {}
    if spec.get("role"):
        card["role"] = spec["role"]

    model = _extract_model(spec)
    if model:
        card["model"] = model

    meta = data.get("metadata") or {}
    if meta.get("description"):
        card["metadata"] = {"description": meta["description"]}
    if meta.get("author"):
        (card.setdefault("metadata", {}))["author"] = meta["author"]

    token_summary = _extract_token_efficiency_summary(data)
    if token_summary:
        card["tokenEfficiencySummary"] = token_summary

    separation = _extract_separation(data)
    if separation:
        card["separation"] = separation

    state = _extract_state(data)
    if state:
        card["state"] = state

    if manifest_ref:
        card["manifestRef"] = manifest_ref
    if manifest_digest:
        card["manifestDigest"] = manifest_digest
    elif manifest_content:
        card["manifestDigest"] = compute_manifest_digest(manifest_content)

    if card_profile in ("minimal", "discovery", "full"):
        card["cardProfile"] = card_profile

    return card
