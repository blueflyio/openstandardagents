<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\LLM;

use Ossa\SymfonyBundle\Exception\UnsupportedProviderException;
use Ossa\SymfonyBundle\LLM\Provider\AnthropicProvider;
use Ossa\SymfonyBundle\LLM\Provider\AzureProvider;
use Ossa\SymfonyBundle\LLM\Provider\GoogleProvider;
use Ossa\SymfonyBundle\LLM\Provider\OpenAIProvider;

/**
 * LLM Provider Factory
 *
 * Creates LLM provider instances based on configuration
 */
class LLMProviderFactory
{
    private array $providers = [];

    public function __construct(
        private readonly array $providersConfig,
        private readonly string $defaultProvider
    ) {
    }

    /**
     * Create a provider instance
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

        $provider = match ($providerName) {
            'anthropic' => new AnthropicProvider($config),
            'openai' => new OpenAIProvider($config),
            'google' => new GoogleProvider($config),
            'azure' => new AzureProvider($config),
            default => throw new UnsupportedProviderException("Unsupported provider: {$providerName}"),
        };

        $this->providers[$providerName] = $provider;

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
}
