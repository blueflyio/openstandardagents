<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Model;

/**
 * OSSA Agent Model
 *
 * Represents an OSSA v0.3.x agent manifest
 */
class Agent
{
    private string $apiVersion;
    private string $kind;
    private array $metadata;
    private array $spec;

    public function __construct(
        string $apiVersion,
        string $kind,
        array $metadata,
        array $spec
    ) {
        $this->apiVersion = $apiVersion;
        $this->kind = $kind;
        $this->metadata = $metadata;
        $this->spec = $spec;
    }

    /**
     * Create Agent from OSSA manifest array
     */
    public static function fromManifest(array $manifest): self
    {
        return new self(
            $manifest['apiVersion'] ?? '',
            $manifest['kind'] ?? '',
            $manifest['metadata'] ?? [],
            $manifest['spec'] ?? []
        );
    }

    /**
     * Create Agent from configuration array
     */
    public static function fromConfig(string $name, array $config): self
    {
        $manifest = [
            'apiVersion' => 'ossa/v0.3',
            'kind' => 'Agent',
            'metadata' => [
                'name' => $name,
                'labels' => $config['labels'] ?? [],
            ],
            'spec' => [
                'role' => $config['role'] ?? '',
                'llm' => $config['llm'] ?? [],
                'tools' => $config['tools'] ?? [],
                'capabilities' => $config['capabilities'] ?? [],
            ],
        ];

        return self::fromManifest($manifest);
    }

    public function getName(): string
    {
        return $this->metadata['name'] ?? '';
    }

    public function getApiVersion(): string
    {
        return $this->apiVersion;
    }

    public function getKind(): string
    {
        return $this->kind;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function getSpec(): array
    {
        return $this->spec;
    }

    public function getRole(): string
    {
        return $this->spec['role'] ?? '';
    }

    public function getLLMConfig(): array
    {
        return $this->spec['llm'] ?? [];
    }

    public function getTools(): array
    {
        return $this->spec['tools'] ?? [];
    }

    public function getCapabilities(): array
    {
        return $this->spec['capabilities'] ?? [];
    }

    public function getPrompt(): ?string
    {
        return $this->spec['prompt'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'apiVersion' => $this->apiVersion,
            'kind' => $this->kind,
            'metadata' => $this->metadata,
            'spec' => $this->spec,
        ];
    }
}
