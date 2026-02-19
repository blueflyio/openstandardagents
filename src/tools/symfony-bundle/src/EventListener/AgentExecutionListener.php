<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\EventListener;

use Ossa\SymfonyBundle\Event\AgentExecutionCompleteEvent;
use Ossa\SymfonyBundle\Event\AgentExecutionErrorEvent;
use Ossa\SymfonyBundle\Event\AgentExecutionStartEvent;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Agent Execution Listener
 *
 * Listens to agent execution events for logging, metrics, and observability.
 */
class AgentExecutionListener implements EventSubscriberInterface
{
    public function __construct(
        private readonly LoggerInterface $logger
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            AgentExecutionStartEvent::class => 'onExecutionStart',
            AgentExecutionCompleteEvent::class => 'onExecutionComplete',
            AgentExecutionErrorEvent::class => 'onExecutionError',
        ];
    }

    /**
     * Handle agent execution start
     */
    public function onExecutionStart(AgentExecutionStartEvent $event): void
    {
        $this->logger->info('Agent execution started', [
            'agent' => $event->getAgentName(),
            'input_length' => strlen($event->getInput()),
            'context_keys' => array_keys($event->getContext()),
            'timestamp' => $event->getStartTime(),
        ]);
    }

    /**
     * Handle successful agent execution
     */
    public function onExecutionComplete(AgentExecutionCompleteEvent $event): void
    {
        $response = $event->getResponse();
        $metadata = $response->getMetadata();

        $this->logger->info('Agent execution completed', [
            'agent' => $event->getAgentName(),
            'duration_ms' => $event->getDurationMs(),
            'output_length' => strlen($response->getOutput()),
            'model' => $metadata['model'] ?? null,
            'provider' => $metadata['provider'] ?? null,
            'tokens' => $metadata['usage'] ?? [],
        ]);
    }

    /**
     * Handle agent execution error
     */
    public function onExecutionError(AgentExecutionErrorEvent $event): void
    {
        $this->logger->error('Agent execution failed', [
            'agent' => $event->getAgentName(),
            'duration_ms' => $event->getDurationMs(),
            'error_class' => $event->getErrorClass(),
            'error_message' => $event->getErrorMessage(),
            'input_length' => strlen($event->getInput()),
        ]);
    }
}
