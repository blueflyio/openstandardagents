<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Agent;

use Ossa\SymfonyBundle\Event\AgentExecutionCompleteEvent;
use Ossa\SymfonyBundle\Event\AgentExecutionErrorEvent;
use Ossa\SymfonyBundle\Event\AgentExecutionStartEvent;
use Ossa\SymfonyBundle\LLM\LLMProviderFactory;
use Ossa\SymfonyBundle\Model\Agent;
use Ossa\SymfonyBundle\Model\AgentResponse;
use Psr\Log\LoggerInterface;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

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
        private readonly LoggerInterface $logger,
        private readonly EventDispatcherInterface $eventDispatcher
    ) {
    }

    /**
     * Execute an agent with a given input
     */
    public function execute(string $agentName, string $input, array $context = []): AgentResponse
    {
        $agent = $this->registry->get($agentName);
        $startTime = microtime(true);

        // Dispatch start event
        $startEvent = new AgentExecutionStartEvent($agent, $input, $context, $startTime);
        $this->eventDispatcher->dispatch($startEvent);

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

            $endTime = microtime(true);

            $agentResponse = new AgentResponse(
                agentName: $agentName,
                output: $response['content'],
                metadata: [
                    'duration_ms' => round(($endTime - $startTime) * 1000, 2),
                    'model' => $llmConfig['model'] ?? null,
                    'provider' => $llmConfig['provider'] ?? null,
                    'usage' => $response['usage'] ?? [],
                ]
            );

            // Dispatch complete event
            $completeEvent = new AgentExecutionCompleteEvent($agent, $agentResponse, $startTime, $endTime);
            $this->eventDispatcher->dispatch($completeEvent);

            return $agentResponse;
        } catch (\Throwable $e) {
            $errorTime = microtime(true);

            // Dispatch error event
            $errorEvent = new AgentExecutionErrorEvent($agent, $e, $input, $context, $startTime, $errorTime);
            $this->eventDispatcher->dispatch($errorEvent);

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
