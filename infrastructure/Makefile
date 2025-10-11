.PHONY: build run test deploy clean help

SERVICE_NAME = ossa
SERVICE_PORT = 7000

help:
	@echo "Available targets:"
	@echo "  build  - Build Docker image"
	@echo "  run    - Start service with docker-compose"
	@echo "  test   - Run tests"
	@echo "  deploy - Deploy to Kubernetes"
	@echo "  clean  - Clean up containers"

build:
	docker build -t $(SERVICE_NAME) -f infrastructure/docker/Dockerfile .

run:
	docker-compose -f infrastructure/docker/docker-compose.yml up -d

test:
	npm test

deploy:
	kubectl apply -f infrastructure/kubernetes/

clean:
	docker-compose -f infrastructure/docker/docker-compose.yml down -v
