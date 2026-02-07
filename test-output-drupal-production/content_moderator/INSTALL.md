# Installation Guide

## Requirements

- Drupal 10 or 11
- PHP 8.1+
- Composer
- ai_agents module 1.3.0+

## Installation Steps

### 1. Install via Composer

```bash
composer require drupal/content_moderator
```

### 2. Enable Module

```bash
drush en content_moderator
```

Or via UI: `/admin/modules`

### 3. Configure Permissions

Navigate to: `/admin/people/permissions`

Grant permissions:
- `administer content_moderator` - for administrators
- `execute content_moderator` - for users who should execute
- `view content_moderator executions` - for viewing results

### 4. Configure Module

Navigate to: `/admin/config/ossa/content_moderator`

Set:
- Enable agent
- Enable async execution
- Execution timeout
- Retry attempts

### 5. (Optional) Configure Symfony Messenger

For async execution, configure transport in `services.yml`:

```yaml
framework:
  messenger:
    transports:
      content_moderator_execution:
        dsn: 'doctrine://default'
        options:
          queue_name: content_moderator_execution
```

Supported transports:
- Database: `doctrine://default`
- Redis: `redis://localhost:6379/messages`
- RabbitMQ: `amqp://localhost/%2f/messages`

### 6. Run Consumer (for async)

```bash
drush messenger:consume content_moderator_execution
```

Or use Supervisor/systemd to run as daemon.

## Verification

1. Navigate to: `/admin/ossa/content_moderator/dashboard`
2. You should see the agent dashboard
3. Try executing: `/admin/ossa/content_moderator/execute`

## Troubleshooting

### Module won't enable

- Check PHP version (>= 8.1)
- Verify ai_agents module is installed
- Check `drush pml | grep ai_agents`

### Async execution not working

- Verify Messenger is configured
- Check consumer is running
- Check queue: `drush queue:list`

### Permissions errors

- Check user has correct permissions
- Clear cache: `drush cr`

## Uninstallation

```bash
# Disable module
drush pmu content_moderator

# Remove via Composer
composer remove drupal/content_moderator
```
