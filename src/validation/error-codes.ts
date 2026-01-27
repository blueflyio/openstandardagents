/**
 * OSSA Validation Error Code Catalog
 *
 * Comprehensive error codes for OSSA manifest validation with remediation steps.
 * Enables programmatic error handling and detailed debugging.
 *
 * Error Code Format: OSSA-XXX
 * - 001-099: Schema validation errors
 * - 100-199: Identity & DID errors
 * - 200-299: Genetics & breeding errors
 * - 300-399: Lifecycle errors
 * - 400-499: Economics & marketplace errors
 * - 500-599: Taxonomy errors
 * - 600-699: Access control & separation of duties errors
 * - 700-799: Revolutionary features errors
 * - 800-899: Naming & format errors
 * - 900-999: Catalog & publishing errors
 */

export enum OSSAErrorCode {
  // Schema Validation (001-099)
  OSSA_001 = 'OSSA-001', // Missing required field
  OSSA_002 = 'OSSA-002', // Invalid field type
  OSSA_003 = 'OSSA-003', // Invalid apiVersion format
  OSSA_004 = 'OSSA-004', // Invalid kind value
  OSSA_005 = 'OSSA-005', // Missing spec field
  OSSA_006 = 'OSSA-006', // Invalid spec for kind
  OSSA_007 = 'OSSA-007', // Invalid enum value
  OSSA_008 = 'OSSA-008', // Pattern mismatch
  OSSA_009 = 'OSSA-009', // Invalid array item
  OSSA_010 = 'OSSA-010', // Duplicate array values
  OSSA_011 = 'OSSA-011', // Invalid JSON format
  OSSA_012 = 'OSSA-012', // Schema version mismatch
  OSSA_013 = 'OSSA-013', // Additional properties not allowed
  OSSA_014 = 'OSSA-014', // Invalid number range
  OSSA_015 = 'OSSA-015', // Invalid string length

  // Identity & DID (100-199)
  OSSA_100 = 'OSSA-100', // Invalid DID format
  OSSA_101 = 'OSSA-101', // DID pattern mismatch
  OSSA_102 = 'OSSA-102', // Missing DID for genetics
  OSSA_103 = 'OSSA-103', // Missing DID for economics
  OSSA_104 = 'OSSA-104', // DID without credentials
  OSSA_105 = 'OSSA-105', // Invalid credential format
  OSSA_106 = 'OSSA-106', // Expired credential
  OSSA_107 = 'OSSA-107', // Invalid reputation score
  OSSA_108 = 'OSSA-108', // Missing credit_score
  OSSA_109 = 'OSSA-109', // Invalid service account provider
  OSSA_110 = 'OSSA-110', // Missing service account details
  OSSA_111 = 'OSSA-111', // Invalid GitLab scopes
  OSSA_112 = 'OSSA-112', // Scope conflicts with tier

  // Genetics & Breeding (200-299)
  OSSA_200 = 'OSSA-200', // Invalid generation number
  OSSA_201 = 'OSSA-201', // Missing parent DIDs
  OSSA_202 = 'OSSA-202', // Invalid parent DID count
  OSSA_203 = 'OSSA-203', // Invalid fitness score
  OSSA_204 = 'OSSA-204', // Missing fitness score
  OSSA_205 = 'OSSA-205', // Invalid task success rate
  OSSA_206 = 'OSSA-206', // Invalid user satisfaction
  OSSA_207 = 'OSSA-207', // Invalid cost efficiency
  OSSA_208 = 'OSSA-208', // Missing breeding criteria
  OSSA_209 = 'OSSA-209', // Invalid mutation count
  OSSA_210 = 'OSSA-210', // Invalid trait
  OSSA_211 = 'OSSA-211', // Generation mismatch with parents
  OSSA_212 = 'OSSA-212', // Breeding ineligible fitness

  // Lifecycle (300-399)
  OSSA_300 = 'OSSA-300', // Invalid lifecycle stage
  OSSA_301 = 'OSSA-301', // Missing retired_at timestamp
  OSSA_302 = 'OSSA-302', // Retirement without legacy
  OSSA_303 = 'OSSA-303', // Invalid promotion entry
  OSSA_304 = 'OSSA-304', // Missing training hours
  OSSA_305 = 'OSSA-305', // Invalid certifications
  OSSA_306 = 'OSSA-306', // Stage transition violation
  OSSA_307 = 'OSSA-307', // Senior without promotions
  OSSA_308 = 'OSSA-308', // Invalid skill level
  OSSA_309 = 'OSSA-309', // Missing onboarding date
  OSSA_310 = 'OSSA-310', // Invalid retirement eligibility
  OSSA_311 = 'OSSA-311', // Lifecycle state inconsistency

  // Economics & Marketplace (400-499)
  OSSA_400 = 'OSSA-400', // Negative wallet balance
  OSSA_401 = 'OSSA-401', // Missing wallet for marketplace
  OSSA_402 = 'OSSA-402', // Invalid offering price
  OSSA_403 = 'OSSA-403', // Missing payment method
  OSSA_404 = 'OSSA-404', // Invalid currency
  OSSA_405 = 'OSSA-405', // Marketplace offering without DID
  OSSA_406 = 'OSSA-406', // Invalid transaction history
  OSSA_407 = 'OSSA-407', // Retired agent with offerings
  OSSA_408 = 'OSSA-408', // Invalid pricing model
  OSSA_409 = 'OSSA-409', // Missing service description
  OSSA_410 = 'OSSA-410', // Invalid revenue share
  OSSA_411 = 'OSSA-411', // Offering price inconsistency

  // Taxonomy (500-599)
  OSSA_500 = 'OSSA-500', // Missing domain
  OSSA_501 = 'OSSA-501', // Invalid domain value
  OSSA_502 = 'OSSA-502', // Invalid subdomain for domain
  OSSA_503 = 'OSSA-503', // Invalid capability pattern
  OSSA_504 = 'OSSA-504', // Invalid concern value
  OSSA_505 = 'OSSA-505', // Type-domain mismatch
  OSSA_506 = 'OSSA-506', // Missing taxonomy classification
  OSSA_507 = 'OSSA-507', // Tier-domain mismatch
  OSSA_508 = 'OSSA-508', // Invalid recommended_tier

  // Access Control & Separation of Duties (600-699)
  OSSA_600 = 'OSSA-600', // Invalid access tier
  OSSA_601 = 'OSSA-601', // Missing tier configuration
  OSSA_602 = 'OSSA-602', // Invalid permission
  OSSA_603 = 'OSSA-603', // Permission-tier mismatch
  OSSA_604 = 'OSSA-604', // Invalid audit level
  OSSA_605 = 'OSSA-605', // Missing approval chain
  OSSA_606 = 'OSSA-606', // Invalid isolation level
  OSSA_607 = 'OSSA-607', // Role conflict detected
  OSSA_608 = 'OSSA-608', // Invalid role value
  OSSA_609 = 'OSSA-609', // Prohibited action in role
  OSSA_610 = 'OSSA-610', // Invalid delegation tier
  OSSA_611 = 'OSSA-611', // Delegation to higher tier
  OSSA_612 = 'OSSA-612', // Missing delegation token
  OSSA_613 = 'OSSA-613', // Self-delegation prohibited
  OSSA_614 = 'OSSA-614', // Conflicting roles assigned

  // Revolutionary Features (700-799)
  OSSA_700 = 'OSSA-700', // Feature requires DID
  OSSA_701 = 'OSSA-701', // Incompatible feature combination
  OSSA_702 = 'OSSA-702', // Missing prerequisite feature
  OSSA_703 = 'OSSA-703', // Feature tier restriction
  OSSA_704 = 'OSSA-704', // Team membership without lifecycle
  OSSA_705 = 'OSSA-705', // Invalid team role
  OSSA_706 = 'OSSA-706', // Team hierarchy violation

  // Naming & Format (800-899)
  OSSA_800 = 'OSSA-800', // Invalid DNS-1123 format
  OSSA_801 = 'OSSA-801', // Name too long
  OSSA_802 = 'OSSA-802', // Name contains invalid characters
  OSSA_803 = 'OSSA-803', // Invalid URL format
  OSSA_804 = 'OSSA-804', // Invalid email format
  OSSA_805 = 'OSSA-805', // Invalid date format
  OSSA_806 = 'OSSA-806', // Invalid version format

  // Catalog & Publishing (900-999)
  OSSA_900 = 'OSSA-900', // Published without documentation
  OSSA_901 = 'OSSA-901', // Invalid visibility value
  OSSA_902 = 'OSSA-902', // Public agent without ratings
  OSSA_903 = 'OSSA-903', // Missing license for public agent
  OSSA_904 = 'OSSA-904', // Invalid rating value
  OSSA_905 = 'OSSA-905', // Missing catalog metadata
  OSSA_906 = 'OSSA-906', // Invalid maturity level
}

export interface ErrorDetails {
  code: OSSAErrorCode;
  severity: 'error' | 'warning' | 'info';
  message: string;
  remediation: string;
  docsUrl: string;
  examples?: ErrorExample[];
  tags?: string[];
}

export interface ErrorExample {
  title: string;
  invalid: string;
  valid: string;
  explanation: string;
}

/**
 * Comprehensive error catalog with remediation steps
 */
export const ERROR_CATALOG: Record<OSSAErrorCode, ErrorDetails> = {
  // Schema Validation (001-099)
  [OSSAErrorCode.OSSA_001]: {
    code: OSSAErrorCode.OSSA_001,
    severity: 'error',
    message: 'Missing required field',
    remediation:
      'Add the required field to your manifest. Check the schema for required fields at the current path.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-001',
    examples: [
      {
        title: 'Missing apiVersion',
        invalid: '{ "kind": "Agent", "metadata": {} }',
        valid:
          '{ "apiVersion": "ossa/v0.3.6", "kind": "Agent", "metadata": {} }',
        explanation: 'apiVersion is a required top-level field',
      },
    ],
    tags: ['schema', 'validation', 'required'],
  },

  [OSSAErrorCode.OSSA_002]: {
    code: OSSAErrorCode.OSSA_002,
    severity: 'error',
    message: 'Invalid field type',
    remediation:
      'Ensure the field value matches the expected type (string, number, boolean, object, array).',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-002',
    examples: [
      {
        title: 'Kind must be string',
        invalid: '{ "kind": 123 }',
        valid: '{ "kind": "Agent" }',
        explanation: 'kind must be a string, not a number',
      },
    ],
    tags: ['schema', 'validation', 'type'],
  },

  [OSSAErrorCode.OSSA_003]: {
    code: OSSAErrorCode.OSSA_003,
    severity: 'error',
    message: 'Invalid apiVersion format',
    remediation:
      'Use format "ossa/v0.3" or "ossa/v0.3.6". Must match pattern: ^ossa/v(0\\.3(\\.[4-9]|\\.[0-9]+)?|1)',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-003',
    examples: [
      {
        title: 'Invalid version format',
        invalid: '{ "apiVersion": "v0.3" }',
        valid: '{ "apiVersion": "ossa/v0.3.6" }',
        explanation: 'apiVersion must start with "ossa/" prefix',
      },
    ],
    tags: ['schema', 'validation', 'version'],
  },

  [OSSAErrorCode.OSSA_004]: {
    code: OSSAErrorCode.OSSA_004,
    severity: 'error',
    message: 'Invalid kind value',
    remediation: 'kind must be one of: "Agent", "Task", "Workflow", "Flow"',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-004',
    examples: [
      {
        title: 'Invalid kind',
        invalid: '{ "kind": "Service" }',
        valid: '{ "kind": "Agent" }',
        explanation: 'kind must be Agent, Task, Workflow, or Flow',
      },
    ],
    tags: ['schema', 'validation', 'enum'],
  },

  [OSSAErrorCode.OSSA_005]: {
    code: OSSAErrorCode.OSSA_005,
    severity: 'error',
    message: 'Missing spec field',
    remediation:
      'Add spec field matching your kind (AgentSpec, TaskSpec, WorkflowSpec, or FlowSpec)',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-005',
    examples: [
      {
        title: 'Agent without spec',
        invalid:
          '{ "apiVersion": "ossa/v0.3.6", "kind": "Agent", "metadata": {} }',
        valid:
          '{ "apiVersion": "ossa/v0.3.6", "kind": "Agent", "metadata": {}, "spec": { "type": "worker" } }',
        explanation: 'spec is required for Agent kind',
      },
    ],
    tags: ['schema', 'validation', 'required', 'spec'],
  },

  [OSSAErrorCode.OSSA_006]: {
    code: OSSAErrorCode.OSSA_006,
    severity: 'error',
    message: 'Invalid spec for kind',
    remediation:
      'Ensure spec matches the kind. Agent→AgentSpec, Task→TaskSpec, Workflow→WorkflowSpec',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-006',
    tags: ['schema', 'validation', 'spec'],
  },

  [OSSAErrorCode.OSSA_007]: {
    code: OSSAErrorCode.OSSA_007,
    severity: 'error',
    message: 'Invalid enum value',
    remediation:
      'Value must be one of the allowed enum values. Check schema for valid options.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-007',
    tags: ['schema', 'validation', 'enum'],
  },

  [OSSAErrorCode.OSSA_008]: {
    code: OSSAErrorCode.OSSA_008,
    severity: 'error',
    message: 'Pattern mismatch',
    remediation:
      'Value must match the required regex pattern. Check schema for pattern requirements.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-008',
    tags: ['schema', 'validation', 'pattern'],
  },

  [OSSAErrorCode.OSSA_009]: {
    code: OSSAErrorCode.OSSA_009,
    severity: 'error',
    message: 'Invalid array item',
    remediation:
      'All array items must match the item schema. Check each item for validation errors.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-009',
    tags: ['schema', 'validation', 'array'],
  },

  [OSSAErrorCode.OSSA_010]: {
    code: OSSAErrorCode.OSSA_010,
    severity: 'error',
    message: 'Duplicate array values',
    remediation: 'Array has uniqueItems: true. Remove duplicate values.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-010',
    examples: [
      {
        title: 'Duplicate permissions',
        invalid: '{ "permissions": ["read_code", "read_code"] }',
        valid: '{ "permissions": ["read_code", "read_configs"] }',
        explanation: 'permissions array must have unique values',
      },
    ],
    tags: ['schema', 'validation', 'array', 'unique'],
  },

  [OSSAErrorCode.OSSA_011]: {
    code: OSSAErrorCode.OSSA_011,
    severity: 'error',
    message: 'Invalid JSON format',
    remediation:
      'File must be valid JSON. Check for syntax errors (trailing commas, quotes, brackets).',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-011',
    tags: ['schema', 'validation', 'json'],
  },

  [OSSAErrorCode.OSSA_012]: {
    code: OSSAErrorCode.OSSA_012,
    severity: 'warning',
    message: 'Schema version mismatch',
    remediation:
      'apiVersion and schema version should match. Update apiVersion or use correct schema.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-012',
    tags: ['schema', 'validation', 'version'],
  },

  [OSSAErrorCode.OSSA_013]: {
    code: OSSAErrorCode.OSSA_013,
    severity: 'error',
    message: 'Additional properties not allowed',
    remediation: 'Remove unknown properties. Check schema for allowed fields.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-013',
    tags: ['schema', 'validation', 'properties'],
  },

  [OSSAErrorCode.OSSA_014]: {
    code: OSSAErrorCode.OSSA_014,
    severity: 'error',
    message: 'Invalid number range',
    remediation:
      'Number must be within allowed range (minimum/maximum). Check schema constraints.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-014',
    tags: ['schema', 'validation', 'number'],
  },

  [OSSAErrorCode.OSSA_015]: {
    code: OSSAErrorCode.OSSA_015,
    severity: 'error',
    message: 'Invalid string length',
    remediation:
      'String length must be within allowed range (minLength/maxLength).',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-015',
    tags: ['schema', 'validation', 'string'],
  },

  // Identity & DID (100-199)
  [OSSAErrorCode.OSSA_100]: {
    code: OSSAErrorCode.OSSA_100,
    severity: 'error',
    message: 'Invalid DID format',
    remediation: 'DID must follow format: did:ossa:[a-z0-9]{32,64}',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-100',
    examples: [
      {
        title: 'Invalid DID format',
        invalid: '{ "did": "agent-123" }',
        valid: '{ "did": "did:ossa:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" }',
        explanation:
          'DID must start with "did:ossa:" and contain 32-64 lowercase alphanumeric characters',
      },
    ],
    tags: ['identity', 'did', 'format'],
  },

  [OSSAErrorCode.OSSA_101]: {
    code: OSSAErrorCode.OSSA_101,
    severity: 'error',
    message: 'DID pattern mismatch',
    remediation: 'DID must match pattern: ^did:ossa:[a-z0-9]{32,64}$',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-101',
    tags: ['identity', 'did', 'pattern'],
  },

  [OSSAErrorCode.OSSA_102]: {
    code: OSSAErrorCode.OSSA_102,
    severity: 'warning',
    message: 'Missing DID for genetics',
    remediation:
      'Agents with genetics should have metadata.decentralized_identity.did for lineage tracking',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-102',
    tags: ['identity', 'did', 'genetics'],
  },

  [OSSAErrorCode.OSSA_103]: {
    code: OSSAErrorCode.OSSA_103,
    severity: 'warning',
    message: 'Missing DID for economics',
    remediation:
      'Agents participating in marketplace should have metadata.decentralized_identity.did',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-103',
    tags: ['identity', 'did', 'economics'],
  },

  [OSSAErrorCode.OSSA_104]: {
    code: OSSAErrorCode.OSSA_104,
    severity: 'warning',
    message: 'DID without credentials',
    remediation:
      'Add credentials array to decentralized_identity for verifiable claims',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-104',
    tags: ['identity', 'did', 'credentials'],
  },

  [OSSAErrorCode.OSSA_105]: {
    code: OSSAErrorCode.OSSA_105,
    severity: 'error',
    message: 'Invalid credential format',
    remediation: 'Credentials must follow Verifiable Credentials data model',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-105',
    tags: ['identity', 'credentials', 'format'],
  },

  [OSSAErrorCode.OSSA_106]: {
    code: OSSAErrorCode.OSSA_106,
    severity: 'warning',
    message: 'Expired credential',
    remediation:
      'Credential has expired. Update or remove expired credentials.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-106',
    tags: ['identity', 'credentials', 'expiration'],
  },

  [OSSAErrorCode.OSSA_107]: {
    code: OSSAErrorCode.OSSA_107,
    severity: 'error',
    message: 'Invalid reputation score',
    remediation: 'Reputation score must be between 0.0 and 1.0',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-107',
    tags: ['identity', 'reputation'],
  },

  [OSSAErrorCode.OSSA_108]: {
    code: OSSAErrorCode.OSSA_108,
    severity: 'warning',
    message: 'Missing credit_score',
    remediation: 'Add credit_score to reputation for marketplace participation',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-108',
    tags: ['identity', 'reputation', 'credit'],
  },

  [OSSAErrorCode.OSSA_109]: {
    code: OSSAErrorCode.OSSA_109,
    severity: 'error',
    message: 'Invalid service account provider',
    remediation:
      'provider must be one of: gitlab, github, azure-devops, bitbucket, generic',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-109',
    tags: ['identity', 'service-account', 'provider'],
  },

  [OSSAErrorCode.OSSA_110]: {
    code: OSSAErrorCode.OSSA_110,
    severity: 'error',
    message: 'Missing service account details',
    remediation: 'Add username and email to service_account configuration',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-110',
    tags: ['identity', 'service-account'],
  },

  [OSSAErrorCode.OSSA_111]: {
    code: OSSAErrorCode.OSSA_111,
    severity: 'error',
    message: 'Invalid GitLab scopes',
    remediation:
      'GitLab scopes must match tier requirements. Check access_tier documentation.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-111',
    tags: ['identity', 'gitlab', 'scopes'],
  },

  [OSSAErrorCode.OSSA_112]: {
    code: OSSAErrorCode.OSSA_112,
    severity: 'error',
    message: 'Scope conflicts with tier',
    remediation:
      'Service account scopes exceed access tier permissions. Reduce scopes or increase tier.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-112',
    tags: ['identity', 'scopes', 'tier'],
  },

  // Genetics & Breeding (200-299)
  [OSSAErrorCode.OSSA_200]: {
    code: OSSAErrorCode.OSSA_200,
    severity: 'error',
    message: 'Invalid generation number',
    remediation: 'generation must be >= 0. Generation 0 = created, > 0 = bred.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-200',
    tags: ['genetics', 'generation'],
  },

  [OSSAErrorCode.OSSA_201]: {
    code: OSSAErrorCode.OSSA_201,
    severity: 'error',
    message: 'Missing parent DIDs',
    remediation: 'Agents with generation > 0 must specify parent_dids array',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-201',
    examples: [
      {
        title: 'Generation 1 without parents',
        invalid: '{ "generation": 1 }',
        valid:
          '{ "generation": 1, "parent_dids": ["did:ossa:parent1", "did:ossa:parent2"] }',
        explanation: 'Bred agents must specify parent DIDs',
      },
    ],
    tags: ['genetics', 'breeding', 'parents'],
  },

  [OSSAErrorCode.OSSA_202]: {
    code: OSSAErrorCode.OSSA_202,
    severity: 'warning',
    message: 'Invalid parent DID count',
    remediation: 'Typical breeding uses 1-2 parents. Verify parent_dids array.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-202',
    tags: ['genetics', 'breeding', 'parents'],
  },

  [OSSAErrorCode.OSSA_203]: {
    code: OSSAErrorCode.OSSA_203,
    severity: 'error',
    message: 'Invalid fitness score',
    remediation: 'fitness.score must be between 0.0 and 1.0',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-203',
    tags: ['genetics', 'fitness'],
  },

  [OSSAErrorCode.OSSA_204]: {
    code: OSSAErrorCode.OSSA_204,
    severity: 'warning',
    message: 'Missing fitness score',
    remediation: 'Add fitness.score to determine breeding eligibility',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-204',
    tags: ['genetics', 'fitness'],
  },

  [OSSAErrorCode.OSSA_205]: {
    code: OSSAErrorCode.OSSA_205,
    severity: 'error',
    message: 'Invalid task success rate',
    remediation: 'task_success_rate must be between 0.0 and 1.0',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-205',
    tags: ['genetics', 'fitness', 'metrics'],
  },

  [OSSAErrorCode.OSSA_206]: {
    code: OSSAErrorCode.OSSA_206,
    severity: 'error',
    message: 'Invalid user satisfaction',
    remediation: 'user_satisfaction must be between 0.0 and 1.0',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-206',
    tags: ['genetics', 'fitness', 'metrics'],
  },

  [OSSAErrorCode.OSSA_207]: {
    code: OSSAErrorCode.OSSA_207,
    severity: 'error',
    message: 'Invalid cost efficiency',
    remediation: 'cost_efficiency must be between 0.0 and 1.0',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-207',
    tags: ['genetics', 'fitness', 'metrics'],
  },

  [OSSAErrorCode.OSSA_208]: {
    code: OSSAErrorCode.OSSA_208,
    severity: 'warning',
    message: 'Missing breeding criteria',
    remediation:
      'Define fitness metrics (task_success_rate, user_satisfaction, cost_efficiency)',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-208',
    tags: ['genetics', 'breeding', 'fitness'],
  },

  [OSSAErrorCode.OSSA_209]: {
    code: OSSAErrorCode.OSSA_209,
    severity: 'warning',
    message: 'Invalid mutation count',
    remediation: 'mutation_count should reflect actual mutations applied',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-209',
    tags: ['genetics', 'mutation'],
  },

  [OSSAErrorCode.OSSA_210]: {
    code: OSSAErrorCode.OSSA_210,
    severity: 'warning',
    message: 'Invalid trait',
    remediation: 'Traits should follow naming convention: category.trait_name',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-210',
    tags: ['genetics', 'traits'],
  },

  [OSSAErrorCode.OSSA_211]: {
    code: OSSAErrorCode.OSSA_211,
    severity: 'error',
    message: 'Generation mismatch with parents',
    remediation: 'Agent generation should be max(parent_generations) + 1',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-211',
    tags: ['genetics', 'generation', 'breeding'],
  },

  [OSSAErrorCode.OSSA_212]: {
    code: OSSAErrorCode.OSSA_212,
    severity: 'warning',
    message: 'Breeding ineligible fitness',
    remediation: 'Fitness score < 0.7 typically not eligible for breeding',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-212',
    tags: ['genetics', 'fitness', 'breeding'],
  },

  // Lifecycle (300-399)
  [OSSAErrorCode.OSSA_300]: {
    code: OSSAErrorCode.OSSA_300,
    severity: 'error',
    message: 'Invalid lifecycle stage',
    remediation:
      'current_stage must be one of: embryonic, juvenile, mature, senior, retired',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-300',
    tags: ['lifecycle', 'stage'],
  },

  [OSSAErrorCode.OSSA_301]: {
    code: OSSAErrorCode.OSSA_301,
    severity: 'warning',
    message: 'Missing retired_at timestamp',
    remediation: 'Add retirement.retired_at when current_stage is "retired"',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-301',
    tags: ['lifecycle', 'retirement'],
  },

  [OSSAErrorCode.OSSA_302]: {
    code: OSSAErrorCode.OSSA_302,
    severity: 'warning',
    message: 'Retirement without legacy',
    remediation: 'Add retirement.legacy to preserve agent contributions',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-302',
    tags: ['lifecycle', 'retirement', 'legacy'],
  },

  [OSSAErrorCode.OSSA_303]: {
    code: OSSAErrorCode.OSSA_303,
    severity: 'error',
    message: 'Invalid promotion entry',
    remediation: 'Promotion must have date, from_role, to_role fields',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-303',
    tags: ['lifecycle', 'career', 'promotion'],
  },

  [OSSAErrorCode.OSSA_304]: {
    code: OSSAErrorCode.OSSA_304,
    severity: 'warning',
    message: 'Missing training hours',
    remediation: 'Track training with career.training array',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-304',
    tags: ['lifecycle', 'career', 'training'],
  },

  [OSSAErrorCode.OSSA_305]: {
    code: OSSAErrorCode.OSSA_305,
    severity: 'warning',
    message: 'Invalid certifications',
    remediation: 'Certification must have name, issued_by, issued_at fields',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-305',
    tags: ['lifecycle', 'career', 'certifications'],
  },

  [OSSAErrorCode.OSSA_306]: {
    code: OSSAErrorCode.OSSA_306,
    severity: 'error',
    message: 'Stage transition violation',
    remediation:
      'Lifecycle stages must progress: embryonic → juvenile → mature → senior → retired',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-306',
    tags: ['lifecycle', 'stage', 'transition'],
  },

  [OSSAErrorCode.OSSA_307]: {
    code: OSSAErrorCode.OSSA_307,
    severity: 'info',
    message: 'Senior without promotions',
    remediation: 'Document career progression with career.promotions array',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-307',
    tags: ['lifecycle', 'career', 'promotion'],
  },

  [OSSAErrorCode.OSSA_308]: {
    code: OSSAErrorCode.OSSA_308,
    severity: 'error',
    message: 'Invalid skill level',
    remediation:
      'Skill level must be: beginner, intermediate, advanced, expert',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-308',
    tags: ['lifecycle', 'skills'],
  },

  [OSSAErrorCode.OSSA_309]: {
    code: OSSAErrorCode.OSSA_309,
    severity: 'warning',
    message: 'Missing onboarding date',
    remediation: 'Add onboarding.started_at timestamp',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-309',
    tags: ['lifecycle', 'onboarding'],
  },

  [OSSAErrorCode.OSSA_310]: {
    code: OSSAErrorCode.OSSA_310,
    severity: 'warning',
    message: 'Invalid retirement eligibility',
    remediation: 'Set retirement.eligible based on fitness and lifecycle stage',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-310',
    tags: ['lifecycle', 'retirement'],
  },

  [OSSAErrorCode.OSSA_311]: {
    code: OSSAErrorCode.OSSA_311,
    severity: 'error',
    message: 'Lifecycle state inconsistency',
    remediation:
      'Ensure current_stage, onboarding, career, and retirement states are consistent',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-311',
    tags: ['lifecycle', 'consistency'],
  },

  // Economics & Marketplace (400-499)
  [OSSAErrorCode.OSSA_400]: {
    code: OSSAErrorCode.OSSA_400,
    severity: 'error',
    message: 'Negative wallet balance',
    remediation: 'wallet.balance cannot be negative',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-400',
    tags: ['economics', 'wallet'],
  },

  [OSSAErrorCode.OSSA_401]: {
    code: OSSAErrorCode.OSSA_401,
    severity: 'error',
    message: 'Missing wallet for marketplace',
    remediation: 'Add economics.wallet to receive marketplace payments',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-401',
    examples: [
      {
        title: 'Marketplace without wallet',
        invalid: '{ "marketplace": { "offerings": [...] } }',
        valid:
          '{ "wallet": { "address": "0x...", "balance": 0 }, "marketplace": { "offerings": [...] } }',
        explanation: 'Agents with marketplace offerings need a wallet',
      },
    ],
    tags: ['economics', 'marketplace', 'wallet'],
  },

  [OSSAErrorCode.OSSA_402]: {
    code: OSSAErrorCode.OSSA_402,
    severity: 'warning',
    message: 'Invalid offering price',
    remediation: 'Set positive price or use pricing_model: "free"',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-402',
    tags: ['economics', 'marketplace', 'pricing'],
  },

  [OSSAErrorCode.OSSA_403]: {
    code: OSSAErrorCode.OSSA_403,
    severity: 'warning',
    message: 'Missing payment method',
    remediation: 'Add payment_methods to wallet configuration',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-403',
    tags: ['economics', 'wallet', 'payment'],
  },

  [OSSAErrorCode.OSSA_404]: {
    code: OSSAErrorCode.OSSA_404,
    severity: 'error',
    message: 'Invalid currency',
    remediation: 'Use standard currency code (USD, EUR, ETH, etc.)',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-404',
    tags: ['economics', 'currency'],
  },

  [OSSAErrorCode.OSSA_405]: {
    code: OSSAErrorCode.OSSA_405,
    severity: 'warning',
    message: 'Marketplace offering without DID',
    remediation: 'Add decentralized_identity.did for marketplace transactions',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-405',
    tags: ['economics', 'marketplace', 'identity'],
  },

  [OSSAErrorCode.OSSA_406]: {
    code: OSSAErrorCode.OSSA_406,
    severity: 'error',
    message: 'Invalid transaction history',
    remediation:
      'Transaction must have id, type, amount, timestamp, status fields',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-406',
    tags: ['economics', 'transactions'],
  },

  [OSSAErrorCode.OSSA_407]: {
    code: OSSAErrorCode.OSSA_407,
    severity: 'warning',
    message: 'Retired agent with offerings',
    remediation: 'Remove marketplace.offerings for retired agents',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-407',
    tags: ['economics', 'marketplace', 'lifecycle'],
  },

  [OSSAErrorCode.OSSA_408]: {
    code: OSSAErrorCode.OSSA_408,
    severity: 'error',
    message: 'Invalid pricing model',
    remediation:
      'pricing_model must be: fixed, variable, subscription, free, auction',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-408',
    tags: ['economics', 'pricing'],
  },

  [OSSAErrorCode.OSSA_409]: {
    code: OSSAErrorCode.OSSA_409,
    severity: 'warning',
    message: 'Missing service description',
    remediation: 'Add description to marketplace offerings',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-409',
    tags: ['economics', 'marketplace'],
  },

  [OSSAErrorCode.OSSA_410]: {
    code: OSSAErrorCode.OSSA_410,
    severity: 'error',
    message: 'Invalid revenue share',
    remediation: 'revenue_share must be between 0.0 and 1.0',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-410',
    tags: ['economics', 'revenue'],
  },

  [OSSAErrorCode.OSSA_411]: {
    code: OSSAErrorCode.OSSA_411,
    severity: 'error',
    message: 'Offering price inconsistency',
    remediation:
      'Free offerings should have pricing_model: "free", not price: 0',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-411',
    tags: ['economics', 'pricing'],
  },

  // Taxonomy (500-599)
  [OSSAErrorCode.OSSA_500]: {
    code: OSSAErrorCode.OSSA_500,
    severity: 'error',
    message: 'Missing domain',
    remediation:
      'Add metadata.taxonomy.domain - every agent belongs to exactly one domain',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-500',
    tags: ['taxonomy', 'domain'],
  },

  [OSSAErrorCode.OSSA_501]: {
    code: OSSAErrorCode.OSSA_501,
    severity: 'error',
    message: 'Invalid domain value',
    remediation:
      'domain must be: security, infrastructure, documentation, backend, frontend, data, agents, development, content',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-501',
    tags: ['taxonomy', 'domain'],
  },

  [OSSAErrorCode.OSSA_502]: {
    code: OSSAErrorCode.OSSA_502,
    severity: 'warning',
    message: 'Invalid subdomain for domain',
    remediation:
      'Subdomain is not typical for this domain. See taxonomy.yaml for valid subdomains.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-502',
    tags: ['taxonomy', 'subdomain'],
  },

  [OSSAErrorCode.OSSA_503]: {
    code: OSSAErrorCode.OSSA_503,
    severity: 'error',
    message: 'Invalid capability pattern',
    remediation: 'capability must match pattern: ^[a-z][a-z0-9_]*$',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-503',
    tags: ['taxonomy', 'capability'],
  },

  [OSSAErrorCode.OSSA_504]: {
    code: OSSAErrorCode.OSSA_504,
    severity: 'warning',
    message: 'Invalid concern value',
    remediation:
      'concerns must be: quality, observability, governance, performance, architecture, cost, reliability',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-504',
    tags: ['taxonomy', 'concerns'],
  },

  [OSSAErrorCode.OSSA_505]: {
    code: OSSAErrorCode.OSSA_505,
    severity: 'info',
    message: 'Type-domain mismatch',
    remediation:
      'Agent type typically belongs to different domain. Verify classification.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-505',
    tags: ['taxonomy', 'type', 'domain'],
  },

  [OSSAErrorCode.OSSA_506]: {
    code: OSSAErrorCode.OSSA_506,
    severity: 'warning',
    message: 'Missing taxonomy classification',
    remediation: 'Add metadata.taxonomy for agent discovery and classification',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-506',
    tags: ['taxonomy'],
  },

  [OSSAErrorCode.OSSA_507]: {
    code: OSSAErrorCode.OSSA_507,
    severity: 'warning',
    message: 'Tier-domain mismatch',
    remediation:
      'Access tier may not align with domain. Verify tier assignment.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-507',
    tags: ['taxonomy', 'tier', 'domain'],
  },

  [OSSAErrorCode.OSSA_508]: {
    code: OSSAErrorCode.OSSA_508,
    severity: 'error',
    message: 'Invalid recommended_tier',
    remediation:
      'recommended_tier must be: tier_1_read, tier_2_write_limited, tier_3_write_elevated, tier_4_policy',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-508',
    tags: ['taxonomy', 'tier'],
  },

  // Access Control & Separation of Duties (600-699)
  [OSSAErrorCode.OSSA_600]: {
    code: OSSAErrorCode.OSSA_600,
    severity: 'error',
    message: 'Invalid access tier',
    remediation:
      'tier must be: tier_1_read, tier_2_write_limited, tier_3_write_elevated, tier_4_policy',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-600',
    tags: ['access-control', 'tier'],
  },

  [OSSAErrorCode.OSSA_601]: {
    code: OSSAErrorCode.OSSA_601,
    severity: 'warning',
    message: 'Missing tier configuration',
    remediation: 'Add metadata.access_tier for separation of duties',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-601',
    tags: ['access-control', 'tier'],
  },

  [OSSAErrorCode.OSSA_602]: {
    code: OSSAErrorCode.OSSA_602,
    severity: 'error',
    message: 'Invalid permission',
    remediation:
      'Permission not in allowed list. Check schema for valid permissions.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-602',
    tags: ['access-control', 'permissions'],
  },

  [OSSAErrorCode.OSSA_603]: {
    code: OSSAErrorCode.OSSA_603,
    severity: 'error',
    message: 'Permission-tier mismatch',
    remediation:
      'Permission exceeds tier capabilities. Reduce permissions or increase tier.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-603',
    examples: [
      {
        title: 'Tier 1 with write permission',
        invalid:
          '{ "tier": "tier_1_read", "permissions": ["write_production_code"] }',
        valid:
          '{ "tier": "tier_3_write_elevated", "permissions": ["write_production_code"] }',
        explanation: 'Tier 1 (read-only) cannot have write permissions',
      },
    ],
    tags: ['access-control', 'tier', 'permissions'],
  },

  [OSSAErrorCode.OSSA_604]: {
    code: OSSAErrorCode.OSSA_604,
    severity: 'error',
    message: 'Invalid audit level',
    remediation: 'audit_level must be: standard, detailed, comprehensive',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-604',
    tags: ['access-control', 'audit'],
  },

  [OSSAErrorCode.OSSA_605]: {
    code: OSSAErrorCode.OSSA_605,
    severity: 'error',
    message: 'Missing approval chain',
    remediation: 'Add approval_chain when requires_approval is true',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-605',
    tags: ['access-control', 'approval'],
  },

  [OSSAErrorCode.OSSA_606]: {
    code: OSSAErrorCode.OSSA_606,
    severity: 'error',
    message: 'Invalid isolation level',
    remediation: 'isolation must be: none, standard, strict',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-606',
    tags: ['access-control', 'isolation'],
  },

  [OSSAErrorCode.OSSA_607]: {
    code: OSSAErrorCode.OSSA_607,
    severity: 'error',
    message: 'Role conflict detected',
    remediation:
      'Agent role conflicts with separation_of_duties.conflicts_with. Remove conflicting role.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-607',
    tags: ['separation-of-duties', 'role', 'conflict'],
  },

  [OSSAErrorCode.OSSA_608]: {
    code: OSSAErrorCode.OSSA_608,
    severity: 'error',
    message: 'Invalid role value',
    remediation:
      'role must be valid SoD role. Check schema for allowed values.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-608',
    tags: ['separation-of-duties', 'role'],
  },

  [OSSAErrorCode.OSSA_609]: {
    code: OSSAErrorCode.OSSA_609,
    severity: 'error',
    message: 'Prohibited action in role',
    remediation:
      'Role cannot perform this action. Remove from prohibited_actions or change role.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-609',
    tags: ['separation-of-duties', 'role', 'prohibited'],
  },

  [OSSAErrorCode.OSSA_610]: {
    code: OSSAErrorCode.OSSA_610,
    severity: 'error',
    message: 'Invalid delegation tier',
    remediation: 'allowed_tiers must contain valid tier values',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-610',
    tags: ['separation-of-duties', 'delegation', 'tier'],
  },

  [OSSAErrorCode.OSSA_611]: {
    code: OSSAErrorCode.OSSA_611,
    severity: 'error',
    message: 'Delegation to higher tier',
    remediation:
      'Cannot delegate to tier_4_policy. Tier 4 cannot be delegated.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-611',
    tags: ['separation-of-duties', 'delegation'],
  },

  [OSSAErrorCode.OSSA_612]: {
    code: OSSAErrorCode.OSSA_612,
    severity: 'error',
    message: 'Missing delegation token',
    remediation: 'Add delegation_token to delegation.requires when enabled',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-612',
    tags: ['separation-of-duties', 'delegation'],
  },

  [OSSAErrorCode.OSSA_613]: {
    code: OSSAErrorCode.OSSA_613,
    severity: 'error',
    message: 'Self-delegation prohibited',
    remediation: 'Agent cannot delegate to itself. Remove self-reference.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-613',
    tags: ['separation-of-duties', 'delegation'],
  },

  [OSSAErrorCode.OSSA_614]: {
    code: OSSAErrorCode.OSSA_614,
    severity: 'error',
    message: 'Conflicting roles assigned',
    remediation:
      'Multiple roles with conflicts detected. Agent can only have one role.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-614',
    tags: ['separation-of-duties', 'role', 'conflict'],
  },

  // Revolutionary Features (700-799)
  [OSSAErrorCode.OSSA_700]: {
    code: OSSAErrorCode.OSSA_700,
    severity: 'warning',
    message: 'Feature requires DID',
    remediation:
      'Add decentralized_identity.did to use this revolutionary feature',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-700',
    tags: ['revolutionary', 'identity', 'did'],
  },

  [OSSAErrorCode.OSSA_701]: {
    code: OSSAErrorCode.OSSA_701,
    severity: 'error',
    message: 'Incompatible feature combination',
    remediation:
      'Feature combination not supported. Check compatibility matrix.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-701',
    tags: ['revolutionary', 'compatibility'],
  },

  [OSSAErrorCode.OSSA_702]: {
    code: OSSAErrorCode.OSSA_702,
    severity: 'error',
    message: 'Missing prerequisite feature',
    remediation: 'This feature requires another feature to be configured first',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-702',
    tags: ['revolutionary', 'prerequisites'],
  },

  [OSSAErrorCode.OSSA_703]: {
    code: OSSAErrorCode.OSSA_703,
    severity: 'error',
    message: 'Feature tier restriction',
    remediation: 'This feature requires minimum access tier. Increase tier.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-703',
    tags: ['revolutionary', 'tier'],
  },

  [OSSAErrorCode.OSSA_704]: {
    code: OSSAErrorCode.OSSA_704,
    severity: 'warning',
    message: 'Team membership without lifecycle',
    remediation: 'Add lifecycle_stages when using team_membership',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-704',
    tags: ['revolutionary', 'team', 'lifecycle'],
  },

  [OSSAErrorCode.OSSA_705]: {
    code: OSSAErrorCode.OSSA_705,
    severity: 'error',
    message: 'Invalid team role',
    remediation: 'team_role must be valid role value',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-705',
    tags: ['revolutionary', 'team', 'role'],
  },

  [OSSAErrorCode.OSSA_706]: {
    code: OSSAErrorCode.OSSA_706,
    severity: 'error',
    message: 'Team hierarchy violation',
    remediation: 'reports_to must reference existing team member',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-706',
    tags: ['revolutionary', 'team', 'hierarchy'],
  },

  // Naming & Format (800-899)
  [OSSAErrorCode.OSSA_800]: {
    code: OSSAErrorCode.OSSA_800,
    severity: 'error',
    message: 'Invalid DNS-1123 format',
    remediation:
      'Name must use lowercase alphanumeric characters and hyphens only',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-800',
    examples: [
      {
        title: 'Invalid name format',
        invalid: '{ "name": "My_Agent_123" }',
        valid: '{ "name": "my-agent-123" }',
        explanation: 'Names must follow DNS-1123 subdomain format',
      },
    ],
    tags: ['naming', 'format', 'dns'],
  },

  [OSSAErrorCode.OSSA_801]: {
    code: OSSAErrorCode.OSSA_801,
    severity: 'error',
    message: 'Name too long',
    remediation: 'Name must be ≤ 253 characters',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-801',
    tags: ['naming', 'length'],
  },

  [OSSAErrorCode.OSSA_802]: {
    code: OSSAErrorCode.OSSA_802,
    severity: 'error',
    message: 'Name contains invalid characters',
    remediation:
      'Remove uppercase, underscores, and special characters. Use lowercase and hyphens.',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-802',
    tags: ['naming', 'characters'],
  },

  [OSSAErrorCode.OSSA_803]: {
    code: OSSAErrorCode.OSSA_803,
    severity: 'error',
    message: 'Invalid URL format',
    remediation: 'URL must be valid HTTP/HTTPS URL',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-803',
    tags: ['format', 'url'],
  },

  [OSSAErrorCode.OSSA_804]: {
    code: OSSAErrorCode.OSSA_804,
    severity: 'error',
    message: 'Invalid email format',
    remediation: 'Email must be valid email address format',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-804',
    tags: ['format', 'email'],
  },

  [OSSAErrorCode.OSSA_805]: {
    code: OSSAErrorCode.OSSA_805,
    severity: 'error',
    message: 'Invalid date format',
    remediation: 'Date must be ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-805',
    tags: ['format', 'date'],
  },

  [OSSAErrorCode.OSSA_806]: {
    code: OSSAErrorCode.OSSA_806,
    severity: 'error',
    message: 'Invalid version format',
    remediation: 'Version must follow semantic versioning (X.Y.Z)',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-806',
    tags: ['format', 'version'],
  },

  // Catalog & Publishing (900-999)
  [OSSAErrorCode.OSSA_900]: {
    code: OSSAErrorCode.OSSA_900,
    severity: 'warning',
    message: 'Published without documentation',
    remediation: 'Add catalog.documentation_url for better discoverability',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-900',
    tags: ['catalog', 'publishing', 'documentation'],
  },

  [OSSAErrorCode.OSSA_901]: {
    code: OSSAErrorCode.OSSA_901,
    severity: 'error',
    message: 'Invalid visibility value',
    remediation: 'visibility must be: public, private, organization',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-901',
    tags: ['catalog', 'visibility'],
  },

  [OSSAErrorCode.OSSA_902]: {
    code: OSSAErrorCode.OSSA_902,
    severity: 'info',
    message: 'Public agent without ratings',
    remediation: 'Encourage users to rate the agent',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-902',
    tags: ['catalog', 'ratings'],
  },

  [OSSAErrorCode.OSSA_903]: {
    code: OSSAErrorCode.OSSA_903,
    severity: 'warning',
    message: 'Missing license for public agent',
    remediation: 'Add license field to catalog for public agents',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-903',
    tags: ['catalog', 'license'],
  },

  [OSSAErrorCode.OSSA_904]: {
    code: OSSAErrorCode.OSSA_904,
    severity: 'error',
    message: 'Invalid rating value',
    remediation: 'Rating must be between 0.0 and 5.0',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-904',
    tags: ['catalog', 'ratings'],
  },

  [OSSAErrorCode.OSSA_905]: {
    code: OSSAErrorCode.OSSA_905,
    severity: 'warning',
    message: 'Missing catalog metadata',
    remediation: 'Add catalog metadata for agent discoverability',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-905',
    tags: ['catalog', 'metadata'],
  },

  [OSSAErrorCode.OSSA_906]: {
    code: OSSAErrorCode.OSSA_906,
    severity: 'error',
    message: 'Invalid maturity level',
    remediation: 'maturity must be: experimental, beta, stable, deprecated',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-906',
    tags: ['catalog', 'maturity'],
  },
};

/**
 * Get error details by code
 */
export function getErrorDetails(code: OSSAErrorCode): ErrorDetails | undefined {
  return ERROR_CATALOG[code];
}

/**
 * Search errors by tag
 */
export function searchErrorsByTag(tag: string): ErrorDetails[] {
  return Object.values(ERROR_CATALOG).filter(
    (error) => error.tags && error.tags.includes(tag)
  );
}

/**
 * Search errors by severity
 */
export function searchErrorsBySeverity(
  severity: 'error' | 'warning' | 'info'
): ErrorDetails[] {
  return Object.values(ERROR_CATALOG).filter(
    (error) => error.severity === severity
  );
}

/**
 * Get all error codes
 */
export function getAllErrorCodes(): OSSAErrorCode[] {
  return Object.values(OSSAErrorCode);
}

/**
 * Get error count by severity
 */
export function getErrorCountBySeverity(): Record<string, number> {
  const counts = { error: 0, warning: 0, info: 0 };
  Object.values(ERROR_CATALOG).forEach((error) => {
    counts[error.severity]++;
  });
  return counts;
}
