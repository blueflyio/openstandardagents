<?php

declare(strict_types=1);

namespace Ossa\SymfonyBundle\Observability;

use Psr\Log\LoggerInterface;

/**
 * Telemetry Service
 *
 * Handles OpenTelemetry tracing and metrics
 */
class TelemetryService
{
    public function __construct(
        private readonly array $observabilityConfig,
        private readonly LoggerInterface $logger
    ) {
    }

    public function trace(string $name, callable $callback, array $attributes = []): mixed
    {
        if (!($this->observabilityConfig['enabled'] ?? true)) {
            return $callback();
        }

        $startTime = microtime(true);

        try {
            $result = $callback();

            $this->recordSpan($name, $startTime, $attributes, 'success');

            return $result;
        } catch (\Throwable $e) {
            $this->recordSpan($name, $startTime, $attributes, 'error', $e->getMessage());
            throw $e;
        }
    }

    private function recordSpan(string $name, float $startTime, array $attributes, string $status, ?string $error = null): void
    {
        $duration = (microtime(true) - $startTime) * 1000;

        $this->logger->info("Span: {$name}", [
            'duration_ms' => round($duration, 2),
            'status' => $status,
            'attributes' => $attributes,
            'error' => $error,
        ]);
    }
}
