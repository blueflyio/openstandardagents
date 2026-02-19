<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\LLM\Provider;

use Ossa\SymfonyBundle\LLM\LLMProviderInterface;
use GuzzleHttp\Client;

/**
 * Anthropic LLM Provider
 *
 * Supports Claude models (opus, sonnet, haiku)
 */
class AnthropicProvider implements LLMProviderInterface
{
    private const API_BASE = 'https://api.anthropic.com/v1';
    private const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

    private Client $client;

    public function __construct(private readonly array $config)
    {
        $this->client = new Client([
            'base_uri' => $this->config['base_url'] ?? self::API_BASE,
            'timeout' => $this->config['timeout'] ?? 60,
            'headers' => [
                'x-api-key' => $this->config['api_key'] ?? $_ENV['ANTHROPIC_API_KEY'] ?? '',
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ],
        ]);
    }

    public function getName(): string
    {
        return 'anthropic';
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

        $response = $this->client->post('/messages', [
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
            'content' => $data['content'][0]['text'] ?? '',
            'usage' => [
                'input_tokens' => $data['usage']['input_tokens'] ?? 0,
                'output_tokens' => $data['usage']['output_tokens'] ?? 0,
                'total_tokens' => ($data['usage']['input_tokens'] ?? 0) + ($data['usage']['output_tokens'] ?? 0),
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
            'claude-opus-4-20250514',
            'claude-sonnet-4-20250514',
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
        ];
    }
}
