#!/usr/bin/env bash
set -euo pipefail

# ╔═══════════════════════════════════════════════════════════════════════════════╗
# ║                                                                               ║
# ║   ██████╗ ███████╗███████╗ █████╗     ██╗   ██╗ ██████╗    ██████╗  ██████╗   ║
# ║  ██╔═══██╗██╔════╝██╔════╝██╔══██╗    ██║   ██║██╔═████╗   ╚════██╗██╔═████╗  ║
# ║  ██║   ██║███████╗███████╗███████║    ██║   ██║██║██╔██║    █████╔╝██║██╔██║  ║
# ║  ██║   ██║╚════██║╚════██║██╔══██║    ╚██╗ ██╔╝████╔╝██║    ╚═══██╗████╔╝██║  ║
# ║  ╚██████╔╝███████║███████║██║  ██║     ╚████╔╝ ╚██████╔╝██╗██████╔╝╚██████╔╝  ║
# ║   ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝      ╚═══╝   ╚═════╝ ╚═╝╚═════╝  ╚═════╝   ║
# ║                                                                               ║
# ║                        QUICKSTART: GET RUNNING IN 60 SECONDS                  ║
# ║                                                                               ║
# ╚═══════════════════════════════════════════════════════════════════════════════╝

# Color codes for beautiful output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly BOLD='\033[1m'
readonly DIM='\033[2m'
readonly RESET='\033[0m'

# Unicode symbols
readonly CHECK_MARK="✓"
readonly CROSS_MARK="✗"
readonly ARROW="→"
readonly ROCKET="🚀"
readonly PARTY="🎉"
readonly WARNING="⚠"
readonly INFO="ℹ"

# Configuration
INSTALL_METHOD="${OSSA_INSTALL_METHOD:-global}" # global or npx
PROVIDER="${LLM_PROVIDER:-anthropic}"
MODEL="${LLM_MODEL:-claude-sonnet-4-20250514}"
AGENT_FILE="${OSSA_AGENT_FILE:-my-first-agent.ossa.yaml}"

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

print_header() {
    echo -e "\n${CYAN}${BOLD}$1${RESET}"
}

print_step() {
    local step=$1
    local total=$2
    local message=$3
    echo -e "\n${BOLD}[${step}/${total}] ${message}${RESET}"
    echo -e "${DIM}$(printf '─%.0s' {1..70})${RESET}"
}

print_success() {
    echo -e "     ${GREEN}${CHECK_MARK}${RESET} $1"
}

print_error() {
    echo -e "     ${RED}${CROSS_MARK}${RESET} $1"
}

print_info() {
    echo -e "     ${BLUE}${INFO}${RESET} $1"
}

print_warning() {
    echo -e "     ${YELLOW}${WARNING}${RESET} $1"
}

print_box() {
    local message="$1"
    local width=70
    echo -e "${CYAN}${DIM}$(printf '═%.0s' $(seq 1 $width))${RESET}"
    echo -e "${CYAN}${message}${RESET}"
    echo -e "${CYAN}${DIM}$(printf '═%.0s' $(seq 1 $width))${RESET}"
}

check_command() {
    command -v "$1" >/dev/null 2>&1
}

get_version() {
    local cmd=$1
    case $cmd in
        node)
            node --version 2>/dev/null | sed 's/v//'
            ;;
        npm)
            npm --version 2>/dev/null
            ;;
        ossa)
            ossa --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+'
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN WORKFLOW
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    clear

    # Header
    echo -e "${CYAN}${BOLD}"
    cat << 'EOF'
🚀 OSSA Quickstart
══════════════════
EOF
    echo -e "${RESET}"
    echo -e "${DIM}Open Standard for Scalable AI Agents${RESET}"
    echo -e "${DIM}Get running in 60 seconds...${RESET}\n"

    # Step 1: Check dependencies
    print_step 1 4 "Checking dependencies..."
    check_dependencies

    # Step 2: Install OSSA CLI
    print_step 2 4 "Installing OSSA CLI..."
    install_ossa_cli

    # Step 3: Create sample agent
    print_step 3 4 "Creating your first agent..."
    create_sample_agent

    # Step 4: Validate agent
    print_step 4 4 "Validating manifest..."
    validate_agent

    # Success message
    show_success_message
}

# ───────────────────────────────────────────────────────────────────────────────
# STEP 1: CHECK DEPENDENCIES
# ───────────────────────────────────────────────────────────────────────────────
check_dependencies() {
    local all_good=true

    # Check Node.js
    if check_command node; then
        local node_version
        node_version=$(get_version node)
        print_success "Node.js v${node_version}"

        # Warn if version is too old
        local major_version
        major_version=$(echo "$node_version" | cut -d. -f1)
        if [[ $major_version -lt 18 ]]; then
            print_warning "Node.js 18+ recommended (you have v${node_version})"
        fi
    else
        print_error "Node.js not found"
        print_info "Install from: ${CYAN}https://nodejs.org${RESET}"
        all_good=false
    fi

    # Check npm
    if check_command npm; then
        local npm_version
        npm_version=$(get_version npm)
        print_success "npm v${npm_version}"
    else
        print_error "npm not found (should come with Node.js)"
        all_good=false
    fi

    # Check for API keys
    local has_key=false
    if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
        print_success "ANTHROPIC_API_KEY found"
        has_key=true
        PROVIDER="anthropic"
    fi
    if [[ -n "${OPENAI_API_KEY:-}" ]]; then
        print_success "OPENAI_API_KEY found"
        has_key=true
        [[ "$has_key" == "false" ]] && PROVIDER="openai"
    fi
    if [[ -n "${GOOGLE_API_KEY:-}" ]]; then
        print_success "GOOGLE_API_KEY found"
        has_key=true
    fi

    if [[ "$has_key" == "false" ]]; then
        print_warning "No LLM API key detected"
        print_info "Set one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY"
        print_info "Or use Ollama for local models (free): ${CYAN}https://ollama.ai${RESET}"
    fi

    if [[ "$all_good" == "false" ]]; then
        echo -e "\n${RED}${BOLD}Missing required dependencies. Please install them first.${RESET}"
        exit 1
    fi
}

# ───────────────────────────────────────────────────────────────────────────────
# STEP 2: INSTALL OSSA CLI
# ───────────────────────────────────────────────────────────────────────────────
install_ossa_cli() {
    if check_command ossa; then
        local ossa_version
        ossa_version=$(get_version ossa)
        print_success "@bluefly/ossa-cli v${ossa_version} already installed"
        return 0
    fi

    if [[ "$INSTALL_METHOD" == "global" ]]; then
        print_info "Installing @bluefly/ossa-cli globally..."
        if npm install -g @bluefly/ossa-cli >/dev/null 2>&1; then
            local ossa_version
            ossa_version=$(get_version ossa)
            print_success "@bluefly/ossa-cli v${ossa_version} installed"
        else
            print_error "Failed to install via npm"
            print_info "Try: ${CYAN}sudo npm install -g @bluefly/ossa-cli${RESET}"
            print_info "Or use npx: ${CYAN}export OSSA_INSTALL_METHOD=npx${RESET}"
            exit 1
        fi
    else
        print_success "Will use npx @bluefly/ossa-cli (no installation needed)"
    fi
}

# ───────────────────────────────────────────────────────────────────────────────
# STEP 3: CREATE SAMPLE AGENT
# ───────────────────────────────────────────────────────────────────────────────
create_sample_agent() {
    if [[ -f "$AGENT_FILE" ]]; then
        print_warning "File already exists: ${AGENT_FILE}"
        print_info "Skipping creation (file preserved)"
        return 0
    fi

    cat > "$AGENT_FILE" << 'EOFAGENT'
# ╔═══════════════════════════════════════════════════════════════════════════════╗
# ║                                                                               ║
# ║   ██████╗ ███████╗███████╗ █████╗     ██╗   ██╗ ██████╗    ██████╗  ██████╗   ║
# ║  ██╔═══██╗██╔════╝██╔════╝██╔══██╗    ██║   ██║██╔═████╗   ╚════██╗██╔═████╗  ║
# ║  ██║   ██║███████╗███████╗███████║    ██║   ██║██║██╔██║    █████╔╝██║██╔██║  ║
# ║  ██║   ██║╚════██║╚════██║██╔══██║    ╚██╗ ██╔╝████╔╝██║    ╚═══██╗████╔╝██║  ║
# ║  ╚██████╔╝███████║███████║██║  ██║     ╚████╔╝ ╚██████╔╝██╗██████╔╝╚██████╔╝  ║
# ║   ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝      ╚═══╝   ╚═════╝ ╚═╝╚═════╝  ╚═════╝   ║
# ║                                                                               ║
# ║                        YOUR FIRST OSSA AGENT                                  ║
# ║                                                                               ║
# ╚═══════════════════════════════════════════════════════════════════════════════╝
#
# This is your first OSSA agent manifest. Think of it like:
#   • package.json for npm
#   • Dockerfile for containers
#   • OpenAPI spec for REST APIs
#
# It's a declarative configuration that any OSSA-compliant runtime can execute.

# ──────────────────────────────────────────────────────────────────────────────────
# API VERSION & KIND (Required)
# ──────────────────────────────────────────────────────────────────────────────────
apiVersion: ossa/v0.3.0
kind: Agent

# ──────────────────────────────────────────────────────────────────────────────────
# METADATA (Required)
# ──────────────────────────────────────────────────────────────────────────────────
metadata:
  name: my-first-agent
  version: 1.0.0
  description: |
    A friendly AI assistant created with OSSA Quickstart.
    This agent demonstrates the minimal required configuration.
  labels:
    created-by: ossa-quickstart
    difficulty: beginner

# ──────────────────────────────────────────────────────────────────────────────────
# AGENT CONFIGURATION
# ──────────────────────────────────────────────────────────────────────────────────
spec:
  # The agent's persona (system prompt)
  role: |
    You are a friendly and helpful AI assistant created with OSSA
    (Open Standard for Scalable AI Agents).

    Your purpose:
    • Answer questions clearly and accurately
    • Help users understand AI agent concepts
    • Provide examples when they clarify ideas
    • Admit when you don't know something

    Communication style:
    • Be concise but thorough
    • Use markdown for clarity
    • Be encouraging to learners
    • Break down complex topics

  # LLM configuration (vendor-neutral)
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4-20250514}
    temperature: 0.7

# ═══════════════════════════════════════════════════════════════════════════════
# NEXT STEPS
# ═══════════════════════════════════════════════════════════════════════════════
#
# 1. Set your API key:
#    export ANTHROPIC_API_KEY=sk-ant-...
#
# 2. Run interactively:
#    ossa run my-first-agent.ossa.yaml --interactive
#
# 3. Learn more:
#    • Docs: https://openstandardagents.org/docs
#    • Examples: https://github.com/blueflyio/openstandardagents/tree/main/examples
#    • Spec: https://openstandardagents.org/spec
#
# 4. Explore advanced features:
#    ossa init my-advanced-agent --template full
#
# ═══════════════════════════════════════════════════════════════════════════════
EOFAGENT

    print_success "Created: ${CYAN}${AGENT_FILE}${RESET}"
}

# ───────────────────────────────────────────────────────────────────────────────
# STEP 4: VALIDATE AGENT
# ───────────────────────────────────────────────────────────────────────────────
validate_agent() {
    local ossa_cmd
    if [[ "$INSTALL_METHOD" == "npx" ]] || ! check_command ossa; then
        ossa_cmd="npx -y @bluefly/ossa-cli"
    else
        ossa_cmd="ossa"
    fi

    print_info "Running validation..."

    if $ossa_cmd validate "$AGENT_FILE" >/dev/null 2>&1; then
        print_success "Schema validation passed"
        print_success "LLM configuration valid"
        print_success "Ready to run!"
    else
        print_warning "Validation encountered issues"
        print_info "Run manually: ${CYAN}${ossa_cmd} validate ${AGENT_FILE}${RESET}"
    fi
}

# ───────────────────────────────────────────────────────────────────────────────
# SUCCESS MESSAGE
# ───────────────────────────────────────────────────────────────────────────────
show_success_message() {
    echo ""
    print_box "$(echo -e "\n${PARTY} ${BOLD}SUCCESS! Your first OSSA agent is ready.${RESET}")"
    echo ""

    local ossa_cmd
    if [[ "$INSTALL_METHOD" == "npx" ]] || ! check_command ossa; then
        ossa_cmd="npx @bluefly/ossa-cli"
    else
        ossa_cmd="ossa"
    fi

    echo -e "${BOLD}Next steps:${RESET}\n"

    echo -e "  ${BOLD}1.${RESET} Set your API key:"
    case $PROVIDER in
        anthropic)
            echo -e "     ${CYAN}export ANTHROPIC_API_KEY=sk-ant-...${RESET}"
            echo -e "     ${DIM}Get key: https://console.anthropic.com${RESET}"
            ;;
        openai)
            echo -e "     ${CYAN}export OPENAI_API_KEY=sk-...${RESET}"
            echo -e "     ${DIM}Get key: https://platform.openai.com/api-keys${RESET}"
            ;;
        *)
            echo -e "     ${CYAN}export ANTHROPIC_API_KEY=sk-ant-...${RESET}"
            echo -e "     ${DIM}Or use: OPENAI_API_KEY, GOOGLE_API_KEY${RESET}"
            ;;
    esac
    echo ""

    echo -e "  ${BOLD}2.${RESET} Run your agent:"
    echo -e "     ${CYAN}${ossa_cmd} run ${AGENT_FILE} --interactive${RESET}"
    echo ""

    echo -e "  ${BOLD}3.${RESET} Explore examples:"
    echo -e "     ${CYAN}${ossa_cmd} init my-agent --template advanced${RESET}"
    echo -e "     ${DIM}See: https://github.com/blueflyio/openstandardagents/tree/main/examples${RESET}"
    echo ""

    echo -e "  ${BOLD}4.${RESET} Learn more:"
    echo -e "     ${DIM}Docs:     ${RESET}${CYAN}https://openstandardagents.org/docs${RESET}"
    echo -e "     ${DIM}Spec:     ${RESET}${CYAN}https://openstandardagents.org/spec${RESET}"
    echo -e "     ${DIM}GitHub:   ${RESET}${CYAN}https://github.com/blueflyio/openstandardagents${RESET}"
    echo -e "     ${DIM}Discord:  ${RESET}${CYAN}https://discord.gg/ossa${RESET}"
    echo ""

    print_box ""

    echo -e "\n${DIM}Tip: Try 'ossa --help' to see all commands${RESET}\n"
}

# ═══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

main "$@"
