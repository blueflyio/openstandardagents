<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Event;

use Ossa\SymfonyBundle\Model\Agent;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * Event dispatched when agent execution fails
 */
class AgentExecutionErrorEvent extends Event
{
    public function __construct(
        private readonly Agent $agent,
        private readonly \Throwable $error,
        private readonly string $input,
        private readonly array $context,
        private readonly float $startTime,
        private readonly float $errorTime
    ) {
    }

    public function getAgent(): Agent
    {
        return $this->agent;
    }

    public function getError(): \Throwable
    {
        return $this->error;
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

    public function getErrorTime(): float
    {
        return $this->errorTime;
    }

    public function getDuration(): float
    {
        return $this->errorTime - $this->startTime;
    }

    public function getDurationMs(): float
    {
        return round($this->getDuration() * 1000, 2);
    }

    public function getAgentName(): string
    {
        return $this->agent->getName();
    }

    public function getErrorMessage(): string
    {
        return $this->error->getMessage();
    }

    public function getErrorClass(): string
    {
        return get_class($this->error);
    }
}
