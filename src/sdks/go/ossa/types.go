// Package ossa provides types and utilities for OSSA v0.5 manifests.
package ossa

// Version is the SDK version.
const Version = "0.5.0"

// Manifest represents an OSSA manifest.
type Manifest struct {
	APIVersion      string               `json:"apiVersion" yaml:"apiVersion"`
	Kind            Kind                 `json:"kind" yaml:"kind"`
	Metadata        Metadata             `json:"metadata" yaml:"metadata"`
	Spec            Spec                 `json:"spec" yaml:"spec"`
	Security        *SecurityPosture     `json:"security,omitempty" yaml:"security,omitempty"`
	Governance      *Governance          `json:"governance,omitempty" yaml:"governance,omitempty"`
	Protocols       *ProtocolDeclarations `json:"protocols,omitempty" yaml:"protocols,omitempty"`
	TokenEfficiency *TokenEfficiency     `json:"token_efficiency,omitempty" yaml:"token_efficiency,omitempty"`
	Cognition       *Cognition           `json:"cognition,omitempty" yaml:"cognition,omitempty"`
	Extensions      map[string]any       `json:"extensions,omitempty" yaml:"extensions,omitempty"`
}

// Kind represents the manifest kind.
type Kind string

const (
	KindAgent    Kind = "Agent"
	KindTask     Kind = "Task"
	KindWorkflow Kind = "Workflow"
)

// IsAgent returns true if the manifest kind is Agent.
func (m *Manifest) IsAgent() bool { return m.Kind == KindAgent }

// IsTask returns true if the manifest kind is Task.
func (m *Manifest) IsTask() bool { return m.Kind == KindTask }

// IsWorkflow returns true if the manifest kind is Workflow.
func (m *Manifest) IsWorkflow() bool { return m.Kind == KindWorkflow }

// AccessTier represents the access level of an agent.
type AccessTier string

const (
	TierRead          AccessTier = "read"
	TierReadShort     AccessTier = "r"
	TierWrite         AccessTier = "write"
	TierWriteShort    AccessTier = "w"
	TierElevated      AccessTier = "write-elevated"
	TierElevatedShort AccessTier = "elevated"
	TierWriteElevated AccessTier = "write-elevated"
	TierAdmin         AccessTier = "admin"
)

// NormalizeAccessTier normalizes shorthand access tiers to canonical form.
func NormalizeAccessTier(tier AccessTier) AccessTier {
	switch tier {
	case TierReadShort:
		return TierRead
	case TierWriteShort:
		return TierWrite
	case TierElevatedShort:
		return TierWriteElevated
	default:
		return tier
	}
}

// GetAccessTier returns the normalized access tier from spec or identity.
func (m *Manifest) GetAccessTier() AccessTier {
	if m.Spec.Identity != nil && m.Spec.Identity.AccessTier != "" {
		return NormalizeAccessTier(m.Spec.Identity.AccessTier)
	}
	if m.Spec.AccessTier != "" {
		return NormalizeAccessTier(m.Spec.AccessTier)
	}
	return TierRead
}

// Metadata contains manifest metadata.
type Metadata struct {
	Name        string            `json:"name" yaml:"name"`
	Version     string            `json:"version,omitempty" yaml:"version,omitempty"`
	Description string            `json:"description,omitempty" yaml:"description,omitempty"`
	Labels      map[string]string `json:"labels,omitempty" yaml:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty" yaml:"annotations,omitempty"`
	Identity    *AgentIdentity    `json:"identity,omitempty" yaml:"identity,omitempty"`
}

// AgentIdentity contains agent identity information.
type AgentIdentity struct {
	AgentID   string     `json:"agent_id,omitempty" yaml:"agent_id,omitempty"`
	Namespace string     `json:"namespace,omitempty" yaml:"namespace,omitempty"`
	Publisher *Publisher `json:"publisher,omitempty" yaml:"publisher,omitempty"`
	Checksum  string     `json:"checksum,omitempty" yaml:"checksum,omitempty"`
	CreatedAt string     `json:"created_at,omitempty" yaml:"created_at,omitempty"`
}

// Publisher contains publisher information.
type Publisher struct {
	Name    string `json:"name" yaml:"name"`
	URL     string `json:"url,omitempty" yaml:"url,omitempty"`
	Contact string `json:"contact,omitempty" yaml:"contact,omitempty"`
}

// Spec contains the agent specification.
type Spec struct {
	Role        string          `json:"role" yaml:"role"`
	LLM         *LLMConfig      `json:"llm,omitempty" yaml:"llm,omitempty"`
	Tools       []ToolConfig    `json:"tools,omitempty" yaml:"tools,omitempty"`
	Autonomy    *AutonomyConfig `json:"autonomy,omitempty" yaml:"autonomy,omitempty"`
	Constraints *Constraints    `json:"constraints,omitempty" yaml:"constraints,omitempty"`
	AccessTier  AccessTier      `json:"accessTier,omitempty" yaml:"accessTier,omitempty"`
	Identity    *Identity       `json:"identity,omitempty" yaml:"identity,omitempty"`
	Safety      *Safety         `json:"safety,omitempty" yaml:"safety,omitempty"`
}

// Identity contains agent identity within the spec (v0.4 compat).
type Identity struct {
	AccessTier AccessTier `json:"accessTier,omitempty" yaml:"accessTier,omitempty"`
}

// Safety contains safety configuration.
type Safety struct {
	ContentFilters []string `json:"contentFilters,omitempty" yaml:"contentFilters,omitempty"`
	MaxRetries     int      `json:"maxRetries,omitempty" yaml:"maxRetries,omitempty"`
}

// LLMConfig contains LLM configuration.
type LLMConfig struct {
	Provider    string  `json:"provider" yaml:"provider"`
	Model       string  `json:"model" yaml:"model"`
	Temperature float64 `json:"temperature,omitempty" yaml:"temperature,omitempty"`
	MaxTokens   int     `json:"maxTokens,omitempty" yaml:"maxTokens,omitempty"`
	TopP        float64 `json:"topP,omitempty" yaml:"topP,omitempty"`
}

// ToolConfig contains tool configuration.
type ToolConfig struct {
	Type         string         `json:"type" yaml:"type"`
	Name         string         `json:"name,omitempty" yaml:"name,omitempty"`
	Description  string         `json:"description,omitempty" yaml:"description,omitempty"`
	Server       string         `json:"server,omitempty" yaml:"server,omitempty"`
	Namespace    string         `json:"namespace,omitempty" yaml:"namespace,omitempty"`
	Endpoint     string         `json:"endpoint,omitempty" yaml:"endpoint,omitempty"`
	Capabilities []string       `json:"capabilities,omitempty" yaml:"capabilities,omitempty"`
	Config       map[string]any `json:"config,omitempty" yaml:"config,omitempty"`
}

// AutonomyConfig contains autonomy settings.
type AutonomyConfig struct {
	Level            string   `json:"level,omitempty" yaml:"level,omitempty"`
	ApprovalRequired bool     `json:"approvalRequired,omitempty" yaml:"approvalRequired,omitempty"`
	AllowedActions   []string `json:"allowedActions,omitempty" yaml:"allowedActions,omitempty"`
	BlockedActions   []string `json:"blockedActions,omitempty" yaml:"blockedActions,omitempty"`
}

// Constraints contains agent constraints.
type Constraints struct {
	Cost        *CostConstraints        `json:"cost,omitempty" yaml:"cost,omitempty"`
	Performance *PerformanceConstraints `json:"performance,omitempty" yaml:"performance,omitempty"`
}

// CostConstraints contains cost constraints.
type CostConstraints struct {
	MaxTokensPerDay     int     `json:"maxTokensPerDay,omitempty" yaml:"maxTokensPerDay,omitempty"`
	MaxTokensPerRequest int     `json:"maxTokensPerRequest,omitempty" yaml:"maxTokensPerRequest,omitempty"`
	MaxCostPerDay       float64 `json:"maxCostPerDay,omitempty" yaml:"maxCostPerDay,omitempty"`
	Currency            string  `json:"currency,omitempty" yaml:"currency,omitempty"`
}

// PerformanceConstraints contains performance constraints.
type PerformanceConstraints struct {
	MaxLatencySeconds     float64 `json:"maxLatencySeconds,omitempty" yaml:"maxLatencySeconds,omitempty"`
	MaxConcurrentRequests int     `json:"maxConcurrentRequests,omitempty" yaml:"maxConcurrentRequests,omitempty"`
	TimeoutSeconds        int     `json:"timeoutSeconds,omitempty" yaml:"timeoutSeconds,omitempty"`
}

// --- v0.5 Top-Level Sections ---

// SecurityPosture contains security configuration (v0.5).
type SecurityPosture struct {
	Tier               string              `json:"tier,omitempty" yaml:"tier,omitempty"`
	Capabilities       *SecurityCapabilities `json:"capabilities,omitempty" yaml:"capabilities,omitempty"`
	Sandboxing         *SandboxConfig      `json:"sandboxing,omitempty" yaml:"sandboxing,omitempty"`
	NetworkAccess      *NetworkAccess      `json:"network_access,omitempty" yaml:"network_access,omitempty"`
	DataClassification string              `json:"data_classification,omitempty" yaml:"data_classification,omitempty"`
	Audit              *AuditConfig        `json:"audit,omitempty" yaml:"audit,omitempty"`
	ThreatModel        []ThreatModelEntry  `json:"threat_model,omitempty" yaml:"threat_model,omitempty"`
}

// SecurityCapabilities describes security capabilities.
type SecurityCapabilities struct {
	Encryption     bool `json:"encryption,omitempty" yaml:"encryption,omitempty"`
	Authentication bool `json:"authentication,omitempty" yaml:"authentication,omitempty"`
	Authorization  bool `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	AuditLogging   bool `json:"audit_logging,omitempty" yaml:"audit_logging,omitempty"`
}

// SandboxConfig contains sandbox configuration.
type SandboxConfig struct {
	Enabled  bool   `json:"enabled,omitempty" yaml:"enabled,omitempty"`
	Runtime  string `json:"runtime,omitempty" yaml:"runtime,omitempty"`
	Isolated bool   `json:"isolated,omitempty" yaml:"isolated,omitempty"`
}

// NetworkAccess describes network access rules.
type NetworkAccess struct {
	Outbound      bool     `json:"outbound,omitempty" yaml:"outbound,omitempty"`
	Inbound       bool     `json:"inbound,omitempty" yaml:"inbound,omitempty"`
	AllowedHosts  []string `json:"allowed_hosts,omitempty" yaml:"allowed_hosts,omitempty"`
	BlockedHosts  []string `json:"blocked_hosts,omitempty" yaml:"blocked_hosts,omitempty"`
	AllowedPorts  []int    `json:"allowed_ports,omitempty" yaml:"allowed_ports,omitempty"`
}

// AuditConfig contains audit configuration.
type AuditConfig struct {
	Enabled     bool   `json:"enabled,omitempty" yaml:"enabled,omitempty"`
	Destination string `json:"destination,omitempty" yaml:"destination,omitempty"`
	Format      string `json:"format,omitempty" yaml:"format,omitempty"`
	Retention   string `json:"retention,omitempty" yaml:"retention,omitempty"`
}

// ThreatModelEntry represents a threat model entry.
type ThreatModelEntry struct {
	Threat     string `json:"threat" yaml:"threat"`
	Severity   string `json:"severity,omitempty" yaml:"severity,omitempty"`
	Mitigation string `json:"mitigation,omitempty" yaml:"mitigation,omitempty"`
}

// Governance contains governance configuration (v0.5).
type Governance struct {
	Authorization       map[string]any `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	Compliance          []string       `json:"compliance,omitempty" yaml:"compliance,omitempty"`
	QualityRequirements map[string]any `json:"quality_requirements,omitempty" yaml:"quality_requirements,omitempty"`
}

// ProtocolDeclarations contains protocol declarations (v0.5).
type ProtocolDeclarations struct {
	MCP []MCPDeclaration `json:"mcp,omitempty" yaml:"mcp,omitempty"`
	A2A []A2ADeclaration `json:"a2a,omitempty" yaml:"a2a,omitempty"`
	ANP []ANPDeclaration `json:"anp,omitempty" yaml:"anp,omitempty"`
}

// MCPDeclaration declares an MCP server.
type MCPDeclaration struct {
	Name      string   `json:"name" yaml:"name"`
	Command   string   `json:"command" yaml:"command"`
	Args      []string `json:"args,omitempty" yaml:"args,omitempty"`
	Env       map[string]string `json:"env,omitempty" yaml:"env,omitempty"`
	Transport string   `json:"transport,omitempty" yaml:"transport,omitempty"`
}

// A2ADeclaration declares an A2A endpoint.
type A2ADeclaration struct {
	Name     string   `json:"name" yaml:"name"`
	Endpoint string   `json:"endpoint" yaml:"endpoint"`
	Skills   []string `json:"skills,omitempty" yaml:"skills,omitempty"`
}

// ANPDeclaration declares an ANP configuration.
type ANPDeclaration struct {
	Name     string `json:"name" yaml:"name"`
	Registry string `json:"registry,omitempty" yaml:"registry,omitempty"`
	Protocol string `json:"protocol,omitempty" yaml:"protocol,omitempty"`
}

// TokenEfficiency contains token efficiency settings (v0.5).
type TokenEfficiency struct {
	Budget        map[string]any `json:"budget,omitempty" yaml:"budget,omitempty"`
	Compression   map[string]any `json:"compression,omitempty" yaml:"compression,omitempty"`
	Consolidation map[string]any `json:"consolidation,omitempty" yaml:"consolidation,omitempty"`
	Routing       map[string]any `json:"routing,omitempty" yaml:"routing,omitempty"`
	CustomMetrics map[string]any `json:"custom_metrics,omitempty" yaml:"custom_metrics,omitempty"`
}

// Cognition contains cognition settings (v0.5).
type Cognition struct {
	Pattern     string         `json:"pattern,omitempty" yaml:"pattern,omitempty"`
	Constraints map[string]any `json:"constraints,omitempty" yaml:"constraints,omitempty"`
	Governance  map[string]any `json:"governance,omitempty" yaml:"governance,omitempty"`
	Trace       map[string]any `json:"trace,omitempty" yaml:"trace,omitempty"`
}
