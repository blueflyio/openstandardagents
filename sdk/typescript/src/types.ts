/** UADP Node Discovery Manifest (/.well-known/uadp.json) */
export interface UadpManifest {
  protocol_version: string;
  node_name: string;
  node_description?: string;
  contact?: string;
  endpoints: {
    skills?: string;
    agents?: string;
    federation?: string;
    validate?: string;
    [key: string]: string | undefined;
  };
  capabilities?: string[];
  public_key?: string;
  ossa_versions?: string[];
}

/** Trust tiers for skills and agents */
export type TrustTier = 'official' | 'verified-signature' | 'signed' | 'community' | 'experimental';

/** Peer status in federation */
export type PeerStatus = 'healthy' | 'degraded' | 'unreachable';

/** OSSA metadata common to skills and agents */
export interface OssaMetadata {
  name: string;
  version?: string;
  description?: string;
  uri?: string;
  category?: string;
  trust_tier?: TrustTier;
  created?: string;
  updated?: string;
  [key: string]: unknown;
}

/** OSSA Skill payload */
export interface OssaSkill {
  apiVersion: string;
  kind: 'Skill';
  metadata: OssaMetadata;
  spec?: Record<string, unknown>;
}

/** OSSA Agent payload */
export interface OssaAgent {
  apiVersion: string;
  kind: 'Agent';
  metadata: OssaMetadata;
  spec?: Record<string, unknown>;
}

/** Pagination metadata */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  node_name: string;
}

/** Paginated response envelope */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Federation peer */
export interface Peer {
  url: string;
  name: string;
  status: PeerStatus;
  last_synced?: string | null;
  skill_count?: number;
  agent_count?: number;
}

/** Federation response */
export interface FederationResponse {
  protocol_version: string;
  node_name: string;
  peers: Peer[];
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Query parameters for list endpoints */
export interface ListParams {
  search?: string;
  category?: string;
  trust_tier?: TrustTier;
  page?: number;
  limit?: number;
}
