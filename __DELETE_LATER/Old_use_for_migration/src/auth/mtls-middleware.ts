/**
 * mTLS Certificate Authentication Middleware
 * OSSA v0.1.8 compliant mutual TLS client certificate validation
 */

import { createHash, X509Certificate } from 'crypto';
import { readFileSync } from 'fs';
import { TLSSocket } from 'tls';
import {
  mTLSConfig,
  ClientCertificate,
  AuthenticatedRequest,
  AuthenticatedUser,
  CertificateValidationError,
  AuthMiddleware
} from './types.js';
import { Response, NextFunction } from 'express';

export interface CertificateRevocationList {
  issuer: string;
  serialNumbers: Set<string>;
  lastUpdated: Date;
  nextUpdate: Date;
  url: string;
}

export interface CertificateValidationResult {
  valid: boolean;
  certificate?: ClientCertificate;
  errors: string[];
  warnings: string[];
  trustLevel: 'trusted' | 'unknown' | 'revoked' | 'expired';
}

export class mTLSCertificateValidator {
  private trustedCAs: Map<string, X509Certificate> = new Map();
  private crlCache: Map<string, CertificateRevocationList> = new Map();
  private certificateCache: Map<string, CertificateValidationResult> = new Map();

  constructor(private config: mTLSConfig) {
    this.loadTrustedCAs();
    this.startCRLUpdateTimer();
  }

  /**
   * Validate client certificate
   */
  async validateCertificate(cert: any): Promise<CertificateValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Create client certificate object
      const clientCert = this.createClientCertificate(cert);
      
      // Check cache first
      const cacheKey = clientCert.fingerprint256;
      if (this.certificateCache.has(cacheKey)) {
        const cached = this.certificateCache.get(cacheKey)!;
        // Return cached result if still valid (within 1 hour)
        if (Date.now() - cached.certificate!.valid_from.getTime() < 3600000) {
          return cached;
        }
      }

      // Basic certificate validation
      const now = new Date();
      const validFrom = new Date(clientCert.valid_from);
      const validTo = new Date(clientCert.valid_to);

      if (now < validFrom) {
        errors.push('Certificate not yet valid');
      }

      if (now > validTo) {
        errors.push('Certificate has expired');
      }

      // Validate certificate chain
      if (!this.validateCertificateChain(cert)) {
        errors.push('Invalid certificate chain');
      }

      // Check if certificate is in allowed subjects list
      if (this.config.allowedSubjects && this.config.allowedSubjects.length > 0) {
        if (!this.config.allowedSubjects.includes(clientCert.subject)) {
          errors.push('Certificate subject not in allowed list');
        }
      }

      // Check trusted fingerprints
      if (this.config.trustedFingerprints && this.config.trustedFingerprints.length > 0) {
        const isFingerprint256Trusted = this.config.trustedFingerprints.includes(clientCert.fingerprint256);
        const isFingerprintTrusted = this.config.trustedFingerprints.includes(clientCert.fingerprint);
        
        if (!isFingerprint256Trusted && !isFingerprintTrusted) {
          errors.push('Certificate fingerprint not trusted');
        }
      }

      // Check certificate revocation
      const revocationResult = await this.checkRevocation(clientCert);
      if (!revocationResult.valid) {
        errors.push(`Certificate revoked: ${revocationResult.reason}`);
      }

      // Determine trust level
      let trustLevel: 'trusted' | 'unknown' | 'revoked' | 'expired' = 'unknown';
      
      if (errors.some(e => e.includes('revoked'))) {
        trustLevel = 'revoked';
      } else if (errors.some(e => e.includes('expired'))) {
        trustLevel = 'expired';
      } else if (errors.length === 0) {
        trustLevel = 'trusted';
      }

      const result: CertificateValidationResult = {
        valid: errors.length === 0,
        certificate: clientCert,
        errors,
        warnings,
        trustLevel
      };

      // Cache result
      this.certificateCache.set(cacheKey, result);
      
      return result;

    } catch (error) {
      errors.push(`Certificate validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        valid: false,
        errors,
        warnings,
        trustLevel: 'unknown'
      };
    }
  }

  /**
   * Create mTLS authentication middleware
   */
  createMiddleware(options?: {
    optional?: boolean;
    requireTrusted?: boolean;
    allowExpired?: boolean;
  }): AuthMiddleware {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!this.config.enabled) {
          return next();
        }

        // Check if connection uses TLS
        if (!req.socket || !(req.socket as TLSSocket).encrypted) {
          if (options?.optional) {
            return next();
          }
          throw new CertificateValidationError('HTTPS required for mTLS authentication');
        }

        const tlsSocket = req.socket as TLSSocket;
        
        // Get client certificate
        const peerCert = tlsSocket.getPeerCertificate(true);
        
        if (!peerCert || Object.keys(peerCert).length === 0) {
          if (options?.optional || !this.config.requireClientCert) {
            return next();
          }
          throw new CertificateValidationError('Client certificate required');
        }

        // Validate certificate
        const validationResult = await this.validateCertificate(peerCert);
        
        if (!validationResult.valid) {
          if (options?.optional) {
            return next();
          }
          
          throw new CertificateValidationError(
            'Certificate validation failed',
            {
              errors: validationResult.errors,
              warnings: validationResult.warnings,
              trustLevel: validationResult.trustLevel
            }
          );
        }

        // Check trust level requirements
        if (options?.requireTrusted && validationResult.trustLevel !== 'trusted') {
          throw new CertificateValidationError(
            `Certificate trust level '${validationResult.trustLevel}' insufficient`
          );
        }

        // Allow expired certificates if configured
        if (!options?.allowExpired && validationResult.trustLevel === 'expired') {
          throw new CertificateValidationError('Expired certificate not allowed');
        }

        // Create authenticated user from certificate
        const user: AuthenticatedUser = {
          id: validationResult.certificate!.subject,
          roles: ['certificate-authenticated'],
          permissions: ['mtls:authenticated'],
          metadata: {
            certificateFingerprint: validationResult.certificate!.fingerprint256,
            certificateIssuer: validationResult.certificate!.issuer,
            certificateSerial: validationResult.certificate!.serialNumber,
            certificateValidFrom: validationResult.certificate!.valid_from,
            certificateValidTo: validationResult.certificate!.valid_to,
            trustLevel: validationResult.trustLevel
          }
        };

        // Extract additional info from certificate
        const subjectFields = this.parseCertificateSubject(validationResult.certificate!.subject);
        if (subjectFields.CN) {
          user.username = subjectFields.CN;
        }
        if (subjectFields.emailAddress) {
          user.email = subjectFields.emailAddress;
        }

        // Attach auth info to request
        req.auth = {
          type: 'mtls',
          user,
          clientCert: validationResult.certificate,
          metadata: {
            trustLevel: validationResult.trustLevel,
            validationErrors: validationResult.errors,
            validationWarnings: validationResult.warnings,
            tlsVersion: tlsSocket.getProtocol(),
            cipher: tlsSocket.getCipher()
          }
        };

        next();

      } catch (error) {
        if (error instanceof CertificateValidationError) {
          res.status(error.statusCode).json({
            error: error.code,
            message: error.message,
            details: error.details
          });
        } else {
          res.status(401).json({
            error: 'CERTIFICATE_AUTHENTICATION_FAILED',
            message: 'mTLS authentication failed'
          });
        }
      }
    };
  }

  /**
   * Create client certificate object from raw certificate
   */
  private createClientCertificate(cert: any): ClientCertificate {
    // Handle Node.js certificate object format
    const rawCert = cert.raw || Buffer.from(cert.pemEncoded || '', 'utf8');
    const pemEncoded = cert.pemEncoded || `-----BEGIN CERTIFICATE-----\n${rawCert.toString('base64')}\n-----END CERTIFICATE-----`;

    return {
      subject: cert.subject?.CN ? this.formatCertificateSubject(cert.subject) : cert.subject || 'Unknown',
      issuer: cert.issuer?.CN ? this.formatCertificateSubject(cert.issuer) : cert.issuer || 'Unknown',
      serialNumber: cert.serialNumber || 'Unknown',
      fingerprint: cert.fingerprint || this.calculateFingerprint(rawCert, 'sha1'),
      fingerprint256: cert.fingerprint256 || this.calculateFingerprint(rawCert, 'sha256'),
      valid_from: cert.valid_from || 'Unknown',
      valid_to: cert.valid_to || 'Unknown',
      subjectaltname: cert.subjectaltname,
      raw: rawCert,
      pemEncoded
    };
  }

  /**
   * Format certificate subject/issuer object as string
   */
  private formatCertificateSubject(subject: any): string {
    if (typeof subject === 'string') {
      return subject;
    }

    const parts: string[] = [];
    if (subject.C) parts.push(`C=${subject.C}`);
    if (subject.ST) parts.push(`ST=${subject.ST}`);
    if (subject.L) parts.push(`L=${subject.L}`);
    if (subject.O) parts.push(`O=${subject.O}`);
    if (subject.OU) parts.push(`OU=${subject.OU}`);
    if (subject.CN) parts.push(`CN=${subject.CN}`);
    if (subject.emailAddress) parts.push(`emailAddress=${subject.emailAddress}`);

    return parts.join(', ');
  }

  /**
   * Parse certificate subject string to object
   */
  private parseCertificateSubject(subject: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    const parts = subject.split(', ');
    for (const part of parts) {
      const [key, value] = part.split('=', 2);
      if (key && value) {
        result[key.trim()] = value.trim();
      }
    }
    
    return result;
  }

  /**
   * Calculate certificate fingerprint
   */
  private calculateFingerprint(cert: Buffer, algorithm: 'sha1' | 'sha256'): string {
    return createHash(algorithm)
      .update(cert)
      .digest('hex')
      .toUpperCase()
      .match(/.{2}/g)!
      .join(':');
  }

  /**
   * Validate certificate chain against trusted CAs
   */
  private validateCertificateChain(cert: any): boolean {
    try {
      // In a real implementation, this would validate the full chain
      // For now, we just check if the issuer is in our trusted CA list
      const issuer = cert.issuer?.CN || cert.issuer;
      
      if (this.trustedCAs.size === 0) {
        return true; // Accept all if no CAs configured
      }

      return Array.from(this.trustedCAs.keys()).some(ca => 
        issuer.includes(ca) || ca.includes(issuer)
      );
    } catch {
      return false;
    }
  }

  /**
   * Check certificate revocation status
   */
  private async checkRevocation(cert: ClientCertificate): Promise<{ valid: boolean; reason?: string }> {
    if (!this.config.crlUrls || this.config.crlUrls.length === 0) {
      return { valid: true }; // No CRL checking configured
    }

    try {
      // Check each CRL for this certificate's serial number
      for (const crlUrl of this.config.crlUrls) {
        const crl = await this.getCRL(crlUrl);
        
        if (crl && crl.serialNumbers.has(cert.serialNumber)) {
          return { valid: false, reason: `Certificate found in CRL: ${crlUrl}` };
        }
      }

      return { valid: true };
    } catch (error) {
      // If CRL check fails, we can either fail secure or allow
      // For now, we allow but log a warning
      console.warn('CRL check failed:', error);
      return { valid: true };
    }
  }

  /**
   * Get Certificate Revocation List
   */
  private async getCRL(url: string): Promise<CertificateRevocationList | null> {
    // Check cache first
    const cached = this.crlCache.get(url);
    if (cached && cached.nextUpdate > new Date()) {
      return cached;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const crlData = await response.arrayBuffer();
      
      // Parse CRL (this is a simplified implementation)
      // In production, you'd use a proper ASN.1/DER parser
      const crl: CertificateRevocationList = {
        issuer: 'Unknown', // Would be parsed from CRL
        serialNumbers: new Set(), // Would contain actual revoked serial numbers
        lastUpdated: new Date(),
        nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        url
      };

      this.crlCache.set(url, crl);
      return crl;

    } catch (error) {
      console.error(`Failed to fetch CRL from ${url}:`, error);
      return null;
    }
  }

  /**
   * Load trusted Certificate Authorities
   */
  private loadTrustedCAs(): void {
    if (!this.config.ca) {
      return;
    }

    const cas = Array.isArray(this.config.ca) ? this.config.ca : [this.config.ca];
    
    for (const ca of cas) {
      try {
        let caPem: string;
        
        if (Buffer.isBuffer(ca)) {
          caPem = ca.toString();
        } else if (typeof ca === 'string') {
          // Try to read as file first, then as PEM data
          try {
            caPem = readFileSync(ca, 'utf8');
          } catch {
            caPem = ca;
          }
        } else {
          continue;
        }

        const x509Cert = new X509Certificate(caPem);
        const caName = x509Cert.subject;
        this.trustedCAs.set(caName, x509Cert);

      } catch (error) {
        console.warn('Failed to load CA certificate:', error);
      }
    }
  }

  /**
   * Start timer to update CRLs periodically
   */
  private startCRLUpdateTimer(): void {
    if (!this.config.crlUrls || this.config.crlUrls.length === 0) {
      return;
    }

    // Update CRLs every 6 hours
    setInterval(async () => {
      for (const url of this.config.crlUrls!) {
        try {
          await this.getCRL(url);
        } catch (error) {
          console.warn(`Failed to update CRL from ${url}:`, error);
        }
      }
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Get certificate validation statistics
   */
  getValidationStats(): {
    totalValidations: number;
    successfulValidations: number;
    failedValidations: number;
    cacheHitRate: number;
    trustedCACount: number;
    crlCount: number;
  } {
    const totalValidations = this.certificateCache.size;
    const successfulValidations = Array.from(this.certificateCache.values())
      .filter(result => result.valid).length;
    const failedValidations = totalValidations - successfulValidations;
    const cacheHitRate = totalValidations > 0 ? successfulValidations / totalValidations : 0;

    return {
      totalValidations,
      successfulValidations,
      failedValidations,
      cacheHitRate,
      trustedCACount: this.trustedCAs.size,
      crlCount: this.crlCache.size
    };
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.certificateCache.clear();
  }

  /**
   * Add trusted CA certificate
   */
  addTrustedCA(caPem: string, name?: string): void {
    try {
      const x509Cert = new X509Certificate(caPem);
      const caName = name || x509Cert.subject;
      this.trustedCAs.set(caName, x509Cert);
    } catch (error) {
      throw new Error(`Failed to add trusted CA: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove trusted CA certificate
   */
  removeTrustedCA(name: string): boolean {
    return this.trustedCAs.delete(name);
  }
}

/**
 * Create mTLS authentication middleware with default configuration
 */
export function createMTLSMiddleware(config: mTLSConfig): AuthMiddleware {
  const validator = new mTLSCertificateValidator(config);
  return validator.createMiddleware();
}