#!/bin/bash
"""
Deploy Coreed Agent Space to 0G Compute

This script deploys a Docker image to 0G Compute and registers it
with the Coreed Space Registry.

Usage:
  ./deploy-to-0g-compute.sh [OPTIONS]

Options:
  --image, -i        Docker image to deploy (default: latest built image)
  --name, -n         Space name
  --model-id, -m     Model ID from ModelRegistry
  --runtime, -r      Runtime: python, node, docker (default: python)
  --template, -t     Template: gradio, fastapi, express, docker (default: gradio)
  --port, -p         Port number (default: template-specific)
  --version, -v      Space version (default: 1.0.0)
  --description, -d  Space description
  --rpc-url         0G RPC URL (default: https://evmrpc-testnet.0g.ai)
  --chain-id        Chain ID (default: 16602)
  --help, -h        Show this help

Environment Variables:
  PRIVATE_KEY              Wallet private key (required)
  MODEL_REGISTRY_ADDRESS   ModelRegistry contract address
  SPACE_REGISTRY_ADDRESS   AgentSpaceRegistry contract address
  GALILEO_RPC_URL          0G RPC URL
  STORAGE_INDEXER_URL      Storage indexer URL

Examples:
  # Deploy from current directory
  ./deploy-to-0g-compute.sh -n "My Chatbot" -m 1

  # Deploy with custom image
  ./deploy-to-0g-compute.sh -i my-registry/my-image:1.0.0 -n "My API" -m 1 -t fastapi -p 8000

  # Full deployment
  ./deploy-to-0g-compute.sh \
    -i my-registry/my-image:1.0.0 \
    -n "My Chatbot" \
    -m 1 \
    -t gradio \
    -p 7860 \
    -v "1.0.0" \
    -d "A chatbot powered by my LLM"
"""

set -euo pipefail

# ============================================================================
# Default Configuration
# ============================================================================

IMAGE=""
NAME=""
MODEL_ID=""
RUNTIME="python"
TEMPLATE="gradio"
PORT=""
VERSION="1.0.0"
DESCRIPTION=""
RPC_URL="${GALILEO_RPC_URL:-https://evmrpc-testnet.0g.ai}"
CHAIN_ID="${GALILEO_CHAIN_ID:-16602}"
INDEXER_URL="${STORAGE_INDEXER_URL:-https://indexer-storage-testnet-turbo.0g.ai}"

# Contract addresses (set via environment or use defaults)
MODEL_REGISTRY_ADDRESS="${MODEL_REGISTRY_ADDRESS:-}"
SPACE_REGISTRY_ADDRESS="${SPACE_REGISTRY_ADDRESS:-}"

# Derived variables
PROJECT_DIR=$(pwd)
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
COREED_DIR=$(cd "$SCRIPT_DIR/../../" && pwd)

# ============================================================================
# Colors and Logging
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================================
# Validation
# ============================================================================

validate_environment() {
    local errors=0
    
    # Check for private key
    if [[ -z "${PRIVATE_KEY:-}" ]]; then
        log_error "PRIVATE_KEY environment variable not set"
        errors=$((errors + 1))
    fi
    
    # Check for required tools
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install Docker."
        errors=$((errors + 1))
    fi
    
    if ! command -v 0g-compute-cli &> /dev/null; then
        log_warning "0g-compute-cli not found. Install with: pnpm add -g @0gfoundation/0g-compute-ts-sdk"
    fi
    
    # Check for contract addresses if verifying
    if [[ -n "$MODEL_REGISTRY_ADDRESS" && -n "$SPACE_REGISTRY_ADDRESS" ]]; then
        : # Both are set, good
    elif [[ -n "$MODEL_REGISTRY_ADDRESS" || -n "$SPACE_REGISTRY_ADDRESS" ]]; then
        log_error "Both MODEL_REGISTRY_ADDRESS and SPACE_REGISTRY_ADDRESS must be set"
        errors=$((errors + 1))
    fi
    
    return $errors
}

# ============================================================================
# Parse Arguments
# ============================================================================

show_help() {
    grep -E '^"""' "$0" | sed 's/^"""//;s/"""$//' | head -n -1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--image)
            IMAGE="$2"
            shift 2
            ;;
        -n|--name)
            NAME="$2"
            shift 2
            ;;
        -m|--model-id)
            MODEL_ID="$2"
            shift 2
            ;;
        -r|--runtime)
            RUNTIME="$2"
            shift 2
            ;;
        -t|--template)
            TEMPLATE="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -d|--description)
            DESCRIPTION="$2"
            shift 2
            ;;
        --rpc-url)
            RPC_URL="$2"
            shift 2
            ;;
        --chain-id)
            CHAIN_ID="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Set default port based on template
if [[ -z "$PORT" ]]; then
    case "$TEMPLATE" in
        gradio) PORT=7860 ;;
        fastapi) PORT=8000 ;;
        express) PORT=3000 ;;
        docker) PORT=8080 ;;
        *) PORT=7860 ;;
    esac
fi

# ============================================================================
# Build Docker Image
# ============================================================================

build_docker_image() {
    local template_dir="$COREED_DIR/templates/$TEMPLATE"
    local docker_tag="coreed-${NAME:-my-space}-${VERSION}"
    
    if [[ -n "$IMAGE" ]]; then
        docker_tag="$IMAGE"
    fi
    
    # Check if template directory exists
    if [[ ! -d "$template_dir" ]]; then
        log_error "Template directory not found: $template_dir"
        return 1
    fi
    
    log_info "Building Docker image: $docker_tag"
    
    # Build the Docker image
    if ! docker build -t "$docker_tag" "$template_dir" > /dev/null 2>&1; then
        log_error "Docker build failed"
        return 1
    fi
    
    log_success "Docker image built: $docker_tag"
    echo "$docker_tag"
    return 0
}

# ============================================================================
# Deploy to 0G Compute
# ============================================================================

deploy_to_0g_compute() {
    local docker_tag="$1"
    local endpoint_url=""
    local deployment_id=""
    
    log_info "Deploying to 0G Compute..."
    
    # Use 0G Compute CLI if available
    if command -v 0g-compute-cli &> /dev/null; then
        # Login first if not already
        if ! 0g-compute-cli account info > /dev/null 2>&1; then
            log_info "Logging in to 0G Compute..."
            if ! 0g-compute-cli login; then
                log_error "Failed to login to 0G Compute"
                return 1
            fi
        fi
        
        # Deploy
        local output
        if output=$(0g-compute-cli deploy \
            --image "$docker_tag" \
            --name "$NAME" \
            --port "$PORT" \
            --env "MODEL_NAME=$NAME" \
            --env "SPACE_ID=" \
            --env "SPACE_VERSION=$VERSION" \
            --env "SERVER_PORT=$PORT" \
            2>&1); then
            
            # Parse output for endpoint URL
            endpoint_url=$(echo "$output" | grep -E 'URL:|Endpoint:' | awk '{print $2}')
            deployment_id=$(echo "$output" | grep -E 'ID:|Deployment:' | awk '{print $2}')
            
            if [[ -n "$endpoint_url" ]]; then
                log_success "Deployed to: $endpoint_url"
                echo "$endpoint_url"
                return 0
            else
                log_error "Failed to parse endpoint URL from output"
                return 1
            fi
        else
            log_error "0G Compute deployment failed"
            return 1
        fi
    else
        log_error "0g-compute-cli not found. Please install it first."
        return 1
    fi
}

# ============================================================================
# Register on Chain
# ============================================================================

register_space_on_chain() {
    local endpoint_url="$1"
    local space_id=""
    
    if [[ -z "$SPACE_REGISTRY_ADDRESS" ]]; then
        log_warning "SPACE_REGISTRY_ADDRESS not set. Skipping on-chain registration."
        echo ""
        return 0
    fi
    
    log_info "Registering space on AgentSpaceRegistry..."
    
    # Check if Node.js/Hardhat is available
    if command -v npx &> /dev/null; then
        local cmd=(
            npx hardhat run "$COREED_DIR/contracts/scripts/deploy-space.js" \
            --network galileo \
            --name "$NAME" \
            --description "$DESCRIPTION" \
            --version "$VERSION" \
            --model-id "$MODEL_ID" \
            --endpoint "$endpoint_url"
        )
        
        if output=$("${cmd[@]}" 2>&1); then
            # Parse space ID from output
            space_id=$(echo "$output" | grep -E 'spaceId:|Space ID:' | grep -oE '[0-9]+' | head -1)
            
            if [[ -n "$space_id" ]]; then
                log_success "Space registered on-chain with ID: $space_id"
                echo "$space_id"
                return 0
            else
                log_error "Failed to parse space ID from output"
                return 1
            fi
        else
            log_error "Failed to register space on-chain"
            return 1
        fi
    else
        log_error "Node.js/npx not found. Cannot register on-chain."
        return 1
    fi
}

# ============================================================================
# Main
# ============================================================================

main() {
    # Validate environment
    log_info "Validating environment..."
    if ! validate_environment; then
        exit 1
    fi
    
    # Build Docker image
    log_info "Building Docker image..."
    local image
    if ! image=$(build_docker_image); then
        exit 1
    fi
    
    # Deploy to 0G Compute
    log_info "Deploying to 0G Compute..."
    local endpoint_url
    if ! endpoint_url=$(deploy_to_0g_compute "$image"); then
        exit 1
    fi
    
    # Register on chain
    log_info "Registering on-chain..."
    local space_id
    if ! space_id=$(register_space_on_chain "$endpoint_url"); then
        log_warning "On-chain registration may have failed"
    fi
    
    # Output results
    echo ""
    echo "=========================================="
    echo "Deployment Summary"
    echo "=========================================="
    echo "Docker Image:    $image"
    echo "Endpoint URL:    $endpoint_url"
    echo "Space ID:       ${space_id:-N/A}"
    echo "Model ID:       ${MODEL_ID:-N/A}"
    echo "Name:           $NAME"
    echo "Version:        $VERSION"
    echo "Template:       $TEMPLATE"
    echo "Port:           $PORT"
    echo "=========================================="
    
    if [[ -n "$endpoint_url" ]]; then
        log_success "Deployment successful!"
        log_info "Access your space at: $endpoint_url"
        exit 0
    else
        log_error "Deployment failed"
        exit 1
    fi
}

main "$@"
