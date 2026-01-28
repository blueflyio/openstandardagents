<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\DependencyInjection;

use Ossa\SymfonyBundle\Agent\AgentExecutor;
use Ossa\SymfonyBundle\Agent\AgentRegistry;
use Ossa\SymfonyBundle\Command\AgentExecuteCommand;
use Ossa\SymfonyBundle\Command\AgentListCommand;
use Ossa\SymfonyBundle\Command\AgentValidateCommand;
use Ossa\SymfonyBundle\LLM\LLMProviderFactory;
use Ossa\SymfonyBundle\Validator\ManifestValidator;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\Extension;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

/**
 * OSSA Bundle Extension
 *
 * Loads and processes OSSA configuration, registers services.
 */
class OssaExtension extends Extension
{
    public function load(array $configs, ContainerBuilder $container): void
    {
        $configuration = new Configuration();
        $config = $this->processConfiguration($configuration, $configs);

        // Store config as parameters
        $container->setParameter('ossa.config', $config);
        $container->setParameter('ossa.default_provider', $config['default_provider']);
        $container->setParameter('ossa.default_model', $config['default_model']);
        $container->setParameter('ossa.default_temperature', $config['default_temperature']);
        $container->setParameter('ossa.manifest_paths', $config['manifest_paths']);
        $container->setParameter('ossa.auto_discover', $config['auto_discover']);
        $container->setParameter('ossa.providers', $config['providers']);
        $container->setParameter('ossa.observability', $config['observability']);
        $container->setParameter('ossa.safety', $config['safety']);
        $container->setParameter('ossa.mcp', $config['mcp']);

        // Register core services
        $loader = new YamlFileLoader($container, new FileLocator(__DIR__.'/../../config'));
        $loader->load('services.yaml');

        // Register agent definitions from config
        $this->registerAgents($config['agents'], $container);
    }

    private function registerAgents(array $agents, ContainerBuilder $container): void
    {
        foreach ($agents as $name => $agentConfig) {
            // Each agent config will be registered in the AgentRegistry
            // This happens at runtime via the AgentRegistry service
        }
    }

    public function getAlias(): string
    {
        return 'ossa';
    }
}
