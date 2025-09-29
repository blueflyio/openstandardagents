# OSSA Infrastructure Makefile
# Standard commands for LLM ecosystem deployment

.PHONY: dev prod standalone status logs clean help

# Development commands
dev:
	@echo "🚀 Starting OSSA development environment..."
	docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d --build

prod:
	@echo "🚀 Starting OSSA production environment..."
	docker-compose -f docker/docker-compose.yml up -d --build

standalone:
	@echo "🚀 Starting OSSA standalone..."
	docker-compose -f docker/docker-compose.yml up -d --build

# Status and monitoring
status:
	@echo "📊 OSSA Service Status:"
	@echo "─────────────────────────"
	docker-compose -f docker/docker-compose.yml ps
	@echo "\n🌐 Service URLs:"
	@echo "  API:       http://localhost:3000"
	@echo "  WebSocket: ws://localhost:3001"
	@echo "  Metrics:   http://localhost:3002/metrics"
	@echo "  Health:    http://localhost:3000/health"

logs:
	docker-compose -f docker/docker-compose.yml logs -f --tail=100

# Kubernetes deployment
helm-install:
	@echo "☸️  Installing OSSA via Helm..."
	helm install ossa ./helm/

helm-upgrade:
	@echo "☸️  Upgrading OSSA via Helm..."
	helm upgrade ossa ./helm/

helm-uninstall:
	@echo "☸️  Uninstalling OSSA via Helm..."
	helm uninstall ossa

# Cleanup
stop:
	docker-compose -f docker/docker-compose.yml down

clean:
	@echo "🧹 Cleaning OSSA environment..."
	docker-compose -f docker/docker-compose.yml down -v --remove-orphans
	docker system prune -f

# Health checks
health:
	@echo "🏥 Checking OSSA health..."
	curl -f http://localhost:3000/health || echo "❌ Health check failed"

# Help
help:
	@echo "OSSA Infrastructure Commands:"
	@echo "  dev        - Start development environment"
	@echo "  prod       - Start production environment"
	@echo "  standalone - Start standalone deployment"
	@echo "  status     - Show service status and URLs"
	@echo "  logs       - Show service logs"
	@echo "  stop       - Stop all services"
	@echo "  clean      - Clean all containers and volumes"
	@echo "  health     - Check service health"
	@echo "  help       - Show this help"