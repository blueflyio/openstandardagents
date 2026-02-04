<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Tests\LLM;

use Ossa\SymfonyBundle\LLM\CircuitBreakerProvider;
use Ossa\SymfonyBundle\LLM\LLMProviderInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;

class CircuitBreakerProviderTest extends TestCase
{
    public function testSuccessfulExecutionKeepsCircuitClosed(): void
    {
        $provider = $this->createMock(LLMProviderInterface::class);
        $logger = new NullLogger();

        $circuitBreaker = new CircuitBreakerProvider(
            $provider,
            $logger,
            [
                'failure_threshold' => 3,
                'reset_timeout' => 60,
                'max_retries' => 2,
            ]
        );

        $provider->expects($this->once())
            ->method('complete')
            ->willReturn(['content' => 'response', 'usage' => []]);

        $result = $circuitBreaker->complete('model', 'prompt');

        $this->assertSame('response', $result['content']);

        $state = $circuitBreaker->getState();
        $this->assertSame('closed', $state['state']);
        $this->assertSame(0, $state['failure_count']);
    }

    public function testFailureIncreasesCount(): void
    {
        $provider = $this->createMock(LLMProviderInterface::class);
        $logger = new NullLogger();

        $circuitBreaker = new CircuitBreakerProvider(
            $provider,
            $logger,
            [
                'failure_threshold' => 3,
                'reset_timeout' => 60,
                'max_retries' => 1,
            ]
        );

        $provider->expects($this->once())
            ->method('complete')
            ->willThrowException(new \RuntimeException('API Error'));

        try {
            $circuitBreaker->complete('model', 'prompt');
            $this->fail('Expected exception');
        } catch (\RuntimeException $e) {
            $this->assertSame('API Error', $e->getMessage());
        }

        $state = $circuitBreaker->getState();
        $this->assertSame(1, $state['failure_count']);
    }

    public function testCircuitOpensAfterThreshold(): void
    {
        $provider = $this->createMock(LLMProviderInterface::class);
        $logger = new NullLogger();

        $circuitBreaker = new CircuitBreakerProvider(
            $provider,
            $logger,
            [
                'failure_threshold' => 2,
                'reset_timeout' => 60,
                'max_retries' => 1,
            ]
        );

        $provider->method('complete')
            ->willThrowException(new \RuntimeException('API Error'));

        // First failure
        try {
            $circuitBreaker->complete('model', 'prompt');
        } catch (\RuntimeException $e) {
            // Expected
        }

        // Second failure - should open circuit
        try {
            $circuitBreaker->complete('model', 'prompt');
        } catch (\RuntimeException $e) {
            // Expected
        }

        $state = $circuitBreaker->getState();
        $this->assertSame('open', $state['state']);
        $this->assertSame(2, $state['failure_count']);
        $this->assertNotNull($state['next_retry']);
    }

    public function testManualCircuitControl(): void
    {
        $provider = $this->createMock(LLMProviderInterface::class);
        $logger = new NullLogger();

        $circuitBreaker = new CircuitBreakerProvider($provider, $logger);

        // Open circuit manually
        $circuitBreaker->open();
        $state = $circuitBreaker->getState();
        $this->assertSame('open', $state['state']);

        // Close circuit manually
        $circuitBreaker->close();
        $state = $circuitBreaker->getState();
        $this->assertSame('closed', $state['state']);
        $this->assertSame(0, $state['failure_count']);
    }

    public function testGetStateReturnsCorrectStructure(): void
    {
        $provider = $this->createMock(LLMProviderInterface::class);
        $logger = new NullLogger();

        $circuitBreaker = new CircuitBreakerProvider($provider, $logger);

        $state = $circuitBreaker->getState();

        $this->assertArrayHasKey('state', $state);
        $this->assertArrayHasKey('failure_count', $state);
        $this->assertArrayHasKey('last_failure', $state);
        $this->assertArrayHasKey('next_retry', $state);

        $this->assertSame('closed', $state['state']);
        $this->assertSame(0, $state['failure_count']);
        $this->assertNull($state['last_failure']);
        $this->assertNull($state['next_retry']);
    }
}
