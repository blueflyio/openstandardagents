<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Event;

use Ossa\SymfonyBundle\Model\Agent;
use Ossa\SymfonyBundle\Model\AgentResponse;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * Event dispatched when agent execution completes successfully
 */
class AgentExecutionCompleteEvent extends Event
{
    public function __construct(
        private readonly Agent $agent,
        private readonly AgentResponse $response,
        private readonly float $startTime,
        private readonly float $endTime
    ) {
    }

    public function getAgent(): Agent
    {
        return $this->agent;
    }

    public function getResponse(): AgentResponse
    {
        return $this->response;
    }

    public function getStartTime(): float
    {
        return $this->startTime;
    }

    public function getEndTime(): float
    {
        return $this->endTime;
    }

    public function getDuration(): float
    {
        return $this->endTime - $this->startTime;
    }

    public function getDurationMs(): float
    {
        return round($this->getDuration() * 1000, 2);
    }

    public function getAgentName(): string
    {
        return $this->agent->getName();
    }
}
