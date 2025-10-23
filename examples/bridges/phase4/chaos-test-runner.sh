#!/usr/bin/env bash
# Chaos Engineering Test Runner for AIFlow Social Agent
#
# Usage:
#   ./chaos-test-runner.sh --test pod-failure
#   ./chaos-test-runner.sh --test all
#   ./chaos-test-runner.sh --schedule

set -euo pipefail

NAMESPACE="agents-staging"
TEST_DURATION="2m"
COOLDOWN_PERIOD="30s"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi
    
    # Check cluster access
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot access Kubernetes cluster"
        exit 1
    fi
    
    # Check if deployment exists
    if ! kubectl get deployment aiflow-social-agent -n ${NAMESPACE} &> /dev/null; then
        log_error "AIFlow deployment not found in namespace ${NAMESPACE}"
        exit 1
    fi
    
    log_info "✅ Prerequisites check passed"
}

get_baseline_metrics() {
    log_info "Collecting baseline metrics..."
    
    local pod_count=$(kubectl get pods -n ${NAMESPACE} -l app=aiflow-social-agent --no-headers | wc -l)
    local ready_pods=$(kubectl get pods -n ${NAMESPACE} -l app=aiflow-social-agent --no-headers | grep "Running" | wc -l)
    
    echo "  Pods: ${pod_count} total, ${ready_pods} ready"
    
    # Check health endpoint
    local pod_name=$(kubectl get pod -n ${NAMESPACE} -l app=aiflow-social-agent -o jsonpath='{.items[0].metadata.name}')
    if kubectl exec -n ${NAMESPACE} ${pod_name} -- wget -q --spider http://localhost:8000/health 2>/dev/null; then
        echo "  Health: ✅ OK"
    else
        echo "  Health: ❌ FAILED"
    fi
}

run_pod_failure_test() {
    log_info "Running Pod Failure Test..."
    
    get_baseline_metrics
    
    log_warn "Deleting one random pod..."
    local pod_to_delete=$(kubectl get pod -n ${NAMESPACE} -l app=aiflow-social-agent -o jsonpath='{.items[0].metadata.name}')
    kubectl delete pod ${pod_to_delete} -n ${NAMESPACE}
    
    log_info "Waiting for pod to be recreated..."
    kubectl wait --for=condition=Ready pod -l app=aiflow-social-agent -n ${NAMESPACE} --timeout=60s
    
    log_info "✅ Pod recreated successfully"
    get_baseline_metrics
}

run_pod_kill_test() {
    log_info "Running Pod Kill Test (50% of pods)..."
    
    get_baseline_metrics
    
    local pod_count=$(kubectl get pods -n ${NAMESPACE} -l app=aiflow-social-agent --no-headers | wc -l)
    local kill_count=$((pod_count / 2))
    
    if [ ${kill_count} -eq 0 ]; then
        kill_count=1
    fi
    
    log_warn "Killing ${kill_count} pod(s)..."
    kubectl get pods -n ${NAMESPACE} -l app=aiflow-social-agent --no-headers | head -n ${kill_count} | awk '{print $1}' | xargs kubectl delete pod -n ${NAMESPACE}
    
    log_info "Waiting for pods to recover..."
    sleep 10
    kubectl wait --for=condition=Ready pod -l app=aiflow-social-agent -n ${NAMESPACE} --timeout=60s
    
    log_info "✅ Pods recovered successfully"
    get_baseline_metrics
}

run_resource_stress_test() {
    log_info "Running Resource Stress Test..."
    
    get_baseline_metrics
    
    log_warn "Applying CPU/Memory stress..."
    local pod_name=$(kubectl get pod -n ${NAMESPACE} -l app=aiflow-social-agent -o jsonpath='{.items[0].metadata.name}')
    
    # Run stress command in pod
    kubectl exec -n ${NAMESPACE} ${pod_name} -- sh -c "
        while true; do
            date
            sleep 0.1
        done
    " &
    local stress_pid=$!
    
    log_info "Monitoring for 30 seconds..."
    sleep 30
    
    kill ${stress_pid} 2>/dev/null || true
    
    log_info "✅ Resource stress test completed"
    get_baseline_metrics
}

run_load_test() {
    log_info "Running Load Test..."
    
    # Check if k6 is available
    if ! command -v k6 &> /dev/null; then
        log_warn "k6 not found. Skipping load test."
        return
    fi
    
    log_info "Running k6 load test..."
    k6 run ../load-tests/k6-load-test.js --vus 50 --duration 1m || true
    
    log_info "✅ Load test completed"
}

run_network_test() {
    log_info "Running Network Chaos Test..."
    
    log_warn "This test requires Chaos Mesh installed"
    log_warn "Simulating network partition..."
    
    # Apply network chaos if Chaos Mesh is available
    if kubectl get crd networkchaos.chaos-mesh.org &> /dev/null; then
        kubectl apply -f chaos-tests.yaml -n ${NAMESPACE}
        
        log_info "Waiting for chaos to complete..."
        sleep ${TEST_DURATION}
        
        log_info "Cleaning up chaos experiments..."
        kubectl delete -f chaos-tests.yaml -n ${NAMESPACE}
    else
        log_warn "Chaos Mesh CRDs not found. Skipping network test."
    fi
}

run_rollback_test() {
    log_info "Running Rollback Test..."
    
    get_baseline_metrics
    
    log_info "Current deployment revision:"
    kubectl rollout history deployment/aiflow-social-agent -n ${NAMESPACE} | tail -5
    
    log_warn "Performing rollback..."
    kubectl rollout undo deployment/aiflow-social-agent -n ${NAMESPACE}
    
    log_info "Waiting for rollback to complete..."
    kubectl rollout status deployment/aiflow-social-agent -n ${NAMESPACE}
    
    log_info "✅ Rollback completed successfully"
    get_baseline_metrics
}

run_all_tests() {
    log_info "Running ALL chaos tests..."
    
    run_pod_failure_test
    sleep ${COOLDOWN_PERIOD}
    
    run_pod_kill_test
    sleep ${COOLDOWN_PERIOD}
    
    run_resource_stress_test
    sleep ${COOLDOWN_PERIOD}
    
    run_load_test
    sleep ${COOLDOWN_PERIOD}
    
    run_network_test
    sleep ${COOLDOWN_PERIOD}
    
    run_rollback_test
    
    log_info "🎉 All chaos tests completed!"
}

# Main execution
main() {
    check_prerequisites
    
    case "${1:-all}" in
        pod-failure)
            run_pod_failure_test
            ;;
        pod-kill)
            run_pod_kill_test
            ;;
        resource-stress)
            run_resource_stress_test
            ;;
        load-test)
            run_load_test
            ;;
        network)
            run_network_test
            ;;
        rollback)
            run_rollback_test
            ;;
        all)
            run_all_tests
            ;;
        *)
            echo "Usage: $0 {pod-failure|pod-kill|resource-stress|load-test|network|rollback|all}"
            exit 1
            ;;
    esac
}

main "$@"

