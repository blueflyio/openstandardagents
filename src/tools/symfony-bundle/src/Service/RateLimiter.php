<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Service;

use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\RateLimiter\Exception\RateLimitExceededException;

/**
 * Rate Limiter Service
 *
 * Provides rate limiting for agent executions with per-user and global limits.
 */
class RateLimiter
{
    private ?RateLimiterFactory $userLimiterFactory = null;
    private ?RateLimiterFactory $globalLimiterFactory = null;
    private readonly bool $enabled;
    private readonly array $config;

    public function __construct(array $rateLimitConfig = [])
    {
        $this->config = $rateLimitConfig;
        $this->enabled = $rateLimitConfig['enabled'] ?? false;
    }

    /**
     * Set the user rate limiter factory (injected by DI)
     */
    public function setUserLimiterFactory(?RateLimiterFactory $factory): void
    {
        $this->userLimiterFactory = $factory;
    }

    /**
     * Set the global rate limiter factory (injected by DI)
     */
    public function setGlobalLimiterFactory(?RateLimiterFactory $factory): void
    {
        $this->globalLimiterFactory = $factory;
    }

    /**
     * Check if rate limiting is enabled
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Check rate limits for a user
     *
     * @param string $userId User identifier
     * @param int $tokens Number of tokens to consume (default: 1)
     * @throws RateLimitExceededException
     */
    public function checkUserLimit(string $userId, int $tokens = 1): void
    {
        if (!$this->enabled || !$this->userLimiterFactory) {
            return;
        }

        $limiter = $this->userLimiterFactory->create($userId);
        $limit = $limiter->consume($tokens);

        if (!$limit->isAccepted()) {
            throw new RateLimitExceededException(
                sprintf(
                    'User rate limit exceeded. Retry after %d seconds.',
                    $limit->getRetryAfter()->getTimestamp() - time()
                )
            );
        }
    }

    /**
     * Check global rate limit
     *
     * @param int $tokens Number of tokens to consume (default: 1)
     * @throws RateLimitExceededException
     */
    public function checkGlobalLimit(int $tokens = 1): void
    {
        if (!$this->enabled || !$this->globalLimiterFactory) {
            return;
        }

        $limiter = $this->globalLimiterFactory->create('global');
        $limit = $limiter->consume($tokens);

        if (!$limit->isAccepted()) {
            throw new RateLimitExceededException(
                sprintf(
                    'Global rate limit exceeded. Retry after %d seconds.',
                    $limit->getRetryAfter()->getTimestamp() - time()
                )
            );
        }
    }

    /**
     * Check both user and global rate limits
     *
     * @param string $userId User identifier
     * @param int $tokens Number of tokens to consume
     * @throws RateLimitExceededException
     */
    public function checkLimits(string $userId, int $tokens = 1): void
    {
        $this->checkGlobalLimit($tokens);
        $this->checkUserLimit($userId, $tokens);
    }

    /**
     * Get remaining capacity for a user
     *
     * @param string $userId User identifier
     * @return array{available: int, limit: int, reset_time: int|null}
     */
    public function getUserCapacity(string $userId): array
    {
        if (!$this->enabled || !$this->userLimiterFactory) {
            return [
                'available' => PHP_INT_MAX,
                'limit' => PHP_INT_MAX,
                'reset_time' => null,
            ];
        }

        $limiter = $this->userLimiterFactory->create($userId);
        $limit = $limiter->consume(0); // Peek without consuming

        return [
            'available' => $limit->getRemainingTokens(),
            'limit' => $limit->getLimit(),
            'reset_time' => $limit->getRetryAfter()?->getTimestamp(),
        ];
    }

    /**
     * Get remaining global capacity
     *
     * @return array{available: int, limit: int, reset_time: int|null}
     */
    public function getGlobalCapacity(): array
    {
        if (!$this->enabled || !$this->globalLimiterFactory) {
            return [
                'available' => PHP_INT_MAX,
                'limit' => PHP_INT_MAX,
                'reset_time' => null,
            ];
        }

        $limiter = $this->globalLimiterFactory->create('global');
        $limit = $limiter->consume(0); // Peek without consuming

        return [
            'available' => $limit->getRemainingTokens(),
            'limit' => $limit->getLimit(),
            'reset_time' => $limit->getRetryAfter()?->getTimestamp(),
        ];
    }

    /**
     * Reset rate limit for a user (admin operation)
     *
     * @param string $userId User identifier
     */
    public function resetUserLimit(string $userId): void
    {
        if (!$this->enabled || !$this->userLimiterFactory) {
            return;
        }

        $limiter = $this->userLimiterFactory->create($userId);
        $limiter->reset();
    }

    /**
     * Get rate limit configuration
     */
    public function getConfig(): array
    {
        return $this->config;
    }
}
