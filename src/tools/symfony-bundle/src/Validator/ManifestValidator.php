<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Validator;

use Symfony\Component\Yaml\Yaml;

/**
 * OSSA Manifest Validator
 *
 * Validates OSSA v0.3.x manifests against the JSON schema
 */
class ManifestValidator
{
    public function __construct(
        private readonly string $schemaPath
    ) {
    }

    /**
     * Validate a manifest file
     *
     * @return array{valid: bool, errors: array<string>}
     */
    public function validateFile(string $filePath): array
    {
        if (!file_exists($filePath)) {
            return [
                'valid' => false,
                'errors' => ["File not found: {$filePath}"],
            ];
        }

        $content = file_get_contents($filePath);
        $manifest = Yaml::parse($content);

        return $this->validateManifest($manifest);
    }

    /**
     * Validate a manifest array
     *
     * @return array{valid: bool, errors: array<string>}
     */
    public function validateManifest(array $manifest): array
    {
        $errors = [];

        // Required fields
        if (!isset($manifest['apiVersion'])) {
            $errors[] = 'Missing required field: apiVersion';
        } elseif (!str_starts_with($manifest['apiVersion'], 'ossa/v0.3')) {
            $errors[] = "Invalid apiVersion: {$manifest['apiVersion']} (expected ossa/v0.3.x)";
        }

        if (!isset($manifest['kind'])) {
            $errors[] = 'Missing required field: kind';
        } elseif (!in_array($manifest['kind'], ['Agent', 'Tool', 'Workflow', 'Extension'])) {
            $errors[] = "Invalid kind: {$manifest['kind']}";
        }

        if (!isset($manifest['metadata']['name'])) {
            $errors[] = 'Missing required field: metadata.name';
        }

        if (!isset($manifest['spec'])) {
            $errors[] = 'Missing required field: spec';
        }

        // Validate spec based on kind
        if (isset($manifest['kind']) && $manifest['kind'] === 'Agent') {
            $this->validateAgentSpec($manifest['spec'] ?? [], $errors);
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    private function validateAgentSpec(array $spec, array &$errors): void
    {
        if (empty($spec['role'])) {
            $errors[] = 'Agent spec.role is required';
        }

        if (empty($spec['llm'])) {
            $errors[] = 'Agent spec.llm is required';
        } else {
            if (empty($spec['llm']['provider'])) {
                $errors[] = 'Agent spec.llm.provider is required';
            }

            if (empty($spec['llm']['model'])) {
                $errors[] = 'Agent spec.llm.model is required';
            }
        }
    }
}
