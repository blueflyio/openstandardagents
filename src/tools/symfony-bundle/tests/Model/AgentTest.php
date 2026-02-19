<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Tests\Model;

use Ossa\SymfonyBundle\Model\Agent;
use PHPUnit\Framework\TestCase;

class AgentTest extends TestCase
{
    public function testFromManifest(): void
    {
        $manifest = [
            'apiVersion' => 'ossa/v0.3',
            'kind' => 'Agent',
            'metadata' => [
                'name' => 'test-agent',
                'labels' => ['team' => 'testing'],
            ],
            'spec' => [
                'role' => 'Test agent',
                'llm' => [
                    'provider' => 'anthropic',
                    'model' => 'claude-sonnet-4',
                ],
                'tools' => ['read_file', 'write_file'],
                'capabilities' => ['coding', 'analysis'],
            ],
        ];

        $agent = Agent::fromManifest($manifest);

        $this->assertSame('test-agent', $agent->getName());
        $this->assertSame('ossa/v0.3', $agent->getApiVersion());
        $this->assertSame('Agent', $agent->getKind());
        $this->assertSame('Test agent', $agent->getRole());
        $this->assertCount(2, $agent->getTools());
        $this->assertCount(2, $agent->getCapabilities());
    }

    public function testFromConfig(): void
    {
        $agent = Agent::fromConfig('config-agent', [
            'role' => 'Config-based agent',
            'llm' => [
                'provider' => 'openai',
                'model' => 'gpt-4',
            ],
        ]);

        $this->assertSame('config-agent', $agent->getName());
        $this->assertSame('Config-based agent', $agent->getRole());
        $this->assertSame('openai', $agent->getLLMConfig()['provider']);
    }

    public function testToArray(): void
    {
        $manifest = [
            'apiVersion' => 'ossa/v0.3',
            'kind' => 'Agent',
            'metadata' => ['name' => 'test'],
            'spec' => ['role' => 'Test'],
        ];

        $agent = Agent::fromManifest($manifest);
        $array = $agent->toArray();

        $this->assertArrayHasKey('apiVersion', $array);
        $this->assertArrayHasKey('kind', $array);
        $this->assertArrayHasKey('metadata', $array);
        $this->assertArrayHasKey('spec', $array);
    }
}
