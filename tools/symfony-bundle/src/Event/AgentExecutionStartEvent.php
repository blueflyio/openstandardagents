<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Event;

use Ossa\SymfonyBundle\Model\Agent;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * Event dispatched when agent execution starts
 */
class AgentExecutionStartEvent extends Event
{
    public function __construct(
        private readonly Agent $agent,
        private readonly string $input,
        private readonly array $context,
        private readonly float $startTime
    ) {
    }

    public function getAgent(): Agent
    {
        return $this->agent;
    }

    public function getInput(): string
    {
        return $this->input;
    }

    public function getContext(): array
    {
        return $this->context;
    }

    public function getStartTime(): float
    {
        return $this->startTime;
    }

    public function getAgentName(): string
    {
        return $this->agent->getName();
    }
}
