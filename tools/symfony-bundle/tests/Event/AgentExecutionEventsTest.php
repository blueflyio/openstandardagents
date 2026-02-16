<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Tests\Event;

use Ossa\SymfonyBundle\Event\AgentExecutionCompleteEvent;
use Ossa\SymfonyBundle\Event\AgentExecutionErrorEvent;
use Ossa\SymfonyBundle\Event\AgentExecutionStartEvent;
use Ossa\SymfonyBundle\Model\Agent;
use Ossa\SymfonyBundle\Model\AgentResponse;
use PHPUnit\Framework\TestCase;

class AgentExecutionEventsTest extends TestCase
{
    private Agent $agent;

    protected function setUp(): void
    {
        $this->agent = new Agent(
            name: 'test-agent',
            role: 'Test Role',
            prompt: 'Test Prompt',
            llmConfig: ['provider' => 'anthropic', 'model' => 'claude-sonnet-4'],
            tools: [],
            manifestPath: '/test/manifest.yaml'
        );
    }

    public function testAgentExecutionStartEvent(): void
    {
        $input = 'test input';
        $context = ['key' => 'value'];
        $startTime = microtime(true);

        $event = new AgentExecutionStartEvent($this->agent, $input, $context, $startTime);

        $this->assertSame($this->agent, $event->getAgent());
        $this->assertSame($input, $event->getInput());
        $this->assertSame($context, $event->getContext());
        $this->assertSame($startTime, $event->getStartTime());
        $this->assertSame('test-agent', $event->getAgentName());
    }

    public function testAgentExecutionCompleteEvent(): void
    {
        $response = new AgentResponse(
            agentName: 'test-agent',
            output: 'test output',
            metadata: ['duration_ms' => 100]
        );

        $startTime = microtime(true);
        $endTime = $startTime + 0.1;

        $event = new AgentExecutionCompleteEvent($this->agent, $response, $startTime, $endTime);

        $this->assertSame($this->agent, $event->getAgent());
        $this->assertSame($response, $event->getResponse());
        $this->assertSame($startTime, $event->getStartTime());
        $this->assertSame($endTime, $event->getEndTime());
        $this->assertEqualsWithDelta(0.1, $event->getDuration(), 0.01);
        $this->assertEqualsWithDelta(100, $event->getDurationMs(), 10);
        $this->assertSame('test-agent', $event->getAgentName());
    }

    public function testAgentExecutionErrorEvent(): void
    {
        $error = new \RuntimeException('Test error');
        $input = 'test input';
        $context = ['key' => 'value'];
        $startTime = microtime(true);
        $errorTime = $startTime + 0.05;

        $event = new AgentExecutionErrorEvent(
            $this->agent,
            $error,
            $input,
            $context,
            $startTime,
            $errorTime
        );

        $this->assertSame($this->agent, $event->getAgent());
        $this->assertSame($error, $event->getError());
        $this->assertSame($input, $event->getInput());
        $this->assertSame($context, $event->getContext());
        $this->assertSame($startTime, $event->getStartTime());
        $this->assertSame($errorTime, $event->getErrorTime());
        $this->assertEqualsWithDelta(0.05, $event->getDuration(), 0.01);
        $this->assertEqualsWithDelta(50, $event->getDurationMs(), 10);
        $this->assertSame('test-agent', $event->getAgentName());
        $this->assertSame('Test error', $event->getErrorMessage());
        $this->assertSame(\RuntimeException::class, $event->getErrorClass());
    }
}
