<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\LLM\Provider;

use Ossa\SymfonyBundle\LLM\LLMProviderInterface;
use GuzzleHttp\Client;

/**
 * Azure OpenAI LLM Provider
 *
 * Supports Azure-hosted OpenAI models
 */
class AzureProvider implements LLMProviderInterface
{
    private Client $client;

    public function __construct(private readonly array $config)
    {
        if (!isset($this->config['base_url'])) {
            throw new \InvalidArgumentException('Azure provider requires base_url configuration');
        }

        $this->client = new Client([
            'base_uri' => $this->config['base_url'],
            'timeout' => $this->config['timeout'] ?? 60,
            'headers' => [
                'api-key' => $this->config['api_key'] ?? $_ENV['AZURE_OPENAI_API_KEY'] ?? '',
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    public function getName(): string
    {
        return 'azure';
    }

    public function complete(
        ?string $model = null,
        string $prompt = '',
        ?float $temperature = null,
        ?int $maxTokens = null
    ): array {
        $deployment = $model ?? $this->config['deployment'] ?? 'gpt-4';
        $temperature = $temperature ?? 0.7;
        $maxTokens = $maxTokens ?? 4096;

        $response = $this->client->post("/openai/deployments/{$deployment}/chat/completions?api-version=2023-05-15", [
            'json' => [
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
            'gpt-4',
            'gpt-35-turbo',
        ];
    }
}
