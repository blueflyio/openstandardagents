#!/bin/bash

# OSSA Enterprise Monitoring Stack Startup Script
# Version: 0.1.8 - Production Deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_DIR="/Users/flux423/Sites/LLM/OSSA/monitoring"
COMPOSE_FILE="docker-compose.monitoring.yml"
HEALTH_CHECK_TIMEOUT=300 # 5 minutes
LOG_LEVEL="info"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[OSSA Monitoring]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    
    # Check available disk space (require at least 10GB)
    available_space=$(df -BG "$MONITORING_DIR" | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$available_space" -lt 10 ]; then
        print_warning "Less than 10GB disk space available. Monitoring may consume significant storage."
    fi
    
    # Check available memory (require at least 8GB)
    available_memory=$(free -g | awk '/^Mem:/{print $7}')
    if [ "$available_memory" -lt 8 ]; then
        print_warning "Less than 8GB memory available. Some services may experience performance issues."
    fi
    
    print_success "Prerequisites check completed"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p "$MONITORING_DIR/data/prometheus"
    mkdir -p "$MONITORING_DIR/data/grafana" 
    mkdir -p "$MONITORING_DIR/data/alertmanager"
    mkdir -p "$MONITORING_DIR/data/jaeger"
    mkdir -p "$MONITORING_DIR/data/loki"
    mkdir -p "$MONITORING_DIR/data/vector"
    mkdir -p "$MONITORING_DIR/logs"
    
    # Set appropriate permissions
    chmod 755 "$MONITORING_DIR/data"/*
    
    print_success "Directories created"
}

# Function to validate configuration files
validate_config() {
    print_status "Validating configuration files..."
    
    local config_files=(
        "prometheus/prometheus.yml"
        "grafana/provisioning/datasources/prometheus.yml"
        "alertmanager/alertmanager.yml"
        "opentelemetry/otel-collector-config.yaml"
        "loki/loki-config.yml"
        "vector/vector-config.toml"
    )
    
    for config_file in "${config_files[@]}"; do
        if [ ! -f "$MONITORING_DIR/$config_file" ]; then
            print_error "Configuration file missing: $config_file"
            exit 1
        fi
    done
    
    # Validate Prometheus config
    if ! docker run --rm -v "$MONITORING_DIR/prometheus:/etc/prometheus" prom/prometheus:latest promtool check config /etc/prometheus/prometheus.yml > /dev/null 2>&1; then
        print_error "Prometheus configuration validation failed"
        exit 1
    fi
    
    print_success "Configuration validation completed"
}

# Function to start services
start_services() {
    print_status "Starting OSSA monitoring services..."
    
    cd "$MONITORING_DIR"
    
    # Pull latest images
    print_status "Pulling latest Docker images..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Start services in dependency order
    print_status "Starting core services..."
    docker-compose -f "$COMPOSE_FILE" up -d prometheus grafana alertmanager
    
    # Wait for core services to be ready
    sleep 30
    
    print_status "Starting logging and tracing services..."
    docker-compose -f "$COMPOSE_FILE" up -d loki jaeger otel-collector
    
    # Wait for logging services
    sleep 20
    
    print_status "Starting additional monitoring services..."
    docker-compose -f "$COMPOSE_FILE" up -d node-exporter cadvisor blackbox-exporter vector
    
    # Final service startup
    print_status "Starting remaining services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    print_success "All services started"
}

# Function to check service health
check_service_health() {
    print_status "Checking service health..."
    
    local services=(
        "prometheus:9090:/api/v1/status/config"
        "grafana:3000:/api/health"
        "alertmanager:9093:/api/v1/status"
        "jaeger:16686:/api/traces"
        "loki:3100:/ready"
    )
    
    local timeout=$HEALTH_CHECK_TIMEOUT
    local interval=10
    local elapsed=0
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service port path <<< "$service_info"
        
        print_status "Checking $service health..."
        
        while [ $elapsed -lt $timeout ]; do
            if curl -sf "http://localhost:$port$path" > /dev/null 2>&1; then
                print_success "$service is healthy"
                break
            fi
            
            if [ $elapsed -ge $timeout ]; then
                print_error "$service health check failed after ${timeout}s"
                return 1
            fi
            
            sleep $interval
            elapsed=$((elapsed + interval))
        done
        
        elapsed=0
    done
    
    print_success "All services are healthy"
}

# Function to display service URLs
display_urls() {
    print_status "OSSA Monitoring Stack is ready!"
    echo
    echo -e "${GREEN}Service URLs:${NC}"
    echo -e "  📊 Grafana:        ${BLUE}http://localhost:3000${NC} (admin / ossa-enterprise-2025)"
    echo -e "  📈 Prometheus:     ${BLUE}http://localhost:9090${NC}"
    echo -e "  🚨 AlertManager:   ${BLUE}http://localhost:9093${NC}"
    echo -e "  🔍 Jaeger:         ${BLUE}http://localhost:16686${NC}"
    echo -e "  📋 Loki:          ${BLUE}http://localhost:3100${NC}"
    echo -e "  ⚡ Vector API:     ${BLUE}http://localhost:8686${NC}"
    echo
    echo -e "${GREEN}Key Dashboards:${NC}"
    echo -e "  • Executive Dashboard: ${BLUE}http://localhost:3000/d/ossa-executive${NC}"
    echo -e "  • Technical Dashboard: ${BLUE}http://localhost:3000/d/ossa-technical${NC}"
    echo
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Configure alert notification channels in AlertManager"
    echo -e "  2. Verify OSSA service metrics are being collected"
    echo -e "  3. Set up dashboard alerts and notifications"
    echo -e "  4. Review and customize alert thresholds"
    echo
}

# Function to show usage
show_usage() {
    echo "OSSA Enterprise Monitoring Stack"
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose logging"
    echo "  --force        Force restart even if services are running"
    echo "  --check        Only perform health checks"
    echo "  --stop         Stop all monitoring services"
    echo
}

# Function to stop services
stop_services() {
    print_status "Stopping OSSA monitoring services..."
    cd "$MONITORING_DIR"
    docker-compose -f "$COMPOSE_FILE" down
    print_success "All services stopped"
}

# Parse command line arguments
FORCE=false
CHECK_ONLY=false
STOP_SERVICES=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --check)
            CHECK_ONLY=true
            shift
            ;;
        --stop)
            STOP_SERVICES=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Enable verbose logging if requested
if [ "$VERBOSE" = true ]; then
    set -x
fi

# Main execution flow
main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════╗"
    echo "║        OSSA Monitoring Stack          ║"
    echo "║      Enterprise Edition v0.1.8       ║"
    echo "╚═══════════════════════════════════════╝"
    echo -e "${NC}"
    
    if [ "$STOP_SERVICES" = true ]; then
        stop_services
        exit 0
    fi
    
    check_prerequisites
    create_directories
    validate_config
    
    if [ "$CHECK_ONLY" = true ]; then
        check_service_health
        exit 0
    fi
    
    # Check if services are already running
    if [ "$FORCE" = false ] && docker-compose -f "$MONITORING_DIR/$COMPOSE_FILE" ps | grep -q "Up"; then
        print_warning "Monitoring services appear to be already running."
        print_status "Use --force to restart or --check to verify health."
        exit 0
    fi
    
    start_services
    check_service_health
    display_urls
    
    print_success "OSSA Enterprise Monitoring Stack is fully operational!"
}

# Change to monitoring directory
cd "$MONITORING_DIR"

# Run main function
main "$@"