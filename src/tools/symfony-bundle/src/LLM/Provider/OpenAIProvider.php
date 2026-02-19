<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\LLM\Provider;

use Ossa\SymfonyBundle\LLM\LLMProviderInterface;
use GuzzleHttp\Client;

/**
 * OpenAI LLM Provider
 *
 * Supports GPT-4, GPT-3.5, and other OpenAI models
 */
class OpenAIProvider implements LLMProviderInterface
{
    private const API_BASE = 'https://api.openai.com/v1';
    private const DEFAULT_MODEL = 'gpt-4-turbo';

    private Client $client;

    public function __construct(private readonly array $config)
    {
        $this->client = new Client([
            'base_uri' => $this->config['base_url'] ?? self::API_BASE,
            'timeout' => $this->config['timeout'] ?? 60,
            'headers' => [
                'Authorization' => 'Bearer ' . ($this->config['api_key'] ?? $_ENV['OPENAI_API_KEY'] ?? ''),
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    public function getName(): string
    {
        return 'openai';
    }

    public function complete(
        ?string $model = null,
        string $prompt = '',
        ?float $temperature = null,
        ?int $maxTokens = null
    ): array {
        $model = $model ?? self::DEFAULT_MODEL;
        $temperature = $temperature ?? 0.7;
        $maxTokens = $maxTokens ?? 4096;

        $response = $this->client->post('/chat/completions', [
            'json' => [
                'model' => $model,
                'max_tokens' => $maxTokens,
                'temperature' => $temperature,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
            ],
        ]);

        $data = json_decode($response->getBody()->getContents(), true);

        return [
            'content' => $data['choices'][0]['message']['content'] ?? '',
            'usage' => [
                'prompt_tokens' => $data['usage']['prompt_tokens'] ?? 0,
                'completion_tokens' => $data['usage']['completion_tokens'] ?? 0,
                'total_tokens' => $data['usage']['total_tokens'] ?? 0,
            ],
        ];
    }

    public function supportsStreaming(): bool
    {
        return true;
    }

    public function getSupportedModels(): array
    {
        return [
            'gpt-4-turbo',
            'gpt-4',
            'gpt-4-32k',
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-16k',
        ];
    }
}
