// Package types defines OSSA manifest types aligned with agent.schema.json v0.5.
package types

// Kind represents the type of OSSA manifest.
type Kind string

const (
	KindAgent    Kind = "Agent"
	KindTask     Kind = "Task"
	KindWorkflow Kind = "Workflow"
	KindFlow     Kind = "Flow"
)

// LLMProvider represents supported LLM providers.
type LLMProvider string

const (
	ProviderAnthropic LLMProvider = "anthropic"
	ProviderOpenAI    LLMProvider = "openai"
	ProviderAzure     LLMProvider = "azure"
	ProviderGoogle    LLMProvider = "google"
	ProviderBedrock   LLMProvider = "bedrock"
	ProviderGroq      LLMProvider = "groq"
	ProviderOllama    LLMProvider = "ollama"
)

// AccessTier represents agent access levels.
type AccessTier string

const (
	TierRead           AccessTier = "tier_1_read"
	TierWriteLimited   AccessTier = "tier_2_write_limited"
	TierWriteElevated  AccessTier = "tier_3_write_elevated"
	TierPolicy         AccessTier = "tier_4_policy"
)

// SecurityTierLevel represents trust tiers.
type SecurityTierLevel string

const (
	TierOfficial          SecurityTierLevel = "official"
	TierVerifiedSignature SecurityTierLevel = "verified-signature"
	TierSigned            SecurityTierLevel = "signed"
	TierCommunity         SecurityTierLevel = "community"
	TierExperimental      SecurityTierLevel = "experimental"
)

// Manifest is the top-level OSSA manifest.
type Manifest struct {
	APIVersion      string               `json:"apiVersion" yaml:"apiVersion"`
	Kind            Kind                 `json:"kind" yaml:"kind"`
	Metadata        Metadata             `json:"metadata" yaml:"metadata"`
	Spec            map[string]any       `json:"spec,omitempty" yaml:"spec,omitempty"`
	Security        *SecurityPosture     `json:"security,omitempty" yaml:"security,omitempty"`
	Governance      *Governance          `json:"governance,omitempty" yaml:"governance,omitempty"`
	Protocols       *ProtocolDeclarations `json:"protocols,omitempty" yaml:"protocols,omitempty"`
	TokenEfficiency *TokenEfficiency     `json:"token_efficiency,omitempty" yaml:"token_efficiency,omitempty"`
	Cognition       *Cognition           `json:"cognition,omitempty" yaml:"cognition,omitempty"`
	Extensions      map[string]any       `json:"extensions,omitempty" yaml:"extensions,omitempty"`
}

// IsAgent returns true if this is an Agent manifest.
func (m *Manifest) IsAgent() bool { return m.Kind == KindAgent }

// IsTask returns true if this is a Task manifest.
func (m *Manifest) IsTask() bool { return m.Kind == KindTask }

// IsWorkflow returns true if this is a Workflow manifest.
func (m *Manifest) IsWorkflow() bool { return m.Kind == KindWorkflow }

// Metadata contains agent identification and registry info.
type Metadata struct {
	Name        string            `json:"name" yaml:"name"`
	Version     string            `json:"version,omitempty" yaml:"version,omitempty"`
	Namespace   string            `json:"namespace,omitempty" yaml:"namespace,omitempty"`
	Description string            `json:"description,omitempty" yaml:"description,omitempty"`
	Labels      map[string]string `json:"labels,omitempty" yaml:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty" yaml:"annotations,omitempty"`
	Identity    *AgentIdentity    `json:"identity,omitempty" yaml:"identity,omitempty"`
	UUID        string            `json:"uuid,omitempty" yaml:"uuid,omitempty"`
	Status      string            `json:"status,omitempty" yaml:"status,omitempty"`
	AgentType   string            `json:"agentType,omitempty" yaml:"agentType,omitempty"`
	AgentKind   string            `json:"agentKind,omitempty" yaml:"agentKind,omitempty"`
}

// AgentIdentity provides identity attestation.
type AgentIdentity struct {
	Namespace string    `json:"namespace,omitempty" yaml:"namespace,omitempty"`
	AgentID   string    `json:"agent_id,omitempty" yaml:"agent_id,omitempty"`
	Version   string    `json:"version,omitempty" yaml:"version,omitempty"`
	Publisher *Publisher `json:"publisher,omitempty" yaml:"publisher,omitempty"`
	Checksum  string    `json:"checksum,omitempty" yaml:"checksum,omitempty"`
	CreatedAt string    `json:"created_at,omitempty" yaml:"created_at,omitempty"`
	UpdatedAt string    `json:"updated_at,omitempty" yaml:"updated_at,omitempty"`
}

// Publisher identifies who published the agent.
type Publisher struct {
	Name        string `json:"name,omitempty" yaml:"name,omitempty"`
	Email       string `json:"email,omitempty" yaml:"email,omitempty"`
	Website     string `json:"website,omitempty" yaml:"website,omitempty"`
	PGPKey      string `json:"pgp_key,omitempty" yaml:"pgp_key,omitempty"`
	RegistryURL string `json:"registry_url,omitempty" yaml:"registry_url,omitempty"`
}

// LLMConfig defines LLM provider settings.
type LLMConfig struct {
	Provider    string   `json:"provider" yaml:"provider"`
	Model       string   `json:"model" yaml:"model"`
	Temperature *float64 `json:"temperature,omitempty" yaml:"temperature,omitempty"`
	MaxTokens   *int     `json:"maxTokens,omitempty" yaml:"maxTokens,omitempty"`
	TopP        *float64 `json:"top_p,omitempty" yaml:"top_p,omitempty"`
}

// Tool defines an agent tool.
type Tool struct {
	Name        string         `json:"name" yaml:"name"`
	Type        string         `json:"type,omitempty" yaml:"type,omitempty"`
	Description string         `json:"description,omitempty" yaml:"description,omitempty"`
	Parameters  map[string]any `json:"parameters,omitempty" yaml:"parameters,omitempty"`
	Permissions []string       `json:"permissions,omitempty" yaml:"permissions,omitempty"`
}

// SecurityPosture declares security properties (v0.5 top-level).
type SecurityPosture struct {
	Tier               string              `json:"tier,omitempty" yaml:"tier,omitempty"`
	ThreatModel        []ThreatModelEntry  `json:"threat_model,omitempty" yaml:"threat_model,omitempty"`
	Capabilities       *SecurityCapabilities `json:"capabilities,omitempty" yaml:"capabilities,omitempty"`
	Sandboxing         *SandboxConfig      `json:"sandboxing,omitempty" yaml:"sandboxing,omitempty"`
	NetworkAccess      *NetworkAccess      `json:"network_access,omitempty" yaml:"network_access,omitempty"`
	DataClassification string              `json:"data_classification,omitempty" yaml:"data_classification,omitempty"`
	Audit              *AuditConfig        `json:"audit,omitempty" yaml:"audit,omitempty"`
}

// ThreatModelEntry describes a threat and its mitigations.
type ThreatModelEntry struct {
	Category    string   `json:"category,omitempty" yaml:"category,omitempty"`
	Severity    string   `json:"severity,omitempty" yaml:"severity,omitempty"`
	Mitigations []string `json:"mitigations,omitempty" yaml:"mitigations,omitempty"`
	Description string   `json:"description,omitempty" yaml:"description,omitempty"`
}

// SecurityCapabilities lists required and optional capabilities.
type SecurityCapabilities struct {
	Required []string `json:"required,omitempty" yaml:"required,omitempty"`
	Optional []string `json:"optional,omitempty" yaml:"optional,omitempty"`
}

// SandboxConfig defines sandboxing requirements.
type SandboxConfig struct {
	Required       *bool          `json:"required,omitempty" yaml:"required,omitempty"`
	Type           string         `json:"type,omitempty" yaml:"type,omitempty"`
	ResourceLimits map[string]any `json:"resource_limits,omitempty" yaml:"resource_limits,omitempty"`
}

// NetworkAccess defines network restrictions.
type NetworkAccess struct {
	AllowedDomains []string `json:"allowed_domains,omitempty" yaml:"allowed_domains,omitempty"`
	BlockedDomains []string `json:"blocked_domains,omitempty" yaml:"blocked_domains,omitempty"`
	Protocols      []string `json:"protocols,omitempty" yaml:"protocols,omitempty"`
	EgressPolicy   string   `json:"egress_policy,omitempty" yaml:"egress_policy,omitempty"`
}

// AuditConfig defines audit logging settings.
type AuditConfig struct {
	LogInputs     *bool `json:"log_inputs,omitempty" yaml:"log_inputs,omitempty"`
	LogOutputs    *bool `json:"log_outputs,omitempty" yaml:"log_outputs,omitempty"`
	LogToolCalls  *bool `json:"log_tool_calls,omitempty" yaml:"log_tool_calls,omitempty"`
	RetentionDays *int  `json:"retention_days,omitempty" yaml:"retention_days,omitempty"`
}

// Governance declares authorization and compliance (v0.5 top-level).
type Governance struct {
	Authorization     map[string]any `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	Compliance        map[string]any `json:"compliance,omitempty" yaml:"compliance,omitempty"`
	QualityRequirements map[string]any `json:"quality_requirements,omitempty" yaml:"quality_requirements,omitempty"`
}

// ProtocolDeclarations declares protocol support (v0.5 top-level).
type ProtocolDeclarations struct {
	MCP *MCPProtocol `json:"mcp,omitempty" yaml:"mcp,omitempty"`
	A2A *A2AProtocol `json:"a2a,omitempty" yaml:"a2a,omitempty"`
	ANP *ANPProtocol `json:"anp,omitempty" yaml:"anp,omitempty"`
}

// MCPProtocol declares MCP server/client configuration.
type MCPProtocol struct {
	Version      string       `json:"version,omitempty" yaml:"version,omitempty"`
	Role         string       `json:"role,omitempty" yaml:"role,omitempty"`
	Servers      []MCPServer  `json:"servers,omitempty" yaml:"servers,omitempty"`
	Capabilities map[string]any `json:"capabilities,omitempty" yaml:"capabilities,omitempty"`
}

// MCPServer describes an MCP server binding.
type MCPServer struct {
	Name      string   `json:"name,omitempty" yaml:"name,omitempty"`
	Transport string   `json:"transport,omitempty" yaml:"transport,omitempty"`
	Command   string   `json:"command,omitempty" yaml:"command,omitempty"`
	Args      []string `json:"args,omitempty" yaml:"args,omitempty"`
	Tools     []string `json:"tools,omitempty" yaml:"tools,omitempty"`
}

// A2AProtocol declares Agent-to-Agent protocol support.
type A2AProtocol struct {
	Version        string         `json:"version,omitempty" yaml:"version,omitempty"`
	Endpoint       string         `json:"endpoint,omitempty" yaml:"endpoint,omitempty"`
	AgentCard      map[string]any `json:"agent_card,omitempty" yaml:"agent_card,omitempty"`
	Capabilities   map[string]any `json:"capabilities,omitempty" yaml:"capabilities,omitempty"`
	Authentication map[string]any `json:"authentication,omitempty" yaml:"authentication,omitempty"`
}

// ANPProtocol declares Agent Network Protocol support.
type ANPProtocol struct {
	DID                   string           `json:"did,omitempty" yaml:"did,omitempty"`
	VerifiableCredentials []map[string]any `json:"verifiable_credentials,omitempty" yaml:"verifiable_credentials,omitempty"`
	Discovery             map[string]any   `json:"discovery,omitempty" yaml:"discovery,omitempty"`
}

// TokenEfficiency declares token optimization settings (v0.5 top-level).
type TokenEfficiency struct {
	Budget              *TokenBudget   `json:"budget,omitempty" yaml:"budget,omitempty"`
	Compression         map[string]any `json:"compression,omitempty" yaml:"compression,omitempty"`
	Consolidation       map[string]any `json:"consolidation,omitempty" yaml:"consolidation,omitempty"`
	Routing             map[string]any `json:"routing,omitempty" yaml:"routing,omitempty"`
	SerializationProfile string        `json:"serialization_profile,omitempty" yaml:"serialization_profile,omitempty"`
	ObservationFormat   string         `json:"observation_format,omitempty" yaml:"observation_format,omitempty"`
}

// TokenBudget defines token allocation limits.
type TokenBudget struct {
	MaxInputTokens     *int           `json:"max_input_tokens,omitempty" yaml:"max_input_tokens,omitempty"`
	MaxOutputTokens    *int           `json:"max_output_tokens,omitempty" yaml:"max_output_tokens,omitempty"`
	AllocationStrategy string         `json:"allocation_strategy,omitempty" yaml:"allocation_strategy,omitempty"`
	Cascade            []map[string]any `json:"cascade,omitempty" yaml:"cascade,omitempty"`
}

// Cognition declares reasoning patterns (v0.5 top-level).
type Cognition struct {
	Pattern     string         `json:"pattern,omitempty" yaml:"pattern,omitempty"`
	Constraints map[string]any `json:"constraints,omitempty" yaml:"constraints,omitempty"`
	Governance  map[string]any `json:"governance,omitempty" yaml:"governance,omitempty"`
	Trace       map[string]any `json:"trace,omitempty" yaml:"trace,omitempty"`
}
