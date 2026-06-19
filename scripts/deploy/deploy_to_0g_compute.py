#!/usr/bin/env python3
"""
Deploy Coreed Agent Space to 0G Compute (Python version)

This script provides a Python interface for deploying Agent Spaces to 0G Compute.
It can be used programmatically or from the command line.

Usage:
    python deploy_to_0g_compute.py [OPTIONS]

Options:
    --image, -i          Docker image to deploy
    --name, -n           Space name
    --model-id, -m       Model ID from ModelRegistry
    --runtime, -r        Runtime: python, node, docker
    --template, -t       Template: gradio, fastapi, express, docker
    --port, -p           Port number
    --version, -v        Space version
    --description, -d    Space description
    --skip-build        Skip Docker build
    --skip-register     Skip on-chain registration
    --help, -h          Show this help

Environment Variables:
    PRIVATE_KEY              Wallet private key (required)
    MODEL_REGISTRY_ADDRESS   ModelRegistry contract address
    SPACE_REGISTRY_ADDRESS   AgentSpaceRegistry contract address
    GALILEO_RPC_URL          0G RPC URL
    STORAGE_INDEXER_URL      Storage indexer URL

Example:
    python deploy_to_0g_compute.py -n "My Chatbot" -m 1 -t gradio -p 7860
"""

import os
import sys
import json
import subprocess
import argparse
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass, asdict


# ============================================================================
# Configuration
# ============================================================================

@dataclass
class DeployConfig:
    """Configuration for deployment"""
    
    image: str = ""
    name: str = ""
    model_id: Optional[str] = None
    runtime: str = "python"
    template: str = "gradio"
    port: int = 7860
    version: str = "1.0.0"
    description: str = ""
    skip_build: bool = False
    skip_register: bool = False
    
    # Network
    rpc_url: str = "https://evmrpc-testnet.0g.ai"
    chain_id: int = 16602
    indexer_url: str = "https://indexer-storage-testnet-turbo.0g.ai"
    
    # Contract addresses
    model_registry_address: str = ""
    space_registry_address: str = ""


@dataclass
class DeployResult:
    """Result of deployment"""
    
    success: bool = False
    docker_image: str = ""
    endpoint_url: str = ""
    space_id: str = ""
    model_id: str = ""
    errors: list = None
    warnings: list = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ============================================================================
# Logging
# ============================================================================

class colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    NC = '\033[0m'


def log_info(msg: str):
    print(f"{colors.BLUE}[INFO]{colors.NC} {msg}")


def log_success(msg: str):
    print(f"{colors.GREEN}[SUCCESS]{colors.NC} {msg}")


def log_warning(msg: str):
    print(f"{colors.YELLOW}[WARNING]{colors.NC} {msg}")


def log_error(msg: str):
    print(f"{colors.RED}[ERROR]{colors.NC} {msg}")


# ============================================================================
# Validation
# ============================================================================

def validate_environment(config: DeployConfig) -> Tuple[bool, list]:
    """Validate deployment environment"""
    errors = []
    warnings = []
    
    # Check private key
    if not os.getenv("PRIVATE_KEY"):
        errors.append("PRIVATE_KEY environment variable not set")
    
    # Check Docker
    try:
        subprocess.run(["docker", "--version"], capture_output=True, check=True)
    except FileNotFoundError:
        errors.append("Docker not found. Please install Docker.")
    except subprocess.CalledProcessError:
        errors.append("Docker not working correctly.")
    
    # Check 0G Compute CLI
    try:
        subprocess.run(["0g-compute-cli", "--version"], capture_output=True, check=True)
    except FileNotFoundError:
        warnings.append("0g-compute-cli not found. Install with: pnpm add -g @0gfoundation/0g-compute-ts-sdk")
    except subprocess.CalledProcessError:
        warnings.append("0g-compute-cli not working correctly.")
    
    # Check Node.js if registering
    if not config.skip_register:
        try:
            subprocess.run(["npx", "--version"], capture_output=True, check=True)
        except FileNotFoundError:
            warnings.append("Node.js/npx not found. On-chain registration will be skipped.")
        except subprocess.CalledProcessError:
            warnings.append("Node.js/npx not working correctly.")
    
    return len(errors) == 0, errors, warnings


# ============================================================================
# Docker Operations
# ============================================================================

def build_docker_image(config: DeployConfig) -> Tuple[bool, str, list]:
    """Build Docker image from template"""
    errors = []
    
    # Determine image tag
    docker_tag = config.image
    if not docker_tag:
        docker_tag = f"coreed-{config.name.lower().replace(' ', '-')}:{config.version}"
    
    # Get template directory
    script_dir = Path(__file__).parent
    coreed_dir = script_dir.parent.parent
    template_dir = coreed_dir / "templates" / config.template
    
    if not template_dir.exists():
        errors.append(f"Template directory not found: {template_dir}")
        return False, "", errors
    
    # Set default port based on template
    if config.port == 7860 and config.template != "gradio":
        port_map = {
            "fastapi": 8000,
            "express": 3000,
            "docker": 8080,
        }
        config.port = port_map.get(config.template, 7860)
    
    log_info(f"Building Docker image: {docker_tag}")
    
    # Build the image
    try:
        cmd = [
            "docker", "build",
            "-t", docker_tag,
            str(template_dir)
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600
        )
        
        if result.returncode != 0:
            errors.append(f"Docker build failed: {result.stderr}")
            return False, "", errors
        
        log_success(f"Docker image built: {docker_tag}")
        return True, docker_tag, errors
        
    except subprocess.TimeoutExpired:
        errors.append("Docker build timed out")
        return False, "", errors
    except Exception as e:
        errors.append(f"Docker build error: {str(e)}")
        return False, "", errors


# ============================================================================
# 0G Compute Deployment
# ============================================================================

def deploy_to_0g_compute(config: DeployConfig, image: str) -> Tuple[bool, str, list]:
    """Deploy Docker image to 0G Compute"""
    errors = []
    endpoint_url = ""
    
    log_info("Deploying to 0G Compute...")
    
    try:
        # Check if logged in
        login_check = subprocess.run(
            ["0g-compute-cli", "account", "info"],
            capture_output=True,
            text=True
        )
        
        if login_check.returncode != 0:
            log_info("Logging in to 0G Compute...")
            login_result = subprocess.run(
                ["0g-compute-cli", "login"],
                capture_output=True,
                text=True,
                input=os.getenv("PRIVATE_KEY", "") + "\n",
                timeout=30
            )
            
            if login_result.returncode != 0:
                errors.append(f"Failed to login to 0G Compute: {login_result.stderr}")
                return False, "", errors
        
        # Prepare environment variables
        env_vars = [
            f"MODEL_NAME={config.name}",
            f"SPACE_VERSION={config.version}",
            f"SERVER_PORT={config.port}",
        ]
        
        if config.model_id:
            env_vars.append(f"MODEL_ID={config.model_id}")
        
        # Build deploy command
        cmd = [
            "0g-compute-cli", "deploy",
            "--image", image,
            "--name", config.name,
            "--port", str(config.port),
        ]
        
        for env in env_vars:
            cmd.extend(["--env", env])
        
        # Execute deploy
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode != 0:
            errors.append(f"0G Compute deployment failed: {result.stderr}")
            return False, "", errors
        
        # Parse endpoint URL from output
        output = result.stdout + result.stderr
        import re
        
        url_match = re.search(r'(https?://[^\s]+\.0g\.compute|https?://[^\s/]+/[^\s]+)', output)
        if url_match:
            endpoint_url = url_match.group(1)
            log_success(f"Deployed to: {endpoint_url}")
            return True, endpoint_url, errors
        else:
            errors.append("Failed to parse endpoint URL from output")
            log_warning(f"Deployment output:\n{output}")
            return False, "", errors
        
    except FileNotFoundError:
        errors.append("0g-compute-cli not found. Please install it first.")
        return False, "", errors
    except subprocess.TimeoutExpired:
        errors.append("0G Compute deployment timed out")
        return False, "", errors
    except Exception as e:
        errors.append(f"0G Compute deployment error: {str(e)}")
        return False, "", errors


# ============================================================================
# Contract Registration
# ============================================================================

def register_space_on_chain(config: DeployConfig, endpoint_url: str) -> Tuple[bool, str, list]:
    """Register space on AgentSpaceRegistry contract"""
    errors = []
    space_id = ""
    
    if not config.space_registry_address:
        log_warning("SPACE_REGISTRY_ADDRESS not set. Skipping on-chain registration.")
        return True, "", errors
    
    log_info("Registering space on AgentSpaceRegistry...")
    
    try:
        # Get contract addresses from environment
        space_registry = config.space_registry_address or os.getenv("SPACE_REGISTRY_ADDRESS", "")
        
        if not space_registry:
            errors.append("SPACE_REGISTRY_ADDRESS not set")
            return False, "", errors
        
        # Use Hardhat script for deployment
        coreed_dir = Path(__file__).parent.parent.parent
        deploy_script = coreed_dir / "contracts" / "scripts" / "deploy-space.js"
        
        if not deploy_script.exists():
            errors.append(f"Deploy script not found: {deploy_script}")
            return False, "", errors
        
        cmd = [
            "npx", "hardhat", "run", str(deploy_script),
            "--network", "galileo",
            "--name", config.name,
            "--description", config.description,
            "--version", config.version,
            "--model-id", str(config.model_id) if config.model_id else "0",
            "--endpoint", endpoint_url,
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
            cwd=coreed_dir / "contracts"
        )
        
        if result.returncode != 0:
            errors.append(f"Space registration failed: {result.stderr}")
            return False, "", errors
        
        # Parse space ID from output
        import re
        space_id_match = re.search(r'spaceId[\s:]+(\d+)', result.stdout)
        if space_id_match:
            space_id = space_id_match.group(1)
            log_success(f"Space registered with ID: {space_id}")
            return True, space_id, errors
        else:
            errors.append("Failed to parse space ID from output")
            return False, "", errors
        
    except FileNotFoundError:
        errors.append("Node.js/npx not found. Cannot register on-chain.")
        return False, "", errors
    except subprocess.TimeoutExpired:
        errors.append("Space registration timed out")
        return False, "", errors
    except Exception as e:
        errors.append(f"Space registration error: {str(e)}")
        return False, "", errors


# ============================================================================
# Main Function
# ============================================================================

def deploy(config: DeployConfig) -> DeployResult:
    """Main deployment function"""
    result = DeployResult()
    
    # Validate environment
    log_info("Validating environment...")
    is_valid, errors, warnings = validate_environment(config)
    result.errors.extend(errors)
    result.warnings.extend(warnings)
    
    if not is_valid:
        for error in errors:
            log_error(error)
        return result
    
    # Build Docker image (unless skipped)
    if not config.skip_build:
        log_info("Building Docker image...")
        build_success, docker_image, build_errors = build_docker_image(config)
        result.errors.extend(build_errors)
        
        if not build_success:
            for error in build_errors:
                log_error(error)
            return result
        
        result.docker_image = docker_image
    else:
        if not config.image:
            result.errors.append("--image must be specified when --skip-build is used")
            return result
        result.docker_image = config.image
    
    # Deploy to 0G Compute
    log_info("Deploying to 0G Compute...")
    deploy_success, endpoint_url, deploy_errors = deploy_to_0g_compute(config, result.docker_image)
    result.errors.extend(deploy_errors)
    
    if not deploy_success:
        for error in deploy_errors:
            log_error(error)
        return result
    
    result.endpoint_url = endpoint_url
    
    # Register on chain (unless skipped)
    if not config.skip_register:
        log_info("Registering on-chain...")
        register_success, space_id, register_errors = register_space_on_chain(config, endpoint_url)
        result.errors.extend(register_errors)
        
        if not register_success and len(register_errors) > 0:
            for error in register_errors:
                log_warning(error)
        else:
            result.space_id = space_id
    
    # Set success
    result.success = len(result.errors) == 0
    result.model_id = str(config.model_id) if config.model_id else ""
    
    return result


# ============================================================================
# CLI Entry Point
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Deploy Coreed Agent Space to 0G Compute",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Deploy from current directory
  python deploy_to_0g_compute.py -n "My Chatbot" -m 1

  # Deploy with custom image
  python deploy_to_0g_compute.py -i my-registry/my-image:1.0.0 -n "My API" -m 1 -t fastapi -p 8000

  # Full deployment
  python deploy_to_0g_compute.py \\
    -i my-registry/my-image:1.0.0 \\
    -n "My Chatbot" \\
    -m 1 \\
    -t gradio \\
    -p 7860 \\
    -v "1.0.0" \\
    -d "A chatbot powered by my LLM"
        """
    )
    
    # Deployment options
    parser.add_argument("-i", "--image", help="Docker image to deploy")
    parser.add_argument("-n", "--name", required=True, help="Space name")
    parser.add_argument("-m", "--model-id", help="Model ID from ModelRegistry")
    parser.add_argument("-r", "--runtime", choices=["python", "node", "docker"], 
                        default="python", help="Runtime")
    parser.add_argument("-t", "--template", choices=["gradio", "fastapi", "express", "docker"],
                        default="gradio", help="Template")
    parser.add_argument("-p", "--port", type=int, default=7860, help="Port number")
    parser.add_argument("-v", "--version", default="1.0.0", help="Space version")
    parser.add_argument("-d", "--description", default="", help="Space description")
    parser.add_argument("--skip-build", action="store_true", help="Skip Docker build")
    parser.add_argument("--skip-register", action="store_true", help="Skip on-chain registration")
    
    # Network options
    parser.add_argument("--rpc-url", default="https://evmrpc-testnet.0g.ai", help="0G RPC URL")
    parser.add_argument("--chain-id", type=int, default=16602, help="Chain ID")
    parser.add_argument("--indexer-url", default="https://indexer-storage-testnet-turbo.0g.ai", 
                        help="Storage indexer URL")
    
    args = parser.parse_args()
    
    # Create config
    config = DeployConfig(
        image=args.image or "",
        name=args.name,
        model_id=args.model_id,
        runtime=args.runtime,
        template=args.template,
        port=args.port,
        version=args.version,
        description=args.description,
        skip_build=args.skip_build,
        skip_register=args.skip_register,
        rpc_url=args.rpc_url,
        chain_id=args.chain_id,
        indexer_url=args.indexer_url,
        model_registry_address=os.getenv("MODEL_REGISTRY_ADDRESS", ""),
        space_registry_address=os.getenv("SPACE_REGISTRY_ADDRESS", ""),
    )
    
    # Deploy
    result = deploy(config)
    
    # Print results
    print("")
    print("=" * 50)
    print("Deployment Summary")
    print("=" * 50)
    print(f"Success:       {result.success}")
    print(f"Docker Image: {result.docker_image}")
    print(f"Endpoint URL: {result.endpoint_url}")
    print(f"Space ID:     {result.space_id}")
    print(f"Model ID:     {result.model_id}")
    
    if result.errors:
        print("\nErrors:")
        for error in result.errors:
            print(f"  - {error}")
    
    if result.warnings:
        print("\nWarnings:")
        for warning in result.warnings:
            print(f"  - {warning}")
    
    print("=" * 50)
    
    if result.success:
        log_success("Deployment successful!")
        if result.endpoint_url:
            log_info(f"Access your space at: {result.endpoint_url}")
        sys.exit(0)
    else:
        log_error("Deployment failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
