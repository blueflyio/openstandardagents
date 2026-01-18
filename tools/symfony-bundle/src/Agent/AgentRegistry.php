<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Agent;

use Ossa\SymfonyBundle\Exception\AgentNotFoundException;
use Ossa\SymfonyBundle\Model\Agent;

/**
 * Agent Registry
 *
 * Central registry for all OSSA agents in the application.
 * Loads agents from manifests and configuration.
 */
class AgentRegistry
{
    /** @var array<string, Agent> */
    private array $agents = [];

    public function __construct(
        private readonly array $config,
        private readonly AgentLoader $loader
    ) {
        $this->loadAgents();
    }

    /**
     * Register an agent
     */
    public function register(Agent $agent): void
    {
        $this->agents[$agent->getName()] = $agent;
    }

    /**
     * Get an agent by name
     *
     * @throws AgentNotFoundException
     */
    public function get(string $name): Agent
    {
        if (!isset($this->agents[$name])) {
            throw new AgentNotFoundException("Agent '{$name}' not found");
        }

        return $this->agents[$name];
    }

    /**
     * Check if an agent exists
     */
    public function has(string $name): bool
    {
        return isset($this->agents[$name]);
    }

    /**
     * Get all registered agents
     *
     * @return array<string, Agent>
     */
    public function all(): array
    {
        return $this->agents;
    }

    /**
     * Get agent names
     *
     * @return array<int, string>
     */
    public function getNames(): array
    {
        return array_keys($this->agents);
    }

    /**
     * Load agents from manifests and configuration
     */
    private function loadAgents(): void
    {
        // Load from manifest files
        $manifestAgents = $this->loader->loadFromManifests();
        foreach ($manifestAgents as $agent) {
            $this->register($agent);
        }

        // Load from configuration
        foreach ($this->config['agents'] ?? [] as $name => $agentConfig) {
            if (isset($agentConfig['manifest'])) {
                // Load from manifest file
                $agent = $this->loader->loadFromFile($agentConfig['manifest']);
            } else {
                // Create from inline config
                $agent = Agent::fromConfig($name, $agentConfig);
            }

            $this->register($agent);
        }
    }
}
