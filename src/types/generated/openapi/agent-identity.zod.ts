/**
 * OSSA Agent Identity & Authentication API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: /Users/flux423/Sites/LLM/OssA/openstandardagents/openapi/agent-identity.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:08:30.942Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const agentIdentitySchema = z.unknown();

export type AgentIdentity = z.infer<typeof agentIdentitySchema>;

export const authenticationRequestSchema = z.unknown();

export type AuthenticationRequest = z.infer<typeof authenticationRequestSchema>;

export const tokenResponseSchema = z.unknown();

export type TokenResponse = z.infer<typeof tokenResponseSchema>;

export const securityContextSchema = z.unknown();

export type SecurityContext = z.infer<typeof securityContextSchema>;

export const tokenRevocationRequestSchema = z.unknown();

export type TokenRevocationRequest = z.infer<typeof tokenRevocationRequestSchema>;

export const tokenRevocationResponseSchema = z.unknown();

export type TokenRevocationResponse = z.infer<typeof tokenRevocationResponseSchema>;

/**
 * Standard error response
 */
export const errorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  trace_id: z.string().optional(),
  timestamp: z.string().datetime().optional()
});

export type Error = z.infer<typeof errorSchema>;
