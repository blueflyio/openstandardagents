// Package ossa provides types and utilities for OSSA manifests.
package ossa

// Manifest represents an OSSA manifest.
type Manifest struct {
	APIVersion string   `json:"apiVersion" yaml:"apiVersion"`
	Kind       Kind     `json:"kind" yaml:"kind"`
	Metadata   Metadata `json:"metadata" yaml:"metadata"`
	Spec       Spec     `json:"spec" yaml:"spec"`
}

// Kind represents the manifest kind.
type Kind string

const (
	KindAgent    Kind = "Agent"
	KindTask     Kind = "Task"
	KindWorkflow Kind = "Workflow"
)

// Metadata contains manifest metadata.
type Metadata struct {
	Name        string            `json:"name" yaml:"name"`
	Version     string            `json:"version,omitempty" yaml:"version,omitempty"`
	Description string            `json:"description,omitempty" yaml:"description,omitempty"`
	Labels      map[string]string `json:"labels,omitempty" yaml:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty" yaml:"annotations,omitempty"`
}

// Spec contains the agent specification.
type Spec struct {
	Role         string           `json:"role" yaml:"role"`
	LLM          *LLMConfig       `json:"llm,omitempty" yaml:"llm,omitempty"`
	Tools        []ToolConfig     `json:"tools,omitempty" yaml:"tools,omitempty"`
	Autonomy     *AutonomyConfig  `json:"autonomy,omitempty" yaml:"autonomy,omitempty"`
	Constraints  *Constraints     `json:"constraints,omitempty" yaml:"constraints,omitempty"`
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
	Type         string                 `json:"type" yaml:"type"`
	Name         string                 `json:"name,omitempty" yaml:"name,omitempty"`
	Server       string                 `json:"server,omitempty" yaml:"server,omitempty"`
	Namespace    string                 `json:"namespace,omitempty" yaml:"namespace,omitempty"`
	Endpoint     string                 `json:"endpoint,omitempty" yaml:"endpoint,omitempty"`
	Capabilities []string               `json:"capabilities,omitempty" yaml:"capabilities,omitempty"`
	Config       map[string]interface{} `json:"config,omitempty" yaml:"config,omitempty"`
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
