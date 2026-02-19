<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle;

use Ossa\SymfonyBundle\DependencyInjection\OssaExtension;
use Symfony\Component\HttpKernel\Bundle\Bundle;

/**
 * OSSA Symfony Bundle
 *
 * Integrates Open Standard Agents (OSSA) into Symfony applications.
 *
 * Features:
 * - Agent manifest validation
 * - Agent execution and orchestration
 * - LLM provider integration (Anthropic, OpenAI, Google, etc.)
 * - MCP tools support
 * - Event-driven agent triggers
 * - Cost tracking and observability
 * - Safety guardrails
 *
 * @link https://openstandardagents.org/spec/v0.3/
 */
class OssaBundle extends Bundle
{
    public function getPath(): string
    {
        return \dirname(__DIR__);
    }

    public function getContainerExtension(): OssaExtension
    {
        return new OssaExtension();
    }
}
