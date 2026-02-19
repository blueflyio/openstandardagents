.PHONY: help install test phpstan cs-check cs-fix coverage clean

help: ## Display this help message
	@echo "OSSA Symfony Bundle - Development Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	composer install

test: ## Run PHPUnit tests
	vendor/bin/phpunit

phpstan: ## Run PHPStan static analysis
	vendor/bin/phpstan analyse src --level=8

cs-check: ## Check code style
	vendor/bin/php-cs-fixer fix --dry-run --diff

cs-fix: ## Fix code style
	vendor/bin/php-cs-fixer fix

coverage: ## Generate test coverage report
	XDEBUG_MODE=coverage vendor/bin/phpunit --coverage-html=var/coverage/html
	@echo "Coverage report: var/coverage/html/index.html"

clean: ## Clean build artifacts
	rm -rf vendor/ var/ .phpunit.cache composer.lock

ci: install phpstan cs-check test ## Run CI pipeline (install, phpstan, cs-check, test)
