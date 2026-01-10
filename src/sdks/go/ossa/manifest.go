package ossa

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// LoadManifest loads an OSSA manifest from a file path.
// Supports both YAML (.yaml, .yml) and JSON (.json) formats.
func LoadManifest(path string) (*Manifest, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read manifest file: %w", err)
	}

	return ParseManifest(data, path)
}

// ParseManifest parses manifest data from bytes.
// The path is used to determine format (YAML vs JSON).
func ParseManifest(data []byte, path string) (*Manifest, error) {
	var manifest Manifest

	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".yaml", ".yml":
		if err := yaml.Unmarshal(data, &manifest); err != nil {
			return nil, fmt.Errorf("failed to parse YAML manifest: %w", err)
		}
	case ".json":
		if err := json.Unmarshal(data, &manifest); err != nil {
			return nil, fmt.Errorf("failed to parse JSON manifest: %w", err)
		}
	default:
		// Try YAML first, then JSON
		if err := yaml.Unmarshal(data, &manifest); err != nil {
			if err := json.Unmarshal(data, &manifest); err != nil {
				return nil, fmt.Errorf("failed to parse manifest (tried YAML and JSON)")
			}
		}
	}

	return &manifest, nil
}

// ToYAML converts a manifest to YAML bytes
func (m *Manifest) ToYAML() ([]byte, error) {
	return yaml.Marshal(m)
}

// ToJSON converts a manifest to JSON bytes
func (m *Manifest) ToJSON() ([]byte, error) {
	return json.MarshalIndent(m, "", "  ")
}

// SaveManifest saves a manifest to a file
func SaveManifest(manifest *Manifest, path string) error {
	ext := strings.ToLower(filepath.Ext(path))

	var data []byte
	var err error

	switch ext {
	case ".json":
		data, err = manifest.ToJSON()
	default:
		data, err = manifest.ToYAML()
	}

	if err != nil {
		return fmt.Errorf("failed to serialize manifest: %w", err)
	}

	return os.WriteFile(path, data, 0644)
}

// IsAgent returns true if this is an Agent manifest
func (m *Manifest) IsAgent() bool {
	return m.Kind == KindAgent
}

// IsTask returns true if this is a Task manifest
func (m *Manifest) IsTask() bool {
	return m.Kind == KindTask
}

// IsWorkflow returns true if this is a Workflow manifest
func (m *Manifest) IsWorkflow() bool {
	return m.Kind == KindWorkflow
}

// GetAccessTier returns the effective access tier (handles shorthand)
func (m *Manifest) GetAccessTier() AccessTier {
	tier := m.Spec.AccessTier
	if tier == "" && m.Spec.Identity != nil {
		tier = m.Spec.Identity.AccessTier
	}

	// Normalize shorthand to full names
	switch tier {
	case TierReadShort:
		return TierRead
	case TierLimitedShort:
		return TierWriteLimited
	case TierElevatedShort:
		return TierWriteElevated
	case TierPolicyShort:
		return TierPolicy
	default:
		return tier
	}
}
