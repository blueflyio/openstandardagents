<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Tests\Service;

use Ossa\SymfonyBundle\Agent\AgentExecutor;
use Ossa\SymfonyBundle\Model\AgentResponse;
use Ossa\SymfonyBundle\Service\CachedAgentExecutor;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Component\Cache\Adapter\ArrayAdapter;

class CachedAgentExecutorTest extends TestCase
{
    public function testExecuteWithCacheDisabled(): void
    {
        $executor = $this->createMock(AgentExecutor::class);
        $cache = new ArrayAdapter();
        $logger = new NullLogger();

        $cachedExecutor = new CachedAgentExecutor(
            $executor,
            $cache,
            $logger,
            ['enabled' => false]
        );

        $this->assertFalse($cachedExecutor->isEnabled());

        $response = new AgentResponse('test-agent', 'output', []);
        $executor->expects($this->once())
            ->method('execute')
            ->with('test-agent', 'input', [])
            ->willReturn($response);

        $result = $cachedExecutor->execute('test-agent', 'input');

        $this->assertSame($response, $result);
    }

    public function testExecuteWithCacheEnabled(): void
    {
        $executor = $this->createMock(AgentExecutor::class);
        $cache = new ArrayAdapter();
        $logger = new NullLogger();

        $cachedExecutor = new CachedAgentExecutor(
            $executor,
            $cache,
            $logger,
            ['enabled' => true, 'response_ttl' => 3600]
        );

        $this->assertTrue($cachedExecutor->isEnabled());

        $response = new AgentResponse('test-agent', 'output', []);

        // First call - cache miss
        $executor->expects($this->once())
            ->method('execute')
            ->with('test-agent', 'input', [])
            ->willReturn($response);

        $result1 = $cachedExecutor->execute('test-agent', 'input');
        $this->assertSame('output', $result1->getOutput());

        // Second call - cache hit (executor should not be called again)
        $result2 = $cachedExecutor->execute('test-agent', 'input');
        $this->assertSame('output', $result2->getOutput());
    }

    public function testExecuteWithSkipCache(): void
    {
        $executor = $this->createMock(AgentExecutor::class);
        $cache = new ArrayAdapter();
        $logger = new NullLogger();

        $cachedExecutor = new CachedAgentExecutor(
            $executor,
            $cache,
            $logger,
            ['enabled' => true]
        );

        $response = new AgentResponse('test-agent', 'output', []);
        $executor->expects($this->exactly(2))
            ->method('execute')
            ->willReturn($response);

        $cachedExecutor->execute('test-agent', 'input', [], skipCache: true);
        $cachedExecutor->execute('test-agent', 'input', [], skipCache: true);

        // Both calls should hit executor (skipCache = true)
        $this->assertTrue(true);
    }

    public function testInvalidateAgent(): void
    {
        $executor = $this->createMock(AgentExecutor::class);
        $cache = new ArrayAdapter();
        $logger = new NullLogger();

        $cachedExecutor = new CachedAgentExecutor(
            $executor,
            $cache,
            $logger,
            ['enabled' => true]
        );

        $response = new AgentResponse('test-agent', 'output', []);
        $executor->expects($this->exactly(2))
            ->method('execute')
            ->willReturn($response);

        // First call - cache miss
        $cachedExecutor->execute('test-agent', 'input');

        // Invalidate cache
        $cachedExecutor->invalidateAgent('test-agent');

        // Second call - cache miss again (cache was invalidated)
        $cachedExecutor->execute('test-agent', 'input');

        $this->assertTrue(true);
    }

    public function testGetStats(): void
    {
        $executor = $this->createMock(AgentExecutor::class);
        $cache = new ArrayAdapter();
        $logger = new NullLogger();

        $cachedExecutor = new CachedAgentExecutor(
            $executor,
            $cache,
            $logger,
            ['enabled' => true, 'response_ttl' => 7200, 'manifest_ttl' => 86400]
        );

        $stats = $cachedExecutor->getStats();

        $this->assertTrue($stats['enabled']);
        $this->assertSame(7200, $stats['response_ttl']);
        $this->assertSame(86400, $stats['manifest_ttl']);
    }

    public function testGetExecutor(): void
    {
        $executor = $this->createMock(AgentExecutor::class);
        $cache = new ArrayAdapter();
        $logger = new NullLogger();

        $cachedExecutor = new CachedAgentExecutor(
            $executor,
            $cache,
            $logger,
            ['enabled' => true]
        );

        $this->assertSame($executor, $cachedExecutor->getExecutor());
    }

    public function testClearAll(): void
    {
        $executor = $this->createMock(AgentExecutor::class);
        $cache = new ArrayAdapter();
        $logger = new NullLogger();

        $cachedExecutor = new CachedAgentExecutor(
            $executor,
            $cache,
            $logger,
            ['enabled' => true]
        );

        $response = new AgentResponse('test-agent', 'output', []);
        $executor->expects($this->exactly(2))
            ->method('execute')
            ->willReturn($response);

        // First call - cache miss
        $cachedExecutor->execute('test-agent', 'input');

        // Clear all cache
        $cachedExecutor->clearAll();

        // Second call - cache miss again
        $cachedExecutor->execute('test-agent', 'input');

        $this->assertTrue(true);
    }
}
