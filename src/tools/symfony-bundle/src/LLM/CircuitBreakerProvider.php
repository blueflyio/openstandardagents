<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\LLM;

use Psr\Log\LoggerInterface;

/**
 * Circuit Breaker Provider
 *
 * Implements circuit breaker pattern with exponential backoff and provider fallback.
 * Wraps LLM providers to provide resilience and fault tolerance.
 */
class CircuitBreakerProvider implements LLMProviderInterface
{
    private const STATE_CLOSED = 'closed';
    private const STATE_OPEN = 'open';
    private const STATE_HALF_OPEN = 'half_open';

    private string $state = self::STATE_CLOSED;
    private int $failureCount = 0;
    private ?float $lastFailureTime = null;
    private ?float $nextRetryTime = null;

    private readonly int $failureThreshold;
    private readonly int $resetTimeout;
    private readonly int $maxRetries;
    private readonly float $backoffMultiplier;
    private readonly int $initialBackoffMs;
    private readonly array $fallbackChain;

    public function __construct(
        private readonly LLMProviderInterface $provider,
        private readonly LoggerInterface $logger,
        array $config = []
    ) {
        $this->failureThreshold = $config['failure_threshold'] ?? 5;
        $this->resetTimeout = $config['reset_timeout'] ?? 60; // seconds
        $this->maxRetries = $config['max_retries'] ?? 3;
        $this->backoffMultiplier = $config['backoff_multiplier'] ?? 2.0;
        $this->initialBackoffMs = $config['initial_backoff_ms'] ?? 1000;
        $this->fallbackChain = $config['fallback_providers'] ?? [];
    }

    /**
     * Complete with circuit breaker protection
     */
    public function complete(
        ?string $model = null,
        ?string $prompt = null,
        ?float $temperature = null,
        ?int $maxTokens = null,
        ?array $tools = null
    ): array {
        // Check circuit state
        if ($this->state === self::STATE_OPEN) {
            if ($this->shouldAttemptReset()) {
                $this->state = self::STATE_HALF_OPEN;
                $this->logger->info('Circuit breaker entering half-open state', [
                    'provider' => get_class($this->provider),
                ]);
            } else {
                return $this->tryFallback($model, $prompt, $temperature, $maxTokens, $tools);
            }
        }

        // Attempt execution with retry logic
        return $this->executeWithRetry($model, $prompt, $temperature, $maxTokens, $tools);
    }

    /**
     * Execute with exponential backoff retry
     */
    private function executeWithRetry(
        ?string $model,
        ?string $prompt,
        ?float $temperature,
        ?int $maxTokens,
        ?array $tools
    ): array {
        $attempt = 0;
        $lastException = null;

        while ($attempt < $this->maxRetries) {
            try {
                $result = $this->provider->complete($model, $prompt, $temperature, $maxTokens, $tools);

                // Success - reset circuit breaker
                if ($this->state !== self::STATE_CLOSED) {
                    $this->logger->info('Circuit breaker reset to closed state', [
                        'provider' => get_class($this->provider),
                    ]);
                }
                $this->reset();

                return $result;
            } catch (\Exception $e) {
                $lastException = $e;
                $attempt++;

                $this->recordFailure();

                if ($attempt < $this->maxRetries) {
                    $backoffMs = $this->calculateBackoff($attempt);

                    $this->logger->warning('LLM provider call failed, retrying', [
                        'provider' => get_class($this->provider),
                        'attempt' => $attempt,
                        'max_retries' => $this->maxRetries,
                        'backoff_ms' => $backoffMs,
                        'error' => $e->getMessage(),
                    ]);

                    usleep($backoffMs * 1000);
                } else {
                    $this->logger->error('LLM provider exhausted all retries', [
                        'provider' => get_class($this->provider),
                        'attempts' => $attempt,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        // All retries exhausted, try fallback
        if (!empty($this->fallbackChain)) {
            $this->logger->info('Attempting fallback providers', [
                'primary_provider' => get_class($this->provider),
                'fallback_count' => count($this->fallbackChain),
            ]);

            return $this->tryFallback($model, $prompt, $temperature, $maxTokens, $tools);
        }

        throw $lastException;
    }

    /**
     * Try fallback provider chain
     */
    private function tryFallback(
        ?string $model,
        ?string $prompt,
        ?float $temperature,
        ?int $maxTokens,
        ?array $tools
    ): array {
        foreach ($this->fallbackChain as $fallbackProvider) {
            try {
                $this->logger->info('Trying fallback provider', [
                    'provider' => get_class($fallbackProvider),
                ]);

                return $fallbackProvider->complete($model, $prompt, $temperature, $maxTokens, $tools);
            } catch (\Exception $e) {
                $this->logger->warning('Fallback provider failed', [
                    'provider' => get_class($fallbackProvider),
                    'error' => $e->getMessage(),
                ]);
            }
        }

        throw new \RuntimeException('All providers (primary and fallbacks) failed');
    }

    /**
     * Calculate exponential backoff delay
     */
    private function calculateBackoff(int $attempt): int
    {
        return (int) ($this->initialBackoffMs * pow($this->backoffMultiplier, $attempt - 1));
    }

    /**
     * Record a failure
     */
    private function recordFailure(): void
    {
        $this->failureCount++;
        $this->lastFailureTime = microtime(true);

        if ($this->failureCount >= $this->failureThreshold) {
            $this->state = self::STATE_OPEN;
            $this->nextRetryTime = $this->lastFailureTime + $this->resetTimeout;

            $this->logger->warning('Circuit breaker opened', [
                'provider' => get_class($this->provider),
                'failure_count' => $this->failureCount,
                'next_retry_at' => date('Y-m-d H:i:s', (int) $this->nextRetryTime),
            ]);
        }
    }

    /**
     * Reset circuit breaker
     */
    private function reset(): void
    {
        $this->state = self::STATE_CLOSED;
        $this->failureCount = 0;
        $this->lastFailureTime = null;
        $this->nextRetryTime = null;
    }

    /**
     * Check if should attempt reset
     */
    private function shouldAttemptReset(): bool
    {
        return $this->nextRetryTime !== null && microtime(true) >= $this->nextRetryTime;
    }

    /**
     * Get circuit breaker state
     *
     * @return array{state: string, failure_count: int, last_failure: float|null, next_retry: float|null}
     */
    public function getState(): array
    {
        return [
            'state' => $this->state,
            'failure_count' => $this->failureCount,
            'last_failure' => $this->lastFailureTime,
            'next_retry' => $this->nextRetryTime,
        ];
    }

    /**
     * Manually open circuit (for testing/admin operations)
     */
    public function open(): void
    {
        $this->state = self::STATE_OPEN;
        $this->nextRetryTime = microtime(true) + $this->resetTimeout;
    }

    /**
     * Manually close circuit (for testing/admin operations)
     */
    public function close(): void
    {
        $this->reset();
    }
}
