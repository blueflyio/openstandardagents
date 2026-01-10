package ossa

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"

	"github.com/xeipuuv/gojsonschema"
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
	schema     *gojsonschema.Schema
}

// NewValidator creates a new validator.
// If schemaPath is provided, loads JSON Schema for validation.
// If empty, only structural validation is performed.
func NewValidator(schemaPath string) *Validator {
	v := &Validator{schemaPath: schemaPath}
	if schemaPath != "" {
		v.loadSchema()
	}
	return v
}

func (v *Validator) loadSchema() {
	if v.schemaPath == "" {
		return
	}
	data, err := os.ReadFile(v.schemaPath)
	if err != nil {
		return
	}
	loader := gojsonschema.NewBytesLoader(data)
	schema, err := gojsonschema.NewSchema(loader)
	if err != nil {
		return
	}
	v.schema = schema
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

	// JSON Schema validation if schema loaded
	if v.schema != nil && result.Valid {
		data, err := json.Marshal(m)
		if err == nil {
			docLoader := gojsonschema.NewBytesLoader(data)
			schemaResult, err := v.schema.Validate(docLoader)
			if err == nil && !schemaResult.Valid() {
				for _, desc := range schemaResult.Errors() {
					result.addError(fmt.Sprintf("Schema: %s", desc.Description()))
				}
			}
		}
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
