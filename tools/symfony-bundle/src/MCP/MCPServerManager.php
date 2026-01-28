<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\MCP;

use Psr\Log\LoggerInterface;

/**
 * MCP Server Manager
 *
 * Manages MCP server connections (stdio, SSE, WebSocket)
 */
class MCPServerManager
{
    private array $servers = [];

    public function __construct(
        private readonly array $mcpConfig,
        private readonly LoggerInterface $logger
    ) {
    }

    public function getServers(): array
    {
        return $this->mcpConfig['servers'] ?? [];
    }

    public function connect(string $serverName): bool
    {
        $servers = $this->getServers();

        if (!isset($servers[$serverName])) {
            $this->logger->error("MCP server not found: {$serverName}");
            return false;
        }

        $config = $servers[$serverName];

        $this->logger->info("Connecting to MCP server: {$serverName}", [
            'transport' => $config['transport'],
        ]);

        // TODO: Implement actual MCP connection logic
        $this->servers[$serverName] = $config;

        return true;
    }
}
