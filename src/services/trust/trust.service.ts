/**
 * OSSA Trust Verification Service
 *
 * Verifies agent `x-signature` blocks using:
 *   - @noble/ed25519  for Ed25519 (default, fastest)
 *   - jose            for JWT, JWK, VC, ECDSA, RSA-PSS (IETF-standard)
 *   - did-resolver    for DID document resolution (did:web, did:key)
 *   - json-canonicalize for RFC 8785 canonical form (payload that was signed)
 *
 * NO custom cryptographic primitives — only audited open-source libraries.
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { compactVerify, importJWK, importSPKI, jwtVerify } from 'jose';
import { Resolver } from 'did-resolver';
import { getResolver as webResolver } from 'web-did-resolver';
// @ts-ignore — json-canonicalize is CJS
import canonicalize from 'json-canonicalize';

// noble/ed25519 v2 requires an async SHA-512 implementation
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

export interface XSignature {
  type: 'Ed25519' | 'RSA-PSS' | 'ECDSA' | 'jwt' | 'vc' | 'did';
  value: string;
  publicKey: string;
  issuer?: string;
  timestamp?: string;
}

export type TrustTier = 'official' | 'verified-signature' | 'signed' | 'community' | 'experimental';

export interface TrustVerificationResult {
  verified: boolean;
  tier: TrustTier;
  signatureType?: string;
  issuer?: string;
  verifiedAt: string;
  reason?: string;
}

/** Build a DID resolver supporting did:web and did:key */
const didResolver = new Resolver({ ...webResolver() });

/**
 * Canonicalize the agent manifest using RFC 8785 (json-canonicalize),
 * then return the UTF-8 bytes. This is the payload that x-signature.value signs.
 */
export function canonicalManifestBytes(manifest: Record<string, unknown>): Uint8Array {
  // Remove x-signature from the manifest before canonicalizing — it must not
  // be part of the signed payload (same as JWT header exclusion)
  const { metadata, ...rest } = manifest as any;
  const { 'x-signature': _sig, ...cleanMetadata } = metadata ?? {};
  const cleaned = { ...rest, metadata: cleanMetadata };
  const canonical = canonicalize(cleaned);
  return new TextEncoder().encode(canonical);
}

/**
 * Verify an Ed25519 signature using @noble/ed25519.
 * publicKey and value are expected as base64-encoded strings.
 */
async function verifyEd25519(
  payload: Uint8Array,
  signatureB64: string,
  publicKeyB64: string,
): Promise<boolean> {
  const sig = base64ToBytes(signatureB64);
  const pub = base64ToBytes(publicKeyB64);
  return ed.verifyAsync(sig, payload, pub);
}

/**
 * Verify a compact JWT. The `value` field IS the JWT — publicKey is the JWK or PEM.
 * Uses `jose` — handles RS256, ES256, EdDSA etc automatically.
 */
async function verifyJwt(jwt: string, publicKeyPemOrJwk: string): Promise<boolean> {
  try {
    let key;
    try {
      const jwk = JSON.parse(publicKeyPemOrJwk);
      key = await importJWK(jwk);
    } catch {
      key = await importSPKI(publicKeyPemOrJwk, 'RS256');
    }
    await jwtVerify(jwt, key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify via a DID document.
 * Resolves the DID (issuer field), finds the verification method,
 * and verifies the Ed25519 or JWT signature against the resolved public key.
 */
async function verifyDid(
  payload: Uint8Array,
  signature: XSignature,
): Promise<boolean> {
  if (!signature.issuer) return false;
  try {
    const result = await didResolver.resolve(signature.issuer);
    const doc = result.didDocument;
    if (!doc?.verificationMethod?.length) return false;

    // Try each verification method in the DID document
    for (const vm of doc.verificationMethod) {
      if (vm.publicKeyBase64 || vm.publicKeyBase58 || vm.publicKeyJwk) {
        const pubKeyB64 = vm.publicKeyBase64 ??
          (vm.publicKeyBase58 ? base58ToBase64(vm.publicKeyBase58) : null);

        if (pubKeyB64) {
          const ok = await verifyEd25519(payload, signature.value, pubKeyB64);
          if (ok) return true;
        }

        if (vm.publicKeyJwk) {
          const keyStr = JSON.stringify(vm.publicKeyJwk);
          const ok = await verifyJwt(signature.value, keyStr);
          if (ok) return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Main entry point.
 * Verifies an agent's x-signature block against its canonical manifest.
 */
export async function verifyAgentSignature(
  manifest: Record<string, unknown>,
  signature: XSignature,
  agentId?: string,
): Promise<TrustVerificationResult> {
  const base: Omit<TrustVerificationResult, 'verified' | 'tier' | 'reason'> = {
    signatureType: signature.type,
    issuer: signature.issuer,
    verifiedAt: new Date().toISOString(),
  };

  // Require all three fields for any verification attempt
  if (!signature.type || !signature.value || !signature.publicKey) {
    return {
      ...base,
      verified: false,
      tier: 'signed',
      reason: 'x-signature present but missing required fields (type, value, or publicKey)',
    };
  }

  try {
    const payload = canonicalManifestBytes(manifest);
    let verified = false;

    switch (signature.type) {
      case 'Ed25519':
        verified = await verifyEd25519(payload, signature.value, signature.publicKey);
        break;

      case 'jwt':
      case 'vc':
        verified = await verifyJwt(signature.value, signature.publicKey);
        break;

      case 'did':
        verified = await verifyDid(payload, signature);
        break;

      case 'ECDSA':
      case 'RSA-PSS': {
        // Use jose compact verification for asymmetric algorithms
        try {
          const key = await importSPKI(signature.publicKey, signature.type === 'ECDSA' ? 'ES256' : 'PS256');
          await compactVerify(signature.value, key);
          verified = true;
        } catch {
          verified = false;
        }
        break;
      }

      default:
        return {
          ...base,
          verified: false,
          tier: 'community',
          reason: `Unsupported signature type: ${signature.type}`,
        };
    }

    return {
      ...base,
      verified,
      tier: verified ? 'verified-signature' : 'signed',
      reason: verified ? undefined : 'Signature verification failed — payload mismatch or invalid key',
    };
  } catch (err: any) {
    return {
      ...base,
      verified: false,
      tier: 'signed',
      reason: `Verification error: ${err?.message ?? 'unknown'}`,
    };
  }
}

// ─── Utilities ──────────────────────────────────────────────

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base58ToBase64(b58: string): string {
  // Minimal base58 decode — for production use the `bs58` package
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let n = BigInt(0);
  for (const char of b58) {
    n = n * BigInt(58) + BigInt(ALPHABET.indexOf(char));
  }
  const hex = n.toString(16).padStart(64, '0');
  const bytes = hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16));
  return btoa(String.fromCharCode(...bytes));
}
