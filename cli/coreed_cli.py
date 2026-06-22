"""
Coreed CLI - Main implementation

This module implements the push_to_coreed functionality that mirrors
Coreed push_to_coreed workflow.
"""

import os
import json
import shutil
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field, asdict
import time
import hashlib


# ============================================================================
# Configuration
# ============================================================================

@dataclass
class CoreedConfig:
    """Configuration for Coreed deployment"""
    
    # 0G Chain Configuration
    rpc_url: str = "https://evmrpc-testnet.0g.ai"
    chain_id: int = 16602
    storage_indexer: str = "https://indexer-storage-testnet-turbo.0g.ai"
    
    # Contract Addresses (Galileo Testnet)
    model_registry_address: str = "0xFA81366Ba81C19d848191B8e49eC0948230d4216"
    agent_registry_address: str = "0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C"
    space_registry_address: str = "0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A"
    private_key: str = ""
    
    # API Configuration
    router_api_url: str = "https://router-api.0g.ai/v1"
    
    # Local Configuration
    project_dir: str = "."
    model_dir: str = "models"
    storage_dir: str = ".coreed/storage"
    config_file: str = "coreed.json"
    
    # Model Configuration
    model_name: str = ""
    model_description: str = ""
    model_architecture: str = ""
    model_parameters: int = 0
    model_license: str = "MIT"
    model_tags: List[str] = field(default_factory=list)
    model_id: Optional[int] = None
    
    # Space Configuration
    space_name: str = ""
    space_version: str = "1.0.0"
    space_description: str = ""
    runtime: str = "python"  # python, node, docker
    template: str = "gradio"  # gradio, fastapi, express, docker
    port: int = 7860
    
    # Git Configuration
    repo_name: str = ""
    branch: str = "main"
    commit_message: str = ""
    
    # Flags
    auto_deploy: bool = True
    verify_contracts: bool = True
    skip_storage: bool = False
    force: bool = False


@dataclass
class PushResult:
    """Result of push_to_coreed operation"""
    
    success: bool
    model_id: Optional[str] = None
    space_id: Optional[str] = None
    storage_root_hash: Optional[str] = None
    endpoint_url: Optional[str] = None
    contract_addresses: Dict[str, str] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    deployment_time: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass  
class ModelMetadata:
    """Model metadata for registration"""
    
    name: str
    description: str = ""
    architecture: str = ""
    parameters: int = 0
    license: str = "MIT"
    tags: List[str] = field(default_factory=list)
    storage_root_hash: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "architecture": self.architecture,
            "parameters": self.parameters,
            "license": self.license,
            "tags": self.tags,
            "storageRootHash": self.storage_root_hash,
        }


@dataclass
class SpaceMetadata:
    """Space metadata for deployment"""
    
    name: str
    description: str = ""
    version: str = "1.0.0"
    model_id: Optional[int] = None
    endpoint_url: str = ""
    runtime: str = "python"
    template: str = "gradio"
    port: int = 7860
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ============================================================================
# Git Integration
# ============================================================================

def get_git_repo_info() -> Dict[str, str]:
    """Get current git repository information"""
    try:
        repo_name = subprocess.check_output(
            ["git", "config", "--get", "remote.origin.url"],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        
        # Extract repo name from URL
        if repo_name:
            # Remove .git suffix
            if repo_name.endswith('.git'):
                repo_name = repo_name[:-4]
            # Extract from https://github.com/user/repo
            if '/github.com/' in repo_name:
                repo_name = repo_name.split('/github.com/')[-1]
            elif '/gitlab.com/' in repo_name:
                repo_name = repo_name.split('/gitlab.com/')[-1]
        
        branch = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        
        commit_hash = subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        
        return {
            "repo_url": repo_name,
            "branch": branch,
            "commit": commit_hash,
            "is_dirty": is_git_dirty(),
        }
    except (subprocess.CalledProcessError, FileNotFoundError):
        return {"error": "Not a git repository or git not found"}


def is_git_dirty() -> bool:
    """Check if there are uncommitted changes"""
    try:
        status = subprocess.check_output(
            ["git", "status", "--porcelain"],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        return bool(status)
    except subprocess.CalledProcessError:
        return False


def get_git_commit_message() -> str:
    """Get the latest commit message"""
    try:
        return subprocess.check_output(
            ["git", "log", "-1", "--pretty=%B"],
            stderr=subprocess.DEVNULL
        ).decode().strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return ""


# ============================================================================
# Storage Integration (0G Storage)
# ============================================================================

def calculate_file_hash(file_path: str) -> str:
    """Calculate SHA256 hash of a file"""
    sha256 = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while True:
            data = f.read(8192)
            if not data:
                break
            sha256.update(data)
    return "0x" + sha256.hexdigest()


def upload_to_0g_storage(
    file_path: str,
    indexer_url: str = "https://indexer-storage-testnet-turbo.0g.ai",
    rpc_url: str = "https://evmrpc-testnet.0g.ai",
    private_key: Optional[str] = None,
) -> Tuple[Optional[str], Optional[str]]:
    """
    Upload a file to 0G Storage and return (tx_hash, root_hash)
    
    Uses the official 0G Storage CLI if available. The 0G docs note that
    TypeScript SDK uploads resolve the Flow contract internally through the
    Indexer; the Python CLI keeps this path explicit by shelling out to the
    storage client.
    """
    try:
        cmd = [
            "0g-storage-client", "upload",
            "--url", rpc_url,
            "--indexer", indexer_url,
            "--file", file_path,
        ]
        
        if private_key:
            cmd.extend(["--key", private_key])
        elif os.getenv("PRIVATE_KEY"):
            cmd.extend(["--key", os.environ["PRIVATE_KEY"]])
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            raise Exception(f"CLI upload failed: {result.stderr}")
        
        # Parse output for root hash
        output = result.stdout + result.stderr
        
        # Try to find root hash in output
        import re
        hash_match = re.search(r'root[\s:]+(0x[a-fA-F0-9]{64})', output)
        if hash_match:
            root_hash = hash_match.group(1)
            return None, root_hash
        
        return None, None
        
    except Exception as e:
        print(f"Warning: Could not upload to 0G Storage: {e}")
        return None, None


def download_from_0g_storage(
    root_hash: str,
    output_path: str,
    indexer_url: str = "https://indexer-storage-testnet-turbo.0g.ai",
    with_proof: bool = True,
) -> bool:
    """Download a file from 0G Storage"""
    try:
        cmd = [
            "0g-storage-client", "download",
            "--indexer", indexer_url,
            "--root", root_hash,
            "--file", output_path,
        ]
        
        if with_proof:
            cmd.append("--proof")
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            raise Exception(f"Download failed: {result.stderr}")
        
        return True
        
    except Exception as e:
        print(f"Warning: Could not download from 0G Storage: {e}")
        return False


# ============================================================================
# Contract Integration
# ============================================================================

def register_model_on_chain(
    metadata: ModelMetadata,
    rpc_url: str = "https://evmrpc-testnet.0g.ai",
    contract_address: str = "",
    private_key: Optional[str] = None,
) -> Tuple[Optional[str], Optional[str]]:
    """
    Register a model on the ModelRegistry contract
    
    Returns: (tx_hash, model_id)
    """
    try:
        from web3 import Web3
        import json
        
        # Load ABI
        abi_path = Path(__file__).parent.parent / "contracts" / "artifacts" / "ModelRegistry.sol" / "ModelRegistry.json"
        if not abi_path.exists():
            # Try alternative path
            abi_path = Path(__file__).parent.parent.parent / "contracts" / "artifacts" / "contracts" / "ModelRegistry.sol" / "ModelRegistry.json"
        
        if not abi_path.exists():
            raise FileNotFoundError("ModelRegistry ABI not found. Please compile contracts first.")
        
        with open(abi_path) as f:
            abi = json.load(f)["abi"]
        
        # Initialize Web3
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        if not private_key:
            private_key = os.getenv("PRIVATE_KEY")
            if not private_key:
                raise ValueError("PRIVATE_KEY environment variable not set")
        
        account = w3.eth.account.from_key(private_key)
        contract = w3.eth.contract(address=contract_address, abi=abi)
        
        # Build transaction
        tx = contract.functions.registerModel(
            metadata.name,
            metadata.description,
            metadata.architecture,
            metadata.parameters,
            metadata.license,
            metadata.storage_root_hash,
        ).build_transaction({
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gas": 200000,
            "gasPrice": w3.eth.gas_price,
        })
        
        # Sign and send
        signed_tx = account.sign_transaction(tx)
        raw_tx = getattr(signed_tx, "rawTransaction", None) or getattr(signed_tx, "raw_transaction")
        tx_hash = w3.eth.send_raw_transaction(raw_tx)
        
        # Wait for receipt
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        events = contract.events.ModelRegistered().process_receipt(receipt)
        if events:
            model_id = str(events[0]["args"]["modelId"])
            return tx_hash.hex(), model_id
        
        return tx_hash.hex(), None
        
    except ImportError:
        pass
    
    # Fallback: Use ethers.js via subprocess or Hardhat
    try:
        # Try to use Hardhat scripts
        cmd = [
            "npx", "hardhat", "run",
            Path(__file__).parent.parent / "contracts" / "scripts" / "register-model.js",
            "--network", "galileo",
            "--name", metadata.name,
            "--description", metadata.description,
            "--architecture", metadata.architecture,
            "--parameters", str(metadata.parameters),
            "--license", metadata.license,
            "--storage-hash", metadata.storage_root_hash,
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            # Parse output for tx hash and model ID
            output = result.stdout
            import re
            tx_match = re.search(r'tx:\s*(0x[a-fA-F0-9]{64})', output)
            model_match = re.search(r'modelId:\s*(\d+)', output)
            
            return tx_match.group(1) if tx_match else None, model_match.group(1) if model_match else None
        
    except Exception as e:
        print(f"Warning: Could not register model on chain: {e}")
    
    return None, None


def deploy_space_on_chain(
    space_meta: SpaceMetadata,
    rpc_url: str = "https://evmrpc-testnet.0g.ai",
    contract_address: str = "",
    private_key: Optional[str] = None,
) -> Tuple[Optional[str], Optional[str]]:
    """
    Deploy a space on the AgentSpaceRegistry contract
    
    Returns: (tx_hash, space_id)
    """
    try:
        from web3 import Web3
        import json
        
        # Load ABI
        abi_path = Path(__file__).parent.parent / "contracts" / "artifacts" / "AgentSpaceRegistry.sol" / "AgentSpaceRegistry.json"
        if not abi_path.exists():
            abi_path = Path(__file__).parent.parent.parent / "contracts" / "artifacts" / "contracts" / "AgentSpaceRegistry.sol" / "AgentSpaceRegistry.json"
        
        if not abi_path.exists():
            raise FileNotFoundError("AgentSpaceRegistry ABI not found. Please compile contracts first.")
        
        with open(abi_path) as f:
            abi = json.load(f)["abi"]
        
        # Initialize Web3
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        if not private_key:
            private_key = os.getenv("PRIVATE_KEY")
            if not private_key:
                raise ValueError("PRIVATE_KEY environment variable not set")
        
        account = w3.eth.account.from_key(private_key)
        contract = w3.eth.contract(address=contract_address, abi=abi)
        
        # Build transaction
        tx = contract.functions.deploySpace(
            space_meta.name,
            space_meta.description,
            space_meta.version,
            int(space_meta.model_id) if space_meta.model_id else 0,
            space_meta.endpoint_url,
        ).build_transaction({
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gas": 200000,
            "gasPrice": w3.eth.gas_price,
        })
        
        # Sign and send
        signed_tx = account.sign_transaction(tx)
        raw_tx = getattr(signed_tx, "rawTransaction", None) or getattr(signed_tx, "raw_transaction")
        tx_hash = w3.eth.send_raw_transaction(raw_tx)
        
        # Wait for receipt
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Parse space ID from event
        for log in receipt.logs:
            try:
                event = contract.events.SpaceDeployed().process_receipt(receipt)
                if event:
                    space_id = str(event[0].args.spaceId)
                    return tx_hash.hex(), space_id
            except:
                pass
        
        return tx_hash.hex(), None
        
    except Exception as e:
        print(f"Warning: Could not deploy space on chain: {e}")
    
    return None, None


# ============================================================================
# 0G Compute Integration
# ============================================================================

def deploy_to_0g_compute(
    docker_image: str,
    name: str,
    model_id: Optional[str] = None,
    runtime: str = "python",
    port: int = 7860,
    env_vars: Optional[Dict[str, str]] = None,
) -> Tuple[Optional[str], Optional[str]]:
    """
    Deploy a Docker image to 0G Compute
    
    Returns: (service_url, deployment_id)
    
    Note: This uses the 0G Compute Router API or Direct SDK
    """
    try:
        # Use 0G Compute CLI if available
        cmd = [
            "0g-compute-cli", "deploy",
            "--image", docker_image,
            "--name", name,
            "--port", str(port),
        ]
        
        if model_id:
            cmd.extend(["--model-id", model_id])
        
        if env_vars:
            for key, value in env_vars.items():
                cmd.extend(["--env", f"{key}={value}"])
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            import re
            url_match = re.search(r'URL:\s*(https?://[^\s]+)', result.stdout)
            id_match = re.search(r'ID:\s*(\w+)', result.stdout)
            
            return url_match.group(1) if url_match else None, id_match.group(1) if id_match else None
        else:
            print(f"Warning: 0G Compute deployment failed: {result.stderr}")
            
    except Exception as e:
        print(f"Warning: Could not deploy to 0G Compute: {e}")
    
    return None, None


def build_docker_image(
    template_dir: str,
    tag: str,
    build_args: Optional[Dict[str, str]] = None,
) -> bool:
    """Build a Docker image from a template directory"""
    try:
        cmd = ["docker", "build", "-t", tag]
        
        if build_args:
            for key, value in build_args.items():
                cmd.extend(["--build-arg", f"{key}={value}"])
        
        cmd.append(template_dir)
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        
        if result.returncode != 0:
            print(f"Docker build failed: {result.stderr}")
            return False
        
        return True
        
    except Exception as e:
        print(f"Warning: Docker build failed: {e}")
        return False


# ============================================================================
# Main Functions
# ============================================================================

def load_config(config_path: Optional[str] = None) -> CoreedConfig:
    """Load configuration from file or environment"""
    config = CoreedConfig()
    
    # Try to load from file
    if config_path:
        config_file = Path(config_path)
    else:
        # Try default locations
        for path in [
            Path.cwd() / "coreed.json",
            Path.cwd() / ".coreed" / "config.json",
            Path.home() / ".coreed" / "config.json",
        ]:
            if path.exists():
                config_file = path
                break
        else:
            config_file = None
    
    if config_file and config_file.exists():
        with open(config_file) as f:
            data = json.load(f)
            for key, value in data.items():
                if hasattr(config, key):
                    setattr(config, key, value)
    
    # Override from environment variables
    env_mapping = {
        "PRIVATE_KEY": "private_key",
        "GALILEO_RPC_URL": "rpc_url",
        "STORAGE_INDEXER_URL": "storage_indexer",
        "ROUTER_API_URL": "router_api_url",
        "MODEL_REGISTRY_ADDRESS": "model_registry_address",
        "AGENT_REGISTRY_ADDRESS": "agent_registry_address",
        "SPACE_REGISTRY_ADDRESS": "space_registry_address",
        "COREED_PROJECT_DIR": "project_dir",
        "COREED_MODEL_DIR": "model_dir",
    }
    
    for env_key, config_key in env_mapping.items():
        if env_key in os.environ:
            setattr(config, config_key, os.environ[env_key])
    
    # Get git info
    git_info = get_git_repo_info()
    if "repo_url" in git_info and git_info["repo_url"]:
        config.repo_name = git_info["repo_url"].split('/')[-1]
    if "branch" in git_info and git_info["branch"]:
        config.branch = git_info["branch"]
    
    return config


def save_config(config: CoreedConfig, config_path: Optional[str] = None) -> bool:
    """Save configuration to file"""
    try:
        if config_path:
            output_path = Path(config_path)
        else:
            output_path = Path.cwd() / "coreed.json"
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert to dict, excluding private fields
        data = {k: v for k, v in asdict(config).items() if not k.startswith('_')}
        
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        return True
        
    except Exception as e:
        print(f"Warning: Could not save config: {e}")
        return False


def create_space_config(
    name: str,
    runtime: str = "python",
    template: str = "gradio",
    model_path: Optional[str] = None,
    port: int = 7860,
    **kwargs,
) -> CoreedConfig:
    """Create a CoreedConfig with sensible defaults"""
    config = CoreedConfig()
    
    config.space_name = name
    config.runtime = runtime
    config.template = template
    config.port = port
    
    # Infer model name from model path
    if model_path:
        model_name = Path(model_path).stem
        config.model_name = model_name
        config.model_dir = str(Path(model_path).parent)
    
    # Get git info
    git_info = get_git_repo_info()
    if "repo_url" in git_info and git_info["repo_url"]:
        config.repo_name = git_info["repo_url"].split('/')[-1]
    
    # Override with kwargs
    for key, value in kwargs.items():
        if hasattr(config, key):
            setattr(config, key, value)
    
    return config


def validate_environment(config: Optional[CoreedConfig] = None) -> Tuple[bool, List[str]]:
    """Validate that the environment is properly configured"""
    errors = []
    config = config or CoreedConfig()
    
    # Check for required tools
    required_tools = {
        "git": "Git is required for version control integration",
        "docker": "Docker is required for building and deploying containers",
    }
    
    for tool, message in required_tools.items():
        try:
            subprocess.run([tool, "--version"], 
                         capture_output=True, check=True)
        except (FileNotFoundError, subprocess.CalledProcessError):
            errors.append(f"{message} ({tool} not found)")
    
    # Check for private key
    if not (config.private_key or os.getenv("PRIVATE_KEY")):
        errors.append("PRIVATE_KEY environment variable not set")
    
    # Check for contract addresses
    if not config.model_registry_address:
        errors.append("ModelRegistry address is not set")
    if not config.space_registry_address:
        errors.append("AgentSpaceRegistry address is not set")
    
    return len(errors) == 0, errors


def push_to_coreed(
    model_path: Optional[str] = None,
    space_name: Optional[str] = None,
    runtime: str = "python",
    template: str = "gradio",
    auto_deploy: bool = True,
    commit_message: Optional[str] = None,
    force: bool = False,
    config: Optional[CoreedConfig] = None,
    **kwargs,
) -> PushResult:
    """
    Main function: Push code and model to Coreed (like push_to_hub)
    
    This function:
    1. Validates the environment
    2. Uploads the model to 0G Storage
    3. Registers the model on ModelRegistry
    4. Builds a Docker image
    5. Deploys to 0G Compute
    6. Registers the space on AgentSpaceRegistry
    7. Optionally commits and pushes to git
    
    Args:
        model_path: Path to the model file(s)
        space_name: Name for the agent space
        runtime: Runtime (python, node, docker)
        template: Template to use (gradio, fastapi, express, docker)
        auto_deploy: Automatically deploy the space
        commit_message: Custom git commit message
        force: Force deployment even if there are warnings
        config: Pre-configured CoreedConfig
        **kwargs: Additional configuration options
    
    Returns:
        PushResult with deployment details
    
    Raises:
        Exception: If deployment fails and force=False
    """
    
    start_time = time.time()
    result = PushResult(success=False)
    
    # Load or create configuration
    if config is None:
        config = create_space_config(
            name=space_name or "my-agent-space",
            runtime=runtime,
            template=template,
            model_path=model_path,
            **kwargs,
        )
    else:
        for key, value in kwargs.items():
            if hasattr(config, key) and value is not None:
                setattr(config, key, value)

    if space_name:
        config.space_name = space_name
    config.runtime = runtime or config.runtime
    config.template = template or config.template
    config.auto_deploy = auto_deploy
    
    # Step 1: Validate environment
    is_valid, errors = validate_environment(config)
    if not is_valid and not force:
        result.errors.extend(errors)
        return result
    result.warnings.extend(errors)
    
    # Step 2: Check git status
    git_info = get_git_repo_info()
    if "error" in git_info:
        result.warnings.append(f"Git warning: {git_info['error']}")
    elif git_info.get("is_dirty", False):
        result.warnings.append("Uncommitted changes detected. Consider committing first.")
    
    # Step 3: Process model files
    model_metadata = None
    if model_path and Path(model_path).is_file():
        model_file = Path(model_path)
        if not model_file.exists():
            result.errors.append(f"Model file not found: {model_path}")
            return result
        
        # Calculate hash
        storage_root_hash = calculate_file_hash(model_path)
        
        # Upload to 0G Storage (unless skipped)
        if not config.skip_storage:
            print(f"📤 Uploading {model_path} to 0G Storage...")
            tx_hash, root_hash = upload_to_0g_storage(
                model_path,
                config.storage_indexer,
                config.rpc_url,
                config.private_key or None,
            )
            if root_hash:
                storage_root_hash = root_hash
                result.storage_root_hash = root_hash
            else:
                result.warnings.append("Model upload to 0G Storage may have failed")
        
        # Create model metadata
        model_metadata = ModelMetadata(
            name=config.model_name or model_file.stem,
            description=config.model_description,
            architecture=config.model_architecture,
            parameters=config.model_parameters,
            license=config.model_license,
            tags=config.model_tags,
            storage_root_hash=storage_root_hash,
        )
        
        # Register model on-chain
        if config.verify_contracts and config.model_registry_address:
            print(f"📝 Registering model on ModelRegistry...")
            tx_hash, model_id = register_model_on_chain(
                model_metadata,
                config.rpc_url,
                config.model_registry_address,
                config.private_key or None,
            )
            if model_id:
                model_metadata = None  # Force re-creation with ID
                result.model_id = model_id
            else:
                result.warnings.append("Model registration may have failed")
    
    # Step 4: Prepare space metadata
    if config.model_id and not result.model_id:
        result.model_id = str(config.model_id)

    if not auto_deploy:
        result.deployment_time = time.time() - start_time
        result.success = len(result.errors) == 0
        return result

    space_meta = SpaceMetadata(
        name=config.space_name,
        description=config.space_description,
        version=config.space_version,
        model_id=int(result.model_id) if result.model_id else None,
        endpoint_url="",  # Will be set after deployment
        runtime=config.runtime,
        template=config.template,
        port=config.port,
    )
    
    # Step 5: Build Docker image
    template_dir = Path(__file__).parent.parent / "templates" / template
    if not template_dir.exists():
        result.errors.append(f"Template not found: {template}")
        return result
    
    print(f"🐳 Building Docker image from {template} template...")
    docker_tag = f"coreed-{space_meta.name.lower().replace(' ', '-')}:{space_meta.version}"
    
    if not build_docker_image(str(template_dir), docker_tag):
        result.errors.append("Docker build failed")
        return result
    
    # Step 6: Deploy to 0G Compute
    if auto_deploy:
        print(f"☁️  Deploying to 0G Compute...")
        
        # Prepare environment variables
        env_vars = {
            "MODEL_PATH": f"/app/models/{Path(model_path).name}" if model_path and Path(model_path).is_file() else "",
            "MODEL_NAME": space_meta.name,
            "SPACE_ID": "",  # Will be set after space registration
            "SPACE_VERSION": space_meta.version,
            "SERVER_PORT": str(space_meta.port),
        }
        
        endpoint_url, deployment_id = deploy_to_0g_compute(
            docker_tag,
            space_meta.name,
            result.model_id,
            space_meta.runtime,
            space_meta.port,
            env_vars,
        )
        
        if endpoint_url:
            space_meta.endpoint_url = endpoint_url
            result.endpoint_url = endpoint_url
        else:
            result.warnings.append("0G Compute deployment may have failed")
    
    # Step 7: Register space on-chain
    if config.verify_contracts and config.space_registry_address and space_meta.endpoint_url:
        print(f"🚀 Registering space on AgentSpaceRegistry...")
        tx_hash, space_id = deploy_space_on_chain(
            space_meta,
            config.rpc_url,
            config.space_registry_address,
            config.private_key or None,
        )
        
        if space_id:
            result.space_id = space_id
            result.contract_addresses = {
                "model_registry": config.model_registry_address,
                "space_registry": config.space_registry_address,
            }
        else:
            result.warnings.append("Space registration may have failed")
    
    # Step 8: Git integration
    if commit_message:
        try:
            # Commit changes
            subprocess.run(["git", "add", "."], check=True, capture_output=True)
            subprocess.run([
                "git", "commit", "-m", commit_message
            ], check=True, capture_output=True)
            
            # Push to remote
            subprocess.run(["git", "push"], check=True, capture_output=True)
            
            print(f"🎉 Git commit and push successful: {commit_message}")
            
        except Exception as e:
            result.warnings.append(f"Git operations failed: {e}")
    
    # Finalize result
    result.deployment_time = time.time() - start_time
    result.success = len(result.errors) == 0
    
    if result.success:
        print(f"\n✅ Successfully deployed to Coreed!")
        print(f"   Model ID: {result.model_id or 'N/A'}")
        print(f"   Space ID: {result.space_id or 'N/A'}")
        print(f"   Endpoint: {result.endpoint_url or 'N/A'}")
        print(f"   Storage Hash: {result.storage_root_hash or 'N/A'}")
    else:
        print(f"\n❌ Deployment failed with {len(result.errors)} error(s)")
        for error in result.errors:
            print(f"   - {error}")
    
    return result


def deploy_space(
    model_id: str,
    name: str = "My Agent Space",
    description: str = "",
    version: str = "1.0.0",
    runtime: str = "python",
    template: str = "gradio",
    port: int = 7860,
    **kwargs,
) -> PushResult:
    """
    Convenience function to deploy a space from an existing model
    
    Args:
        model_id: Model ID from ModelRegistry
        name: Space name
        description: Space description
        version: Space version
        runtime: Runtime (python, node, docker)
        template: Template to use
        port: Port number
        **kwargs: Additional options passed to push_to_coreed
    
    Returns:
        PushResult with deployment details
    """
    config = CoreedConfig(
        model_id=model_id,
        space_name=name,
        space_description=description,
        space_version=version,
        runtime=runtime,
        template=template,
        port=port,
        auto_deploy=True,
        skip_storage=True,  # Model already uploaded
    )
    
    return push_to_coreed(config=config, **kwargs)


def register_model(
    name: str,
    model_path: str,
    description: str = "",
    architecture: str = "",
    parameters: int = 0,
    license: str = "MIT",
    tags: Optional[List[str]] = None,
    **kwargs,
) -> PushResult:
    """
    Convenience function to register a model
    
    Args:
        name: Model name
        model_path: Path to model file
        description: Model description
        architecture: Model architecture
        parameters: Number of parameters
        license: License type
        tags: List of tags
        **kwargs: Additional options
    
    Returns:
        PushResult with model registration details
    """
    config = CoreedConfig(
        model_name=name,
        model_description=description,
        model_architecture=architecture,
        model_parameters=parameters,
        model_license=license,
        model_tags=tags or [],
        auto_deploy=False,
        verify_contracts=True,
    )
    
    return push_to_coreed(
        model_path=model_path,
        config=config,
        **kwargs,
    )


# ============================================================================
# CLI Entry Point
# ============================================================================

def main():
    """CLI entry point for push_to_coreed"""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(
        description="Push to Coreed - Deploy AI models and agents to Coreed on 0G Chain",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Deploy from current directory
  push-to-coreed

  # Deploy with custom model
  push-to-coreed --model-path models/my-model.gguf --space-name "My LLM"

  # Register a model only
  push-to-coreed --model-path models/my-model.gguf --register-only

  # Deploy a space from existing model
  push-to-coreed --model-id 1 --space-name "My Space"

  # With custom template
  push-to-coreed --model-path models/my-model.gguf --template fastapi
        """
    )
    
    # Positional arguments
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to model or project directory (default: current directory)"
    )
    
    # Model arguments
    parser.add_argument("-m", "--model-path", help="Path to model file")
    parser.add_argument("--model-name", help="Model name")
    parser.add_argument("--model-desc", help="Model description")
    parser.add_argument("--architecture", help="Model architecture")
    parser.add_argument("--parameters", type=int, help="Number of parameters")
    parser.add_argument("--license", default="MIT", help="Model license")
    parser.add_argument("--tags", nargs="+", help="Model tags")
    parser.add_argument("--model-id", type=int, help="Existing model ID to use")
    
    # Space arguments
    parser.add_argument("-n", "--space-name", help="Space name")
    parser.add_argument("-d", "--description", help="Space description")
    parser.add_argument("-v", "--version", default="1.0.0", help="Space version")
    parser.add_argument("-r", "--runtime", choices=["python", "node", "docker"], 
                        default="python", help="Runtime")
    parser.add_argument("-t", "--template", choices=["gradio", "fastapi", "express", "docker"],
                        default="gradio", help="Template to use")
    parser.add_argument("-p", "--port", type=int, default=7860, help="Port number")
    
    # Deployment options
    parser.add_argument("--auto-deploy", action="store_true", default=True,
                        help="Automatically deploy after registration")
    parser.add_argument("--no-deploy", action="store_false", dest="auto_deploy",
                        help="Skip deployment, only register")
    parser.add_argument("--register-only", action="store_true",
                        help="Only register model, don't deploy space")
    parser.add_argument("--skip-storage", action="store_true",
                        help="Skip uploading to 0G Storage")
    parser.add_argument("-f", "--force", action="store_true",
                        help="Force deployment even with warnings")
    
    # Git options
    parser.add_argument("--git-commit", action="store_true",
                        help="Commit changes before deployment")
    parser.add_argument("--commit-message", help="Git commit message")
    
    # Configuration
    parser.add_argument("-c", "--config", help="Config file path")
    parser.add_argument("--save-config", action="store_true",
                        help="Save configuration to coreed.json")
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate without actually deploying")
    
    # Network
    parser.add_argument("--rpc-url", help="0G RPC URL")
    parser.add_argument("--indexer-url", help="Storage indexer URL")
    parser.add_argument("--chain-id", type=int, help="Chain ID")
    
    args = parser.parse_args()
    
    # Set up logging
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )
    
    # Load configuration
    if args.config:
        config = load_config(args.config)
    else:
        config = load_config()
    
    # Override from args
    if args.rpc_url:
        config.rpc_url = args.rpc_url
    if args.indexer_url:
        config.storage_indexer = args.indexer_url
    if args.chain_id:
        config.chain_id = args.chain_id
    
    # Build kwargs
    kwargs = {
        "model_path": args.model_path or args.path,
        "space_name": args.space_name,
        "runtime": args.runtime,
        "template": args.template,
        "port": args.port,
        "auto_deploy": args.auto_deploy and not args.register_only,
        "skip_storage": args.skip_storage,
        "force": args.force,
    }
    
    if args.model_name:
        config.model_name = args.model_name
    if args.model_desc:
        config.model_description = args.model_desc
    if args.architecture:
        config.model_architecture = args.architecture
    if args.parameters:
        config.model_parameters = args.parameters
    if args.license:
        config.model_license = args.license
    if args.tags:
        config.model_tags = args.tags
    if args.description:
        config.space_description = args.description
    if args.version:
        config.space_version = args.version
    
    if args.model_id:
        kwargs["model_id"] = args.model_id
    
    # Git commit message
    if args.commit_message:
        kwargs["commit_message"] = args.commit_message
    elif args.git_commit:
        kwargs["commit_message"] = f"Deploy {args.space_name or 'agent space'} to Coreed"
    
    # Dry run
    if args.dry_run:
        print("🔍 Dry run - Validating configuration...")
        is_valid, errors = validate_environment(config)
        if not is_valid:
            print("❌ Validation failed:")
            for error in errors:
                print(f"   - {error}")
            sys.exit(1)
        else:
            print("✅ Configuration valid")
            print(f"   Model: {kwargs.get('model_path', 'N/A')}")
            print(f"   Space: {kwargs.get('space_name', 'N/A')}")
            print(f"   Template: {kwargs.get('template', 'N/A')}")
            print(f"   Runtime: {kwargs.get('runtime', 'N/A')}")
        sys.exit(0)
    
    # Save config if requested
    if args.save_config:
        save_config(config)
        print(f"✅ Configuration saved to {Path.cwd() / 'coreed.json'}")
    
    # Execute
    try:
        result = push_to_coreed(config=config, **kwargs)
        
        if not result.success:
            sys.exit(1)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
