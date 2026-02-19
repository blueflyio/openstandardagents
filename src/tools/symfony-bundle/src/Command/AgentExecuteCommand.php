<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Command;

use Ossa\SymfonyBundle\Agent\AgentExecutor;
use Ossa\SymfonyBundle\Agent\AgentRegistry;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'ossa:agent:execute',
    description: 'Execute an OSSA agent'
)]
class AgentExecuteCommand extends Command
{
    public function __construct(
        private readonly AgentExecutor $executor,
        private readonly AgentRegistry $registry
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('agent', InputArgument::REQUIRED, 'Agent name')
            ->addArgument('input', InputArgument::REQUIRED, 'Input text')
            ->addOption('context', 'c', InputOption::VALUE_OPTIONAL | InputOption::VALUE_IS_ARRAY, 'Context key=value pairs');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $agentName = $input->getArgument('agent');
        $inputText = $input->getArgument('input');
        $contextArray = $this->parseContext($input->getOption('context'));

        if (!$this->registry->has($agentName)) {
            $io->error("Agent '{$agentName}' not found");
            $io->note('Available agents: ' . implode(', ', $this->registry->getNames()));
            return Command::FAILURE;
        }

        $io->title("Executing Agent: {$agentName}");

        try {
            $response = $this->executor->execute($agentName, $inputText, $contextArray);

            $io->section('Output');
            $io->writeln($response->getOutput());

            $io->section('Metadata');
            $io->horizontalTable(
                ['Duration (ms)', 'Model', 'Provider', 'Total Tokens'],
                [[
                    $response->getDuration(),
                    $response->getMetadata()['model'] ?? 'N/A',
                    $response->getMetadata()['provider'] ?? 'N/A',
                    $response->getUsage()['total_tokens'] ?? 'N/A',
                ]]
            );

            $io->success('Agent execution completed');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $io->error("Agent execution failed: {$e->getMessage()}");
            return Command::FAILURE;
        }
    }

    private function parseContext(array $contextPairs): array
    {
        $context = [];
        foreach ($contextPairs as $pair) {
            [$key, $value] = explode('=', $pair, 2);
            $context[$key] = $value;
        }
        return $context;
    }
}
