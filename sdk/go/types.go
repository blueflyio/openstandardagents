package uadp

// UadpManifest represents /.well-known/uadp.json
type UadpManifest struct {
	ProtocolVersion string        `json:"protocol_version"`
	NodeName        string        `json:"node_name"`
	NodeDescription string        `json:"node_description,omitempty"`
	Contact         string        `json:"contact,omitempty"`
	Endpoints       UadpEndpoints `json:"endpoints"`
	Capabilities    []string      `json:"capabilities,omitempty"`
	PublicKey       string        `json:"public_key,omitempty"`
	OssaVersions    []string      `json:"ossa_versions,omitempty"`
}

type UadpEndpoints struct {
	Skills     string `json:"skills,omitempty"`
	Agents     string `json:"agents,omitempty"`
	Federation string `json:"federation,omitempty"`
	Validate   string `json:"validate,omitempty"`
}

// TrustTier for skills and agents
type TrustTier string

const (
	TrustOfficial          TrustTier = "official"
	TrustVerifiedSignature TrustTier = "verified-signature"
	TrustSigned            TrustTier = "signed"
	TrustCommunity         TrustTier = "community"
	TrustExperimental      TrustTier = "experimental"
)

// PeerStatus in federation
type PeerStatus string

const (
	PeerHealthy     PeerStatus = "healthy"
	PeerDegraded    PeerStatus = "degraded"
	PeerUnreachable PeerStatus = "unreachable"
)

// OssaMetadata common to skills and agents
type OssaMetadata struct {
	Name        string    `json:"name"`
	Version     string    `json:"version,omitempty"`
	Description string    `json:"description,omitempty"`
	URI         string    `json:"uri,omitempty"`
	Category    string    `json:"category,omitempty"`
	TrustTier   TrustTier `json:"trust_tier,omitempty"`
	Created     string    `json:"created,omitempty"`
	Updated     string    `json:"updated,omitempty"`
}

// OssaSkill payload
type OssaSkill struct {
	APIVersion string                 `json:"apiVersion"`
	Kind       string                 `json:"kind"`
	Metadata   OssaMetadata           `json:"metadata"`
	Spec       map[string]interface{} `json:"spec,omitempty"`
}

// OssaAgent payload
type OssaAgent struct {
	APIVersion string                 `json:"apiVersion"`
	Kind       string                 `json:"kind"`
	Metadata   OssaMetadata           `json:"metadata"`
	Spec       map[string]interface{} `json:"spec,omitempty"`
}

// PaginationMeta for list responses
type PaginationMeta struct {
	Total    int    `json:"total"`
	Page     int    `json:"page"`
	Limit    int    `json:"limit"`
	NodeName string `json:"node_name"`
}

// SkillsResponse for GET /uadp/v1/skills
type SkillsResponse struct {
	Data []OssaSkill    `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

// AgentsResponse for GET /uadp/v1/agents
type AgentsResponse struct {
	Data []OssaAgent    `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

// Peer in federation
type Peer struct {
	URL        string     `json:"url"`
	Name       string     `json:"name"`
	Status     PeerStatus `json:"status"`
	LastSynced *string    `json:"last_synced,omitempty"`
	SkillCount *int       `json:"skill_count,omitempty"`
	AgentCount *int       `json:"agent_count,omitempty"`
}

// FederationResponse for GET /uadp/v1/federation
type FederationResponse struct {
	ProtocolVersion string `json:"protocol_version"`
	NodeName        string `json:"node_name"`
	Peers           []Peer `json:"peers"`
}

// ValidationResult from validation endpoint
type ValidationResult struct {
	Valid    bool     `json:"valid"`
	Errors   []string `json:"errors"`
	Warnings []string `json:"warnings"`
}

// ListParams for querying skills/agents
type ListParams struct {
	Search    string
	Category  string
	TrustTier TrustTier
	Page      int
	Limit     int
}

// ErrorResponse for error responses
type ErrorResponse struct {
	Error string `json:"error"`
	Code  string `json:"code,omitempty"`
}
