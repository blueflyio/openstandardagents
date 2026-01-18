<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Model;

/**
 * Agent Response
 *
 * Response from an agent execution
 */
class AgentResponse
{
    public function __construct(
        private readonly string $agentName,
        private readonly string $output,
        private readonly array $metadata = []
    ) {
    }

    public function getAgentName(): string
    {
        return $this->agentName;
    }

    public function getOutput(): string
    {
        return $this->output;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function getDuration(): ?float
    {
        return $this->metadata['duration_ms'] ?? null;
    }

    public function getUsage(): array
    {
        return $this->metadata['usage'] ?? [];
    }

    public function toArray(): array
    {
        return [
            'agent' => $this->agentName,
            'output' => $this->output,
            'metadata' => $this->metadata,
        ];
    }
}
