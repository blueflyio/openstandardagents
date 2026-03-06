package ossa

// ManifestBuilder builds OSSA manifests using a fluent API.
type ManifestBuilder struct {
	manifest *Manifest
}

// AgentBuilder creates a builder for an Agent manifest.
func AgentBuilder(name string) *ManifestBuilder {
	return &ManifestBuilder{
		manifest: NewManifest(name, KindAgent),
	}
}

// TaskBuilder creates a builder for a Task manifest.
func TaskBuilder(name string) *ManifestBuilder {
	return &ManifestBuilder{
		manifest: NewManifest(name, KindTask),
	}
}

// WorkflowBuilder creates a builder for a Workflow manifest.
func WorkflowBuilder(name string) *ManifestBuilder {
	return &ManifestBuilder{
		manifest: NewManifest(name, KindWorkflow),
	}
}

// Version sets the metadata version.
func (b *ManifestBuilder) Version(v string) *ManifestBuilder {
	b.manifest.Metadata.Version = v
	return b
}

// Description sets the metadata description.
func (b *ManifestBuilder) Description(d string) *ManifestBuilder {
	b.manifest.Metadata.Description = d
	return b
}

// Role sets the spec role.
func (b *ManifestBuilder) Role(r string) *ManifestBuilder {
	b.manifest.Spec.Role = r
	return b
}

// LLM sets the LLM configuration.
func (b *ManifestBuilder) LLM(llm LLMConfig) *ManifestBuilder {
	b.manifest.Spec.LLM = &llm
	return b
}

// AddTool adds a tool configuration.
func (b *ManifestBuilder) AddTool(tool ToolConfig) *ManifestBuilder {
	b.manifest.Spec.Tools = append(b.manifest.Spec.Tools, tool)
	return b
}

// Security sets the security posture.
func (b *ManifestBuilder) Security(s SecurityPosture) *ManifestBuilder {
	b.manifest.Security = &s
	return b
}

// Governance sets the governance configuration.
func (b *ManifestBuilder) Governance(g Governance) *ManifestBuilder {
	b.manifest.Governance = &g
	return b
}

// Protocols sets the protocol declarations.
func (b *ManifestBuilder) Protocols(p ProtocolDeclarations) *ManifestBuilder {
	b.manifest.Protocols = &p
	return b
}

// MCPServer adds an MCP server declaration.
func (b *ManifestBuilder) MCPServer(name, command string, args ...string) *ManifestBuilder {
	if b.manifest.Protocols == nil {
		b.manifest.Protocols = &ProtocolDeclarations{}
	}
	b.manifest.Protocols.MCP = append(b.manifest.Protocols.MCP, MCPDeclaration{
		Name:    name,
		Command: command,
		Args:    args,
	})
	return b
}

// A2AEndpoint adds an A2A endpoint declaration.
func (b *ManifestBuilder) A2AEndpoint(name, endpoint string, skills ...string) *ManifestBuilder {
	if b.manifest.Protocols == nil {
		b.manifest.Protocols = &ProtocolDeclarations{}
	}
	b.manifest.Protocols.A2A = append(b.manifest.Protocols.A2A, A2ADeclaration{
		Name:     name,
		Endpoint: endpoint,
		Skills:   skills,
	})
	return b
}

// TokenEfficiencyConfig sets the token efficiency configuration.
func (b *ManifestBuilder) TokenEfficiencyConfig(te TokenEfficiency) *ManifestBuilder {
	b.manifest.TokenEfficiency = &te
	return b
}

// CognitionConfig sets the cognition configuration.
func (b *ManifestBuilder) CognitionConfig(c Cognition) *ManifestBuilder {
	b.manifest.Cognition = &c
	return b
}

// Label adds a metadata label.
func (b *ManifestBuilder) Label(key, value string) *ManifestBuilder {
	if b.manifest.Metadata.Labels == nil {
		b.manifest.Metadata.Labels = make(map[string]string)
	}
	b.manifest.Metadata.Labels[key] = value
	return b
}

// Annotation adds a metadata annotation.
func (b *ManifestBuilder) Annotation(key, value string) *ManifestBuilder {
	if b.manifest.Metadata.Annotations == nil {
		b.manifest.Metadata.Annotations = make(map[string]string)
	}
	b.manifest.Metadata.Annotations[key] = value
	return b
}

// Build returns the constructed manifest.
func (b *ManifestBuilder) Build() *Manifest {
	return b.manifest
}
