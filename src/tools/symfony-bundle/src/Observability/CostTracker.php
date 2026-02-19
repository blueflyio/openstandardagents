<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Observability;

/**
 * Cost Tracker
 *
 * Tracks LLM usage costs
 */
class CostTracker
{
    private array $usage = [];

    public function __construct(
        private readonly array $safetyConfig
    ) {
    }

    public function trackUsage(string $provider, string $model, array $usage): void
    {
        $cost = $this->calculateCost($provider, $model, $usage);

        $this->usage[] = [
            'timestamp' => time(),
            'provider' => $provider,
            'model' => $model,
            'tokens' => $usage,
            'cost_usd' => $cost,
        ];
    }

    public function getTotalCost(): float
    {
        return array_sum(array_column($this->usage, 'cost_usd'));
    }

    private function calculateCost(string $provider, string $model, array $usage): float
    {
        // Approximate costs per 1M tokens
        $pricing = [
            'anthropic' => [
                'claude-opus-4' => ['input' => 15.00, 'output' => 75.00],
                'claude-sonnet-4' => ['input' => 3.00, 'output' => 15.00],
                'claude-3-5-sonnet' => ['input' => 3.00, 'output' => 15.00],
                'claude-3-5-haiku' => ['input' => 1.00, 'output' => 5.00],
            ],
            'openai' => [
                'gpt-4-turbo' => ['input' => 10.00, 'output' => 30.00],
                'gpt-4' => ['input' => 30.00, 'output' => 60.00],
                'gpt-3.5-turbo' => ['input' => 0.50, 'output' => 1.50],
            ],
        ];

        $modelPricing = null;
        foreach ($pricing[$provider] ?? [] as $modelKey => $prices) {
            if (str_contains($model, $modelKey)) {
                $modelPricing = $prices;
                break;
            }
        }

        if (!$modelPricing) {
            return 0.0;
        }

        $inputTokens = $usage['input_tokens'] ?? $usage['prompt_tokens'] ?? 0;
        $outputTokens = $usage['output_tokens'] ?? $usage['completion_tokens'] ?? 0;

        return (($inputTokens * $modelPricing['input']) + ($outputTokens * $modelPricing['output'])) / 1_000_000;
    }
}
