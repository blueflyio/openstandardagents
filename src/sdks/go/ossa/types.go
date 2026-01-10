// Package ossa provides types and utilities for working with OSSA manifests.
// OSSA (Open Standard for Scalable AI Agents) is a JSON Schema specification
// for defining AI agents, tasks, and workflows.
package ossa

// Version is the SDK version
const Version = "0.3.3"

// OSSAVersion is the OSSA specification version this SDK supports
const OSSAVersion = "v0.3.3"

// Kind represents the type of OSSA manifest
type Kind string

const (
	KindAgent    Kind = "Agent"
	KindTask     Kind = "Task"
	KindWorkflow Kind = "Workflow"
)

// AccessTier represents the agent's permission level
type AccessTier string

const (
	TierRead          AccessTier = "tier_1_read"
	TierWriteLimited  AccessTier = "tier_2_write_limited"
	TierWriteElevated AccessTier = "tier_3_write_elevated"
	TierPolicy        AccessTier = "tier_4_policy"
	// Shorthand versions
	TierReadShort     AccessTier = "read"
	TierLimitedShort  AccessTier = "limited"
	TierElevatedShort AccessTier = "elevated"
	TierPolicyShort   AccessTier = "policy"
)

// Manifest represents a complete OSSA manifest
type Manifest struct {
	APIVersion string   `yaml:"apiVersion" json:"apiVersion"`
	Kind       Kind     `yaml:"kind" json:"kind"`
	Metadata   Metadata `yaml:"metadata" json:"metadata"`
	Spec       Spec     `yaml:"spec" json:"spec"`
}

// Metadata contains manifest metadata
type Metadata struct {
	Name        string            `yaml:"name" json:"name"`
	Version     string            `yaml:"version,omitempty" json:"version,omitempty"`
	Namespace   string            `yaml:"namespace,omitempty" json:"namespace,omitempty"`
	Description string            `yaml:"description,omitempty" json:"description,omitempty"`
	Labels      map[string]string `yaml:"labels,omitempty" json:"labels,omitempty"`
	Annotations map[string]string `yaml:"annotations,omitempty" json:"annotations,omitempty"`
}

// Spec contains the agent/task/workflow specification
type Spec struct {
	// Common fields
	Role        string      `yaml:"role,omitempty" json:"role,omitempty"`
	Tools       []Tool      `yaml:"tools,omitempty" json:"tools,omitempty"`
	LLM         *LLMConfig  `yaml:"llm,omitempty" json:"llm,omitempty"`
	Safety      *Safety     `yaml:"safety,omitempty" json:"safety,omitempty"`
	AccessTier  AccessTier  `yaml:"access_tier,omitempty" json:"access_tier,omitempty"`
	Identity    *Identity   `yaml:"identity,omitempty" json:"identity,omitempty"`

	// Agent-specific
	Capabilities []Capability `yaml:"capabilities,omitempty" json:"capabilities,omitempty"`

	// Task-specific
	Steps []TaskStep `yaml:"steps,omitempty" json:"steps,omitempty"`

	// Workflow-specific
	Agents []WorkflowAgent `yaml:"agents,omitempty" json:"agents,omitempty"`
}

// Tool represents a tool/function the agent can use
type Tool struct {
	Name        string                 `yaml:"name" json:"name"`
	Description string                 `yaml:"description,omitempty" json:"description,omitempty"`
	Handler     *ToolHandler           `yaml:"handler,omitempty" json:"handler,omitempty"`
	Parameters  map[string]interface{} `yaml:"parameters,omitempty" json:"parameters,omitempty"`
}

// ToolHandler defines how a tool is executed
type ToolHandler struct {
	Runtime    string `yaml:"runtime,omitempty" json:"runtime,omitempty"`
	Capability string `yaml:"capability,omitempty" json:"capability,omitempty"`
	Endpoint   string `yaml:"endpoint,omitempty" json:"endpoint,omitempty"`
	Method     string `yaml:"method,omitempty" json:"method,omitempty"`
}

// LLMConfig contains LLM provider configuration
type LLMConfig struct {
	Provider    string  `yaml:"provider" json:"provider"`
	Model       string  `yaml:"model" json:"model"`
	Temperature float64 `yaml:"temperature,omitempty" json:"temperature,omitempty"`
	MaxTokens   int     `yaml:"max_tokens,omitempty" json:"max_tokens,omitempty"`
}

// Safety contains safety and guardrail configuration
type Safety struct {
	Guardrails  *Guardrails `yaml:"guardrails,omitempty" json:"guardrails,omitempty"`
	PIIHandling string      `yaml:"pii_handling,omitempty" json:"pii_handling,omitempty"`
}

// Guardrails defines operational safety limits
type Guardrails struct {
	MaxActionsPerMinute     int      `yaml:"max_actions_per_minute,omitempty" json:"max_actions_per_minute,omitempty"`
	RequireHumanApprovalFor []string `yaml:"require_human_approval_for,omitempty" json:"require_human_approval_for,omitempty"`
	BlockedActions          []string `yaml:"blocked_actions,omitempty" json:"blocked_actions,omitempty"`
	AuditAllActions         bool     `yaml:"audit_all_actions,omitempty" json:"audit_all_actions,omitempty"`
}

// Identity contains agent identity configuration
type Identity struct {
	Provider       string          `yaml:"provider,omitempty" json:"provider,omitempty"`
	ServiceAccount *ServiceAccount `yaml:"service_account,omitempty" json:"service_account,omitempty"`
	AccessTier     AccessTier      `yaml:"access_tier,omitempty" json:"access_tier,omitempty"`
}

// ServiceAccount defines the agent's service account
type ServiceAccount struct {
	ID          string   `yaml:"id,omitempty" json:"id,omitempty"`
	Username    string   `yaml:"username,omitempty" json:"username,omitempty"`
	Email       string   `yaml:"email,omitempty" json:"email,omitempty"`
	DisplayName string   `yaml:"display_name,omitempty" json:"display_name,omitempty"`
	Roles       []string `yaml:"roles,omitempty" json:"roles,omitempty"`
}

// Capability defines what an agent can do
type Capability struct {
	Name        string `yaml:"name" json:"name"`
	Description string `yaml:"description,omitempty" json:"description,omitempty"`
}

// TaskStep defines a step in a Task
type TaskStep struct {
	Name        string                 `yaml:"name" json:"name"`
	Description string                 `yaml:"description,omitempty" json:"description,omitempty"`
	Action      string                 `yaml:"action,omitempty" json:"action,omitempty"`
	Parameters  map[string]interface{} `yaml:"parameters,omitempty" json:"parameters,omitempty"`
}

// WorkflowAgent defines an agent reference in a workflow
type WorkflowAgent struct {
	Name string `yaml:"name" json:"name"`
	Ref  string `yaml:"ref,omitempty" json:"ref,omitempty"`
	Role string `yaml:"role,omitempty" json:"role,omitempty"`
}

// ValidationResult contains the result of manifest validation
type ValidationResult struct {
	Valid  bool              `json:"valid"`
	Errors []ValidationError `json:"errors,omitempty"`
}

// ValidationError represents a single validation error
type ValidationError struct {
	Path    string `json:"path"`
	Message string `json:"message"`
}
