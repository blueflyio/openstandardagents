# content_moderator

AI-powered content moderation agent for Drupal with ai_agents integration

## Description

Review and moderate user-generated content for quality, spam, and compliance

This module integrates with the ai_agents 1.3.x-dev module and implements async execution via Symfony Messenger.

## Features

- ai_agents 1.3.x-dev integration (extends AIAgentPluginBase)
- Symfony Messenger async execution
- Complete admin UI with dashboard
- Entity storage for execution history
- Configuration management
- Permissions system
- Full test coverage (Unit, Kernel, Functional)
- Production-ready error handling
- Comprehensive logging

## Requirements

- Drupal 10 or 11
- PHP 8.1+
- ai_agents module 1.3.0+

## Installation

```bash
# Install via Composer
composer require drupal/content_moderator

# Enable module
drush en content_moderator
```

## Usage

### Via UI

1. Navigate to: `/admin/config/ossa/content_moderator`
2. Configure settings
3. Execute agent: `/admin/ossa/content_moderator/execute`
4. View dashboard: `/admin/ossa/content_moderator/dashboard`

### Via Code

```php
// Get agent service
$agent = \Drupal::service('content_moderator.agent_executor');

// Execute agent
$result = $agent->execute([
  'input' => 'your data here',
]);

if ($result['success']) {
  print_r($result['data']);
}
```

### Via Drush

```bash
# Execute agent
drush content_moderator:execute '{"input": "data"}'

# View statistics
drush content_moderator:stats
```

## Capabilities

- content-analysis
- spam-detection
- sentiment-analysis
- auto-moderation
- toxicity-detection

## Configuration

Configure at: `/admin/config/ossa/content_moderator`

Options:
- Enable/disable agent
- Enable async execution
- Execution timeout
- Retry attempts on failure

## Async Execution

The module supports async execution via Symfony Messenger:

1. Enable in settings
2. Configure Messenger transport (database, Redis, RabbitMQ)
3. Run consumer: `drush messenger:consume content_moderator_execution`

## Testing

```bash
# Run all tests
./vendor/bin/phpunit -c phpunit.xml

# Run unit tests
./vendor/bin/phpunit tests/src/Unit

# Run kernel tests
./vendor/bin/phpunit tests/src/Kernel

# Run functional tests
./vendor/bin/phpunit tests/src/Functional
```

## Generated from OSSA

This module was generated from an OSSA ossa/v0.4.x manifest.

Original manifest: `config/ossa/content_moderator.agent.yml`

## License

GPL-2.0-or-later

## Documentation

- [Installation Guide](INSTALL.md)
- [API Documentation](API.md)
- [Testing Guide](TESTING.md)

## Support

For issues, please use the Drupal.org issue queue.
