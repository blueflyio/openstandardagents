package ossa

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"

	"github.com/xeipuuv/gojsonschema"
)

// OSSAVersion is the OSSA spec version.
const OSSAVersion = "0.5.0"

// ValidationResult contains validation results.
type ValidationResult struct {
	Valid    bool
	Errors   []ValidationIssue
	Warnings []string
}

// ValidationIssue represents a single validation error with path context.
type ValidationIssue struct {
	Path    string
	Message string
}

// Validator validates OSSA manifests.
type Validator struct {
	schemaPath string
	schema     *gojsonschema.Schema
}

// NewValidator creates a new validator.
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

	if m.APIVersion == "" {
		result.addError("", "Missing apiVersion")
	} else if !apiVersionPattern.MatchString(m.APIVersion) {
		result.addError("apiVersion", fmt.Sprintf("Invalid apiVersion: %s", m.APIVersion))
	}

	if m.Kind == "" {
		result.addError("", "Missing kind")
	} else if !ValidKinds[m.Kind] {
		result.addError("kind", fmt.Sprintf("Invalid kind: %s", m.Kind))
	}

	if m.Metadata.Name == "" {
		result.addError("metadata.name", "Missing metadata.name")
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
					result.addError(desc.Field(), desc.Description())
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

func (r *ValidationResult) addError(path, msg string) {
	r.Valid = false
	r.Errors = append(r.Errors, ValidationIssue{Path: path, Message: msg})
}

func (r *ValidationResult) addWarning(msg string) {
	r.Warnings = append(r.Warnings, msg)
}

// ValidateManifest validates a manifest (convenience function).
func ValidateManifest(m *Manifest) *ValidationResult {
	return NewValidator("").Validate(m)
}

// ValidateFile loads and validates a manifest file.
func ValidateFile(path string, schemaPath string) (*ValidationResult, error) {
	m, err := LoadManifest(path)
	if err != nil {
		return nil, err
	}
	return NewValidator(schemaPath).Validate(m), nil
}
