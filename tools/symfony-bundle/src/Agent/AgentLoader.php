<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Agent;

use Ossa\SymfonyBundle\Model\Agent;
use Symfony\Component\Finder\Finder;
use Symfony\Component\Yaml\Yaml;

/**
 * Agent Loader
 *
 * Loads OSSA agent manifests from files
 */
class AgentLoader
{
    public function __construct(
        private readonly array $manifestPaths,
        private readonly bool $autoDiscover
    ) {
    }

    /**
     * Load all agents from configured manifest paths
     *
     * @return array<Agent>
     */
    public function loadFromManifests(): array
    {
        if (!$this->autoDiscover) {
            return [];
        }

        $agents = [];

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
                try {
                    $agent = $this->loadFromFile($file->getPathname());
                    $agents[] = $agent;
                } catch (\Exception $e) {
                    // Log error but continue loading other agents
                    error_log("Failed to load agent from {$file->getPathname()}: {$e->getMessage()}");
                }
            }
        }

        return $agents;
    }

    /**
     * Load agent from a specific file
     */
    public function loadFromFile(string $filePath): Agent
    {
        if (!file_exists($filePath)) {
            throw new \RuntimeException("Manifest file not found: {$filePath}");
        }

        $content = file_get_contents($filePath);
        if ($content === false) {
            throw new \RuntimeException("Failed to read manifest file: {$filePath}");
        }

        $manifest = Yaml::parse($content);
        if (!is_array($manifest)) {
            throw new \RuntimeException("Invalid manifest format in: {$filePath}");
        }

        return Agent::fromManifest($manifest);
    }
}
