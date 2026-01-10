package ossa

import (
	"testing"
)

func TestLoadManifestYAML(t *testing.T) {
	yamlContent := `
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: test-agent
spec:
  role: "You are a test agent."
`

	manifest, err := ParseManifest([]byte(yamlContent), "test.ossa.yaml")
	if err != nil {
		t.Fatalf("Failed to parse YAML manifest: %v", err)
	}

	if manifest.Kind != KindAgent {
		t.Errorf("Expected kind Agent, got %s", manifest.Kind)
	}

	if manifest.Metadata.Name != "test-agent" {
		t.Errorf("Expected name test-agent, got %s", manifest.Metadata.Name)
	}

	if manifest.Spec.Role != "You are a test agent." {
		t.Errorf("Expected role 'You are a test agent.', got %s", manifest.Spec.Role)
	}
}

func TestLoadManifestJSON(t *testing.T) {
	jsonContent := `{
		"apiVersion": "ossa/v0.3.3",
		"kind": "Task",
		"metadata": {"name": "test-task"},
		"spec": {"description": "A test task"}
	}`

	manifest, err := ParseManifest([]byte(jsonContent), "test.json")
	if err != nil {
		t.Fatalf("Failed to parse JSON manifest: %v", err)
	}

	if manifest.Kind != KindTask {
		t.Errorf("Expected kind Task, got %s", manifest.Kind)
	}

	if manifest.Metadata.Name != "test-task" {
		t.Errorf("Expected name test-task, got %s", manifest.Metadata.Name)
	}
}

func TestManifestTypeChecks(t *testing.T) {
	manifest := &Manifest{
		Kind: KindAgent,
	}

	if !manifest.IsAgent() {
		t.Error("Expected IsAgent() to return true")
	}

	if manifest.IsTask() {
		t.Error("Expected IsTask() to return false")
	}

	if manifest.IsWorkflow() {
		t.Error("Expected IsWorkflow() to return false")
	}
}

func TestAccessTierNormalization(t *testing.T) {
	tests := []struct {
		manifest *Manifest
		expected AccessTier
	}{
		{
			manifest: &Manifest{
				Kind: KindAgent,
				Spec: Spec{AccessTier: TierElevatedShort},
			},
			expected: TierWriteElevated,
		},
		{
			manifest: &Manifest{
				Kind: KindAgent,
				Spec: Spec{AccessTier: TierWriteElevated},
			},
			expected: TierWriteElevated,
		},
		{
			manifest: &Manifest{
				Kind: KindAgent,
				Spec: Spec{
					Identity: &Identity{AccessTier: TierReadShort},
				},
			},
			expected: TierRead,
		},
	}

	for i, tt := range tests {
		got := tt.manifest.GetAccessTier()
		if got != tt.expected {
			t.Errorf("Test %d: expected %s, got %s", i, tt.expected, got)
		}
	}
}

func TestToYAML(t *testing.T) {
	manifest := &Manifest{
		APIVersion: "ossa/v0.3.3",
		Kind:       KindAgent,
		Metadata:   Metadata{Name: "yaml-test"},
		Spec:       Spec{Role: "Test role"},
	}

	data, err := manifest.ToYAML()
	if err != nil {
		t.Fatalf("ToYAML failed: %v", err)
	}

	if len(data) == 0 {
		t.Error("ToYAML returned empty data")
	}
}

func TestToJSON(t *testing.T) {
	manifest := &Manifest{
		APIVersion: "ossa/v0.3.3",
		Kind:       KindAgent,
		Metadata:   Metadata{Name: "json-test"},
		Spec:       Spec{Role: "Test role"},
	}

	data, err := manifest.ToJSON()
	if err != nil {
		t.Fatalf("ToJSON failed: %v", err)
	}

	if len(data) == 0 {
		t.Error("ToJSON returned empty data")
	}
}
