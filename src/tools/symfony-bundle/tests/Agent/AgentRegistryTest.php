<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Tests\Agent;

use Ossa\SymfonyBundle\Agent\AgentLoader;
use Ossa\SymfonyBundle\Agent\AgentRegistry;
use Ossa\SymfonyBundle\Exception\AgentNotFoundException;
use Ossa\SymfonyBundle\Model\Agent;
use PHPUnit\Framework\TestCase;

class AgentRegistryTest extends TestCase
{
    public function testRegisterAndGetAgent(): void
    {
        $loader = $this->createMock(AgentLoader::class);
        $loader->method('loadFromManifests')->willReturn([]);

        $registry = new AgentRegistry(
            config: ['agents' => []],
            loader: $loader
        );

        $agent = Agent::fromConfig('test-agent', [
            'role' => 'Test agent',
            'llm' => [
                'provider' => 'anthropic',
                'model' => 'claude-sonnet-4',
            ],
        ]);

        $registry->register($agent);

        $this->assertTrue($registry->has('test-agent'));
        $this->assertSame($agent, $registry->get('test-agent'));
    }

    public function testGetNonExistentAgentThrowsException(): void
    {
        $loader = $this->createMock(AgentLoader::class);
        $loader->method('loadFromManifests')->willReturn([]);

        $registry = new AgentRegistry(
            config: ['agents' => []],
            loader: $loader
        );

        $this->expectException(AgentNotFoundException::class);
        $registry->get('non-existent');
    }

    public function testGetAllAgents(): void
    {
        $loader = $this->createMock(AgentLoader::class);
        $loader->method('loadFromManifests')->willReturn([]);

        $registry = new AgentRegistry(
            config: ['agents' => []],
            loader: $loader
        );

        $agent1 = Agent::fromConfig('agent1', ['role' => 'Agent 1']);
        $agent2 = Agent::fromConfig('agent2', ['role' => 'Agent 2']);

        $registry->register($agent1);
        $registry->register($agent2);

        $all = $registry->all();

        $this->assertCount(2, $all);
        $this->assertArrayHasKey('agent1', $all);
        $this->assertArrayHasKey('agent2', $all);
    }

    public function testGetAgentNames(): void
    {
        $loader = $this->createMock(AgentLoader::class);
        $loader->method('loadFromManifests')->willReturn([]);

        $registry = new AgentRegistry(
            config: ['agents' => []],
            loader: $loader
        );

        $agent1 = Agent::fromConfig('agent1', ['role' => 'Agent 1']);
        $agent2 = Agent::fromConfig('agent2', ['role' => 'Agent 2']);

        $registry->register($agent1);
        $registry->register($agent2);

        $names = $registry->getNames();

        $this->assertCount(2, $names);
        $this->assertContains('agent1', $names);
        $this->assertContains('agent2', $names);
    }
}
