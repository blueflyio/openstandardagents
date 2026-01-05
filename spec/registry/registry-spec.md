# OSSA Agent Registry Specification

**Version**: 0.3.0
**Status**: Draft
**Last Updated**: 2025-12-12

This document defines the OSSA Agent Registry - a centralized discovery and distribution system for OSSA-compliant agents. The registry makes OSSA the "OpenAPI of Agents" by providing standardized publishing, discovery, and installation workflows.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Registry API](#registry-api)
4. [Agent Metadata](#agent-metadata)
5. [Search & Discovery](#search--discovery)
6. [Publishing Workflow](#publishing-workflow)
7. [Installation Workflow](#installation-workflow)
8. [Namespaces & Organizations](#namespaces--organizations)
9. [Verification & Trust](#verification--trust)
10. [Registry Implementation](#registry-implementation)
11. [Security Model](#security-model)
12. [Rate Limiting & Quotas](#rate-limiting--quotas)
13. [Versioning Strategy](#versioning-strategy)
14. [CLI Reference](#cli-reference)
15. [SDK Integration](#sdk-integration)
16. [Best Practices](#best-practices)
17. [Examples](#examples)

---

## Overview

### What is the OSSA Registry?

The OSSA Agent Registry is a centralized repository for discovering, publishing, and distributing OSSA-compliant agents. It provides:

- **Discovery**: Search agents by name, tags, capabilities, compliance requirements
- **Publishing**: Publish agents with versioning, metadata, and documentation
- **Installation**: One-command installation with dependency resolution
- **Verification**: Automated schema validation, security scanning, publisher verification
- **Distribution**: Multi-region CDN for fast agent downloads
- **Analytics**: Download statistics, usage metrics, community feedback

### Design Goals

1. **Developer Experience**: As simple as `npm` or `pip`
2. **Discoverability**: Find the right agent for any task in seconds
3. **Trust**: Verified publishers, security scanning, community ratings
4. **Performance**: Sub-second searches, global CDN distribution
5. **Interoperability**: Works with all OSSA-compliant runtimes
6. **Compliance**: Support for FedRAMP, HIPAA, SOC2, GDPR requirements

### Comparison to Existing Registries

| Feature | OSSA Registry | npm | Docker Hub | OpenAI GPT Store |
|---------|---------------|-----|------------|------------------|
| Semantic versioning | ✅ | ✅ | ✅ | ❌ |
| Dependency resolution | ✅ | ✅ | ❌ | ❌ |
| Capability-based search | ✅ | ❌ | 🟡 (tags) | 🟡 (categories) |
| Compliance profiles | ✅ | ❌ | ❌ | ❌ |
| Multi-framework support | ✅ | ❌ | ✅ | ❌ |
| Automated security scans | ✅ | 🟡 | 🟡 | ❌ |
| Private registries | ✅ | ✅ | ✅ | ❌ |
| Cost transparency | ✅ | ❌ | ❌ | ❌ |

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      OSSA REGISTRY ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │   CLI/SDK    │──▶│  API Gateway │──▶│  Metadata DB │        │
│  │  (Publisher) │   │  (REST/gRPC) │   │  (Postgres)  │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│                           │                     │               │
│                           ▼                     ▼               │
│                    ┌──────────────┐    ┌──────────────┐        │
│                    │ Verification │    │ Search Index │        │
│                    │   Service    │    │ (OpenSearch) │        │
│                    └──────────────┘    └──────────────┘        │
│                           │                     │               │
│                           ▼                     │               │
│                    ┌──────────────┐            │               │
│                    │  CDN Storage │◀───────────┘               │
│                    │  (S3/R2)     │                            │
│                    └──────────────┘                            │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │   CLI/SDK    │◀──│   Registry   │◀──│  CDN Edge    │        │
│  │  (Consumer)  │   │  Website     │   │  (CloudFlare)│        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Publishing Flow

```
1. Developer creates agent manifest (agent.ossa.yaml)
2. Developer runs: `ossa publish`
3. CLI validates manifest against JSON schema
4. CLI packages agent + dependencies
5. API Gateway authenticates publisher
6. Verification Service runs security scans
7. Metadata stored in database
8. Agent package uploaded to CDN
9. Search index updated
10. Publisher receives confirmation
```

#### Installation Flow

```
1. User runs: `ossa install security-scanner`
2. CLI queries registry API
3. API returns agent metadata + CDN URL
4. CLI downloads agent package from CDN
5. CLI validates package signature
6. CLI resolves dependencies
7. CLI installs agent + dependencies
8. CLI updates local registry cache
```

---

## Registry API

### Base URL

```
Production:  https://registry.openstandardagents.org/api/v1
Staging:     https://staging-registry.openstandardagents.org/api/v1
```

### Authentication

All write operations require authentication via Bearer token:

```http
Authorization: Bearer ossa_tok_1234567890abcdef
```

Obtain token via:

```bash
ossa login
# Opens browser for OAuth flow
# Token saved to ~/.ossa/token
```

---

### API Endpoints

#### 1. Publish Agent

**POST** `/agents`

Publish a new agent or new version of existing agent.

**Request Headers**:
```http
Authorization: Bearer ossa_tok_xxx
Content-Type: application/json
```

**Request Body**:
```json
{
  "manifest": {
    "apiVersion": "ossa/v0.3.0",
    "kind": "Agent",
    "metadata": {
      "name": "security-scanner",
      "version": "1.2.0",
      "description": "Enterprise security vulnerability scanner",
      "labels": {
        "domain": "security",
        "compliance": "fedramp"
      }
    },
    "spec": {
      "role": "Security expert specializing in vulnerability scanning",
      "taxonomy": {
        "domain": "security",
        "subdomain": "scanning",
        "capability": "vulnerability-detection"
      },
      "llm": {
        "provider": "anthropic",
        "model": "claude-3-sonnet-20240229"
      }
    }
  },
  "package": {
    "tarball_url": "https://publisher-cdn.example.com/packages/security-scanner-1.2.0.tar.gz",
    "shasum": "abc123def456...",
    "size_bytes": 1048576
  },
  "documentation": {
    "readme": "https://github.com/org/security-scanner/blob/main/README.md",
    "changelog": "https://github.com/org/security-scanner/blob/main/CHANGELOG.md",
    "repository": "https://github.com/org/security-scanner"
  },
  "license": "Apache-2.0",
  "keywords": ["security", "vulnerability", "scanning", "compliance"],
  "dependencies": {
    "@ossa/runtime": "^0.3.0",
    "vuln-scanner-lib": "^2.1.0"
  }
}
```

**Response** (201 Created):
```json
{
  "status": "published",
  "agent": {
    "name": "security-scanner",
    "version": "1.2.0",
    "publisher": "blueflyio",
    "published_at": "2025-12-12T10:00:00.000Z",
    "registry_url": "https://registry.openstandardagents.org/agents/blueflyio/security-scanner",
    "package_url": "https://cdn.openstandardagents.org/packages/blueflyio/security-scanner/1.2.0.tar.gz"
  },
  "verification": {
    "schema_valid": true,
    "security_scan": "passed",
    "verified_publisher": true
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid manifest or package
- `401 Unauthorized`: Missing or invalid token
- `409 Conflict`: Version already exists
- `422 Unprocessable Entity`: Validation failed

---

#### 2. List/Search Agents

**GET** `/agents`

Search and list available agents with filtering, sorting, and pagination.

**Query Parameters**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `q` | string | Full-text search query | `security scanner` |
| `tag` | string | Filter by tag | `security` |
| `capability` | string | Filter by capability | `vulnerability-detection` |
| `domain` | string | Filter by domain | `security` |
| `publisher` | string | Filter by publisher | `blueflyio` |
| `license` | string | Filter by license | `Apache-2.0` |
| `compliance` | string | Filter by compliance profile | `fedramp` |
| `verified` | boolean | Only verified publishers | `true` |
| `min_rating` | float | Minimum rating (1-5) | `4.0` |
| `sort` | enum | Sort order | `downloads`, `rating`, `updated`, `created` |
| `limit` | integer | Results per page (max 100) | `20` |
| `offset` | integer | Pagination offset | `40` |

**Request Examples**:

```bash
# Search for security agents
GET /agents?q=security&sort=downloads&limit=10

# Find FedRAMP-compliant agents
GET /agents?compliance=fedramp&verified=true

# Get agents by capability
GET /agents?capability=vulnerability-detection&min_rating=4.0

# Explore by domain
GET /agents?domain=security&tag=scanning&sort=rating
```

**Response** (200 OK):
```json
{
  "total": 147,
  "limit": 20,
  "offset": 0,
  "agents": [
    {
      "name": "security-scanner",
      "version": "1.2.0",
      "publisher": "blueflyio",
      "description": "Enterprise security vulnerability scanner",
      "license": "Apache-2.0",
      "downloads": 12450,
      "rating": 4.7,
      "verified": true,
      "tags": ["security", "scanning", "compliance", "fedramp"],
      "capabilities": ["vulnerability-detection", "compliance-check"],
      "created_at": "2024-06-15T10:00:00.000Z",
      "updated_at": "2025-12-10T14:30:00.000Z",
      "registry_url": "https://registry.openstandardagents.org/agents/blueflyio/security-scanner"
    },
    {
      "name": "code-security-analyzer",
      "version": "2.0.1",
      "publisher": "acmecorp",
      "description": "AI-powered code security analysis",
      "license": "MIT",
      "downloads": 8921,
      "rating": 4.5,
      "verified": true,
      "tags": ["security", "code-analysis", "sast"],
      "capabilities": ["code-analysis", "security-scanning"],
      "created_at": "2024-08-20T12:00:00.000Z",
      "updated_at": "2025-12-08T09:15:00.000Z",
      "registry_url": "https://registry.openstandardagents.org/agents/acmecorp/code-security-analyzer"
    }
  ]
}
```

---

#### 3. Get Agent Details

**GET** `/agents/{publisher}/{name}`

Retrieve detailed information about a specific agent (latest version).

**Request**:
```bash
GET /agents/blueflyio/security-scanner
```

**Response** (200 OK):
```json
{
  "name": "security-scanner",
  "version": "1.2.0",
  "publisher": {
    "id": "blueflyio",
    "name": "Bluefly.io",
    "verified": true,
    "website": "https://bluefly.io",
    "email": "support@bluefly.io"
  },
  "description": "Enterprise security vulnerability scanner for cloud infrastructure",
  "long_description": "Comprehensive security scanner that identifies vulnerabilities...",
  "license": "Apache-2.0",
  "repository": "https://github.com/blueflyio/security-scanner",
  "homepage": "https://bluefly.io/agents/security-scanner",
  "documentation": "https://docs.bluefly.io/agents/security-scanner",
  "tags": ["security", "scanning", "compliance", "fedramp", "kubernetes"],
  "capabilities": [
    "vulnerability-detection",
    "compliance-check",
    "risk-assessment"
  ],
  "taxonomy": {
    "domain": "security",
    "subdomain": "scanning",
    "capability": "vulnerability-detection"
  },
  "compliance_profiles": ["fedramp-moderate", "soc2", "hipaa"],
  "downloads": {
    "total": 12450,
    "last_month": 3421,
    "last_week": 892
  },
  "rating": {
    "average": 4.7,
    "count": 234
  },
  "versions": [
    {
      "version": "1.2.0",
      "published_at": "2025-12-10T14:30:00.000Z",
      "changelog": "Added HIPAA compliance checks, fixed CVE detection"
    },
    {
      "version": "1.1.5",
      "published_at": "2025-11-22T10:15:00.000Z",
      "changelog": "Performance improvements, updated CVE database"
    }
  ],
  "dependencies": {
    "@ossa/runtime": "^0.3.0",
    "vuln-scanner-lib": "^2.1.0"
  },
  "llm_requirements": {
    "provider": "anthropic",
    "model": "claude-3-sonnet-20240229",
    "estimated_cost_per_run": "$0.15"
  },
  "manifest_url": "https://cdn.openstandardagents.org/manifests/blueflyio/security-scanner/1.2.0/manifest.yaml",
  "package_url": "https://cdn.openstandardagents.org/packages/blueflyio/security-scanner/1.2.0.tar.gz",
  "created_at": "2024-06-15T10:00:00.000Z",
  "updated_at": "2025-12-10T14:30:00.000Z"
}
```

**Error Responses**:
- `404 Not Found`: Agent does not exist

---

#### 4. Get Agent Version History

**GET** `/agents/{publisher}/{name}/versions`

List all published versions of an agent.

**Request**:
```bash
GET /agents/blueflyio/security-scanner/versions
```

**Response** (200 OK):
```json
{
  "agent": "blueflyio/security-scanner",
  "versions": [
    {
      "version": "1.2.0",
      "published_at": "2025-12-10T14:30:00.000Z",
      "downloads": 512,
      "changelog_url": "https://github.com/blueflyio/security-scanner/releases/tag/v1.2.0",
      "manifest_url": "https://cdn.openstandardagents.org/manifests/blueflyio/security-scanner/1.2.0/manifest.yaml",
      "package_url": "https://cdn.openstandardagents.org/packages/blueflyio/security-scanner/1.2.0.tar.gz",
      "deprecated": false
    },
    {
      "version": "1.1.5",
      "published_at": "2025-11-22T10:15:00.000Z",
      "downloads": 3421,
      "changelog_url": "https://github.com/blueflyio/security-scanner/releases/tag/v1.1.5",
      "manifest_url": "https://cdn.openstandardagents.org/manifests/blueflyio/security-scanner/1.1.5/manifest.yaml",
      "package_url": "https://cdn.openstandardagents.org/packages/blueflyio/security-scanner/1.1.5.tar.gz",
      "deprecated": false
    },
    {
      "version": "1.0.0",
      "published_at": "2024-06-15T10:00:00.000Z",
      "downloads": 8517,
      "changelog_url": "https://github.com/blueflyio/security-scanner/releases/tag/v1.0.0",
      "manifest_url": "https://cdn.openstandardagents.org/manifests/blueflyio/security-scanner/1.0.0/manifest.yaml",
      "package_url": "https://cdn.openstandardagents.org/packages/blueflyio/security-scanner/1.0.0.tar.gz",
      "deprecated": true,
      "deprecation_reason": "Security vulnerability CVE-2024-12345 fixed in 1.1.0"
    }
  ]
}
```

---

#### 5. Get Specific Version

**GET** `/agents/{publisher}/{name}/{version}`

Retrieve details for a specific version of an agent.

**Request**:
```bash
GET /agents/blueflyio/security-scanner/1.1.5
```

**Response**: Same structure as "Get Agent Details" but for specified version.

---

#### 6. Unpublish Agent

**DELETE** `/agents/{publisher}/{name}/{version}`

Remove a specific version from the registry. Requires ownership.

**Request Headers**:
```http
Authorization: Bearer ossa_tok_xxx
```

**Request**:
```bash
DELETE /agents/blueflyio/security-scanner/1.0.0
```

**Request Body** (optional):
```json
{
  "reason": "Critical security vulnerability - use 1.1.0 or later"
}
```

**Response** (200 OK):
```json
{
  "status": "unpublished",
  "agent": "blueflyio/security-scanner",
  "version": "1.0.0",
  "unpublished_at": "2025-12-12T10:30:00.000Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not agent owner
- `404 Not Found`: Version does not exist

---

#### 7. Deprecate Version

**POST** `/agents/{publisher}/{name}/{version}/deprecate`

Mark a version as deprecated (still available but discouraged).

**Request Headers**:
```http
Authorization: Bearer ossa_tok_xxx
Content-Type: application/json
```

**Request Body**:
```json
{
  "reason": "Replaced by version 2.0.0 with improved performance",
  "replacement_version": "2.0.0"
}
```

**Response** (200 OK):
```json
{
  "status": "deprecated",
  "agent": "blueflyio/security-scanner",
  "version": "1.0.0",
  "deprecated_at": "2025-12-12T10:30:00.000Z",
  "replacement_version": "2.0.0"
}
```

---

#### 8. Get Download Stats

**GET** `/agents/{publisher}/{name}/stats`

Retrieve download and usage statistics.

**Query Parameters**:
- `period`: `day`, `week`, `month`, `year`, `all` (default: `all`)

**Response** (200 OK):
```json
{
  "agent": "blueflyio/security-scanner",
  "period": "month",
  "downloads": {
    "total": 3421,
    "by_version": {
      "1.2.0": 512,
      "1.1.5": 2909
    },
    "by_date": [
      {"date": "2025-12-11", "count": 142},
      {"date": "2025-12-10", "count": 156},
      {"date": "2025-12-09", "count": 138}
    ]
  },
  "installs": {
    "total_unique": 1892,
    "by_region": {
      "us-east": 892,
      "eu-west": 543,
      "ap-south": 457
    }
  }
}
```

---

#### 9. Submit Rating/Review

**POST** `/agents/{publisher}/{name}/reviews`

Submit a rating and review for an agent.

**Request Headers**:
```http
Authorization: Bearer ossa_tok_xxx
Content-Type: application/json
```

**Request Body**:
```json
{
  "version": "1.2.0",
  "rating": 5,
  "review": "Excellent security scanner! Caught vulnerabilities our previous tools missed.",
  "use_case": "Kubernetes cluster security audits"
}
```

**Response** (201 Created):
```json
{
  "status": "submitted",
  "review_id": "rev_abc123",
  "published_at": "2025-12-12T10:30:00.000Z"
}
```

---

#### 10. Get Agent Reviews

**GET** `/agents/{publisher}/{name}/reviews`

Retrieve user reviews and ratings.

**Query Parameters**:
- `version`: Filter by version
- `min_rating`: Minimum rating (1-5)
- `sort`: `helpful`, `recent`, `rating` (default: `helpful`)
- `limit`: Results per page (max 50, default: 10)
- `offset`: Pagination offset

**Response** (200 OK):
```json
{
  "agent": "blueflyio/security-scanner",
  "total_reviews": 234,
  "average_rating": 4.7,
  "rating_distribution": {
    "5": 156,
    "4": 62,
    "3": 12,
    "2": 3,
    "1": 1
  },
  "reviews": [
    {
      "review_id": "rev_abc123",
      "version": "1.2.0",
      "rating": 5,
      "review": "Excellent security scanner! Caught vulnerabilities...",
      "author": {
        "username": "security_engineer",
        "verified": true
      },
      "use_case": "Kubernetes cluster security audits",
      "helpful_count": 42,
      "published_at": "2025-12-10T14:30:00.000Z"
    }
  ]
}
```

---

#### 11. Get Dependencies

**GET** `/agents/{publisher}/{name}/dependencies`

Retrieve agent dependencies with version resolution.

**Response** (200 OK):
```json
{
  "agent": "blueflyio/security-scanner",
  "version": "1.2.0",
  "dependencies": {
    "runtime": {
      "@ossa/runtime": {
        "required": "^0.3.0",
        "resolved": "0.3.2",
        "type": "runtime"
      }
    },
    "agents": {
      "blueflyio/vuln-db-agent": {
        "required": "^2.1.0",
        "resolved": "2.1.5",
        "type": "agent"
      }
    },
    "tools": {
      "kubernetes-api": {
        "required": "^1.28.0",
        "resolved": "1.28.4",
        "type": "tool"
      }
    }
  },
  "dependency_tree": {
    "blueflyio/security-scanner@1.2.0": {
      "@ossa/runtime@0.3.2": {},
      "blueflyio/vuln-db-agent@2.1.5": {
        "@ossa/runtime@0.3.2": {}
      },
      "kubernetes-api@1.28.4": {}
    }
  }
}
```

---

## Agent Metadata

### Core Metadata Schema

Every agent in the registry has associated metadata:

```typescript
interface AgentRegistryMetadata {
  // Identity
  name: string;                      // Agent name (DNS-1123 format)
  version: string;                   // Semantic version
  publisher: PublisherInfo;          // Publisher details

  // Description
  description: string;               // Short description (max 200 chars)
  long_description?: string;         // Full description (markdown)
  keywords: string[];                // Search keywords

  // Classification
  tags: string[];                    // Freeform tags
  capabilities: string[];            // OSSA capabilities
  taxonomy: TaxonomyInfo;            // Hierarchical classification

  // Links
  repository?: string;               // Source code URL
  homepage?: string;                 // Project homepage
  documentation?: string;            // Documentation URL
  changelog?: string;                // Changelog URL
  issues?: string;                   // Issue tracker URL

  // Legal
  license: string;                   // SPDX license identifier
  compliance_profiles?: string[];    // FedRAMP, HIPAA, SOC2, etc.

  // Requirements
  ossa_version: string;              // Required OSSA spec version
  dependencies: DependencyMap;       // Agent/runtime dependencies
  llm_requirements?: LLMRequirements; // LLM provider/model requirements

  // Package
  manifest_url: string;              // OSSA manifest download URL
  package_url: string;               // Agent package download URL
  package_size: number;              // Size in bytes
  package_shasum: string;            // SHA-256 checksum

  // Stats
  downloads: DownloadStats;          // Download counts
  rating: RatingInfo;                // User ratings

  // Verification
  verified: boolean;                 // Publisher verified
  security_scan: SecurityScanResult; // Security scan status

  // Timestamps
  created_at: string;                // ISO 8601
  updated_at: string;                // ISO 8601
  published_at: string;              // ISO 8601 (this version)

  // Status
  deprecated?: boolean;
  deprecation_reason?: string;
  replacement_version?: string;
}

interface PublisherInfo {
  id: string;                        // Publisher ID
  name: string;                      // Display name
  verified: boolean;                 // Verified publisher badge
  website?: string;
  email?: string;
  github?: string;
}

interface TaxonomyInfo {
  domain: string;                    // security, infrastructure, etc.
  subdomain?: string;                // scanning, deployment, etc.
  capability?: string;               // vulnerability-detection, etc.
}

interface DependencyMap {
  [package: string]: string;         // package: version range
}

interface LLMRequirements {
  provider: string;                  // anthropic, openai, etc.
  model: string;                     // claude-3-sonnet-20240229
  estimated_cost_per_run?: string;   // "$0.15"
}

interface DownloadStats {
  total: number;
  last_month: number;
  last_week: number;
}

interface RatingInfo {
  average: number;                   // 1-5
  count: number;                     // Number of ratings
}

interface SecurityScanResult {
  status: "passed" | "failed" | "pending";
  scanned_at?: string;               // ISO 8601
  vulnerabilities?: number;
  severity?: "low" | "medium" | "high" | "critical";
}
```

---

## Search & Discovery

### Search Capabilities

The registry provides multiple search mechanisms:

#### 1. Full-Text Search

```bash
# Search agent names, descriptions, keywords
ossa search "kubernetes security"

# API equivalent
GET /agents?q=kubernetes+security
```

**Search Algorithm**:
- Weighted scoring: name (5x), description (3x), keywords (2x), tags (1x)
- Fuzzy matching for typos
- Stemming for word variations ("scan" matches "scanning")
- Synonym expansion ("k8s" matches "kubernetes")

#### 2. Capability-Based Search

```bash
# Find agents by specific capability
ossa search --capability vulnerability-detection

# API equivalent
GET /agents?capability=vulnerability-detection
```

#### 3. Taxonomy Navigation

```bash
# Browse by domain
ossa search --domain security

# Narrow by subdomain
ossa search --domain security --subdomain scanning

# API equivalent
GET /agents?domain=security&subdomain=scanning
```

#### 4. Compliance Filtering

```bash
# Find FedRAMP-compliant agents
ossa search --compliance fedramp

# Multiple compliance requirements
ossa search --compliance fedramp --compliance hipaa

# API equivalent
GET /agents?compliance=fedramp&compliance=hipaa
```

#### 5. Advanced Filters

```bash
# Verified publishers only
ossa search "code review" --verified

# Minimum rating
ossa search "deployment" --min-rating 4.0

# Specific license
ossa search "security" --license Apache-2.0

# API equivalent
GET /agents?q=security&verified=true&min_rating=4.0&license=Apache-2.0
```

#### 6. Sorting Options

```bash
# Most downloaded
ossa search "security" --sort downloads

# Highest rated
ossa search "security" --sort rating

# Recently updated
ossa search "security" --sort updated

# API equivalent
GET /agents?q=security&sort=downloads
```

---

### Search Index Structure

The registry uses OpenSearch with the following index mapping:

```json
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "standard",
        "boost": 5.0
      },
      "description": {
        "type": "text",
        "analyzer": "english",
        "boost": 3.0
      },
      "keywords": {
        "type": "text",
        "analyzer": "keyword",
        "boost": 2.0
      },
      "tags": {
        "type": "keyword"
      },
      "capabilities": {
        "type": "keyword"
      },
      "domain": {
        "type": "keyword"
      },
      "subdomain": {
        "type": "keyword"
      },
      "publisher": {
        "type": "keyword"
      },
      "verified": {
        "type": "boolean"
      },
      "downloads_total": {
        "type": "integer"
      },
      "rating_average": {
        "type": "float"
      },
      "updated_at": {
        "type": "date"
      }
    }
  }
}
```

---

## Publishing Workflow

### Prerequisites

1. **Registry Account**: Sign up at https://registry.openstandardagents.org
2. **CLI Installed**: `npm install -g @ossa/cli`
3. **Authentication**: Run `ossa login`

### Publishing Steps

#### Step 1: Create Agent Manifest

Create `agent.ossa.yaml`:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: security-scanner
  version: 1.2.0
  description: Enterprise security vulnerability scanner
  labels:
    domain: security
    compliance: fedramp
spec:
  role: Security expert specializing in vulnerability scanning
  taxonomy:
    domain: security
    subdomain: scanning
    capability: vulnerability-detection
  llm:
    provider: anthropic
    model: claude-3-sonnet-20240229
```

#### Step 2: Validate Manifest

```bash
# Validate against JSON schema
ossa validate agent.ossa.yaml

# Output:
# ✓ Schema validation passed
# ✓ No security issues found
# ✓ Ready to publish
```

#### Step 3: Add Registry Metadata

Create `ossa.json` in project root:

```json
{
  "name": "security-scanner",
  "version": "1.2.0",
  "description": "Enterprise security vulnerability scanner",
  "keywords": ["security", "vulnerability", "scanning", "compliance"],
  "license": "Apache-2.0",
  "repository": "https://github.com/blueflyio/security-scanner",
  "homepage": "https://bluefly.io/agents/security-scanner",
  "documentation": "https://docs.bluefly.io/agents/security-scanner",
  "manifest": "./agent.ossa.yaml",
  "dependencies": {
    "@ossa/runtime": "^0.3.0",
    "vuln-scanner-lib": "^2.1.0"
  },
  "files": [
    "agent.ossa.yaml",
    "tools/",
    "prompts/",
    "README.md"
  ]
}
```

#### Step 4: Publish

```bash
# Dry run (validate without publishing)
ossa publish --dry-run

# Publish to registry
ossa publish

# Output:
# 📦 Packaging security-scanner@1.2.0...
# ✓ Manifest validated
# ✓ Dependencies resolved
# ✓ Package created (1.2 MB)
# 🔐 Security scan: passed
# 📤 Uploading to registry...
# ✓ Published security-scanner@1.2.0
#
# View at: https://registry.openstandardagents.org/agents/blueflyio/security-scanner
```

#### Step 5: Verify Publication

```bash
# Check if published successfully
ossa view security-scanner

# Output shows agent details from registry
```

---

### Publishing Options

```bash
# Publish with custom tag
ossa publish --tag beta

# Publish with access control
ossa publish --access restricted

# Publish to private registry
ossa publish --registry https://registry.internal.example.com

# Publish with provenance (SLSA)
ossa publish --provenance
```

---

## Installation Workflow

### Basic Installation

```bash
# Install latest version
ossa install security-scanner

# Install specific version
ossa install security-scanner@1.2.0

# Install from org namespace
ossa install blueflyio/security-scanner

# Install with version range
ossa install "security-scanner@^1.0.0"
```

### Installation Process

```
1. Resolve agent name → registry ID
2. Fetch agent metadata from registry
3. Check compatibility (OSSA version, dependencies)
4. Download agent package from CDN
5. Verify package signature (SHA-256)
6. Resolve and install dependencies
7. Extract package to ~/.ossa/agents/
8. Register agent in local registry
9. Run post-install verification
```

### Installation Options

```bash
# Install to specific directory
ossa install security-scanner --prefix /opt/ossa

# Install without dependencies
ossa install security-scanner --no-deps

# Install with verbose output
ossa install security-scanner --verbose

# Reinstall (overwrite existing)
ossa install security-scanner --force

# Install from local package
ossa install ./security-scanner-1.2.0.tgz
```

---

### Dependency Resolution

OSSA CLI resolves dependencies using semver:

```bash
# Example dependency tree
security-scanner@1.2.0
├── @ossa/runtime@0.3.2
├── vuln-db-agent@2.1.5
│   └── @ossa/runtime@0.3.2 (deduped)
└── kubernetes-tools@1.28.4

# CLI automatically:
# - Resolves version ranges
# - Deduplicates shared dependencies
# - Checks for version conflicts
# - Downloads missing dependencies
```

**Conflict Resolution**:

```bash
# If conflicts detected:
$ ossa install security-scanner

⚠️  Dependency conflict detected:
  security-scanner requires @ossa/runtime@^0.3.0
  existing-agent requires @ossa/runtime@^0.2.0

Options:
  1. Upgrade existing-agent to compatible version
  2. Install security-scanner with --force (may break existing-agent)
  3. Cancel installation

Choose [1/2/3]:
```

---

## Namespaces & Organizations

### Namespace Types

#### 1. Public Namespace (Default)

```bash
# Published to public namespace
ossa publish

# Installed as: security-scanner
# URL: registry.openstandardagents.org/agents/security-scanner
```

#### 2. Organization Namespace

```bash
# Published to org namespace (requires ownership)
ossa publish --org blueflyio

# Installed as: @blueflyio/security-scanner
# URL: registry.openstandardagents.org/agents/blueflyio/security-scanner
```

#### 3. Private Registry

```bash
# Published to private registry
ossa publish --registry https://registry.internal.example.com

# Installed with registry config
ossa install security-scanner --registry https://registry.internal.example.com
```

---

### Organization Management

#### Create Organization

```bash
# Create organization via web UI
https://registry.openstandardagents.org/orgs/new

# Or via CLI
ossa org create blueflyio \
  --display-name "Bluefly.io" \
  --website "https://bluefly.io" \
  --email "support@bluefly.io"
```

#### Add Organization Members

```bash
# Add member with role
ossa org add-member blueflyio \
  --username john.doe \
  --role developer

# Roles:
# - owner: Full access, can manage members
# - admin: Publish/unpublish agents, manage settings
# - developer: Publish agents only
# - viewer: Read-only access
```

#### Organization Verification

Verified organizations get badge and improved discoverability:

**Requirements**:
1. Domain ownership verification (DNS TXT record)
2. Active for 30+ days
3. Published 3+ agents with average rating > 4.0
4. No security violations

**Apply for verification**:
```bash
ossa org verify blueflyio
```

---

## Verification & Trust

### Publisher Verification

#### Verification Process

1. **Domain Verification**:
   ```bash
   # Add DNS TXT record
   TXT _ossa-verify.example.com "ossa-verify=abc123def456"

   # Verify ownership
   ossa org verify-domain blueflyio --domain bluefly.io
   ```

2. **Identity Verification**:
   - Email verification
   - GitHub account linking
   - Optional: OIDC provider (Google Workspace, Okta)

3. **Security Review**:
   - No critical vulnerabilities in published agents
   - Compliant with registry policies
   - Responsive to security reports

#### Verified Publisher Badge

Agents from verified publishers display badge:

```
✓ Verified Publisher
  blueflyio has verified ownership of bluefly.io
```

---

### Security Scanning

Every published agent undergoes automated security scanning:

#### 1. Manifest Validation

```yaml
# Schema validation
✓ Valid OSSA v0.3.0 manifest
✓ All required fields present
✓ Semantic version format correct
```

#### 2. Dependency Scanning

```yaml
# Check dependencies for known vulnerabilities
✓ No vulnerable dependencies found
  Scanned: @ossa/runtime@0.3.2, vuln-scanner-lib@2.1.0
```

#### 3. Secret Detection

```yaml
# Scan for hardcoded secrets
✓ No secrets detected
  Checked: API keys, tokens, passwords, certificates
```

#### 4. Capability Analysis

```yaml
# Verify capability declarations match manifest
✓ Declared capabilities match implementation
  kubernetes: get_pods, describe_pod, get_logs
```

#### 5. Compliance Check

```yaml
# Verify compliance profile claims
✓ FedRAMP Moderate requirements met
  - Encryption at rest: enabled
  - Audit logging: enabled
  - PII redaction: enabled
```

---

### Security Scan Results

Scan results are included in registry metadata:

```json
{
  "security_scan": {
    "status": "passed",
    "scanned_at": "2025-12-12T10:00:00.000Z",
    "checks": {
      "schema_valid": true,
      "dependencies_secure": true,
      "secrets_detected": false,
      "capabilities_verified": true,
      "compliance_verified": true
    },
    "vulnerabilities": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0
    }
  }
}
```

**Failed Scans**:

Agents that fail security scans cannot be published:

```bash
$ ossa publish

❌ Security scan failed

  Critical Issues:
  - Hardcoded API key detected in prompts/system.yaml
  - Vulnerable dependency: old-lib@1.0.0 (CVE-2024-12345)

  Fix these issues and try again.
```

---

## Registry Implementation

### Technology Stack

- **API**: Go (Gin framework), gRPC
- **Database**: PostgreSQL (metadata), Redis (cache)
- **Search**: OpenSearch (Elasticsearch fork)
- **Storage**: S3/R2 (agent packages), CloudFront/CloudFlare (CDN)
- **Queue**: RabbitMQ (async tasks)
- **Monitoring**: Prometheus, Grafana, Jaeger

### Database Schema

```sql
-- Publishers
CREATE TABLE publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  website VARCHAR(500),
  github_username VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(253) NOT NULL,
  publisher_id UUID NOT NULL REFERENCES publishers(id),
  description TEXT,
  license VARCHAR(100),
  repository VARCHAR(500),
  homepage VARCHAR(500),
  documentation VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, publisher_id)
);

-- Agent Versions
CREATE TABLE agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  version VARCHAR(50) NOT NULL,
  manifest_url VARCHAR(500) NOT NULL,
  package_url VARCHAR(500) NOT NULL,
  package_size BIGINT NOT NULL,
  package_shasum VARCHAR(64) NOT NULL,
  deprecated BOOLEAN DEFAULT FALSE,
  deprecation_reason TEXT,
  replacement_version VARCHAR(50),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, version)
);

-- Downloads
CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_version_id UUID NOT NULL REFERENCES agent_versions(id),
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  ip_hash VARCHAR(64),  -- Hashed IP for privacy
  country VARCHAR(2),
  user_agent VARCHAR(500)
);

-- Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  version VARCHAR(50),
  use_case VARCHAR(500),
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, user_id)
);

-- Security Scans
CREATE TABLE security_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_version_id UUID NOT NULL REFERENCES agent_versions(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'pending')),
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  vulnerabilities_critical INTEGER DEFAULT 0,
  vulnerabilities_high INTEGER DEFAULT 0,
  vulnerabilities_medium INTEGER DEFAULT 0,
  vulnerabilities_low INTEGER DEFAULT 0,
  report JSONB
);
```

---

## Security Model

### Authentication Methods

#### 1. OAuth 2.0

```bash
# Login via web browser (OAuth flow)
ossa login

# Opens browser to:
https://registry.openstandardagents.org/oauth/authorize?client_id=...

# After authorization, token saved to ~/.ossa/token
```

#### 2. API Token

```bash
# Generate API token (via web UI)
https://registry.openstandardagents.org/settings/tokens

# Use token directly
export OSSA_TOKEN=ossa_tok_1234567890abcdef
ossa publish
```

#### 3. CI/CD Integration

```yaml
# GitHub Actions example
name: Publish Agent
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ossa/setup-cli@v1
      - name: Publish to Registry
        env:
          OSSA_TOKEN: ${{ secrets.OSSA_TOKEN }}
        run: ossa publish
```

---

### Authorization Model

**Permissions**:

| Action | Public User | Publisher | Org Member | Org Admin | Org Owner |
|--------|------------|-----------|-----------|-----------|-----------|
| Search agents | ✅ | ✅ | ✅ | ✅ | ✅ |
| Download agents | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit ratings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Publish agents (public) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Publish agents (org) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Unpublish versions | ❌ | ✅ (own) | ✅ (org) | ✅ (org) | ✅ (org) |
| Deprecate versions | ❌ | ✅ (own) | ✅ (org) | ✅ (org) | ✅ (org) |
| Manage org members | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete org | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### Package Integrity

#### SHA-256 Checksums

Every package includes SHA-256 checksum:

```bash
# Checksum generated on publish
$ ossa publish
✓ Package checksum: abc123def456...

# Verified on install
$ ossa install security-scanner
✓ Checksum verified
```

#### Package Signing (SLSA)

Optional: Sign packages with SLSA provenance:

```bash
# Publish with provenance
ossa publish --provenance

# Generates SLSA attestation:
{
  "_type": "https://in-toto.io/Statement/v0.1",
  "subject": [
    {
      "name": "pkg:ossa/blueflyio/security-scanner@1.2.0",
      "digest": {"sha256": "abc123..."}
    }
  ],
  "predicateType": "https://slsa.dev/provenance/v0.2",
  "predicate": {
    "builder": {"id": "https://github.com/actions/runner"},
    "buildType": "https://github.com/actions/workflow",
    "invocation": {...},
    "materials": [...]
  }
}
```

---

## Rate Limiting & Quotas

### Rate Limits

| Endpoint | Authenticated | Unauthenticated |
|----------|--------------|-----------------|
| GET /agents | 1000/hour | 100/hour |
| GET /agents/{id} | 5000/hour | 500/hour |
| POST /agents | 50/hour | N/A |
| DELETE /agents/{id} | 10/hour | N/A |
| POST /reviews | 20/hour | N/A |

**Rate Limit Headers**:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1735939800
```

---

### Storage Quotas

| Plan | Max Package Size | Total Storage | Bandwidth |
|------|-----------------|---------------|-----------|
| Free | 50 MB | 1 GB | 10 GB/month |
| Pro | 500 MB | 100 GB | 1 TB/month |
| Enterprise | 5 GB | Unlimited | Unlimited |

---

## Versioning Strategy

### Semantic Versioning

All agents MUST use semantic versioning (semver 2.0.0):

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Examples:
- 1.0.0         (stable release)
- 1.2.3         (patch update)
- 2.0.0-beta.1  (pre-release)
- 1.0.0+build.123 (build metadata)
```

### Version Ranges

OSSA CLI supports standard semver ranges:

```json
{
  "dependencies": {
    "@ossa/runtime": "^0.3.0",     // >= 0.3.0, < 0.4.0
    "tool-agent": "~1.2.0",        // >= 1.2.0, < 1.3.0
    "other-agent": "1.x",          // >= 1.0.0, < 2.0.0
    "specific": "1.2.3",           // Exactly 1.2.3
    "range": ">=1.0.0 <2.0.0"      // Between 1.0.0 and 2.0.0
  }
}
```

### Version Deprecation

Publishers can deprecate old versions:

```bash
# Deprecate version
ossa deprecate security-scanner@1.0.0 \
  --reason "Security vulnerability - upgrade to 1.1.0+" \
  --replacement 1.1.0

# CLI warns users on install
$ ossa install security-scanner@1.0.0

⚠️  WARNING: security-scanner@1.0.0 is deprecated
  Reason: Security vulnerability - upgrade to 1.1.0+
  Recommended: security-scanner@1.1.0

Continue anyway? [y/N]:
```

---

## CLI Reference

### Installation

```bash
# npm
npm install -g @ossa/cli

# yarn
yarn global add @ossa/cli

# Homebrew (macOS)
brew install ossa

# Scoop (Windows)
scoop install ossa

# Direct download
curl -fsSL https://install.openstandardagents.org | sh
```

---

### Commands

#### `ossa login`

Authenticate with registry.

```bash
ossa login

# Options:
#   --token <token>     Use API token directly
#   --registry <url>    Custom registry URL
```

---

#### `ossa logout`

Remove authentication token.

```bash
ossa logout

# Options:
#   --registry <url>    Custom registry URL
```

---

#### `ossa search`

Search for agents.

```bash
ossa search [query]

# Options:
#   --capability <cap>     Filter by capability
#   --domain <domain>      Filter by domain
#   --compliance <profile> Filter by compliance
#   --verified             Verified publishers only
#   --min-rating <rating>  Minimum rating (1-5)
#   --license <license>    Filter by license
#   --sort <field>         Sort by: downloads, rating, updated, created
#   --limit <n>            Results per page
#   --json                 Output as JSON

# Examples:
ossa search "kubernetes security"
ossa search --capability vulnerability-detection
ossa search --compliance fedramp --verified
```

---

#### `ossa view`

View agent details.

```bash
ossa view <agent>

# Options:
#   --version <version>  Specific version
#   --json               Output as JSON

# Examples:
ossa view security-scanner
ossa view blueflyio/security-scanner@1.2.0
```

---

#### `ossa install`

Install agent.

```bash
ossa install <agent>[@version]

# Options:
#   --prefix <dir>       Install directory
#   --no-deps            Skip dependencies
#   --force              Overwrite existing
#   --verbose            Verbose output
#   --registry <url>     Custom registry

# Examples:
ossa install security-scanner
ossa install security-scanner@1.2.0
ossa install blueflyio/security-scanner
ossa install "security-scanner@^1.0.0"
```

---

#### `ossa uninstall`

Uninstall agent.

```bash
ossa uninstall <agent>

# Options:
#   --prefix <dir>       Install directory

# Examples:
ossa uninstall security-scanner
```

---

#### `ossa publish`

Publish agent to registry.

```bash
ossa publish [directory]

# Options:
#   --dry-run            Validate without publishing
#   --tag <tag>          Publish with tag (e.g., beta, latest)
#   --access <level>     public | restricted | private
#   --org <org>          Publish to organization
#   --registry <url>     Custom registry
#   --provenance         Generate SLSA provenance

# Examples:
ossa publish
ossa publish --dry-run
ossa publish --org blueflyio
ossa publish --tag beta
```

---

#### `ossa unpublish`

Remove agent version from registry.

```bash
ossa unpublish <agent>@<version>

# Options:
#   --reason <reason>    Reason for unpublishing
#   --force              Skip confirmation

# Examples:
ossa unpublish security-scanner@1.0.0
ossa unpublish security-scanner@1.0.0 --reason "Security vulnerability"
```

---

#### `ossa deprecate`

Mark version as deprecated.

```bash
ossa deprecate <agent>@<version>

# Options:
#   --reason <reason>       Deprecation reason
#   --replacement <version> Recommended replacement version

# Examples:
ossa deprecate security-scanner@1.0.0 --replacement 1.1.0
```

---

#### `ossa validate`

Validate agent manifest.

```bash
ossa validate [manifest]

# Options:
#   --schema <version>   OSSA schema version

# Examples:
ossa validate agent.ossa.yaml
ossa validate --schema v0.3.0
```

---

## SDK Integration

### JavaScript/TypeScript

```typescript
import { OSSARegistry } from '@ossa/registry-sdk';

const registry = new OSSARegistry({
  url: 'https://registry.openstandardagents.org/api/v1',
  token: process.env.OSSA_TOKEN
});

// Search agents
const results = await registry.search({
  query: 'security',
  capability: 'vulnerability-detection',
  verified: true,
  limit: 10
});

// Get agent details
const agent = await registry.getAgent('blueflyio/security-scanner');

// Install agent
await registry.install('security-scanner', {
  version: '^1.0.0',
  prefix: './agents'
});

// Publish agent
await registry.publish({
  manifest: './agent.ossa.yaml',
  packagePath: './dist'
});
```

---

### Python

```python
from ossa_registry import Registry

registry = Registry(
    url='https://registry.openstandardagents.org/api/v1',
    token=os.environ['OSSA_TOKEN']
)

# Search agents
results = registry.search(
    query='security',
    capability='vulnerability-detection',
    verified=True,
    limit=10
)

# Get agent details
agent = registry.get_agent('blueflyio/security-scanner')

# Install agent
registry.install(
    'security-scanner',
    version='^1.0.0',
    prefix='./agents'
)

# Publish agent
registry.publish(
    manifest='./agent.ossa.yaml',
    package_path='./dist'
)
```

---

### Go

```go
import "github.com/openstandardagents/registry-sdk-go"

client := registry.NewClient(&registry.Config{
    URL:   "https://registry.openstandardagents.org/api/v1",
    Token: os.Getenv("OSSA_TOKEN"),
})

// Search agents
results, err := client.Search(ctx, &registry.SearchRequest{
    Query:      "security",
    Capability: "vulnerability-detection",
    Verified:   true,
    Limit:      10,
})

// Get agent details
agent, err := client.GetAgent(ctx, "blueflyio/security-scanner")

// Install agent
err = client.Install(ctx, &registry.InstallRequest{
    Agent:   "security-scanner",
    Version: "^1.0.0",
    Prefix:  "./agents",
})

// Publish agent
err = client.Publish(ctx, &registry.PublishRequest{
    Manifest:    "./agent.ossa.yaml",
    PackagePath: "./dist",
})
```

---

## Best Practices

### For Publishers

#### 1. Version Management

**DO**:
- Use semantic versioning consistently
- Increment MAJOR for breaking changes
- Increment MINOR for new features
- Increment PATCH for bug fixes
- Publish changelog with each release

**DON'T**:
- Reuse version numbers
- Delete published versions (deprecate instead)
- Make breaking changes in PATCH versions

#### 2. Documentation

**DO**:
- Include comprehensive README.md
- Provide usage examples
- Document all capabilities
- Maintain CHANGELOG.md
- Include troubleshooting guide

**DON'T**:
- Leave README empty
- Assume users know how to use your agent
- Skip changelog entries

#### 3. Dependencies

**DO**:
- Use version ranges (^, ~) for flexibility
- Keep dependencies up to date
- Document external requirements
- Test with minimum supported versions

**DON'T**:
- Pin to exact versions unnecessarily
- Use deprecated dependencies
- Bundle dependencies in package

#### 4. Security

**DO**:
- Scan for vulnerabilities before publishing
- Use secrets manager for credentials
- Enable security features (encryption, audit logging)
- Respond to security reports promptly

**DON'T**:
- Hardcode secrets in manifest
- Ignore security scan warnings
- Grant excessive capabilities

---

### For Consumers

#### 1. Installation

**DO**:
- Use version ranges for flexibility
- Review agent metadata before installing
- Check security scan results
- Prefer verified publishers

**DON'T**:
- Install agents without reviewing capabilities
- Ignore deprecation warnings
- Use outdated versions

#### 2. Updates

**DO**:
- Check for updates regularly
- Read changelogs before updating
- Test updates in non-production first
- Use version ranges to get updates automatically

**DON'T**:
- Use exact versions for all dependencies
- Skip CHANGELOG review
- Update directly in production

---

## Examples

### Example 1: Publishing Your First Agent

```bash
# 1. Create agent directory
mkdir my-agent && cd my-agent

# 2. Create manifest
cat > agent.ossa.yaml <<EOF
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
  description: My first OSSA agent
spec:
  role: A helpful assistant
  llm:
    provider: anthropic
    model: claude-3-sonnet-20240229
EOF

# 3. Create package metadata
cat > ossa.json <<EOF
{
  "name": "my-agent",
  "version": "1.0.0",
  "description": "My first OSSA agent",
  "license": "MIT",
  "manifest": "./agent.ossa.yaml"
}
EOF

# 4. Validate
ossa validate agent.ossa.yaml

# 5. Login to registry
ossa login

# 6. Publish
ossa publish
```

---

### Example 2: Finding and Installing Agents

```bash
# Search for security agents
ossa search "security" --domain security --verified

# View agent details
ossa view blueflyio/security-scanner

# Install latest version
ossa install blueflyio/security-scanner

# Install specific version
ossa install blueflyio/security-scanner@1.2.0

# Install with version range
ossa install "blueflyio/security-scanner@^1.0.0"
```

---

### Example 3: Organization Publishing

```bash
# Create organization
ossa org create my-company \
  --display-name "My Company" \
  --website "https://example.com"

# Verify domain ownership
ossa org verify-domain my-company --domain example.com

# Publish to organization
ossa publish --org my-company

# Result: @my-company/agent-name
```

---

### Example 4: Private Registry

```bash
# Configure private registry
ossa config set registry https://registry.internal.example.com

# Login to private registry
ossa login --registry https://registry.internal.example.com

# Publish to private registry
ossa publish --registry https://registry.internal.example.com

# Install from private registry
ossa install my-agent --registry https://registry.internal.example.com
```

---

## References

- [OSSA Specification v0.3.0](../v0.3.0/)
- [Agent Manifest Spec](../v0.2.9/agent.md)
- [Semantic Versioning 2.0.0](https://semver.org/)
- [SLSA Provenance](https://slsa.dev/)
- [SPDX License List](https://spdx.org/licenses/)
- [OpenAPI Specification](https://spec.openapis.org/) (inspiration)
- [npm Registry](https://docs.npmjs.com/cli/v10/using-npm/registry) (inspiration)
- [Docker Hub](https://docs.docker.com/docker-hub/) (inspiration)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-12
**Status**: Draft
**Authors**: OSSA Technical Committee
