package ossa

import (
	"fmt"
	"regexp"
)

// ValidationResult contains validation results.
type ValidationResult struct {
	Valid    bool
	Errors   []string
	Warnings []string
}

// Validator validates OSSA manifests.
type Validator struct {
	schemaPath string
}

// NewValidator creates a new validator.
func NewValidator(schemaPath string) *Validator {
	return &Validator{schemaPath: schemaPath}
}

// ValidKinds are the valid manifest kinds.
var ValidKinds = map[Kind]bool{
	KindAgent:    true,
	KindTask:     true,
	KindWorkflow: true,
}

var apiVersionPattern = regexp.MustCompile(`^ossa/v\d+\.\d+\.\d+$`)

// Validate validates a manifest.
func (v *Validator) Validate(m *Manifest) *ValidationResult {
	result := &ValidationResult{Valid: true}

	// Required fields
	if m.APIVersion == "" {
		result.addError("Missing apiVersion")
	} else if !apiVersionPattern.MatchString(m.APIVersion) {
		result.addError(fmt.Sprintf("Invalid apiVersion: %s", m.APIVersion))
	}

	if m.Kind == "" {
		result.addError("Missing kind")
	} else if !ValidKinds[m.Kind] {
		result.addError(fmt.Sprintf("Invalid kind: %s", m.Kind))
	}

	if m.Metadata.Name == "" {
		result.addError("Missing metadata.name")
	}

	if m.Kind == KindAgent && m.Spec.Role == "" {
		result.addWarning("Agent should have spec.role")
	}

	// Best practices
	if m.Spec.LLM == nil {
		result.addWarning("Best practice: Specify LLM configuration")
	}

	if len(m.Spec.Tools) == 0 {
		result.addWarning("Best practice: Define tools/capabilities")
	}

	return result
}

func (r *ValidationResult) addError(msg string) {
	r.Valid = false
	r.Errors = append(r.Errors, msg)
}

func (r *ValidationResult) addWarning(msg string) {
	r.Warnings = append(r.Warnings, msg)
}

// ValidateManifest validates a manifest (convenience function).
func ValidateManifest(m *Manifest) *ValidationResult {
	return NewValidator("").Validate(m)
}
