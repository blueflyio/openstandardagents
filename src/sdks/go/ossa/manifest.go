package ossa

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// defaultAPIVersion is resolved once at init from .version.json if available.
var defaultAPIVersion = "ossa/v0.4"

func init() {
	// Walk up from CWD to find .version.json (single source of truth)
	dir, _ := os.Getwd()
	for i := 0; i < 10; i++ {
		candidate := filepath.Join(dir, ".version.json")
		if data, err := os.ReadFile(candidate); err == nil {
			var v struct{ Current string `json:"current"` }
			if json.Unmarshal(data, &v) == nil && v.Current != "" {
				defaultAPIVersion = "ossa/v" + v.Current
			}
			break
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
}

// LoadManifest loads a manifest from a file.
func LoadManifest(path string) (*Manifest, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	return ParseManifest(data, filepath.Ext(path))
}

// ParseManifest parses manifest data.
func ParseManifest(data []byte, ext string) (*Manifest, error) {
	var manifest Manifest

	switch strings.ToLower(ext) {
	case ".json":
		if err := json.Unmarshal(data, &manifest); err != nil {
			return nil, fmt.Errorf("failed to parse JSON: %w", err)
		}
	case ".yaml", ".yml":
		if err := yaml.Unmarshal(data, &manifest); err != nil {
			return nil, fmt.Errorf("failed to parse YAML: %w", err)
		}
	default:
		// Try YAML first, then JSON
		if err := yaml.Unmarshal(data, &manifest); err != nil {
			if err := json.Unmarshal(data, &manifest); err != nil {
				return nil, fmt.Errorf("failed to parse manifest: %w", err)
			}
		}
	}

	return &manifest, nil
}

// SaveManifest saves a manifest to a file.
func SaveManifest(manifest *Manifest, path string, format string) error {
	var data []byte
	var err error

	switch format {
	case "json":
		data, err = json.MarshalIndent(manifest, "", "  ")
	case "yaml":
		data, err = yaml.Marshal(manifest)
	default:
		return fmt.Errorf("unsupported format: %s", format)
	}
	if err != nil {
		return fmt.Errorf("failed to marshal manifest: %w", err)
	}

	return os.WriteFile(path, data, 0644)
}

// ToYAML converts manifest to YAML string.
func (m *Manifest) ToYAML() (string, error) {
	data, err := yaml.Marshal(m)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// ToJSON converts manifest to JSON string.
func (m *Manifest) ToJSON() (string, error) {
	data, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// NewManifest creates a new manifest with defaults.
func NewManifest(name string, kind Kind) *Manifest {
	return &Manifest{
		APIVersion: defaultAPIVersion,
		Kind:       kind,
		Metadata: Metadata{
			Name: name,
		},
		Spec: Spec{
			Role: "assistant",
		},
	}
}
