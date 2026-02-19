<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\MCP;

/**
 * MCP Tool Registry
 *
 * Manages Model Context Protocol (MCP) tools
 */
class MCPToolRegistry
{
    private array $tools = [];

    public function __construct(
        private readonly array $mcpConfig
    ) {
    }

    public function register(string $name, callable $tool): void
    {
        $this->tools[$name] = $tool;
    }

    public function get(string $name): ?callable
    {
        return $this->tools[$name] ?? null;
    }

    public function all(): array
    {
        return $this->tools;
    }
}
