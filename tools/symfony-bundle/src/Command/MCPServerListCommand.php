<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Command;

use Ossa\SymfonyBundle\MCP\MCPServerManager;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'ossa:mcp:list',
    description: 'List configured MCP tool servers'
)]
class MCPServerListCommand extends Command
{
    public function __construct(
        private readonly MCPServerManager $mcpManager
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $servers = $this->mcpManager->getServers();

        if (empty($servers)) {
            $io->warning('No MCP servers configured');
            return Command::SUCCESS;
        }

        $io->title('MCP Tool Servers');

        $rows = [];
        foreach ($servers as $name => $config) {
            $rows[] = [
                $name,
                $config['transport'],
                $config['command'] ?? $config['url'] ?? 'N/A',
            ];
        }

        $io->table(
            ['Name', 'Transport', 'Connection'],
            $rows
        );

        $io->success(sprintf('Found %d MCP server(s)', count($servers)));

        return Command::SUCCESS;
    }
}
