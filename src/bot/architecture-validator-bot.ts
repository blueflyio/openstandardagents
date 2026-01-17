#!/usr/bin/env tsx
export class ArchitectureValidatorBot {
  async validatePatterns(
    code: string | null | undefined
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (code == null || typeof code !== 'string') {
      issues.push('Invalid input: code parameter must be a non-null string');
      return { valid: false, issues };
    }

    if (code.includes('Drupal::service(')) {
      issues.push(
        'Direct Drupal service access detected - use dependency injection'
      );
    }

    return { valid: issues.length === 0, issues };
  }
}
