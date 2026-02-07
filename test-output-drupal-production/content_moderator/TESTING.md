# Testing Guide

## Overview

The module includes comprehensive test coverage:
- Unit tests (Service logic)
- Kernel tests (Plugin integration)
- Functional tests (UI and execution)

## Running Tests

### All Tests

```bash
./vendor/bin/phpunit -c phpunit.xml
```

### Unit Tests

```bash
./vendor/bin/phpunit tests/src/Unit
```

### Kernel Tests

```bash
./vendor/bin/phpunit tests/src/Kernel
```

### Functional Tests

```bash
./vendor/bin/phpunit tests/src/Functional
```

## Test Coverage

### Unit Tests

- `AgentExecutorTest` - Tests service execution logic
- `MessageHandlerTest` - Tests Messenger handler

### Kernel Tests

- `AgentPluginTest` - Tests plugin discovery and execution
- `EntityStorageTest` - Tests entity CRUD operations

### Functional Tests

- `AdminUITest` - Tests admin UI forms
- `AgentExecutionTest` - Tests end-to-end execution

## Writing Tests

### Unit Test Example

```php
namespace Drupal\Tests\content_moderator\Unit;

use Drupal\Tests\UnitTestCase;

class MyTest extends UnitTestCase {
  public function testSomething() {
    // Test logic
  }
}
```

### Kernel Test Example

```php
namespace Drupal\Tests\content_moderator\Kernel;

use Drupal\KernelTests\KernelTestBase;

class MyTest extends KernelTestBase {
  protected static $modules = ['content_moderator'];

  public function testSomething() {
    // Test logic
  }
}
```

### Functional Test Example

```php
namespace Drupal\Tests\content_moderator\Functional;

use Drupal\Tests\BrowserTestBase;

class MyTest extends BrowserTestBase {
  protected static $modules = ['content_moderator'];

  public function testSomething() {
    // Test UI
  }
}
```

## CI/CD Integration

Add to `.gitlab-ci.yml`:

```yaml
test:
  script:
    - composer install
    - ./vendor/bin/phpunit -c phpunit.xml
```

## Code Coverage

Generate coverage report:

```bash
./vendor/bin/phpunit --coverage-html coverage
```

View: `coverage/index.html`
