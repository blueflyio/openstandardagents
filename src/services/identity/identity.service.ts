import { generateKeyPairSync } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface IdentityResult {
  publicKey: string;
  algorithm: string;
  privateKeyPath: string;
}

export class IdentityService {
  /**
   * Generates a secure Ed25519 cryptographic keypair
   */
  static generateIdentity(): {
    privateKey: string;
    publicKey: string;
    algorithm: string;
  } {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { privateKey, publicKey, algorithm: 'ed25519' };
  }

  /**
   * Provisions a new identity explicitly for a scaffolded agent environment,
   * storing the private counterpart securely.
   */
  static provisionIdentityForAgent(agentDir: string): IdentityResult {
    const keysDir = path.join(agentDir, '.keys');
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
    }

    const { privateKey, publicKey, algorithm } = this.generateIdentity();
    const privateKeyPath = path.join(keysDir, 'private.pem');

    // Write private key with secure file permissions
    fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });

    // Ensure the folder ignores all contents (protecting private keys from git leakage)
    const gitignorePath = path.join(keysDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, '*\n!.gitignore\n');
    }

    return { publicKey, algorithm, privateKeyPath };
  }
}
