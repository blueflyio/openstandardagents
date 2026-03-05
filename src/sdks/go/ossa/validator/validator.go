// Package validator provides OSSA manifest validation.
package validator

import (
	"fmt"
	"strings"

	"github.com/blueflyio/ossa-sdk-go/ossa/types"
)

// Result holds validation results.
type Result struct {
	Valid    bool     `json:"valid"`
	Errors   []string `json:"errors,omitempty"`
	Warnings []string `json:"warnings,omitempty"`
}

// Validate checks an OSSA manifest for correctness.
func Validate(m *types.Manifest) *Result {
	r := &Result{Valid: true}

	if m.APIVersion == "" {
		r.addError("apiVersion is required")
	} else if !strings.HasPrefix(m.APIVersion, "ossa/") {
		r.addError(fmt.Sprintf("apiVersion must start with 'ossa/', got: %s", m.APIVersion))
	}

	if m.Kind == "" {
		r.addError("kind is required")
	} else {
		validKinds := map[types.Kind]bool{
			types.KindAgent: true, types.KindTask: true,
			types.KindWorkflow: true, types.KindFlow: true,
		}
		if !validKinds[m.Kind] {
			r.addError(fmt.Sprintf("invalid kind: %s", m.Kind))
		}
	}

	if m.Metadata.Name == "" {
		r.addError("metadata.name is required")
	}

	if m.IsAgent() && m.Spec != nil {
		if _, ok := m.Spec["role"]; !ok {
			r.addWarning("Agent should have spec.role defined")
		}
		if _, ok := m.Spec["llm"]; !ok {
			r.addWarning("Agent should have spec.llm configured")
		}

		if llm, ok := m.Spec["llm"].(map[string]any); ok {
			if provider, ok := llm["provider"].(string); ok {
				validProviders := map[string]bool{
					"anthropic": true, "openai": true, "azure": true,
					"google": true, "bedrock": true, "groq": true, "ollama": true,
				}
				if !validProviders[provider] {
					r.addWarning(fmt.Sprintf("Unknown LLM provider: %s", provider))
				}
			}
		}
	}

	return r
}

func (r *Result) addError(msg string) {
	r.Valid = false
	r.Errors = append(r.Errors, msg)
}

func (r *Result) addWarning(msg string) {
	r.Warnings = append(r.Warnings, msg)
}
