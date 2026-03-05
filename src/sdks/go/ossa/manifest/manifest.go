// Package manifest provides OSSA manifest loading, saving, and export.
package manifest

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/blueflyio/ossa-sdk-go/ossa/types"
	"github.com/goccy/go-yaml"
)

// Load reads an OSSA manifest from a file path.
func Load(path string) (*types.Manifest, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("ossa: failed to read manifest: %w", err)
	}

	format := detectFormat(path)
	return Parse(data, format)
}

// Parse decodes manifest bytes in the given format.
func Parse(data []byte, format string) (*types.Manifest, error) {
	var m types.Manifest

	switch format {
	case "json":
		if err := json.Unmarshal(data, &m); err != nil {
			return nil, fmt.Errorf("ossa: invalid JSON manifest: %w", err)
		}
	default:
		if err := yaml.Unmarshal(data, &m); err != nil {
			return nil, fmt.Errorf("ossa: invalid YAML manifest: %w", err)
		}
	}

	return &m, nil
}

// Save writes a manifest to a file.
func Save(m *types.Manifest, path string) error {
	format := detectFormat(path)
	data, err := Export(m, format)
	if err != nil {
		return err
	}

	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("ossa: failed to create directory: %w", err)
	}

	return os.WriteFile(path, data, 0o644)
}

// Export serializes a manifest to bytes.
func Export(m *types.Manifest, format string) ([]byte, error) {
	switch format {
	case "json":
		return json.MarshalIndent(m, "", "  ")
	case "yaml":
		return yaml.Marshal(m)
	default:
		return nil, fmt.Errorf("ossa: unsupported format: %s", format)
	}
}

func detectFormat(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	if ext == ".json" {
		return "json"
	}
	return "yaml"
}
