<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Agent;

use Ossa\SymfonyBundle\LLM\LLMProviderFactory;
use Ossa\SymfonyBundle\Model\Agent;
use Ossa\SymfonyBundle\Model\AgentResponse;
use Psr\Log\LoggerInterface;

/**
 * Agent Executor
 *
 * Executes OSSA agents with LLM providers
 */
class AgentExecutor
{
    public function __construct(
        private readonly AgentRegistry $registry,
        private readonly LLMProviderFactory $llmFactory,
        private readonly LoggerInterface $logger
    ) {
    }

    /**
     * Execute an agent with a given input
     */
    public function execute(string $agentName, string $input, array $context = []): AgentResponse
    {
        $agent = $this->registry->get($agentName);

        $this->logger->info('Executing agent', [
            'agent' => $agentName,
            'input_length' => strlen($input),
        ]);

        $startTime = microtime(true);

        try {
            // Get LLM provider
            $llmConfig = $agent->getLLMConfig();
            $provider = $this->llmFactory->create($llmConfig['provider'] ?? null);

            // Build prompt
            $prompt = $this->buildPrompt($agent, $input, $context);

            // Execute LLM
            $response = $provider->complete(
                model: $llmConfig['model'] ?? null,
                prompt: $prompt,
                temperature: $llmConfig['temperature'] ?? null,
                maxTokens: $llmConfig['max_tokens'] ?? null
            );

            $duration = microtime(true) - $startTime;

            $this->logger->info('Agent execution completed', [
                'agent' => $agentName,
                'duration_ms' => round($duration * 1000, 2),
                'tokens' => $response['usage'] ?? null,
            ]);

            return new AgentResponse(
                agentName: $agentName,
                output: $response['content'],
                metadata: [
                    'duration_ms' => round($duration * 1000, 2),
                    'model' => $llmConfig['model'] ?? null,
                    'provider' => $llmConfig['provider'] ?? null,
                    'usage' => $response['usage'] ?? [],
                ]
            );
        } catch (\Exception $e) {
            $duration = microtime(true) - $startTime;

            $this->logger->error('Agent execution failed', [
                'agent' => $agentName,
                'duration_ms' => round($duration * 1000, 2),
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Build the complete prompt for the agent
     */
    private function buildPrompt(Agent $agent, string $input, array $context): string
    {
        $parts = [];

        // Agent role
        if ($role = $agent->getRole()) {
            $parts[] = "Role: {$role}";
        }

        // Agent system prompt
        if ($systemPrompt = $agent->getPrompt()) {
            $parts[] = $systemPrompt;
        }

        // Context
        if (!empty($context)) {
            $parts[] = "Context:";
            foreach ($context as $key => $value) {
                $parts[] = "{$key}: {$value}";
            }
        }

        // User input
        $parts[] = "Input:";
        $parts[] = $input;

        return implode("\n\n", $parts);
    }
}
