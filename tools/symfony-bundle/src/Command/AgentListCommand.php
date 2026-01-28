<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Command;

use Ossa\SymfonyBundle\Agent\AgentRegistry;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'ossa:agent:list',
    description: 'List all registered OSSA agents'
)]
class AgentListCommand extends Command
{
    public function __construct(
        private readonly AgentRegistry $registry
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $agents = $this->registry->all();

        if (empty($agents)) {
            $io->warning('No agents registered');
            return Command::SUCCESS;
        }

        $io->title('OSSA Agents');

        $rows = [];
        foreach ($agents as $agent) {
            $llmConfig = $agent->getLLMConfig();
            $rows[] = [
                $agent->getName(),
                $agent->getRole(),
                $llmConfig['provider'] ?? 'N/A',
                $llmConfig['model'] ?? 'N/A',
                count($agent->getTools()),
            ];
        }

        $io->table(
            ['Name', 'Role', 'Provider', 'Model', 'Tools'],
            $rows
        );

        $io->success(sprintf('Found %d agent(s)', count($agents)));

        return Command::SUCCESS;
    }
}
