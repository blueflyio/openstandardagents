<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\LLM;

/**
 * LLM Provider Interface
 *
 * Interface for all LLM providers (Anthropic, OpenAI, Google, etc.)
 */
interface LLMProviderInterface
{
    /**
     * Get provider name
     */
    public function getName(): string;

    /**
     * Complete a prompt
     *
     * @return array{content: string, usage: array}
     */
    public function complete(
        ?string $model = null,
        string $prompt = '',
        ?float $temperature = null,
        ?int $maxTokens = null
    ): array;

    /**
     * Check if provider supports streaming
     */
    public function supportsStreaming(): bool;

    /**
     * Get supported models
     *
     * @return array<string>
     */
    public function getSupportedModels(): array;
}
