# Architecting the Open Standard for Federated AI Agent Registries

**The agent ecosystem's biggest gap is not another protocol — it's a universal, decentralized registry.** MCP solved agent-to-tool integration (10,000+ servers, 97M+ monthly SDK downloads), and A2A solved agent-to-agent communication (150+ organizations). But neither provides a federated, decentralized system for discovering, distributing, trusting, and deploying agents across organizational boundaries. This gap mirrors where containers were before OCI standardized distribution, and the window to establish this standard is open *now* — before proprietary registries from Microsoft (Entra Agent Registry), OpenAI (Connector Registry), and Google (Vertex AI Agent Builder) lock in enterprises.

**This proposal reimagines agent registries not as monolithic servers but as lightweight, composable pods that form a dynamic mesh network** — bringing the Kubernetes revolution to agent infrastructure. The recommended architecture combines OCI distribution for artifact storage, A2A Agent Cards for discovery metadata, SPIFFE/SPIRE for federated identity, Sigstore for provenance, and CloudEvents over NATS for mesh synchronization — all proven CNCF standards assembled into a purpose-built agent registry under Linux Foundation governance.

---

## The registry landscape is fragmented and none solves the whole problem

The current agent registry ecosystem contains at least **seven distinct approaches**, none of which provides a complete, open, federated solution. Understanding what exists — and what each misses — reveals the precise design space for a new standard.

**Microsoft Entra Agent Registry** (Preview, November 2025) represents the most complete enterprise implementation. It features a two-tier data model with Agent Instances and Agent Card Manifests, four new identity object types, collection-based discovery (Global, Custom, Quarantined), and Zero Trust enforcement with Conditional Access policies. However, it is **deeply proprietary** — all registration flows through Microsoft Graph API (`/beta/agentRegistry/`), agents must obtain Entra identities, and there is no cross-platform federation. It exemplifies the vendor lock-in pattern this project must counter.

**The MCP Registry** (launched September 2025, now under the Agentic AI Foundation) is the closest thing to an open agent registry today, but it is a **metaregistry for tools, not agents**. It stores metadata about MCP servers while code lives in npm, PyPI, and Docker Hub. It supports sub-registries and namespace ownership via GitHub authentication or DNS verification, but offers no agent identity, no capability negotiation, and no agent-to-agent discovery.

**Google's A2A Protocol** (v0.3, Apache 2.0, now under Linux Foundation) provides elegant discovery through Agent Cards hosted at `/.well-known/agent.json`, but explicitly leaves registry implementation as an exercise for the reader. Active GitHub discussion (#741) on building a formal A2A registry confirms this gap.

**AGNTCY** (Cisco -> Linux Foundation, July 2025) is the most ambitious open-source competitor, featuring an Agent Directory built on IPFS Kademlia DHT with OCI artifact storage and Sigstore-backed integrity. Backed by **75+ companies** including Dell, Google Cloud, Oracle, and Red Hat, AGNTCY's Open Agent Schema Framework (OASF) integrates both A2A and MCP. This is OSSA's primary competitive threat and potential collaboration partner.

**Project NANDA** (MIT) proposes a "Quilt of registries" model with cryptographically signed AgentFacts using W3C Verifiable Credentials, CRDT-based updates, and TTL-based endpoint resolution designed for billions of agents. It represents the most sophisticated academic architecture but remains at v0.3 research stage.

**OSSA itself** (v0.4.4, Apache 2.0) provides a declarative YAML-based agent manifest specification with Kubernetes-native deployment, MCP bridging, and multi-agent orchestration. Its existing KAgent CRD and knowledge graph integration (demonstrated in the GitLab Duo proposal) provide a concrete infrastructure foundation. However, OSSA currently lacks a discovery protocol, federated registry specification, and cryptographic agent identity — the exact gaps this architecture must fill.

| Registry | Open | Federation | Identity | Agent Discovery | Maturity |
|----------|------|-----------|----------|----------------|----------|
| MS Entra | No | No | Entra ID | Collections | Preview |
| MCP Registry | Yes | Sub-registries | GitHub/DNS | Tool-only | Preview |
| A2A | Yes | Decentralized | OAuth/OIDC | Agent Cards | v0.3 |
| AGNTCY | Yes | DHT + OCI | DIDs + Sigstore | OASF Directory | Active dev |
| NANDA | Yes | Quilt/CRDT | W3C VCs | AgentFacts | Research |
| OpenAI | No | No | API keys | None (uses MCP) | Beta |
| **OSSA** | **Yes** | **None yet** | **Name+version** | **None yet** | **v0.4.4** |

---

## Ten proven patterns from infrastructure that scaled globally

Analysis of eight successful federated infrastructure systems reveals ten recurring patterns that should form the design foundation. The most critical insight: **no major registry achieved true peer-to-peer federation — they all use proxy/cache models with centralized discovery over decentralized hosting.** However, the emerging paradigm of service meshes and Kubernetes-native architectures points toward a more innovative approach: **registries as lightweight, interconnected pods** rather than monolithic servers.

**Content-addressable storage** is universal. OCI registries, npm, Maven, and Git all use cryptographic hashes (SHA-256) as the fundamental unit of trust. Same content produces same hash, enabling deduplication, integrity verification, and immutability without coordination between registries. The agent registry must store all artifacts — agent manifests, code bundles, model references — by content digest.

**Proxy/cache federation** is how traditional registries scale. Verdaccio (npm) chains private and public registries via "uplinks." Nexus and Artifactory aggregate multiple Maven repositories behind a single endpoint. Harbor replicates OCI images between registries with event-based or scheduled sync. DevPI inherits Python packages through "bases." These systems implement **hierarchical proxy caching with selective replication**, and this pattern works at massive scale — but it's evolutionarily descended from the pre-cloud era of monolithic services.

**Discovery aggregation over decentralized hosting** is the Artifact Hub model. CNCF's Artifact Hub doesn't host Helm charts — it indexes charts hosted on any HTTP server, OCI registry, or GitHub Pages. DNS provides the same pattern for email: MX records enable discovery of mail servers hosted anywhere. This separation of discovery from hosting is a powerful architectural principle, but the centralized index remains a bottleneck.

**DNS as universal trust anchor** is battle-tested at global scale. Email authentication layers SPF (authorized senders via DNS TXT records), DKIM (cryptographic message signing with public keys in DNS), and DMARC (policy enforcement tying SPF and DKIM together). Each agent registry instance should publish its trust metadata via DNS, enabling domain-based identity verification without a central authority.

**Service mesh patterns** revolutionized microservices by making the network programmable, observable, and secure by default. Istio, Linkerd, and Consul Connect demonstrate that **distributed systems work better when the substrate handles discovery, routing, security, and observability** rather than forcing each service to implement these concerns. This insight applies directly to agent registries.

**Layered security adoption** is how trust systems achieve real-world deployment. Email evolved from SPF -> DKIM -> DMARC over years. PyPI is implementing TUF in phases (PEP 458 minimum security -> PEP 480 maximum security). The agent registry should define **three conformance tiers**: basic (HTTPS + API keys), standard (OIDC + signed manifests), and verified (mTLS + full provenance chain + transparency logs).

The remaining four patterns — **mandatory signing** (Maven's PGP requirement, the strictest of any registry), **OIDC-based keyless identity** (Sigstore's breakthrough eliminating key management), **simple HTTP APIs** (PyPI's PEP 503 static HTML, Helm's index.yaml), and **namespace/coordinate systems** (Maven GAV, npm scopes, OCI references) — each inform specific design decisions detailed in the architecture section below.

---

## Registry pods as mesh nodes: the paradigm shift

The traditional federation models above — proxy/cache, hub-and-spoke, centralized index — all share a common limitation: **they treat registries as monolithic servers**. The truly innovative approach reconceptualizes registries as **lightweight, composable pods** that form a dynamic mesh network, mirroring how Kubernetes revolutionized application deployment and how service meshes transformed microservices communication.

### The registry pod model

In this architecture, a "registry pod" is a **minimal, autonomous unit** that can:

- **Store and serve** a subset of agent artifacts (by namespace, capability, or organizational boundary)
- **Discover and connect** to peer pods dynamically through mesh discovery protocols
- **Route requests** intelligently based on agent location, health, and policy
- **Replicate selectively** based on usage patterns, trust relationships, and resource constraints
- **Scale independently** without affecting the broader mesh

Unlike traditional registries that are deployed as single, heavyweight services, registry pods are **ephemeral, location-independent, and interconnected** — more like Kubernetes pods than traditional databases. This enables deployment patterns impossible with monolithic registries:

**Deployment topologies:**

- **Edge registries**: Lightweight pods running on developer laptops, CI runners, or edge devices, caching frequently-used agents locally and syncing deltas to remote meshes
- **Team registries**: Department-specific pods with fine-grained access control, isolated from broader organizational meshes until explicitly federated
- **Regional registries**: Geography-specific pods reducing latency for distributed teams while maintaining global discovery
- **Ephemeral registries**: Temporary pods spun up for specific workflows (security audits, compliance checks, load testing) and decommissioned after use

### Mesh networking for registries

Registry pods communicate through a **service mesh substrate** — not unlike Istio or Linkerd, but purpose-built for artifact distribution rather than HTTP routing. The mesh provides:

**Dynamic discovery**: Pods register with the mesh control plane (similar to Consul or etcd), advertising their capabilities, namespaces, and health status. When a client requests an agent, the mesh routes to the optimal pod based on proximity, load, and availability.

**Intelligent routing**: Agent requests flow through the mesh with **content-aware routing** — requests for verified agents route to pods with Sigstore integration, requests for high-availability agents route to replicated pods, requests for compliance-sensitive agents route to air-gapped pods.

**Observability by default**: Every registry operation flows through the mesh data plane, enabling automatic distributed tracing (OpenTelemetry), metrics collection (Prometheus), and audit logging without instrumenting individual pods.

**Zero-trust security**: Pod-to-pod communication uses mutual TLS (SPIFFE/SPIRE), with authorization policies enforced at the mesh layer rather than in each pod. A compromised pod cannot access artifacts outside its authorized namespaces.

### Why this is transformative

The registry pod model enables **organizational patterns that traditional registries cannot support**:

**Multi-tenant isolation without multi-tenancy complexity**: Instead of a single registry with complex RBAC managing 50 teams, deploy 50 lightweight pods (one per team) with simple, local RBAC, and federate them through the mesh. Each team controls their pod's lifecycle, storage backend, and replication policies.

**Incremental federation adoption**: Organizations can start with a single pod serving internal agents, then gradually connect to external meshes (public registries, partner organizations, ecosystem projects) by establishing mesh peering relationships. No forklift migration required.

**Organic growth and emergent topologies**: As the mesh grows, popular agents naturally replicate across pods through usage-based caching, while niche agents remain localized. The topology evolves based on actual usage patterns rather than upfront capacity planning.

**Resilience through redundancy**: When a pod fails, the mesh automatically routes requests to healthy peers. When a network partition occurs, pods continue serving their local artifacts while queuing sync operations for eventual reconciliation.

### Relationship to existing infrastructure

This architecture directly integrates with the **agent-mesh** infrastructure already deployed in the BlueFly platform. The agent-mesh handles agent-to-agent communication (A2A protocol), while the registry mesh handles agent artifact discovery and distribution. These are complementary layers:

- **Agent mesh**: Runtime communication between executing agents (A2A messages, streaming, capabilities negotiation)
- **Registry mesh**: Distribution of agent artifacts, discovery of agent capabilities, provenance verification, policy enforcement

The registry pods become **first-class citizens** in the Kubernetes cluster, deployed alongside agents, orchestrators, and infrastructure services, with the service mesh providing unified observability and security across all components.

---

## The recommended architecture: five layers from substrate to API

The optimal architecture extends three proven standards rather than inventing new protocols, assembled into five distinct layers that work together to create a decentralized, production-grade agent registry mesh.

### Layer 1: Agent artifact distribution via OCI

Agent packages should be distributed as **OCI artifacts** using the existing OCI Distribution Specification v1.1. This is not theoretical — WASM modules, Helm charts, OPA bundles, and Falco rules already ship through OCI registries today using ORAS (OCI Registry As Storage). An agent artifact consists of:

- **Config blob**: The OSSA agent manifest (YAML converted to JSON, containing metadata, capabilities, triggers, runtime requirements)
- **Content layers**: Agent code bundles, configuration files, model references, tool definitions
- **Custom `artifactType`**: `application/vnd.ossa.agent.manifest.v1+json`
- **Referrers**: Signatures (via Cosign), SBOMs, provenance attestations, and A2A Agent Cards attached as associated artifacts via the OCI v1.1 referrers API

This approach immediately grants access to **every existing container registry** — Docker Hub, Harbor, GitHub Container Registry, AWS ECR, Google Artifact Registry, Azure ACR — as agent distribution infrastructure. Organizations already running Harbor or Artifactory can store agents alongside their containers with zero new infrastructure.

Agent references follow a PURL-compatible scheme: `pkg:agent/registry.example.com/namespace/agent-name@1.0.0`. The OCI reference format maps directly: `registry.example.com/namespace/agent-name:1.0.0` (by tag) or `@sha256:abc123` (by digest for immutable references).

### Layer 2: Federated discovery via Agent Card mesh

Discovery operates through a **distributed mesh index** rather than a centralized catalog. Each registry pod maintains its own index of Agent Cards — JSON metadata documents following the A2A Agent Card format extended with OSSA-specific fields:

```json
{
  "name": "security-scanner",
  "version": "2.1.0",
  "provider": { "organization": "acme-corp", "url": "https://acme.example.com" },
  "url": "https://agents.acme.example.com/security-scanner",
  "capabilities": { "streaming": true, "pushNotifications": true },
  "skills": [
    { "id": "vulnerability-scan", "name": "Container Vulnerability Scan",
      "inputModes": ["application/json"], "outputModes": ["application/json"] }
  ],
  "ossa": {
    "manifestDigest": "sha256:abc123def456",
    "registry": "oci://registry.acme.example.com/agents/security-scanner",
    "conformanceTier": "verified",
    "runtime": { "type": "kubernetes", "minVersion": "1.28" },
    "meshMetadata": {
      "replicatedFrom": "pod://registry-us-east-1.acme.example.com",
      "lastSync": "2026-02-07T15:23:45Z",
      "popularityScore": 0.89
    }
  }
}
```

**Federation works through pod-to-pod mesh synchronization**, not hierarchical replication. Each pod publishes its local Agent Cards to the mesh control plane, subscribes to cards from peer pods based on federation policies, caches frequently-requested agents locally (usage-driven replication), and routes client queries to the optimal pod (latency, load, availability).

### Layer 3: Federated identity via SPIFFE/SPIRE

Agent identity uses **SPIFFE** (CNCF Graduated) for workload-to-workload authentication and OIDC for human user authentication. Each registry pod operates with a unique SPIFFE identity:

- Registry pod identity: `spiffe://registry-mesh.bluefly.io/pod/us-east-1-team-alpha`
- Agent identity: `spiffe://registry-mesh.bluefly.io/agent/security-scanner@sha256:abc123`
- Mesh control plane identity: `spiffe://registry-mesh.bluefly.io/control-plane/primary`

Cross-pod trust is established by exchanging SPIRE trust bundles via the SPIFFE Federation API. For human users, **OIDC integration** with GitHub, Google, GitLab, and Azure AD provides authentication. Sigstore's keyless signing model (Fulcio + Rekor) extends this to artifact signing — no key management required.

### Layer 4: Event-driven mesh sync via CloudEvents + NATS

Pod synchronization uses **CloudEvents** (CNCF Graduated) as the event format and **NATS JetStream** for inter-pod messaging:

```json
{
  "specversion": "1.0",
  "type": "io.ossa.registry.agent.published.v1",
  "source": "/pods/registry-us-east-1-team-alpha",
  "subject": "agents/security-scanner@sha256:abc123",
  "data": { "name": "security-scanner", "version": "2.1.0", "digest": "sha256:abc123" },
  "ossaext": { "namespace": "acme-corp", "conformanceTier": "verified" }
}
```

Content-addressable storage makes sync efficient — pods exchange hash lists (bloom filters or merkle trees) and only transfer objects that the destination doesn't already have. **Mesh control plane** (built on Consul or etcd) provides service discovery, health checking, and configuration distribution.

### Layer 5: API surface — REST + GraphQL

**REST** handles artifact operations following the OCI Distribution Spec. **GraphQL** handles discovery and complex queries. The mesh provides **automatic load balancing** — queries are distributed across discovery pods using consistent hashing.

---

## Comparison of federation approaches

| Approach | Autonomy | Scalability | Operational Complexity | Decentralization |
|----------|----------|-------------|----------------------|------------------|
| Proxy/Cache (Verdaccio) | Low | Moderate | Low | Hub-and-spoke |
| DHT/P2P (AGNTCY) | High | High | High | True P2P |
| Centralized Index (Artifact Hub) | Medium | Medium | Low | Central discovery |
| **Registry Pods + Mesh** | **High** | **Very High** | **Medium** | **Mesh-native** |

---

## Installation: npm package to Kubernetes operator

```bash
# Run a local registry pod
npx @ossa/registry

# Publish an agent
ossa publish ./agent.yaml

# Search across the mesh
ossa search --capability "vulnerability-scan" --conformance "verified"

# Pull and deploy
ossa pull acme/security-scanner@2.1.0
```

**Packages:**

- `@ossa/registry-core` — Data models, validation, business logic
- `@ossa/registry-pod` — Registry pod runtime with OCI storage, mesh integration, API server
- `@ossa/registry-mesh` — Mesh control plane for pod discovery, routing, sync orchestration
- `@ossa/registry-cli` — CLI entry point
- `@ossa/registry-client` — SDK for publishing, pulling, searching
- `@ossa/registry-plugins` — Storage (S3, GCS, filesystem), auth (OIDC), mesh backends (NATS, Consul)

**Kubernetes CRDs:**

```yaml
apiVersion: ossa.ai/v1
kind: RegistryPod
metadata:
  name: team-alpha-registry
spec:
  namespace: acme-corp/team-alpha
  storage:
    backend: s3
    bucket: ossa-agents-team-alpha
  authentication:
    oidc:
      provider: https://gitlab.com
  mesh:
    controlPlane: consul://consul.bluefly.io:8500
    federationPolicies:
      - namespace: acme-corp/*
        action: replicate
      - namespace: public/*
        action: cache
        maxAgeHours: 168
```

```yaml
apiVersion: ossa.ai/v1
kind: RegistryMesh
metadata:
  name: bluefly-global-mesh
spec:
  controlPlane:
    backend: consul
    endpoint: consul.bluefly.io:8500
  messageBus:
    backend: nats
    cluster: nats://nats.bluefly.io:4222
  identity:
    spiffeTrustDomain: registry-mesh.bluefly.io
    spireServer: spire://spire.bluefly.io:8081
```

---

## Community strategy: from current state to infrastructure standard

**Phase 1 (Months 1-6):** Ship functional registry pod (`npx @ossa/registry`), OCI-compatible storage, A2A Agent Card discovery, basic pod-to-pod mesh sync. Target 3 design partners. Apply to AAIF.

**Phase 2 (Months 6-18):** Developer experience (docs, VS Code extension, GitHub Action). TSC with 5+ organizations. KubeCon presentation. 10+ adopting organizations.

**Phase 3 (Months 18-36):** CNCF Sandbox. Open-core enterprise features. Security audit. 100+ stars, active community.

**Positioning:** "OSSA is the Kubernetes of agent registries — making agents portable, discoverable, and deployable across any platform through a decentralized mesh architecture."

**Against AGNTCY:** Pragmatic innovation — mesh-native using service mesh patterns SREs already understand, vs IPFS/DHT operational complexity.

---

## Timeline

| Weeks | Deliverable |
|-------|-------------|
| 1-4 | Registry spec v0.1, monorepo scaffold, basic publish/pull/search |
| 5-8 | Content-addressable storage, OIDC auth, Sigstore signing, GraphQL API, `npx @ossa/registry` |
| 9-16 | Pod-to-pod sync (CloudEvents/NATS), mesh control plane (Consul), SPIFFE/SPIRE, Helm chart |
| 17-24 | Intelligent routing, usage-driven caching, observability stack, conformance tiers, docs |
| 25-32 | KAgent operator (RegistryPod + RegistryMesh CRDs), VS Code extension, GitHub Action, 3 design partners |
| 33-48 | Security audit, TSC formation, AAIF submission, KubeCon presentation, 10+ adopters |

---

*Last updated: 2026-02-07*
*Status: Architecture proposal — pending implementation*
