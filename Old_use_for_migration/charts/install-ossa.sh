#!/bin/bash

# OSSA v0.1.8 Helm Chart Installation Script
# Open Standards for Scalable Agents

set -euo pipefail

# Default values
ENVIRONMENT="dev"
NAMESPACE=""
CHART_PATH="./ossa"
RELEASE_NAME="ossa"
DRY_RUN=false
WAIT=true
TIMEOUT="15m0s"
CREATE_NAMESPACE=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Display usage
usage() {
    cat << EOF
OSSA v0.1.8 Helm Chart Installation Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENVIRONMENT    Environment: dev, staging, production (default: dev)
    -n, --namespace NAMESPACE        Kubernetes namespace (default: ossa-{environment})
    -r, --release RELEASE_NAME       Helm release name (default: ossa)
    -c, --chart-path PATH           Path to chart directory (default: ./ossa)
    --dry-run                       Perform a dry run
    --no-wait                       Don't wait for deployment to complete
    --timeout DURATION              Timeout for deployment (default: 15m0s)
    --no-create-namespace           Don't create namespace if it doesn't exist
    -h, --help                      Show this help message

Examples:
    # Install development environment
    $0 -e dev

    # Install staging environment
    $0 -e staging -n ossa-staging

    # Install production environment with custom settings
    $0 -e production -n ossa-prod --timeout 20m0s

    # Dry run for production
    $0 -e production --dry-run

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -r|--release)
                RELEASE_NAME="$2"
                shift 2
                ;;
            -c|--chart-path)
                CHART_PATH="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --no-wait)
                WAIT=false
                shift
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --no-create-namespace)
                CREATE_NAMESPACE=false
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done

    # Set default namespace if not provided
    if [[ -z "$NAMESPACE" ]]; then
        NAMESPACE="ossa-${ENVIRONMENT}"
    fi
}

# Validate prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is required but not installed"
    fi

    # Check if helm is available
    if ! command -v helm &> /dev/null; then
        error "helm is required but not installed"
    fi

    # Check helm version
    local helm_version=$(helm version --short | cut -d'"' -f2)
    if [[ ${helm_version:1:1} -lt 3 ]]; then
        error "Helm 3.x is required, found: $helm_version"
    fi

    # Check if chart directory exists
    if [[ ! -d "$CHART_PATH" ]]; then
        error "Chart directory not found: $CHART_PATH"
    fi

    # Check if values file exists for environment
    local values_file="$CHART_PATH/values/values-${ENVIRONMENT}.yaml"
    if [[ "$ENVIRONMENT" != "dev" && ! -f "$values_file" ]]; then
        error "Values file not found: $values_file"
    fi

    # Check kubectl cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
    fi

    log "Prerequisites check passed"
}

# Validate environment
validate_environment() {
    case "$ENVIRONMENT" in
        dev|staging|production)
            log "Environment: $ENVIRONMENT"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Must be dev, staging, or production"
            ;;
    esac
}

# Check cluster resources
check_cluster_resources() {
    log "Checking cluster resources..."

    # Get cluster info
    local nodes=$(kubectl get nodes --no-headers | wc -l)
    log "Cluster has $nodes node(s)"

    # Check if cluster has enough resources for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        local total_cpu=$(kubectl describe nodes | grep -A 3 "Allocatable:" | grep "cpu" | awk '{sum += $2} END {print sum}')
        local total_memory=$(kubectl describe nodes | grep -A 3 "Allocatable:" | grep "memory" | awk '{sum += substr($2, 1, length($2)-2)} END {print sum}')
        
        warn "Production deployment requires significant resources:"
        warn "  - Recommended: 16+ CPU cores, 32+ GB memory"
        warn "  - Multi-zone deployment recommended"
        warn "  - Fast SSD storage recommended"
        
        read -p "Continue with production deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Production deployment cancelled"
        fi
    fi
}

# Create namespace if needed
create_namespace() {
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log "Namespace '$NAMESPACE' already exists"
    else
        if [[ "$CREATE_NAMESPACE" == "true" ]]; then
            log "Creating namespace: $NAMESPACE"
            if [[ "$DRY_RUN" == "false" ]]; then
                kubectl create namespace "$NAMESPACE"
            else
                info "DRY RUN: Would create namespace: $NAMESPACE"
            fi
        else
            error "Namespace '$NAMESPACE' does not exist and --no-create-namespace was specified"
        fi
    fi
}

# Create required secrets for production
create_secrets() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Checking production secrets..."
        
        # Check for PostgreSQL secret
        if ! kubectl get secret ossa-postgresql-secret -n "$NAMESPACE" &> /dev/null; then
            warn "PostgreSQL secret 'ossa-postgresql-secret' not found in namespace '$NAMESPACE'"
            warn "Create it with:"
            warn "  kubectl create secret generic ossa-postgresql-secret \\"
            warn "    --from-literal=postgres-password=\"your-secure-postgres-password\" \\"
            warn "    --from-literal=password=\"your-secure-user-password\" \\"
            warn "    --namespace $NAMESPACE"
            
            if [[ "$DRY_RUN" == "false" ]]; then
                error "Required secret missing. Please create PostgreSQL secret first."
            fi
        fi
        
        # Check for Grafana secret
        if ! kubectl get secret ossa-grafana-secret -n "$NAMESPACE" &> /dev/null; then
            warn "Grafana secret 'ossa-grafana-secret' not found in namespace '$NAMESPACE'"
            warn "Create it with:"
            warn "  kubectl create secret generic ossa-grafana-secret \\"
            warn "    --from-literal=admin-password=\"your-secure-grafana-password\" \\"
            warn "    --namespace $NAMESPACE"
            
            if [[ "$DRY_RUN" == "false" ]]; then
                error "Required secret missing. Please create Grafana secret first."
            fi
        fi
    fi
}

# Install or upgrade OSSA
install_ossa() {
    log "Installing OSSA v0.1.8..."

    # Prepare helm command
    local helm_cmd="helm upgrade --install $RELEASE_NAME $CHART_PATH"
    helm_cmd="$helm_cmd --namespace $NAMESPACE"
    
    # Add environment-specific values file
    if [[ "$ENVIRONMENT" != "dev" ]]; then
        local values_file="$CHART_PATH/values/values-${ENVIRONMENT}.yaml"
        helm_cmd="$helm_cmd --values $values_file"
    fi
    
    # Add common options
    helm_cmd="$helm_cmd --timeout $TIMEOUT"
    
    if [[ "$WAIT" == "true" ]]; then
        helm_cmd="$helm_cmd --wait"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        helm_cmd="$helm_cmd --dry-run"
    fi

    # Add production-specific options
    if [[ "$ENVIRONMENT" == "production" && "$DRY_RUN" == "false" ]]; then
        helm_cmd="$helm_cmd --atomic --cleanup-on-fail"
    fi

    log "Executing: $helm_cmd"
    
    if eval "$helm_cmd"; then
        log "OSSA installation completed successfully"
    else
        error "OSSA installation failed"
    fi
}

# Verify installation
verify_installation() {
    if [[ "$DRY_RUN" == "true" ]]; then
        return
    fi

    log "Verifying installation..."

    # Wait for pods to be ready
    log "Waiting for pods to be ready..."
    kubectl wait --for=condition=Ready pods -l app.kubernetes.io/name=ossa -n "$NAMESPACE" --timeout=300s

    # Check pod status
    log "Pod status:"
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=ossa

    # Check service status
    log "Service status:"
    kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/name=ossa

    # Check ingress if enabled
    if kubectl get ingress -n "$NAMESPACE" &> /dev/null; then
        log "Ingress status:"
        kubectl get ingress -n "$NAMESPACE"
    fi

    # Display access information
    display_access_info
}

# Display access information
display_access_info() {
    log "=== OSSA v0.1.8 Installation Complete ==="
    
    echo
    info "Environment: $ENVIRONMENT"
    info "Namespace: $NAMESPACE"
    info "Release: $RELEASE_NAME"
    echo
    
    info "To access OSSA services:"
    
    # Port forwarding commands
    info "Gateway API (port forward):"
    info "  kubectl port-forward svc/$RELEASE_NAME-gateway 3000:3000 -n $NAMESPACE"
    
    if [[ "$ENVIRONMENT" != "dev" ]]; then
        info "Monitoring Dashboard (port forward):"
        info "  kubectl port-forward svc/$RELEASE_NAME-grafana 3080:3000 -n $NAMESPACE"
    fi
    
    echo
    info "To check status:"
    info "  kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=ossa"
    info "  kubectl get svc -n $NAMESPACE -l app.kubernetes.io/name=ossa"
    
    echo
    info "To view logs:"
    info "  kubectl logs -n $NAMESPACE -l ossa.io/component=gateway -f"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo
        warn "PRODUCTION DEPLOYMENT NOTES:"
        warn "1. Monitor uptime metrics for 99.97% SLA compliance"
        warn "2. Set up external monitoring and alerting"
        warn "3. Configure backup procedures for databases"
        warn "4. Review security configurations"
    fi
    
    echo
    log "For detailed information, see: $CHART_PATH/README.md"
}

# Main execution
main() {
    log "Starting OSSA v0.1.8 installation..."
    
    parse_args "$@"
    validate_environment
    check_prerequisites
    check_cluster_resources
    create_namespace
    create_secrets
    install_ossa
    verify_installation
    
    log "Installation process completed!"
}

# Execute main function with all arguments
main "$@"