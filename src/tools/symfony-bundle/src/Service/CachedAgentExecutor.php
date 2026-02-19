<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Service;

use Ossa\SymfonyBundle\Agent\AgentExecutor;
use Ossa\SymfonyBundle\Model\AgentResponse;
use Psr\Log\LoggerInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * Cached Agent Executor
 *
 * Wraps AgentExecutor with caching layer for response and manifest caching.
 */
class CachedAgentExecutor
{
    private readonly bool $enabled;
    private readonly int $responseTtl;
    private readonly int $manifestTtl;

    public function __construct(
        private readonly AgentExecutor $executor,
        private readonly ?CacheInterface $cache,
        private readonly LoggerInterface $logger,
        array $cacheConfig = []
    ) {
        $this->enabled = ($cacheConfig['enabled'] ?? false) && $cache !== null;
        $this->responseTtl = $cacheConfig['response_ttl'] ?? 3600; // 1 hour default
        $this->manifestTtl = $cacheConfig['manifest_ttl'] ?? 86400; // 24 hours default
    }

    /**
     * Execute agent with caching
     *
     * Caches responses based on agent name, input, and context.
     */
    public function execute(string $agentName, string $input, array $context = [], bool $skipCache = false): AgentResponse
    {
        if (!$this->enabled || $skipCache) {
            return $this->executor->execute($agentName, $input, $context);
        }

        $cacheKey = $this->generateCacheKey($agentName, $input, $context);

        try {
            return $this->cache->get($cacheKey, function (ItemInterface $item) use ($agentName, $input, $context) {
                $item->expiresAfter($this->responseTtl);

                $this->logger->debug('Cache miss for agent execution', [
                    'agent' => $agentName,
                    'cache_key' => $item->getKey(),
                ]);

                return $this->executor->execute($agentName, $input, $context);
            });
        } catch (\Exception $e) {
            $this->logger->warning('Cache failure, executing without cache', [
                'agent' => $agentName,
                'error' => $e->getMessage(),
            ]);

            return $this->executor->execute($agentName, $input, $context);
        }
    }

    /**
     * Invalidate cache for specific agent
     */
    public function invalidateAgent(string $agentName): void
    {
        if (!$this->enabled) {
            return;
        }

        try {
            // Delete cache entries with agent name prefix
            $this->cache->delete($this->getAgentCachePrefix($agentName));

            $this->logger->info('Cache invalidated for agent', [
                'agent' => $agentName,
            ]);
        } catch (\Exception $e) {
            $this->logger->warning('Failed to invalidate cache', [
                'agent' => $agentName,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Invalidate specific cached response
     */
    public function invalidateResponse(string $agentName, string $input, array $context = []): void
    {
        if (!$this->enabled) {
            return;
        }

        $cacheKey = $this->generateCacheKey($agentName, $input, $context);

        try {
            $this->cache->delete($cacheKey);

            $this->logger->debug('Cache entry deleted', [
                'agent' => $agentName,
                'cache_key' => $cacheKey,
            ]);
        } catch (\Exception $e) {
            $this->logger->warning('Failed to delete cache entry', [
                'agent' => $agentName,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Clear all agent execution cache
     */
    public function clearAll(): void
    {
        if (!$this->enabled) {
            return;
        }

        try {
            $this->cache->clear();

            $this->logger->info('All agent cache cleared');
        } catch (\Exception $e) {
            $this->logger->warning('Failed to clear cache', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get cache statistics
     *
     * @return array{enabled: bool, response_ttl: int, manifest_ttl: int}
     */
    public function getStats(): array
    {
        return [
            'enabled' => $this->enabled,
            'response_ttl' => $this->responseTtl,
            'manifest_ttl' => $this->manifestTtl,
        ];
    }

    /**
     * Check if caching is enabled
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Generate cache key for agent execution
     */
    private function generateCacheKey(string $agentName, string $input, array $context): string
    {
        // Create deterministic hash of input and context
        $hash = hash('xxh3', json_encode([
            'input' => $input,
            'context' => $context,
        ]));

        return sprintf('ossa.agent.%s.%s', $agentName, $hash);
    }

    /**
     * Get cache key prefix for agent
     */
    private function getAgentCachePrefix(string $agentName): string
    {
        return sprintf('ossa.agent.%s', $agentName);
    }

    /**
     * Warm cache with specific input
     */
    public function warmCache(string $agentName, string $input, array $context = []): void
    {
        if (!$this->enabled) {
            return;
        }

        $this->logger->debug('Warming cache for agent', [
            'agent' => $agentName,
        ]);

        $this->execute($agentName, $input, $context, skipCache: false);
    }

    /**
     * Get the underlying executor (for direct access when needed)
     */
    public function getExecutor(): AgentExecutor
    {
        return $this->executor;
    }
}
