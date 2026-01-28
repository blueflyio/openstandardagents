<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\LLM\Provider;

use Ossa\SymfonyBundle\LLM\LLMProviderInterface;
use GuzzleHttp\Client;

/**
 * Google LLM Provider
 *
 * Supports Gemini models
 */
class GoogleProvider implements LLMProviderInterface
{
    private const API_BASE = 'https://generativelanguage.googleapis.com/v1';
    private const DEFAULT_MODEL = 'gemini-2.0-flash-exp';

    private Client $client;

    public function __construct(private readonly array $config)
    {
        $this->client = new Client([
            'base_uri' => $this->config['base_url'] ?? self::API_BASE,
            'timeout' => $this->config['timeout'] ?? 60,
        ]);
    }

    public function getName(): string
    {
        return 'google';
    }

    public function complete(
        ?string $model = null,
        string $prompt = '',
        ?float $temperature = null,
        ?int $maxTokens = null
    ): array {
        $model = $model ?? self::DEFAULT_MODEL;
        $temperature = $temperature ?? 0.7;
        $maxTokens = $maxTokens ?? 8192;

        $apiKey = $this->config['api_key'] ?? $_ENV['GOOGLE_API_KEY'] ?? '';

        $response = $this->client->post("/models/{$model}:generateContent", [
            'query' => ['key' => $apiKey],
            'json' => [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => $temperature,
                    'maxOutputTokens' => $maxTokens,
                ],
            ],
        ]);

        $data = json_decode($response->getBody()->getContents(), true);

        return [
            'content' => $data['candidates'][0]['content']['parts'][0]['text'] ?? '',
            'usage' => [
                'prompt_tokens' => $data['usageMetadata']['promptTokenCount'] ?? 0,
                'completion_tokens' => $data['usageMetadata']['candidatesTokenCount'] ?? 0,
                'total_tokens' => $data['usageMetadata']['totalTokenCount'] ?? 0,
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
            'gemini-2.0-flash-exp',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-pro',
        ];
    }
}
