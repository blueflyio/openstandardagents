package uadp

import (
	"encoding/json"
	"net/http"
	"strconv"
)

// DataProvider is the interface for providing data to UADP endpoints.
type DataProvider interface {
	ListSkills(search, category string, page, limit int) (*SkillsResponse, error)
	ListAgents(search string, page, limit int) (*AgentsResponse, error)
	ListPeers() ([]Peer, error)
	AddPeer(url, name string) (*Peer, error)
	ValidateManifest(manifest string) (*ValidationResult, error)
}

// NodeConfig configures a UADP server node.
type NodeConfig struct {
	NodeName        string
	NodeDescription string
	BaseURL         string
	Contact         string
	PublicKey       string
	OssaVersions    []string
}

// NewHandler creates an http.Handler that serves all UADP endpoints.
//
// Usage:
//
//	mux := http.NewServeMux()
//	handler := uadp.NewHandler(config, provider)
//	mux.Handle("/", handler)
func NewHandler(config NodeConfig, provider DataProvider) http.Handler {
	mux := http.NewServeMux()

	ossaVersions := config.OssaVersions
	if len(ossaVersions) == 0 {
		ossaVersions = []string{"v0.4"}
	}

	// GET /.well-known/uadp.json
	mux.HandleFunc("GET /.well-known/uadp.json", func(w http.ResponseWriter, r *http.Request) {
		manifest := UadpManifest{
			ProtocolVersion: "0.1.0",
			NodeName:        config.NodeName,
			NodeDescription: config.NodeDescription,
			Contact:         config.Contact,
			Endpoints: UadpEndpoints{
				Skills:     config.BaseURL + "/uadp/v1/skills",
				Agents:     config.BaseURL + "/uadp/v1/agents",
				Federation: config.BaseURL + "/uadp/v1/federation",
				Validate:   config.BaseURL + "/uadp/v1/skills/validate",
			},
			Capabilities: []string{"skills", "agents", "federation", "validation"},
			PublicKey:     config.PublicKey,
			OssaVersions:  ossaVersions,
		}
		writeJSON(w, http.StatusOK, manifest)
	})

	// GET /uadp/v1/skills
	mux.HandleFunc("GET /uadp/v1/skills", func(w http.ResponseWriter, r *http.Request) {
		search := r.URL.Query().Get("search")
		category := r.URL.Query().Get("category")
		page := intParam(r, "page", 1)
		limit := intParam(r, "limit", 20)
		if limit > 100 {
			limit = 100
		}

		resp, err := provider.ListSkills(search, category, page, limit)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}
		resp.Meta.NodeName = config.NodeName
		writeJSON(w, http.StatusOK, resp)
	})

	// GET /uadp/v1/agents
	mux.HandleFunc("GET /uadp/v1/agents", func(w http.ResponseWriter, r *http.Request) {
		search := r.URL.Query().Get("search")
		page := intParam(r, "page", 1)
		limit := intParam(r, "limit", 20)
		if limit > 100 {
			limit = 100
		}

		resp, err := provider.ListAgents(search, page, limit)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}
		resp.Meta.NodeName = config.NodeName
		writeJSON(w, http.StatusOK, resp)
	})

	// GET /uadp/v1/federation
	mux.HandleFunc("GET /uadp/v1/federation", func(w http.ResponseWriter, r *http.Request) {
		peers, err := provider.ListPeers()
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}
		resp := FederationResponse{
			ProtocolVersion: "0.1.0",
			NodeName:        config.NodeName,
			Peers:           peers,
		}
		writeJSON(w, http.StatusOK, resp)
	})

	// POST /uadp/v1/federation
	mux.HandleFunc("POST /uadp/v1/federation", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			URL  string `json:"url"`
			Name string `json:"name"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.URL == "" || body.Name == "" {
			writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Missing required fields: url, name"})
			return
		}
		peer, err := provider.AddPeer(body.URL, body.Name)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}
		writeJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "peer": peer})
	})

	// POST /uadp/v1/skills/validate
	mux.HandleFunc("POST /uadp/v1/skills/validate", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Manifest string `json:"manifest"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Manifest == "" {
			writeJSON(w, http.StatusBadRequest, ValidationResult{Valid: false, Errors: []string{"Missing manifest field"}})
			return
		}
		result, err := provider.ValidateManifest(body.Manifest)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, result)
	})

	return mux
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func intParam(r *http.Request, key string, def int) int {
	s := r.URL.Query().Get(key)
	if s == "" {
		return def
	}
	v, err := strconv.Atoi(s)
	if err != nil || v < 1 {
		return def
	}
	return v
}
