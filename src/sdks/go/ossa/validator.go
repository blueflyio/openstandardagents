package ossa

import (
	"embed"
	"encoding/json"
	"fmt"

	"github.com/xeipuuv/gojsonschema"
)

//go:embed schema/*.json
var schemaFS embed.FS

// Validator validates OSSA manifests against the JSON Schema
type Validator struct {
	schema *gojsonschema.Schema
}

// NewValidator creates a new validator with the embedded OSSA schema
func NewValidator() (*Validator, error) {
	schemaData, err := schemaFS.ReadFile("schema/ossa-0.3.3.schema.json")
	if err != nil {
		return nil, fmt.Errorf("failed to load embedded schema: %w", err)
	}

	schemaLoader := gojsonschema.NewBytesLoader(schemaData)
	schema, err := gojsonschema.NewSchema(schemaLoader)
	if err != nil {
		return nil, fmt.Errorf("failed to compile schema: %w", err)
	}

	return &Validator{schema: schema}, nil
}

// NewValidatorFromPath creates a validator from a schema file path
func NewValidatorFromPath(schemaPath string) (*Validator, error) {
	schemaLoader := gojsonschema.NewReferenceLoader("file://" + schemaPath)
	schema, err := gojsonschema.NewSchema(schemaLoader)
	if err != nil {
		return nil, fmt.Errorf("failed to compile schema from %s: %w", schemaPath, err)
	}

	return &Validator{schema: schema}, nil
}

// Validate validates a manifest against the OSSA schema
func (v *Validator) Validate(manifest *Manifest) (*ValidationResult, error) {
	// Convert manifest to JSON for validation
	jsonData, err := json.Marshal(manifest)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize manifest: %w", err)
	}

	documentLoader := gojsonschema.NewBytesLoader(jsonData)
	result, err := v.schema.Validate(documentLoader)
	if err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	vr := &ValidationResult{
		Valid:  result.Valid(),
		Errors: make([]ValidationError, 0),
	}

	for _, err := range result.Errors() {
		vr.Errors = append(vr.Errors, ValidationError{
			Path:    err.Context().String(),
			Message: err.Description(),
		})
	}

	return vr, nil
}

// ValidateFile validates a manifest file against the OSSA schema
func (v *Validator) ValidateFile(path string) (*ValidationResult, error) {
	manifest, err := LoadManifest(path)
	if err != nil {
		return nil, err
	}

	return v.Validate(manifest)
}

// ValidateManifest is a convenience function that validates without explicit Validator creation
func ValidateManifest(manifest *Manifest, schemaPath string) (*ValidationResult, error) {
	var v *Validator
	var err error

	if schemaPath != "" {
		v, err = NewValidatorFromPath(schemaPath)
	} else {
		v, err = NewValidator()
	}

	if err != nil {
		return nil, err
	}

	return v.Validate(manifest)
}

// ValidateFile is a convenience function that validates a file
func ValidateFile(path string, schemaPath string) (*ValidationResult, error) {
	manifest, err := LoadManifest(path)
	if err != nil {
		return nil, err
	}

	return ValidateManifest(manifest, schemaPath)
}

// Quick validation helpers

// IsValid returns true if the manifest is valid
func (vr *ValidationResult) IsValid() bool {
	return vr.Valid
}

// ErrorCount returns the number of validation errors
func (vr *ValidationResult) ErrorCount() int {
	return len(vr.Errors)
}

// FirstError returns the first validation error, or nil if valid
func (vr *ValidationResult) FirstError() *ValidationError {
	if len(vr.Errors) == 0 {
		return nil
	}
	return &vr.Errors[0]
}
