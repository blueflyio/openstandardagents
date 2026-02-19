<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Command;

use Ossa\SymfonyBundle\Validator\ManifestValidator;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Finder\Finder;

#[AsCommand(
    name: 'ossa:agent:validate',
    description: 'Validate OSSA agent manifests'
)]
class AgentValidateCommand extends Command
{
    public function __construct(
        private readonly ManifestValidator $validator,
        private readonly array $manifestPaths
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('file', InputArgument::OPTIONAL, 'Specific manifest file to validate');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $specificFile = $input->getArgument('file');

        if ($specificFile) {
            return $this->validateFile($specificFile, $io);
        }

        return $this->validateAll($io);
    }

    private function validateFile(string $filePath, SymfonyStyle $io): int
    {
        $io->title("Validating: {$filePath}");

        try {
            $result = $this->validator->validateFile($filePath);

            if ($result['valid']) {
                $io->success('Manifest is valid');
                return Command::SUCCESS;
            }

            $io->error('Manifest validation failed');
            foreach ($result['errors'] as $error) {
                $io->writeln("  - {$error}");
            }

            return Command::FAILURE;
        } catch (\Exception $e) {
            $io->error("Validation failed: {$e->getMessage()}");
            return Command::FAILURE;
        }
    }

    private function validateAll(SymfonyStyle $io): int
    {
        $io->title('Validating all OSSA manifests');

        $files = $this->findManifests();

        if (empty($files)) {
            $io->warning('No manifest files found');
            return Command::SUCCESS;
        }

        $io->progressStart(count($files));

        $validCount = 0;
        $invalidCount = 0;
        $errors = [];

        foreach ($files as $file) {
            try {
                $result = $this->validator->validateFile($file);

                if ($result['valid']) {
                    $validCount++;
                } else {
                    $invalidCount++;
                    $errors[$file] = $result['errors'];
                }
            } catch (\Exception $e) {
                $invalidCount++;
                $errors[$file] = [$e->getMessage()];
            }

            $io->progressAdvance();
        }

        $io->progressFinish();

        if ($invalidCount > 0) {
            $io->section('Validation Errors');
            foreach ($errors as $file => $fileErrors) {
                $io->error($file);
                foreach ($fileErrors as $error) {
                    $io->writeln("  - {$error}");
                }
            }
        }

        $io->table(
            ['Status', 'Count'],
            [
                ['Valid', $validCount],
                ['Invalid', $invalidCount],
                ['Total', $validCount + $invalidCount],
            ]
        );

        return $invalidCount > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    private function findManifests(): array
    {
        $files = [];

        foreach ($this->manifestPaths as $path) {
            if (!is_dir($path)) {
                continue;
            }

            $finder = new Finder();
            $finder->files()
                ->in($path)
                ->name('*.ossa.yaml')
                ->name('*.ossa.yml');

            foreach ($finder as $file) {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }
}
