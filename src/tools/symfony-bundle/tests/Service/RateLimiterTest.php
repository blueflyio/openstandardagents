<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Tests\Service;

use Ossa\SymfonyBundle\Service\RateLimiter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\RateLimiter\Exception\RateLimitExceededException;
use Symfony\Component\RateLimiter\RateLimit;
use Symfony\Component\RateLimiter\RateLimiterFactory;

class RateLimiterTest extends TestCase
{
    public function testDisabledRateLimiter(): void
    {
        $rateLimiter = new RateLimiter(['enabled' => false]);

        $this->assertFalse($rateLimiter->isEnabled());

        // Should not throw when disabled
        $rateLimiter->checkUserLimit('user1');
        $rateLimiter->checkGlobalLimit();
        $rateLimiter->checkLimits('user1');

        $this->assertTrue(true); // No exception thrown
    }

    public function testEnabledRateLimiterWithoutFactories(): void
    {
        $rateLimiter = new RateLimiter(['enabled' => true]);

        $this->assertTrue($rateLimiter->isEnabled());

        // Should not throw when factories not set
        $rateLimiter->checkUserLimit('user1');
        $rateLimiter->checkGlobalLimit();

        $this->assertTrue(true); // No exception thrown
    }

    public function testGetCapacityWhenDisabled(): void
    {
        $rateLimiter = new RateLimiter(['enabled' => false]);

        $userCapacity = $rateLimiter->getUserCapacity('user1');
        $this->assertSame(PHP_INT_MAX, $userCapacity['available']);
        $this->assertSame(PHP_INT_MAX, $userCapacity['limit']);
        $this->assertNull($userCapacity['reset_time']);

        $globalCapacity = $rateLimiter->getGlobalCapacity();
        $this->assertSame(PHP_INT_MAX, $globalCapacity['available']);
        $this->assertSame(PHP_INT_MAX, $globalCapacity['limit']);
        $this->assertNull($globalCapacity['reset_time']);
    }

    public function testGetConfig(): void
    {
        $config = [
            'enabled' => true,
            'user' => ['limit' => 100, 'interval' => '1 hour'],
            'global' => ['limit' => 1000, 'interval' => '1 hour'],
        ];

        $rateLimiter = new RateLimiter($config);

        $this->assertSame($config, $rateLimiter->getConfig());
    }

    public function testSetFactories(): void
    {
        $rateLimiter = new RateLimiter(['enabled' => true]);

        $userFactory = $this->createMock(RateLimiterFactory::class);
        $globalFactory = $this->createMock(RateLimiterFactory::class);

        $rateLimiter->setUserLimiterFactory($userFactory);
        $rateLimiter->setGlobalLimiterFactory($globalFactory);

        // Should not throw - factories are set
        $this->assertTrue(true);
    }
}
