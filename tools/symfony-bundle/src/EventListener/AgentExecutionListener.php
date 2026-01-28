<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Agent Execution Listener
 *
 * Listens to agent execution events for logging, metrics, etc.
 */
class AgentExecutionListener implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            // TODO: Define custom events
            // AgentExecutionStartEvent::class => 'onExecutionStart',
            // AgentExecutionCompleteEvent::class => 'onExecutionComplete',
        ];
    }
}
