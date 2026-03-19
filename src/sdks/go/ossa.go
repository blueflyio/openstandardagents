// Package ossasdk is the module root for the OSSA Go SDK.
//
// The main API is in the ossa sub-package:
//
//	import "github.com/blueflyio/ossa-sdk-go/ossa"
//
//	// Load from file
//	m, err := ossa.LoadManifest("agent.ossa.yaml")
//
//	// Build programmatically
//	m := ossa.AgentBuilder("my-agent").
//	    Version("1.0.0").
//	    Role("You are a helpful assistant.").
//	    LLM(ossa.LLMConfig{Provider: "anthropic", Model: "claude-sonnet-4-20250514"}).
//	    Build()
package ossasdk
