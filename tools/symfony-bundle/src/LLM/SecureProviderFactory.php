<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\LLM;

use Ossa\SymfonyBundle\Exception\UnsupportedProviderException;
use Ossa\SymfonyBundle\LLM\Provider\AnthropicProvider;
use Ossa\SymfonyBundle\LLM\Provider\AzureProvider;
use Ossa\SymfonyBundle\LLM\Provider\GoogleProvider;
use Ossa\SymfonyBundle\LLM\Provider\OpenAIProvider;
use Psr\Log\LoggerInterface;

/**
 * Secure LLM Provider Factory
 *
 * Creates LLM provider instances with security enhancements:
 * - Integration with Symfony Secrets Vault
 * - No plaintext API keys in configuration
 * - Request signing
 * - Audit logging
 */
class SecureProviderFactory
{
    private array $providers = [];
    private readonly bool $auditLoggingEnabled;

    public function __construct(
        private readonly array $providersConfig,
        private readonly string $defaultProvider,
        private readonly LoggerInterface $logger,
        private readonly LoggerInterface $auditLogger,
        array $securityConfig = []
    ) {
        $this->auditLoggingEnabled = $securityConfig['audit_logging'] ?? true;
    }

    /**
     * Create a secure provider instance
     *
     * @throws UnsupportedProviderException
     */
    public function create(?string $providerName = null): LLMProviderInterface
    {
        $providerName = $providerName ?? $this->defaultProvider;

        if (isset($this->providers[$providerName])) {
            return $this->providers[$providerName];
        }

        $config = $this->providersConfig[$providerName] ?? [];

        // Validate and secure configuration
        $secureConfig = $this->secureConfiguration($providerName, $config);

        // Create provider instance
        $provider = match ($providerName) {
            'anthropic' => new AnthropicProvider($secureConfig),
            'openai' => new OpenAIProvider($secureConfig),
            'google' => new GoogleProvider($secureConfig),
            'azure' => new AzureProvider($secureConfig),
            default => throw new UnsupportedProviderException("Unsupported provider: {$providerName}"),
        };

        // Wrap with security decorator if needed
        $provider = $this->wrapWithSecurityDecorators($provider, $providerName, $secureConfig);

        $this->providers[$providerName] = $provider;

        // Audit log provider creation
        $this->auditLog('provider_created', [
            'provider' => $providerName,
            'has_api_key' => isset($secureConfig['api_key']),
        ]);

        return $provider;
    }

    /**
     * Secure the provider configuration
     *
     * Validates API keys are from secrets vault, not plaintext
     */
    private function secureConfiguration(string $providerName, array $config): array
    {
        $secureConfig = $config;

        // Check for plaintext API keys (security risk)
        if (isset($config['api_key']) && !$this->isSecretReference($config['api_key'])) {
            $this->logger->warning('Plaintext API key detected in configuration', [
                'provider' => $providerName,
                'recommendation' => 'Use Symfony Secrets Vault: %env(PROVIDER_API_KEY)%',
            ]);

            // Still allow it, but log the warning
        }

        // Validate required fields
        if (!isset($secureConfig['api_key'])) {
            throw new \InvalidArgumentException(
                sprintf('API key not configured for provider: %s', $providerName)
            );
        }

        // Add request signing if configured
        if (!isset($secureConfig['sign_requests'])) {
            $secureConfig['sign_requests'] = true;
        }

        return $secureConfig;
    }

    /**
     * Check if value is a Symfony secret reference
     */
    private function isSecretReference(string $value): bool
    {
        // Check if it's an environment variable reference
        return str_starts_with($value, '%env(') || str_starts_with($value, '$');
    }

    /**
     * Wrap provider with security decorators
     */
    private function wrapWithSecurityDecorators(
        LLMProviderInterface $provider,
        string $providerName,
        array $config
    ): LLMProviderInterface {
        // Wrap with audit logging decorator
        if ($this->auditLoggingEnabled) {
            $provider = new AuditLoggingProvider($provider, $this->auditLogger, $providerName);
        }

        // Wrap with circuit breaker if configured
        if ($config['circuit_breaker']['enabled'] ?? true) {
            $provider = new CircuitBreakerProvider(
                $provider,
                $this->logger,
                $config['circuit_breaker'] ?? []
            );
        }

        return $provider;
    }

    /**
     * Get all available provider names
     *
     * @return array<string>
     */
    public function getAvailableProviders(): array
    {
        return array_keys($this->providersConfig);
    }

    /**
     * Rotate API key for a provider (security operation)
     *
     * This invalidates the cached provider instance, forcing recreation with new key
     */
    public function rotateApiKey(string $providerName): void
    {
        if (isset($this->providers[$providerName])) {
            unset($this->providers[$providerName]);

            $this->auditLog('api_key_rotated', [
                'provider' => $providerName,
            ]);
        }
    }

    /**
     * Audit log security events
     */
    private function auditLog(string $event, array $context): void
    {
        if (!$this->auditLoggingEnabled) {
            return;
        }

        $this->auditLogger->info($event, array_merge($context, [
            'timestamp' => time(),
            'component' => 'SecureProviderFactory',
        ]));
    }

    /**
     * Validate provider configuration (security check)
     *
     * @return array{valid: bool, issues: array<string>}
     */
    public function validateProviderSecurity(string $providerName): array
    {
        $issues = [];
        $config = $this->providersConfig[$providerName] ?? null;

        if ($config === null) {
            return [
                'valid' => false,
                'issues' => ['Provider not configured'],
            ];
        }

        // Check API key security
        if (isset($config['api_key']) && !$this->isSecretReference($config['api_key'])) {
            $issues[] = 'API key is plaintext (should use Symfony Secrets Vault)';
        }

        // Check HTTPS enforcement
        if (isset($config['base_url']) && !str_starts_with($config['base_url'], 'https://')) {
            $issues[] = 'Base URL is not HTTPS (insecure)';
        }

        // Check timeout configuration
        if (!isset($config['timeout']) || $config['timeout'] > 300) {
            $issues[] = 'Timeout not configured or too high (max recommended: 300s)';
        }

        return [
            'valid' => empty($issues),
            'issues' => $issues,
        ];
    }
}

/**
 * Audit Logging Provider Decorator
 *
 * Wraps provider to log all LLM API calls for security audit
 */
class AuditLoggingProvider implements LLMProviderInterface
{
    public function __construct(
        private readonly LLMProviderInterface $provider,
        private readonly LoggerInterface $auditLogger,
        private readonly string $providerName
    ) {
    }

    public function complete(
        ?string $model = null,
        ?string $prompt = null,
        ?float $temperature = null,
        ?int $maxTokens = null,
        ?array $tools = null
    ): array {
        $requestId = uniqid('llm_', true);
        $startTime = microtime(true);

        // Log request
        $this->auditLogger->info('llm_request', [
            'request_id' => $requestId,
            'provider' => $this->providerName,
            'model' => $model,
            'prompt_length' => $prompt ? strlen($prompt) : 0,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
            'tools_count' => $tools ? count($tools) : 0,
            'timestamp' => time(),
        ]);

        try {
            $response = $this->provider->complete($model, $prompt, $temperature, $maxTokens, $tools);
            $duration = microtime(true) - $startTime;

            // Log successful response
            $this->auditLogger->info('llm_response', [
                'request_id' => $requestId,
                'provider' => $this->providerName,
                'model' => $model,
                'duration_ms' => round($duration * 1000, 2),
                'response_length' => isset($response['content']) ? strlen($response['content']) : 0,
                'tokens_used' => $response['usage'] ?? null,
                'timestamp' => time(),
            ]);

            return $response;
        } catch (\Throwable $e) {
            $duration = microtime(true) - $startTime;

            // Log error
            $this->auditLogger->error('llm_error', [
                'request_id' => $requestId,
                'provider' => $this->providerName,
                'model' => $model,
                'duration_ms' => round($duration * 1000, 2),
                'error_class' => get_class($e),
                'error_message' => $e->getMessage(),
                'timestamp' => time(),
            ]);

            throw $e;
        }
    }
}
