/**
 * Secure Credential Management System
 * OSSA v0.1.8 compliant credential storage with encryption and audit trail
 */

import { createCipher, createDecipher, randomBytes, scrypt, createHash } from 'crypto';
import { promisify } from 'util';
import {
  SecureCredential,
  CredentialMetadata,
  AccessLogEntry,
  RotationHistoryEntry,
  AuthenticationError
} from './types.js';

const scryptAsync = promisify(scrypt);

export interface CredentialStorage {
  get(id: string): Promise<SecureCredential | null>;
  set(id: string, credential: SecureCredential): Promise<void>;
  delete(id: string): Promise<void>;
  list(filters?: CredentialFilters): Promise<SecureCredential[]>;
  updateMetadata(id: string, metadata: Partial<CredentialMetadata>): Promise<void>;
}

export interface CredentialFilters {
  type?: SecureCredential['type'];
  owner?: string;
  environment?: string;
  tags?: string[];
  isActive?: boolean;
  expiringBefore?: Date;
}

export interface CredentialOptions {
  type: SecureCredential['type'];
  name: string;
  value: string;
  owner: string;
  environment: string;
  tags?: string[];
  expiresIn?: number; // seconds
  rotationEnabled?: boolean;
}

export interface EncryptionOptions {
  algorithm?: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
  keyDerivation?: {
    method: 'pbkdf2' | 'scrypt' | 'argon2';
    iterations?: number;
    cost?: number;
    blockSize?: number;
    parallelization?: number;
  };
}

export interface AccessContext {
  accessor: string;
  action: 'read' | 'write' | 'delete' | 'rotate';
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

// In-memory storage implementation (for demo purposes)
class MemoryCredentialStorage implements CredentialStorage {
  private storage: Map<string, SecureCredential> = new Map();

  async get(id: string): Promise<SecureCredential | null> {
    return this.storage.get(id) || null;
  }

  async set(id: string, credential: SecureCredential): Promise<void> {
    this.storage.set(id, credential);
  }

  async delete(id: string): Promise<void> {
    this.storage.delete(id);
  }

  async list(filters?: CredentialFilters): Promise<SecureCredential[]> {
    let credentials = Array.from(this.storage.values());

    if (filters) {
      if (filters.type) {
        credentials = credentials.filter(c => c.type === filters.type);
      }
      if (filters.owner) {
        credentials = credentials.filter(c => c.metadata.owner === filters.owner);
      }
      if (filters.environment) {
        credentials = credentials.filter(c => c.metadata.environment === filters.environment);
      }
      if (filters.tags && filters.tags.length > 0) {
        credentials = credentials.filter(c =>
          filters.tags!.some(tag => c.metadata.tags.includes(tag))
        );
      }
      if (filters.isActive !== undefined) {
        credentials = credentials.filter(c => c.isActive === filters.isActive);
      }
      if (filters.expiringBefore) {
        credentials = credentials.filter(c =>
          c.expiresAt && c.expiresAt <= filters.expiringBefore!
        );
      }
    }

    return credentials;
  }

  async updateMetadata(id: string, metadata: Partial<CredentialMetadata>): Promise<void> {
    const credential = this.storage.get(id);
    if (credential) {
      Object.assign(credential.metadata, metadata);
      credential.updatedAt = new Date();
    }
  }
}

export class SecureCredentialManager {
  private storage: CredentialStorage;
  private masterKey: Buffer;
  private encryptionOptions: Required<EncryptionOptions>;

  constructor(
    masterKey: string | Buffer,
    storage?: CredentialStorage,
    options?: EncryptionOptions
  ) {
    this.storage = storage || new MemoryCredentialStorage();
    this.masterKey = Buffer.isBuffer(masterKey) ? masterKey : Buffer.from(masterKey, 'utf8');
    this.encryptionOptions = {
      algorithm: options?.algorithm || 'aes-256-gcm',
      keyDerivation: {
        method: options?.keyDerivation?.method || 'scrypt',
        iterations: options?.keyDerivation?.iterations || 100000,
        cost: options?.keyDerivation?.cost || 16384,
        blockSize: options?.keyDerivation?.blockSize || 8,
        parallelization: options?.keyDerivation?.parallelization || 1
      }
    };

    this.validateMasterKey();
    this.startExpirationMonitoring();
  }

  /**
   * Store encrypted credential
   */
  async storeCredential(options: CredentialOptions, context: AccessContext): Promise<string> {
    const id = this.generateCredentialId();
    const now = new Date();
    const expiresAt = options.expiresIn ? new Date(now.getTime() + options.expiresIn * 1000) : undefined;

    // Encrypt the credential value
    const encryptionResult = await this.encryptValue(options.value);

    const credential: SecureCredential = {
      id,
      type: options.type,
      name: options.name,
      encryptedValue: encryptionResult.encrypted,
      salt: encryptionResult.salt,
      iv: encryptionResult.iv,
      algorithm: this.encryptionOptions.algorithm,
      keyDerivation: this.encryptionOptions.keyDerivation,
      metadata: {
        owner: options.owner,
        environment: options.environment,
        tags: options.tags || [],
        accessLog: [],
        rotationHistory: []
      },
      createdAt: now,
      updatedAt: now,
      expiresAt,
      isActive: true
    };

    // Log the creation
    await this.logAccess(credential, context);

    await this.storage.set(id, credential);

    return id;
  }

  /**
   * Retrieve and decrypt credential
   */
  async getCredential(id: string, context: AccessContext): Promise<string> {
    const credential = await this.storage.get(id);
    if (!credential) {
      throw new AuthenticationError('Credential not found', 'CREDENTIAL_NOT_FOUND', 404);
    }

    if (!credential.isActive) {
      throw new AuthenticationError('Credential is inactive', 'CREDENTIAL_INACTIVE', 403);
    }

    if (credential.expiresAt && credential.expiresAt < new Date()) {
      throw new AuthenticationError('Credential has expired', 'CREDENTIAL_EXPIRED', 403);
    }

    // Log the access
    await this.logAccess(credential, context);

    // Decrypt the value
    const decryptedValue = await this.decryptValue({
      encrypted: credential.encryptedValue,
      salt: credential.salt,
      iv: credential.iv,
      algorithm: credential.algorithm
    });

    return decryptedValue;
  }

  /**
   * Update credential value
   */
  async updateCredential(id: string, newValue: string, context: AccessContext): Promise<void> {
    const credential = await this.storage.get(id);
    if (!credential) {
      throw new AuthenticationError('Credential not found', 'CREDENTIAL_NOT_FOUND', 404);
    }

    if (!credential.isActive) {
      throw new AuthenticationError('Credential is inactive', 'CREDENTIAL_INACTIVE', 403);
    }

    // Store old value in rotation history
    credential.metadata.rotationHistory.push({
      timestamp: new Date(),
      oldKeyId: id,
      newKeyId: id, // Same ID, just new value
      reason: 'manual',
      initiator: context.accessor,
      success: true
    });

    // Encrypt new value
    const encryptionResult = await this.encryptValue(newValue);
    credential.encryptedValue = encryptionResult.encrypted;
    credential.salt = encryptionResult.salt;
    credential.iv = encryptionResult.iv;
    credential.updatedAt = new Date();

    // Log the update
    await this.logAccess(credential, context);

    await this.storage.set(id, credential);
  }

  /**
   * Rotate credential (create new version)
   */
  async rotateCredential(id: string, context: AccessContext): Promise<string> {
    const oldCredential = await this.storage.get(id);
    if (!oldCredential) {
      throw new AuthenticationError('Credential not found', 'CREDENTIAL_NOT_FOUND', 404);
    }

    // Create new credential with same metadata but new ID
    const newId = this.generateCredentialId();
    const now = new Date();

    // Decrypt old value to re-encrypt with new salt/IV
    const oldValue = await this.decryptValue({
      encrypted: oldCredential.encryptedValue,
      salt: oldCredential.salt,
      iv: oldCredential.iv,
      algorithm: oldCredential.algorithm
    });

    // Encrypt with new parameters
    const encryptionResult = await this.encryptValue(oldValue);

    const newCredential: SecureCredential = {
      ...oldCredential,
      id: newId,
      encryptedValue: encryptionResult.encrypted,
      salt: encryptionResult.salt,
      iv: encryptionResult.iv,
      updatedAt: now,
      metadata: {
        ...oldCredential.metadata,
        rotationHistory: [
          ...oldCredential.metadata.rotationHistory,
          {
            timestamp: now,
            oldKeyId: oldCredential.id,
            newKeyId: newId,
            reason: 'manual',
            initiator: context.accessor,
            success: true
          }
        ],
        accessLog: [] // Start fresh access log
      }
    };

    // Store new credential
    await this.storage.set(newId, newCredential);

    // Deactivate old credential
    oldCredential.isActive = false;
    oldCredential.updatedAt = now;
    await this.storage.set(oldCredential.id, oldCredential);

    // Log the rotation
    await this.logAccess(newCredential, { ...context, action: 'rotate' });

    return newId;
  }

  /**
   * Delete credential
   */
  async deleteCredential(id: string, context: AccessContext): Promise<void> {
    const credential = await this.storage.get(id);
    if (!credential) {
      throw new AuthenticationError('Credential not found', 'CREDENTIAL_NOT_FOUND', 404);
    }

    // Log the deletion
    await this.logAccess(credential, context);

    // In production, you might want to keep an audit trail instead of hard delete
    await this.storage.delete(id);
  }

  /**
   * List credentials with filtering
   */
  async listCredentials(filters?: CredentialFilters): Promise<Omit<SecureCredential, 'encryptedValue' | 'salt' | 'iv'>[]> {
    const credentials = await this.storage.list(filters);
    
    // Return credentials without sensitive data
    return credentials.map(({ encryptedValue, salt, iv, ...credential }) => credential);
  }

  /**
   * Get credential metadata
   */
  async getCredentialMetadata(id: string): Promise<CredentialMetadata | null> {
    const credential = await this.storage.get(id);
    return credential?.metadata || null;
  }

  /**
   * Check credential health (expiry, usage patterns, etc.)
   */
  async checkCredentialHealth(): Promise<{
    total: number;
    active: number;
    expired: number;
    expiringIn7Days: number;
    neverAccessed: number;
    highUsage: number;
  }> {
    const credentials = await this.storage.list({ isActive: true });
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: credentials.length,
      active: 0,
      expired: 0,
      expiringIn7Days: 0,
      neverAccessed: 0,
      highUsage: 0
    };

    for (const credential of credentials) {
      if (credential.isActive) {
        stats.active++;
      }

      if (credential.expiresAt) {
        if (credential.expiresAt < now) {
          stats.expired++;
        } else if (credential.expiresAt <= sevenDaysFromNow) {
          stats.expiringIn7Days++;
        }
      }

      if (credential.metadata.accessLog.length === 0) {
        stats.neverAccessed++;
      } else if (credential.metadata.accessLog.length > 1000) {
        stats.highUsage++;
      }
    }

    return stats;
  }

  /**
   * Generate secure credential ID
   */
  private generateCredentialId(): string {
    return `cred_${randomBytes(16).toString('hex')}`;
  }

  /**
   * Encrypt credential value
   */
  private async encryptValue(value: string): Promise<{
    encrypted: string;
    salt: string;
    iv: string;
  }> {
    const salt = randomBytes(32);
    const iv = randomBytes(16);

    // Derive encryption key
    const key = await this.deriveKey(salt);

    let encrypted: Buffer;
    
    if (this.encryptionOptions.algorithm === 'aes-256-gcm') {
      const cipher = require('crypto').createCipher('aes-256-gcm', key);
      cipher.setAAD(Buffer.from('OSSA-Credential'));
      
      encrypted = Buffer.concat([
        cipher.update(value, 'utf8'),
        cipher.final()
      ]);
      
      // For GCM mode, we should include the auth tag
      const authTag = cipher.getAuthTag();
      encrypted = Buffer.concat([encrypted, authTag]);
      
    } else {
      const cipher = require('crypto').createCipher(this.encryptionOptions.algorithm, key);
      cipher.update(iv);
      
      encrypted = Buffer.concat([
        cipher.update(value, 'utf8'),
        cipher.final()
      ]);
    }

    return {
      encrypted: encrypted.toString('hex'),
      salt: salt.toString('hex'),
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt credential value
   */
  private async decryptValue(data: {
    encrypted: string;
    salt: string;
    iv: string;
    algorithm: string;
  }): Promise<string> {
    const salt = Buffer.from(data.salt, 'hex');
    const iv = Buffer.from(data.iv, 'hex');
    const encrypted = Buffer.from(data.encrypted, 'hex');

    // Derive decryption key
    const key = await this.deriveKey(salt);

    let decrypted: Buffer;

    if (data.algorithm === 'aes-256-gcm') {
      // For GCM mode, extract auth tag
      const authTagLength = 16;
      const authTag = encrypted.slice(-authTagLength);
      const ciphertext = encrypted.slice(0, -authTagLength);
      
      const decipher = require('crypto').createDecipher('aes-256-gcm', key);
      decipher.setAAD(Buffer.from('OSSA-Credential'));
      decipher.setAuthTag(authTag);
      
      decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]);
      
    } else {
      const decipher = require('crypto').createDecipher(data.algorithm, key);
      decipher.update(iv);
      
      decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
    }

    return decrypted.toString('utf8');
  }

  /**
   * Derive encryption key from master key and salt
   */
  private async deriveKey(salt: Buffer): Promise<Buffer> {
    const keyDerivation = this.encryptionOptions.keyDerivation;

    switch (keyDerivation.method) {
      case 'scrypt':
        return scryptAsync(this.masterKey, salt, 32, {
          cost: keyDerivation.cost,
          blockSize: keyDerivation.blockSize,
          parallelization: keyDerivation.parallelization
        }) as Buffer;

      case 'pbkdf2':
        return new Promise((resolve, reject) => {
          require('crypto').pbkdf2(
            this.masterKey, 
            salt, 
            keyDerivation.iterations,
            32,
            'sha256',
            (err: Error | null, derivedKey: Buffer) => {
              if (err) reject(err);
              else resolve(derivedKey);
            }
          );
        });

      case 'argon2':
        // Note: argon2 requires additional dependency
        // For now, fall back to scrypt
        return scryptAsync(this.masterKey, salt, 32, {
          cost: keyDerivation.cost,
          blockSize: keyDerivation.blockSize,
          parallelization: keyDerivation.parallelization
        }) as Buffer;

      default:
        throw new Error(`Unsupported key derivation method: ${keyDerivation.method}`);
    }
  }

  /**
   * Log credential access
   */
  private async logAccess(credential: SecureCredential, context: AccessContext): Promise<void> {
    const logEntry: AccessLogEntry = {
      timestamp: new Date(),
      accessor: context.accessor,
      action: context.action,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      success: true,
      reason: context.reason
    };

    credential.metadata.accessLog.push(logEntry);

    // Limit access log size (keep only last 1000 entries)
    if (credential.metadata.accessLog.length > 1000) {
      credential.metadata.accessLog = credential.metadata.accessLog.slice(-1000);
    }

    await this.storage.updateMetadata(credential.id, credential.metadata);
  }

  /**
   * Validate master key strength
   */
  private validateMasterKey(): void {
    if (this.masterKey.length < 32) {
      throw new Error('Master key must be at least 32 bytes long');
    }

    // Calculate entropy (simplified check)
    const uniqueBytes = new Set(this.masterKey).size;
    const entropy = uniqueBytes / 256;
    
    if (entropy < 0.5) {
      console.warn('Master key has low entropy - consider using a stronger key');
    }
  }

  /**
   * Start monitoring for expired credentials
   */
  private startExpirationMonitoring(): void {
    // Check for expired credentials every hour
    setInterval(async () => {
      try {
        const expiredCredentials = await this.storage.list({
          isActive: true,
          expiringBefore: new Date()
        });

        for (const credential of expiredCredentials) {
          credential.isActive = false;
          credential.updatedAt = new Date();
          await this.storage.set(credential.id, credential);
          
          console.warn(`Credential ${credential.id} (${credential.name}) has expired and been deactivated`);
        }

        // Also warn about credentials expiring in 7 days
        const soonExpiring = await this.storage.list({
          isActive: true,
          expiringBefore: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        for (const credential of soonExpiring) {
          console.info(`Credential ${credential.id} (${credential.name}) expires on ${credential.expiresAt}`);
        }

      } catch (error) {
        console.error('Error during credential expiration check:', error);
      }
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Export credential metadata for backup (without sensitive data)
   */
  async exportMetadata(): Promise<Omit<SecureCredential, 'encryptedValue' | 'salt' | 'iv'>[]> {
    return this.listCredentials();
  }

  /**
   * Generate credential health report
   */
  async generateHealthReport(): Promise<{
    summary: any;
    credentials: Array<{
      id: string;
      name: string;
      status: 'healthy' | 'expired' | 'expiring' | 'unused' | 'overused';
      recommendations: string[];
    }>;
  }> {
    const summary = await this.checkCredentialHealth();
    const credentials = await this.storage.list();
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const credentialReports = credentials.map(credential => {
      const recommendations: string[] = [];
      let status: 'healthy' | 'expired' | 'expiring' | 'unused' | 'overused' = 'healthy';

      // Check expiration
      if (credential.expiresAt) {
        if (credential.expiresAt < now) {
          status = 'expired';
          recommendations.push('Credential has expired and should be renewed or removed');
        } else if (credential.expiresAt <= sevenDaysFromNow) {
          status = 'expiring';
          recommendations.push('Credential expires soon - consider rotating or extending');
        }
      }

      // Check usage patterns
      if (credential.metadata.accessLog.length === 0) {
        if (status === 'healthy') status = 'unused';
        recommendations.push('Credential has never been accessed - consider removing if not needed');
      } else if (credential.metadata.accessLog.length > 1000) {
        if (status === 'healthy') status = 'overused';
        recommendations.push('High usage detected - consider implementing rate limiting');
      }

      // Check rotation history
      if (credential.metadata.rotationHistory.length === 0) {
        const daysSinceCreated = (now.getTime() - credential.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated > 90) {
          recommendations.push('Credential is over 90 days old - consider rotating for security');
        }
      }

      return {
        id: credential.id,
        name: credential.name,
        status,
        recommendations
      };
    });

    return {
      summary,
      credentials: credentialReports
    };
  }
}