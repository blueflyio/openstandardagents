/**
 * OSSA v0.3.4 Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: spec/v0.3.4/ossa-0.3.4.schema.json
 *
 * Regenerate with: ossa generate zod
 */

import { z } from 'zod';

// Basic OSSA schema - manual generation fallback
// Accept v0.3.4 with optional prerelease suffix (e.g., -dev.1, -rc.1)
export const OssaApiVersionSchema = z
  .string()
  .regex(/^ossa\/v0\.3\.4(-[a-zA-Z0-9.-]+)?$/);

// Agent ID Card — Audit Trail Entry (v0.4.5+)
export const AuditTrailEntrySchema = z.object({
  seq: z.number().int().min(0),
  action: z.enum([
    'created',
    'capability-added',
    'capability-removed',
    'tool-added',
    'tool-removed',
    'version-bumped',
    'config-changed',
    'ownership-transferred',
    'access-tier-changed',
    'forked',
    'retired',
    'reactivated',
    'nickname-changed',
    'custom',
  ]),
  timestamp: z.string(),
  actor: z.string(),
  hash: z.string().regex(/^sha(256|384|512):[a-f0-9]+$/),
  prevHash: z
    .string()
    .regex(/^sha(256|384|512):[a-f0-9]+$/)
    .nullable()
    .optional(),
  details: z
    .object({
      field: z.string().optional(),
      oldValue: z.unknown().optional(),
      newValue: z.unknown().optional(),
      reason: z.string().optional(),
      commitHash: z.string().optional(),
    })
    .passthrough()
    .optional(),
  signature: z.string().optional(),
});

// Agent ID Card — Audit Trail (v0.4.5+)
export const AgentAuditTrailSchema = z.object({
  hashAlgorithm: z.enum(['sha256', 'sha384', 'sha512']).optional(),
  chainType: z.enum(['merkle', 'linear', 'signed']).optional(),
  genesisHash: z.string().optional(),
  entries: z.array(AuditTrailEntrySchema).optional(),
});

// Agent ID Card — Provenance (v0.4.5+)
export const AgentProvenanceSchema = z.object({
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  createdWith: z.string().optional(),
  lineage: z
    .array(
      z.object({
        ancestor: z.string(),
        relationship: z.enum([
          'forked-from',
          'cloned-from',
          'derived-from',
          'inspired-by',
          'upgraded-from',
        ]),
        timestamp: z.string(),
        commitHash: z.string().optional(),
      })
    )
    .optional(),
});

// Agent ID Card (v0.4.5+)
export const AgentIdCardSchema = z.object({
  nickname: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
    .optional(),
  displayName: z.string().max(128).optional(),
  avatar: z.string().url().optional(),
  registryId: z
    .string()
    .regex(/^ossa:\/\/[a-z0-9-]+\/[a-z0-9-]+(@[0-9]+\.[0-9]+\.[0-9]+)?$/)
    .optional(),
  fingerprint: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .optional(),
  birthHash: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .optional(),
  provenance: AgentProvenanceSchema.optional(),
  auditTrail: AgentAuditTrailSchema.optional(),
});

export const OssaMetadataSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  description: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
  annotations: z.record(z.string(), z.string()).optional(),
  idCard: AgentIdCardSchema.optional(),
});

export const OssaAgentSchema = z.object({
  apiVersion: OssaApiVersionSchema,
  kind: z.enum(['Agent', 'Task', 'Workflow', 'AgentRegistry']),
  metadata: OssaMetadataSchema,
  spec: z.record(z.string(), z.unknown()),
});

export type OssaAgent = z.infer<typeof OssaAgentSchema>;
export type OssaMetadata = z.infer<typeof OssaMetadataSchema>;
export type AgentIdCard = z.infer<typeof AgentIdCardSchema>;
export type AgentProvenance = z.infer<typeof AgentProvenanceSchema>;
export type AgentAuditTrail = z.infer<typeof AgentAuditTrailSchema>;
export type AuditTrailEntry = z.infer<typeof AuditTrailEntrySchema>;
