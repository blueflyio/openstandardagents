<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Validator;

/**
 * Safety Validator
 *
 * Validates inputs for PII, secrets, and other safety concerns
 */
class SafetyValidator
{
    public function __construct(
        private readonly array $safetyConfig
    ) {
    }

    public function validateInput(string $input): array
    {
        $issues = [];

        if ($this->safetyConfig['pii_detection'] ?? true) {
            if ($this->containsPII($input)) {
                $issues[] = 'Input may contain PII (emails, phone numbers, SSN)';
            }
        }

        if ($this->safetyConfig['secrets_detection'] ?? true) {
            if ($this->containsSecrets($input)) {
                $issues[] = 'Input may contain secrets (API keys, tokens, passwords)';
            }
        }

        return $issues;
    }

    private function containsPII(string $text): bool
    {
        // Email
        if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text)) {
            return true;
        }

        // Phone number
        if (preg_match('/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/', $text)) {
            return true;
        }

        // SSN
        if (preg_match('/\b\d{3}-\d{2}-\d{4}\b/', $text)) {
            return true;
        }

        return false;
    }

    private function containsSecrets(string $text): bool
    {
        $patterns = [
            '/sk-[a-zA-Z0-9]{48}/', // OpenAI API key
            '/sk-ant-[a-zA-Z0-9-]{95}/', // Anthropic API key
            '/AIza[0-9A-Za-z\\-_]{35}/', // Google API key
            '/ghp_[a-zA-Z0-9]{36}/', // GitHub token
            '/gho_[a-zA-Z0-9]{36}/', // GitHub OAuth token
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
            }
        }

        return false;
    }
}
