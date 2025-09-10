/**
 * Git Config Protection Service
 * Prevents AI bots from modifying git configuration
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export interface GitConfigProtection {
  originalUser: string;
  originalEmail: string;
  isProtected: boolean;
  timestamp: string;
}

export class GitConfigProtectionService {
  private readonly CONFIG_FILE = '.git/config.protected';
  private readonly AI_BOT_PATTERNS = [
    'Claude', 'claude', 'GPT', 'gpt', 'AI', 'ai', 'bot', 'assistant',
    'copilot', 'codewhisperer', 'tabnine', 'AI-Assistant'
  ];

  async protectGitConfig(): Promise<GitConfigProtection> {
    try {
      // Get current git configuration
      const { stdout: userName } = await execAsync('git config user.name');
      const { stdout: userEmail } = await execAsync('git config user.email');
      
      const protection: GitConfigProtection = {
        originalUser: userName.trim(),
        originalEmail: userEmail.trim(),
        isProtected: true,
        timestamp: new Date().toISOString()
      };

      // Save protection state
      writeFileSync(this.CONFIG_FILE, JSON.stringify(protection, null, 2));
      
      console.log('🛡️  Git config protection activated');
      console.log(`📍 Protected user: ${protection.originalUser}`);
      console.log(`📧 Protected email: ${protection.originalEmail}`);
      
      return protection;
    } catch (error: any) {
      throw new Error(`Failed to protect git config: ${error.message}`);
    }
  }

  async checkProtection(): Promise<GitConfigProtection | null> {
    if (!existsSync(this.CONFIG_FILE)) {
      return null;
    }

    try {
      const protection = JSON.parse(readFileSync(this.CONFIG_FILE, 'utf8'));
      return protection;
    } catch (error) {
      return null;
    }
  }

  async validateCurrentConfig(): Promise<{ valid: boolean; violations: string[] }> {
    const violations: string[] = [];
    
    try {
      const { stdout: currentUser } = await execAsync('git config user.name');
      const { stdout: currentEmail } = await execAsync('git config user.email');
      
      const user = currentUser.trim();
      const email = currentEmail.trim();
      
      // Check if current config looks like an AI bot
      const isAIUser = this.AI_BOT_PATTERNS.some(pattern => 
        user.toLowerCase().includes(pattern.toLowerCase())
      );
      
      const isAIEmail = this.AI_BOT_PATTERNS.some(pattern => 
        email.toLowerCase().includes(pattern.toLowerCase())
      );

      if (isAIUser) {
        violations.push(`Git user.name "${user}" appears to be an AI bot identifier`);
      }

      if (isAIEmail) {
        violations.push(`Git user.email "${email}" appears to be an AI bot identifier`);
      }

      // Check against protected config
      const protection = await this.checkProtection();
      if (protection) {
        if (user !== protection.originalUser) {
          violations.push(`Git user.name changed from protected value "${protection.originalUser}" to "${user}"`);
        }
        if (email !== protection.originalEmail) {
          violations.push(`Git user.email changed from protected value "${protection.originalEmail}" to "${email}"`);
        }
      }

      return {
        valid: violations.length === 0,
        violations
      };
    } catch (error: any) {
      violations.push(`Failed to validate git config: ${error.message}`);
      return { valid: false, violations };
    }
  }

  async restoreProtectedConfig(): Promise<void> {
    const protection = await this.checkProtection();
    
    if (!protection) {
      throw new Error('No protected configuration found');
    }

    try {
      await execAsync(`git config user.name "${protection.originalUser}"`);
      await execAsync(`git config user.email "${protection.originalEmail}"`);
      
      console.log('✅ Git configuration restored to protected values');
      console.log(`👤 User: ${protection.originalUser}`);
      console.log(`📧 Email: ${protection.originalEmail}`);
    } catch (error: any) {
      throw new Error(`Failed to restore git config: ${error.message}`);
    }
  }

  async blockAIConfigChanges(): Promise<{ blocked: boolean; reason: string }> {
    const validation = await this.validateCurrentConfig();
    
    if (!validation.valid) {
      // Attempt to restore if we have protected config
      const protection = await this.checkProtection();
      if (protection) {
        await this.restoreProtectedConfig();
        return {
          blocked: true,
          reason: `AI bot config change detected and reverted: ${validation.violations.join(', ')}`
        };
      } else {
        return {
          blocked: true,
          reason: `AI bot config detected: ${validation.violations.join(', ')}`
        };
      }
    }

    return {
      blocked: false,
      reason: 'Git configuration is valid'
    };
  }

  async installProtection(): Promise<void> {
    // Create the protection state
    await this.protectGitConfig();
    
    // Create a pre-commit hook to validate config
    const hookContent = `#!/bin/bash
# Git Config Protection Hook
# Prevents AI bots from changing git configuration

echo "🔍 Validating git configuration..."

# Get current config
CURRENT_USER=$(git config user.name 2>/dev/null || echo "unknown")
CURRENT_EMAIL=$(git config user.email 2>/dev/null || echo "unknown")

# AI bot patterns to detect
AI_PATTERNS="Claude|claude|GPT|gpt|AI|ai|bot|assistant|copilot|codewhisperer|tabnine|AI-Assistant"

# Check if current user/email contains AI patterns
if echo "$CURRENT_USER $CURRENT_EMAIL" | grep -iE "$AI_PATTERNS" > /dev/null; then
  echo "🚫 CRITICAL: AI bot git configuration detected!"
  echo "👤 User: $CURRENT_USER"
  echo "📧 Email: $CURRENT_EMAIL"
  echo ""
  echo "❌ This commit is BLOCKED - AI bots cannot modify git configuration"
  echo ""
  echo "If you are a human developer, please fix your git configuration:"
  echo "  git config user.name 'Your Name'"
  echo "  git config user.email 'your.email@domain.com'"
  echo ""
  echo "If you are Claude or another AI, STOP attempting to change git config!"
  exit 1
fi

echo "✅ Git configuration validated"
`;

    const hookPath = '.git/hooks/pre-commit-config-protection';
    writeFileSync(hookPath, hookContent, { mode: 0o755 });
    
    console.log('🛡️  Git config protection hook installed');
  }
}