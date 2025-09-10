#!/bin/bash
# OSSA v0.1.8 Docker Startup Script
# Provides easy startup options for different OSSA configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art for OSSA
echo -e "${BLUE}"
cat << "EOF"
   ___  _____ _____ ___  
  / _ \/ __/ / __/ / _ \ 
 | (_) \__ \_\__ \/ ___/ 
  \___/___/___//_/       
                         
Open Standards for Scalable Agents
Version 0.1.8
EOF
echo -e "${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_status "Docker is running ✓"
}

# Function to check if docker-compose is available
check_compose() {
    if command -v docker-compose >/dev/null 2>&1; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose is not available. Please install Docker Compose and try again."
        exit 1
    fi
    print_status "Docker Compose is available ✓"
}

# Function to create .env file if it doesn't exist
setup_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status ".env file created ✓"
        else
            print_warning ".env.example not found. Using default environment variables."
        fi
    else
        print_status ".env file exists ✓"
    fi
}

# Function to pull latest images
pull_images() {
    print_status "Pulling latest base images..."
    docker pull node:20-alpine
    docker pull redis:7-alpine
    docker pull postgres:15-alpine
    docker pull qdrant/qdrant:latest
    docker pull prom/prometheus:latest
    docker pull grafana/grafana:latest
    print_status "Base images updated ✓"
}

# Function to display usage
usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "OSSA v0.1.8 Docker Management Script"
    echo ""
    echo "Options:"
    echo "  minimal           Start core services only (Gateway, Redis, PostgreSQL)"
    echo "  standard          Start core services + basic agents"
    echo "  complete          Start all services and agents"
    echo "  agents            Start specialized agent services only"
    echo "  development       Start with development overrides"
    echo "  production        Start with production optimizations"
    echo "  monitoring        Start monitoring stack only"
    echo "  stop              Stop all services"
    echo "  clean             Stop and remove all containers and volumes"
    echo "  logs              Show logs for all services"
    echo "  status            Show status of all services"
    echo "  build             Build all Docker images"
    echo "  help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development    # Start in development mode"
    echo "  $0 complete       # Start full OSSA system"
    echo "  $0 stop           # Stop all services"
    echo "  $0 clean          # Complete cleanup"
}

# Function to start minimal configuration
start_minimal() {
    print_header "Starting OSSA Minimal Configuration"
    print_status "Starting: Gateway, Redis, PostgreSQL, Qdrant"
    
    $COMPOSE_CMD -f docker-compose.yml up -d ossa-gateway redis postgres qdrant
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    show_endpoints_minimal
}

# Function to start standard configuration
start_standard() {
    print_header "Starting OSSA Standard Configuration"
    print_status "Starting: Core services + Task, Communication, MCP agents"
    
    $COMPOSE_CMD -f docker-compose.yml up -d
    
    print_status "Waiting for services to be ready..."
    sleep 15
    
    show_endpoints_standard
}

# Function to start complete configuration
start_complete() {
    print_header "Starting OSSA Complete Configuration"
    print_status "Starting: All services and agents"
    
    $COMPOSE_CMD -f docker-compose.complete.yml up -d
    
    print_status "Waiting for all services to be ready..."
    sleep 20
    
    show_endpoints_complete
}

# Function to start agents only
start_agents() {
    print_header "Starting OSSA Specialized Agents"
    print_status "Starting: Task, Communication, MCP, Data, Analytics, Security agents"
    
    $COMPOSE_CMD -f docker-compose.agents.yml up -d
    
    print_status "Waiting for agents to be ready..."
    sleep 15
    
    show_endpoints_agents
}

# Function to start development mode
start_development() {
    print_header "Starting OSSA Development Mode"
    print_status "Starting with development overrides and debugging"
    
    $COMPOSE_CMD -f docker-compose.yml -f docker-compose.development.yml up -d
    
    print_status "Waiting for development services to be ready..."
    sleep 20
    
    show_endpoints_development
}

# Function to start production mode
start_production() {
    print_header "Starting OSSA Production Mode"
    print_status "Starting with production optimizations"
    
    $COMPOSE_CMD -f docker-compose.yml -f docker-compose.production.yml up -d
    
    print_status "Waiting for production services to be ready..."
    sleep 25
    
    show_endpoints_production
}

# Function to start monitoring only
start_monitoring() {
    print_header "Starting OSSA Monitoring Stack"
    print_status "Starting: Prometheus, Grafana, AlertManager"
    
    $COMPOSE_CMD -f docker-compose.yml up -d prometheus grafana alertmanager node-exporter
    
    print_status "Waiting for monitoring services to be ready..."
    sleep 15
    
    show_endpoints_monitoring
}

# Function to stop all services
stop_services() {
    print_header "Stopping All OSSA Services"
    
    # Stop all possible compose configurations
    $COMPOSE_CMD -f docker-compose.yml -f docker-compose.development.yml down 2>/dev/null || true
    $COMPOSE_CMD -f docker-compose.yml -f docker-compose.production.yml down 2>/dev/null || true
    $COMPOSE_CMD -f docker-compose.complete.yml down 2>/dev/null || true
    $COMPOSE_CMD -f docker-compose.agents.yml down 2>/dev/null || true
    $COMPOSE_CMD -f docker-compose.yml down 2>/dev/null || true
    
    print_status "All OSSA services stopped ✓"
}

# Function to clean up everything
clean_all() {
    print_header "Cleaning Up OSSA Environment"
    print_warning "This will remove all containers, networks, and volumes!"
    
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Stop all services first
        stop_services
        
        # Remove all OSSA containers
        docker ps -a | grep ossa- | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true
        
        # Remove all OSSA images
        docker images | grep ossa | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
        
        # Remove volumes
        $COMPOSE_CMD -f docker-compose.complete.yml down -v 2>/dev/null || true
        
        # Prune unused resources
        docker system prune -f
        
        print_status "OSSA environment cleaned ✓"
    else
        print_status "Cleanup cancelled"
    fi
}

# Function to show logs
show_logs() {
    print_header "OSSA Service Logs"
    
    if [ -z "$2" ]; then
        $COMPOSE_CMD -f docker-compose.yml logs -f
    else
        $COMPOSE_CMD -f docker-compose.yml logs -f "$2"
    fi
}

# Function to show status
show_status() {
    print_header "OSSA Service Status"
    
    # Check container status
    echo -e "\n${YELLOW}Container Status:${NC}"
    docker ps -a | grep ossa- | awk '{print $2 " " $7 " " $1}' | column -t
    
    # Check service health
    echo -e "\n${YELLOW}Service Health:${NC}"
    for service in ossa-gateway ossa-task-agent ossa-comm-agent ossa-mcp-agent ossa-coordination ossa-discovery ossa-orchestration ossa-monitoring; do
        if curl -s "http://localhost:3000/health" >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} $service"
        else
            echo -e "${RED}✗${NC} $service"
        fi
    done
}

# Function to build all images
build_all() {
    print_header "Building All OSSA Images"
    
    print_status "Building Gateway..."
    $COMPOSE_CMD -f docker-compose.complete.yml build ossa-gateway
    
    print_status "Building Agents..."
    $COMPOSE_CMD -f docker-compose.complete.yml build ossa-task-agent ossa-comm-agent ossa-mcp-agent
    
    print_status "Building Data & Analytics Agents..."
    $COMPOSE_CMD -f docker-compose.complete.yml build ossa-data-agent ossa-analytics-agent ossa-security-agent
    
    print_status "Building Infrastructure Services..."
    $COMPOSE_CMD -f docker-compose.complete.yml build ossa-coordination ossa-discovery ossa-orchestration ossa-monitoring
    
    print_status "All images built successfully ✓"
}

# Function to show endpoints for different configurations
show_endpoints_minimal() {
    print_header "OSSA Minimal - Available Endpoints"
    echo -e "Gateway API:      ${GREEN}http://localhost:3000${NC}"
    echo -e "PostgreSQL:       ${GREEN}localhost:5432${NC} (ossa/ossa_dev_password)"
    echo -e "Redis:            ${GREEN}localhost:6379${NC}"
    echo -e "Qdrant:           ${GREEN}http://localhost:6333${NC}"
}

show_endpoints_standard() {
    show_endpoints_minimal
    echo -e "Task Agent:       ${GREEN}http://localhost:3001${NC}"
    echo -e "Comm Agent:       ${GREEN}http://localhost:3002${NC}"
    echo -e "MCP Agent:        ${GREEN}http://localhost:3003${NC}"
    echo -e "Coordination:     ${GREEN}http://localhost:3010${NC}"
    echo -e "Discovery:        ${GREEN}http://localhost:3011${NC}"
    echo -e "Orchestration:    ${GREEN}http://localhost:3012${NC}"
    echo -e "Monitoring:       ${GREEN}http://localhost:3013${NC}"
    echo -e "Grafana:          ${GREEN}http://localhost:3080${NC} (admin/ossa-monitor-2025)"
    echo -e "Prometheus:       ${GREEN}http://localhost:9091${NC}"
}

show_endpoints_complete() {
    show_endpoints_standard
    echo -e "Data Agent:       ${GREEN}http://localhost:3007${NC}"
    echo -e "Analytics Agent:  ${GREEN}http://localhost:3008${NC}"
    echo -e "Security Agent:   ${GREEN}http://localhost:3009${NC}"
}

show_endpoints_agents() {
    print_header "OSSA Agents - Available Endpoints"
    echo -e "Task Agent:       ${GREEN}http://localhost:3001${NC}"
    echo -e "Comm Agent:       ${GREEN}http://localhost:3002${NC}"
    echo -e "MCP Agent:        ${GREEN}http://localhost:3003${NC}"
    echo -e "Data Agent:       ${GREEN}http://localhost:3007${NC}"
    echo -e "Analytics Agent:  ${GREEN}http://localhost:3008${NC}"
    echo -e "Security Agent:   ${GREEN}http://localhost:3009${NC}"
}

show_endpoints_development() {
    show_endpoints_standard
    echo -e "Redis Commander:  ${GREEN}http://localhost:8081${NC}"
    echo -e "pgAdmin:          ${GREEN}http://localhost:5050${NC} (admin@ossa.dev/ossa-dev-2025)"
    echo -e "Swagger UI:       ${GREEN}http://localhost:8080${NC}"
    echo -e "Debug Ports:      ${GREEN}9229-9235${NC} (Node.js debugger)"
}

show_endpoints_production() {
    show_endpoints_standard
    echo -e "Nginx:            ${GREEN}http://localhost:80${NC}"
    echo -e "SSL:              ${GREEN}https://localhost:443${NC}"
}

show_endpoints_monitoring() {
    print_header "OSSA Monitoring - Available Endpoints"
    echo -e "Prometheus:       ${GREEN}http://localhost:9091${NC}"
    echo -e "Grafana:          ${GREEN}http://localhost:3080${NC} (admin/ossa-monitor-2025)"
    echo -e "AlertManager:     ${GREEN}http://localhost:9093${NC}"
    echo -e "Node Exporter:    ${GREEN}http://localhost:9100${NC}"
}

# Main execution
main() {
    check_docker
    check_compose
    setup_env
    
    case "${1:-help}" in
        "minimal")
            start_minimal
            ;;
        "standard")
            start_standard
            ;;
        "complete")
            start_complete
            ;;
        "agents")
            start_agents
            ;;
        "development")
            start_development
            ;;
        "production")
            start_production
            ;;
        "monitoring")
            start_monitoring
            ;;
        "stop")
            stop_services
            ;;
        "clean")
            clean_all
            ;;
        "logs")
            show_logs "$@"
            ;;
        "status")
            show_status
            ;;
        "build")
            build_all
            ;;
        "pull")
            pull_images
            ;;
        "help"|*)
            usage
            ;;
    esac
}

# Run main function with all arguments
main "$@"