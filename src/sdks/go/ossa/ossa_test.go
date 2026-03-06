package ossa

import (
	"testing"
)

func TestLoadManifestYAML(t *testing.T) {
	yamlContent := `
apiVersion: ossa/v0.5.0
kind: Agent
metadata:
  name: test-agent
spec:
  role: "You are a test agent."
`

	manifest, err := ParseManifest([]byte(yamlContent), ".yaml")
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
		"apiVersion": "ossa/v0.5.0",
		"kind": "Task",
		"metadata": {"name": "test-task"},
		"spec": {"role": "A test task"}
	}`

	manifest, err := ParseManifest([]byte(jsonContent), ".json")
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
		APIVersion: "ossa/v0.5.0",
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
		APIVersion: "ossa/v0.5.0",
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

func TestNewManifest(t *testing.T) {
	m := NewManifest("my-agent", KindAgent)
	if m.APIVersion != "ossa/v0.5.0" {
		t.Errorf("Expected apiVersion ossa/v0.5.0, got %s", m.APIVersion)
	}
	if m.Metadata.Name != "my-agent" {
		t.Errorf("Expected name my-agent, got %s", m.Metadata.Name)
	}
}

func TestV5SecurityPosture(t *testing.T) {
	yamlContent := `
apiVersion: ossa/v0.5.0
kind: Agent
metadata:
  name: secure-agent
spec:
  role: "Secure assistant"
security:
  tier: signed
  data_classification: internal
  capabilities:
    encryption: true
    audit_logging: true
  network_access:
    outbound: true
    allowed_hosts:
      - api.example.com
`

	manifest, err := ParseManifest([]byte(yamlContent), ".yaml")
	if err != nil {
		t.Fatalf("Failed to parse: %v", err)
	}

	if manifest.Security == nil {
		t.Fatal("Expected security section")
	}
	if manifest.Security.Tier != "signed" {
		t.Errorf("Expected tier signed, got %s", manifest.Security.Tier)
	}
	if manifest.Security.DataClassification != "internal" {
		t.Errorf("Expected data_classification internal, got %s", manifest.Security.DataClassification)
	}
	if manifest.Security.Capabilities == nil || !manifest.Security.Capabilities.Encryption {
		t.Error("Expected encryption capability")
	}
	if manifest.Security.NetworkAccess == nil || len(manifest.Security.NetworkAccess.AllowedHosts) != 1 {
		t.Error("Expected 1 allowed host")
	}
}

func TestV5Protocols(t *testing.T) {
	yamlContent := `
apiVersion: ossa/v0.5.0
kind: Agent
metadata:
  name: protocol-agent
spec:
  role: "Protocol agent"
protocols:
  mcp:
    - name: tools
      command: node
      args: ["./server.js"]
  a2a:
    - name: peer
      endpoint: https://peer.example.com/a2a
      skills: ["search", "summarize"]
`

	manifest, err := ParseManifest([]byte(yamlContent), ".yaml")
	if err != nil {
		t.Fatalf("Failed to parse: %v", err)
	}

	if manifest.Protocols == nil {
		t.Fatal("Expected protocols section")
	}
	if len(manifest.Protocols.MCP) != 1 {
		t.Fatalf("Expected 1 MCP declaration, got %d", len(manifest.Protocols.MCP))
	}
	if manifest.Protocols.MCP[0].Name != "tools" {
		t.Errorf("Expected MCP name tools, got %s", manifest.Protocols.MCP[0].Name)
	}
	if len(manifest.Protocols.A2A) != 1 {
		t.Fatalf("Expected 1 A2A declaration, got %d", len(manifest.Protocols.A2A))
	}
	if len(manifest.Protocols.A2A[0].Skills) != 2 {
		t.Errorf("Expected 2 skills, got %d", len(manifest.Protocols.A2A[0].Skills))
	}
}

func TestV5Governance(t *testing.T) {
	yamlContent := `
apiVersion: ossa/v0.5.0
kind: Agent
metadata:
  name: gov-agent
spec:
  role: "Governed agent"
governance:
  compliance:
    - SOC2
    - HIPAA
`

	manifest, err := ParseManifest([]byte(yamlContent), ".yaml")
	if err != nil {
		t.Fatalf("Failed to parse: %v", err)
	}

	if manifest.Governance == nil {
		t.Fatal("Expected governance section")
	}
	if len(manifest.Governance.Compliance) != 2 {
		t.Errorf("Expected 2 compliance entries, got %d", len(manifest.Governance.Compliance))
	}
}

func TestValidateManifest(t *testing.T) {
	m := NewManifest("valid-agent", KindAgent)
	m.Spec.Role = "A test assistant"
	m.Spec.LLM = &LLMConfig{Provider: "anthropic", Model: "claude-sonnet-4-20250514"}

	result := ValidateManifest(m)
	if !result.Valid {
		t.Errorf("Expected valid manifest, got errors: %v", result.Errors)
	}
}

func TestValidateManifestMissingFields(t *testing.T) {
	m := &Manifest{}
	result := ValidateManifest(m)
	if result.Valid {
		t.Error("Expected invalid manifest for empty manifest")
	}
	if len(result.Errors) == 0 {
		t.Error("Expected validation errors")
	}
}
