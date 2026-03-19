package uadp

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// UadpError is returned when a UADP request fails.
type UadpError struct {
	Message    string
	StatusCode int
}

func (e *UadpError) Error() string {
	if e.StatusCode > 0 {
		return fmt.Sprintf("uadp: HTTP %d: %s", e.StatusCode, e.Message)
	}
	return fmt.Sprintf("uadp: %s", e.Message)
}

// ClientOption configures the UADP client.
type ClientOption func(*Client)

// WithHTTPClient sets a custom HTTP client.
func WithHTTPClient(c *http.Client) ClientOption {
	return func(client *Client) { client.httpClient = c }
}

// WithTimeout sets the request timeout.
func WithTimeout(d time.Duration) ClientOption {
	return func(client *Client) { client.timeout = d }
}

// WithHeaders sets custom headers for all requests.
func WithHeaders(h map[string]string) ClientOption {
	return func(client *Client) { client.headers = h }
}

// Client discovers and queries a UADP node.
type Client struct {
	BaseURL    string
	httpClient *http.Client
	timeout    time.Duration
	headers    map[string]string
	manifest   *UadpManifest
}

// NewClient creates a new UADP client for the given base URL.
func NewClient(baseURL string, opts ...ClientOption) *Client {
	c := &Client{
		BaseURL:    strings.TrimRight(baseURL, "/"),
		httpClient: http.DefaultClient,
		timeout:    10 * time.Second,
		headers:    map[string]string{},
	}
	for _, opt := range opts {
		opt(c)
	}
	return c
}

// Discover fetches /.well-known/uadp.json and caches the manifest.
func (c *Client) Discover(ctx context.Context) (*UadpManifest, error) {
	u := c.BaseURL + "/.well-known/uadp.json"
	var manifest UadpManifest
	if err := c.doGet(ctx, u, &manifest); err != nil {
		return nil, fmt.Errorf("discovery failed: %w", err)
	}
	c.manifest = &manifest
	return &manifest, nil
}

// GetManifest returns the cached manifest or discovers it.
func (c *Client) GetManifest(ctx context.Context) (*UadpManifest, error) {
	if c.manifest != nil {
		return c.manifest, nil
	}
	return c.Discover(ctx)
}

// ListSkills queries GET /uadp/v1/skills.
func (c *Client) ListSkills(ctx context.Context, params *ListParams) (*SkillsResponse, error) {
	m, err := c.GetManifest(ctx)
	if err != nil {
		return nil, err
	}
	if m.Endpoints.Skills == "" {
		return nil, &UadpError{Message: "node does not expose a skills endpoint"}
	}
	u := c.buildURL(m.Endpoints.Skills, params)
	var resp SkillsResponse
	if err := c.doGet(ctx, u, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// ListAgents queries GET /uadp/v1/agents.
func (c *Client) ListAgents(ctx context.Context, params *ListParams) (*AgentsResponse, error) {
	m, err := c.GetManifest(ctx)
	if err != nil {
		return nil, err
	}
	if m.Endpoints.Agents == "" {
		return nil, &UadpError{Message: "node does not expose an agents endpoint"}
	}
	u := c.buildURL(m.Endpoints.Agents, params)
	var resp AgentsResponse
	if err := c.doGet(ctx, u, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetFederation queries GET /uadp/v1/federation.
func (c *Client) GetFederation(ctx context.Context) (*FederationResponse, error) {
	m, err := c.GetManifest(ctx)
	if err != nil {
		return nil, err
	}
	if m.Endpoints.Federation == "" {
		return nil, &UadpError{Message: "node does not expose a federation endpoint"}
	}
	var resp FederationResponse
	if err := c.doGet(ctx, m.Endpoints.Federation, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// RegisterAsPeer sends POST /uadp/v1/federation to register.
func (c *Client) RegisterAsPeer(ctx context.Context, myURL, myName string) error {
	m, err := c.GetManifest(ctx)
	if err != nil {
		return err
	}
	if m.Endpoints.Federation == "" {
		return &UadpError{Message: "node does not expose a federation endpoint"}
	}
	body := fmt.Sprintf(`{"url":%q,"name":%q}`, myURL, myName)
	return c.doPost(ctx, m.Endpoints.Federation, body, nil)
}

// Validate sends POST /uadp/v1/skills/validate.
func (c *Client) Validate(ctx context.Context, manifest string) (*ValidationResult, error) {
	m, err := c.GetManifest(ctx)
	if err != nil {
		return nil, err
	}
	if m.Endpoints.Validate == "" {
		return nil, &UadpError{Message: "node does not expose a validation endpoint"}
	}
	body := fmt.Sprintf(`{"manifest":%q}`, manifest)
	var result ValidationResult
	if err := c.doPost(ctx, m.Endpoints.Validate, body, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *Client) buildURL(base string, params *ListParams) string {
	if params == nil {
		return base
	}
	u, err := url.Parse(base)
	if err != nil {
		return base
	}
	q := u.Query()
	if params.Search != "" {
		q.Set("search", params.Search)
	}
	if params.Category != "" {
		q.Set("category", params.Category)
	}
	if params.TrustTier != "" {
		q.Set("trust_tier", string(params.TrustTier))
	}
	if params.Page > 0 {
		q.Set("page", strconv.Itoa(params.Page))
	}
	if params.Limit > 0 {
		q.Set("limit", strconv.Itoa(params.Limit))
	}
	u.RawQuery = q.Encode()
	return u.String()
}

func (c *Client) doGet(ctx context.Context, u string, out interface{}) error {
	ctx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	for k, v := range c.headers {
		req.Header.Set(k, v)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return &UadpError{Message: string(body), StatusCode: resp.StatusCode}
	}

	return json.NewDecoder(resp.Body).Decode(out)
}

func (c *Client) doPost(ctx context.Context, u string, body string, out interface{}) error {
	ctx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, strings.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	for k, v := range c.headers {
		req.Header.Set(k, v)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return &UadpError{Message: string(respBody), StatusCode: resp.StatusCode}
	}

	if out != nil {
		return json.NewDecoder(resp.Body).Decode(out)
	}
	return nil
}
