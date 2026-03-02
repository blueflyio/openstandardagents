/**
 * OSSA v0.5 Protocol Declaration Types
 *
 * Type definitions for agent protocol interoperability,
 * including MCP, A2A, and ANP protocol declarations.
 */

/**
 * MCP transport mechanism
 */
export type MCPTransport = 'stdio' | 'http' | 'sse' | 'streamable-http';

/**
 * MCP role
 */
export type MCPRole = 'server' | 'client' | 'both';

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  /** Server identifier */
  name: string;

  /** Transport mechanism */
  transport: MCPTransport;

  /** Server URL (for http/sse transports) */
  url?: string;

  /** Command to launch server (for stdio transport) */
  command?: string;

  /** Command arguments (for stdio transport) */
  args?: string[];

  /** List of tool names exposed */
  tools?: string[];

  /** List of resource URIs exposed */
  resources?: string[];
}

/**
 * MCP capability flags
 */
export interface MCPCapabilities {
  /** Whether agent supports MCP tools */
  tools?: boolean;

  /** Whether agent supports MCP resources */
  resources?: boolean;

  /** Whether agent supports MCP prompts */
  prompts?: boolean;

  /** Whether agent supports MCP sampling */
  sampling?: boolean;
}

/**
 * MCP Protocol declaration (v0.5)
 */
export interface MCPProtocol {
  /** MCP protocol version */
  version: string;

  /** MCP role: server, client, or both */
  role?: MCPRole;

  /** MCP server configurations */
  servers?: MCPServerConfig[];

  /** MCP capability flags */
  capabilities?: MCPCapabilities;
}

/**
 * A2A skill definition
 */
export interface A2ASkill {
  /** Skill identifier */
  id: string;

  /** Skill display name */
  name: string;

  /** Skill description */
  description?: string;
}

/**
 * A2A Agent Card
 */
export interface A2AAgentCard {
  /** Agent display name in A2A network */
  name?: string;

  /** Agent description for A2A discovery */
  description?: string;

  /** Skills advertised via A2A */
  skills?: A2ASkill[];
}

/**
 * A2A capability flags
 */
export interface A2ACapabilities {
  /** Whether agent supports streaming responses */
  streaming?: boolean;

  /** Whether agent supports push notifications */
  pushNotifications?: boolean;

  /** Whether agent maintains task state history */
  stateTransitionHistory?: boolean;
}

/**
 * A2A authentication configuration
 */
export interface A2AAuthentication {
  /** Supported authentication schemes */
  schemes?: ('bearer' | 'oauth2' | 'apiKey' | 'none')[];
}

/**
 * A2A Protocol declaration (v0.5)
 */
export interface A2AProtocol {
  /** A2A protocol version */
  version: string;

  /** A2A endpoint URL */
  endpoint?: string;

  /** A2A Agent Card for discovery */
  agent_card?: A2AAgentCard;

  /** A2A capability flags */
  capabilities?: A2ACapabilities;

  /** A2A authentication configuration */
  authentication?: A2AAuthentication;
}

/**
 * Verifiable credential reference
 */
export interface VerifiableCredentialRef {
  /** Credential type */
  type: string;

  /** DID of the credential issuer */
  issuer: string;

  /** URL to the verifiable credential document */
  credential_url?: string;
}

/**
 * ANP discovery configuration
 */
export interface ANPDiscovery {
  /** URL of the ANP agent registry */
  registry_url?: string;

  /** Whether to advertise this agent */
  advertise?: boolean;
}

/**
 * ANP Protocol declaration (v0.5)
 */
export interface ANPProtocol {
  /** Decentralized Identifier (DID) */
  did?: string;

  /** Verifiable credentials */
  verifiable_credentials?: VerifiableCredentialRef[];

  /** ANP discovery configuration */
  discovery?: ANPDiscovery;
}

/**
 * Protocol Declarations (v0.5)
 * Declares which agent communication protocols this agent supports.
 */
export interface ProtocolDeclarations {
  /** Model Context Protocol configuration */
  mcp?: MCPProtocol;

  /** Agent-to-Agent protocol configuration */
  a2a?: A2AProtocol;

  /** Agent Network Protocol configuration */
  anp?: ANPProtocol;
}
