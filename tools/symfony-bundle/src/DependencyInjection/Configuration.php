<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

/**
 * OSSA Bundle Configuration
 *
 * Defines configuration structure for OSSA agents in Symfony.
 */
class Configuration implements ConfigurationInterface
{
    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder('ossa');
        $rootNode = $treeBuilder->getRootNode();

        $rootNode
            ->children()
                // Global settings
                ->scalarNode('default_provider')
                    ->defaultValue('anthropic')
                    ->info('Default LLM provider (anthropic, openai, google, azure)')
                ->end()
                ->scalarNode('default_model')
                    ->defaultValue('claude-sonnet-4-20250514')
                    ->info('Default LLM model')
                ->end()
                ->floatNode('default_temperature')
                    ->defaultValue(0.7)
                    ->min(0.0)
                    ->max(2.0)
                    ->info('Default temperature (0.0-2.0)')
                ->end()

                // Manifest loading
                ->arrayNode('manifest_paths')
                    ->info('Paths to scan for OSSA manifests')
                    ->defaultValue(['config/agents'])
                    ->scalarPrototype()->end()
                ->end()
                ->booleanNode('auto_discover')
                    ->defaultTrue()
                    ->info('Automatically discover *.ossa.yaml files')
                ->end()

                // LLM Provider configurations
                ->arrayNode('providers')
                    ->info('LLM provider API configurations')
                    ->useAttributeAsKey('name')
                    ->arrayPrototype()
                        ->children()
                            ->scalarNode('api_key')
                                ->info('API key (use %env(ANTHROPIC_API_KEY)% for secrets)')
                            ->end()
                            ->scalarNode('base_url')
                                ->info('Custom API base URL')
                            ->end()
                            ->integerNode('timeout')
                                ->defaultValue(60)
                                ->info('Request timeout in seconds')
                            ->end()
                            ->integerNode('max_retries')
                                ->defaultValue(3)
                                ->info('Maximum retry attempts')
                            ->end()
                        ->end()
                    ->end()
                ->end()

                // Observability
                ->arrayNode('observability')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->booleanNode('enabled')
                            ->defaultTrue()
                            ->info('Enable telemetry and tracing')
                        ->end()
                        ->scalarNode('otlp_endpoint')
                            ->defaultNull()
                            ->info('OpenTelemetry OTLP endpoint')
                        ->end()
                        ->enumNode('log_level')
                            ->values(['debug', 'info', 'warning', 'error'])
                            ->defaultValue('info')
                        ->end()
                    ->end()
                ->end()

                // Safety & Cost Controls
                ->arrayNode('safety')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->booleanNode('pii_detection')
                            ->defaultTrue()
                            ->info('Detect and redact PII')
                        ->end()
                        ->booleanNode('secrets_detection')
                            ->defaultTrue()
                            ->info('Detect and block secrets')
                        ->end()
                        ->floatNode('max_cost_per_day')
                            ->defaultNull()
                            ->info('Maximum cost per day in USD')
                        ->end()
                        ->integerNode('max_tokens_per_day')
                            ->defaultNull()
                            ->info('Maximum tokens per day')
                        ->end()
                    ->end()
                ->end()

                // Agent Definitions
                ->arrayNode('agents')
                    ->info('Inline agent definitions')
                    ->useAttributeAsKey('name')
                    ->arrayPrototype()
                        ->children()
                            ->scalarNode('manifest')
                                ->info('Path to OSSA manifest file')
                            ->end()
                            ->scalarNode('role')
                                ->info('Agent role/purpose')
                            ->end()
                            ->arrayNode('llm')
                                ->children()
                                    ->scalarNode('provider')->end()
                                    ->scalarNode('model')->end()
                                    ->floatNode('temperature')->end()
                                ->end()
                            ->end()
                            ->arrayNode('tools')
                                ->scalarPrototype()->end()
                            ->end()
                        ->end()
                    ->end()
                ->end()

                // MCP Tools
                ->arrayNode('mcp')
                    ->info('MCP (Model Context Protocol) tool servers')
                    ->addDefaultsIfNotSet()
                    ->children()
                        ->booleanNode('enabled')
                            ->defaultTrue()
                        ->end()
                        ->arrayNode('servers')
                            ->useAttributeAsKey('name')
                            ->arrayPrototype()
                                ->children()
                                    ->enumNode('transport')
                                        ->values(['stdio', 'sse', 'websocket'])
                                        ->isRequired()
                                    ->end()
                                    ->scalarNode('command')->end()
                                    ->arrayNode('args')
                                        ->scalarPrototype()->end()
                                    ->end()
                                    ->scalarNode('url')->end()
                                ->end()
                            ->end()
                        ->end()
                    ->end()
                ->end()
            ->end()
        ;

        return $treeBuilder;
    }
}
