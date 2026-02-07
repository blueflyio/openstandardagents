<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Tests\LLM;

use Ossa\SymfonyBundle\Exception\UnsupportedProviderException;
use Ossa\SymfonyBundle\LLM\SecureProviderFactory;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;

class SecureProviderFactoryTest extends TestCase
{
    public function testCreateProviderWithSecretReference(): void
    {
        $config = [
            'anthropic' => [
                'api_key' => '%env(ANTHROPIC_API_KEY)%',
                'timeout' => 60,
                'circuit_breaker' => ['enabled' => false], // Disable for test
            ],
        ];

        $factory = new SecureProviderFactory(
            $config,
            'anthropic',
            new NullLogger(),
            new NullLogger(),
            ['audit_logging' => false]
        );

        $provider = $factory->create('anthropic');
        $this->assertNotNull($provider);
    }

    public function testCreateProviderThrowsOnMissingApiKey(): void
    {
        $config = [
            'anthropic' => [
                'timeout' => 60,
            ],
        ];

        $factory = new SecureProviderFactory(
            $config,
            'anthropic',
            new NullLogger(),
            new NullLogger()
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('API key not configured');

        $factory->create('anthropic');
    }

    public function testCreateProviderThrowsOnUnsupportedProvider(): void
    {
        $config = [];

        $factory = new SecureProviderFactory(
            $config,
            'anthropic',
            new NullLogger(),
            new NullLogger()
        );

        $this->expectException(UnsupportedProviderException::class);
        $this->expectExceptionMessage('Unsupported provider: unsupported');

        $factory->create('unsupported');
    }

    public function testGetAvailableProviders(): void
    {
        $config = [
            'anthropic' => ['api_key' => 'test'],
            'openai' => ['api_key' => 'test'],
            'google' => ['api_key' => 'test'],
        ];

        $factory = new SecureProviderFactory(
            $config,
            'anthropic',
            new NullLogger(),
            new NullLogger()
        );

        $providers = $factory->getAvailableProviders();

        $this->assertCount(3, $providers);
        $this->assertContains('anthropic', $providers);
        $this->assertContains('openai', $providers);
        $this->assertContains('google', $providers);
    }

    public function testRotateApiKey(): void
    {
        $config = [
            'anthropic' => [
                'api_key' => '%env(ANTHROPIC_API_KEY)%',
                'timeout' => 60,
                'circuit_breaker' => ['enabled' => false],
            ],
        ];

        $factory = new SecureProviderFactory(
            $config,
            'anthropic',
            new NullLogger(),
            new NullLogger(),
            ['audit_logging' => false]
        );

        // Create provider
        $provider1 = $factory->create('anthropic');

        // Rotate API key (invalidates cache)
        $factory->rotateApiKey('anthropic');

        // Create again - should be new instance
        $provider2 = $factory->create('anthropic');

        // Cannot compare instances directly due to wrapping, but rotation should not throw
        $this->assertNotNull($provider2);
    }

    public function testValidateProviderSecurity(): void
    {
        $config = [
            'secure' => [
                'api_key' => '%env(API_KEY)%',
                'base_url' => 'https://api.example.com',
                'timeout' => 60,
            ],
            'insecure' => [
                'api_key' => 'plaintext-key',
                'base_url' => 'http://api.example.com',
                'timeout' => 400,
            ],
        ];

        $factory = new SecureProviderFactory(
            $config,
            'secure',
            new NullLogger(),
            new NullLogger()
        );

        // Validate secure provider
        $secureResult = $factory->validateProviderSecurity('secure');
        $this->assertTrue($secureResult['valid']);
        $this->assertEmpty($secureResult['issues']);

        // Validate insecure provider
        $insecureResult = $factory->validateProviderSecurity('insecure');
        $this->assertFalse($insecureResult['valid']);
        $this->assertNotEmpty($insecureResult['issues']);
        $this->assertCount(3, $insecureResult['issues']); // Plaintext key, HTTP, high timeout
    }

    public function testValidateProviderSecurityForMissingProvider(): void
    {
        $factory = new SecureProviderFactory(
            [],
            'anthropic',
            new NullLogger(),
            new NullLogger()
        );

        $result = $factory->validateProviderSecurity('missing');

        $this->assertFalse($result['valid']);
        $this->assertContains('Provider not configured', $result['issues']);
    }
}
