# Coreed User Guide - AI Platform Flow Aligned

**Coreed: AI Platform for 0G Chain**

This guide maps the complete AI Platform workflow to Coreed's implementation, ensuring users familiar with AI Platform can seamlessly transition to Coreed.

---

# Table of Contents

1. [Phase 1: Creating Your Account](#phase-1-creating-your-account)
2. [Phase 2: Navigating Coreed Platform Sections](#phase-2-navigating-coreed-platform-sections)
3. [Phase 3: Setting Up Your Profile & Settings](#phase-3-setting-up-your-profile--settings)
4. [Phase 4: Creating a Repository (Step-by-Step Fields)](#phase-4-creating-a-repository-step-by-step-fields)
5. [Phase 5: Inside the Repository (The Final Fields)](#phase-5-inside-the-repository-the-final-fields)
6. [Interface Level Guide](#interface-level-guide)
7. [CLI Level Guide](#cli-level-guide)
8. [SDK Level Guide](#sdk-level-guide)
9. [Hosting Guide](#hosting-guide)

---

# Phase 1: Creating Your Account

**AI Platform**: Sign up at coreed.ai with email/password, verify email, set profile details.

**Coreed**: Get a 0G wallet (your identity on Coreed).

### Step 1 - Wallet Setup (Equivalent to Traditional Platform Account Credentials)

**Option A: MetaMask (Recommended)**
```bash
# 1. Install MetaMask browser extension
# 2. Create new wallet or import existing
# 3. Add 0G Galileo Testnet:
#    - Network Name: 0G Galileo Testnet
#    - RPC URL: https://evmrpc-testnet.0g.ai
#    - Chain ID: 16602
#    - Currency: 0G
#    - Explorer: https://chainscan-galileo.0g.ai
```

**Option B: Private Key (CLI Users - Equivalent to Traditional Platform Access Tokens)**
```bash
# Generate new private key (like Traditional Platform Write token)
openssl rand -hex 32

# Export from MetaMask:
# Settings -> Security & Privacy -> Show Private Key
# This is your "Write Token" for Coreed
```

### Step 2 - Get Testnet Tokens (Equivalent to Free Tier)

```bash
# Method 1: Visit faucet in browser
open https://faucet.0g.ai

# Method 2: Use API
curl https://faucet.0g.ai/api/v1/faucet \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"address":"YOUR_WALLET_ADDRESS"}'

# Method 3: Google Cloud Faucet
open https://cloud.google.com/application/web3/faucet/0g/galileo
```

**Cost Requirements:**
- ~0.1 0G for model registration (gas: ~150K)
- ~0.1 0G for space deployment (gas: ~200K)
- Additional for 0G Compute deposit (funding)

### Step 3 - Install Coreed CLI (Equivalent to `ai-platform-hub` package)

```bash
# Clone Coreed repository
git clone https://github.com/coreed/coreed.git
cd coreed

# Install CLI package (like pip install ai-platform-hub)
cd cli
pip install -e .
cd ..

# Verify installation (like --version)
push-to-coreed --version
# or
python -m cli.coreed_cli --help
```

**Authentication:**
Unlike Traditional Platform's separate API tokens, Coreed uses your **wallet private key** for all operations.

```bash
# Set private key (NEVER commit this - like Traditional Platform Write Token)
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Or use .env file (like Traditional Platform .env)
echo "PRIVATE_KEY=0xYOUR_PRIVATE_KEY" > .env
echo ".env" >> .gitignore
```

**Security Best Practices (Same as Traditional Platform):**
- ✅ Use environment variables
- ✅ Add `.env` to `.gitignore`
- ✅ Use a dedicated wallet for deployments
- ❌ NEVER commit private keys to git
- ❌ NEVER share your private key

---

# Phase 2: Navigating Coreed Platform Sections

**AI Platform Sections → Coreed Equivalents**

| AI Platform | Coreed | Description | Contract/API |
|-------------|--------|-------------|-------------|
| **Models** | **Models** | Browse registered AI models | ModelRegistry.sol |
| **Datasets** | (Future) | Datasets for training | (Planned) |
| **Spaces** | **Spaces** | Live deployments (Agent Spaces) | AgentSpaceRegistry.sol |
| **Posts** | (Future) | Social feed | (Planned) |
| **Docs** | **Docs** | Documentation | Local files |
| **Organizations** | **Agents** | Multi-developer collaboration | AgentRegistry.sol |

### Web Interface (Equivalent to coreed.ai)

While the web UI is being developed, the CLI provides **full functionality** equivalent to Traditional Platform's web interface:

```bash
# List all commands (like --help)
push-to-coreed --help

# Validate your setup (like login --check)
push-to-coreed --dry-run

# Save configuration (like repo create)
push-to-coreed --save-config
```

### Core Sections Comparison

| Section | AI Platform | Coreed | URL Pattern |
|---------|-------------|--------|-------------|
| Model Repository | coreed.ai/username/model-name | coreed.ai/username/model-id | /models/:id |
| Space | coreed.ai/username/space-name | coreed.ai/username/space-id | /spaces/:id |
| User Profile | coreed.ai/username | coreed.ai/username | /:username |
| Create Model | New Model button | push-to-coreed --register-only | N/A |
| Create Space | New Space button | push-to-coreed | N/A |

---

# Phase 3: Setting Up Your Profile & Settings

**AI Platform**: Profile icon → Settings → Access Tokens, SSH Keys, Billing.

**Coreed**: Profile is your wallet. Settings are environment variables and config files.

### 1. Authentication (Equivalent to Traditional Platform Access Tokens)

Coreed uses **wallet private keys** instead of separate API tokens:

| Traditional Platform Concept | Coreed Equivalent | Environment Variable |
|------------|-------------------|---------------------|
| Read Token | PRIVATE_KEY (read-only mode) | PRIVATE_KEY |
| Write Token | PRIVATE_KEY (full access) | PRIVATE_KEY |
| Token Name | Wallet address | N/A |
| Token Role | Wallet permissions | N/A (all or nothing) |

**Creating a "Token" (Wallet Setup):**
```bash
# This is your "Write Token" - equivalent to Traditional Platform Write token
openssl rand -hex 32

# Set it
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

**Note**: Unlike Traditional Platform, Coreed doesn't have separate Read/Write tokens. Your private key gives you full access to all operations.

### 2. Git SSH Keys (Equivalent to Traditional Platform Git Integration)

Coreed repositories **are** Git repositories. You can use SSH or HTTPS.

```bash
# Add your SSH key to git (standard git setup)
ssh-add ~/.ssh/id_rsa

# Clone using SSH (like Traditional Platform)
git clone git@github.com:your-repo/my-coreed-space.git

# Or use HTTPS
git clone https://github.com/your-repo/my-coreed-space.git
```

### 3. Configuration Files (Equivalent to Traditional Platform Settings)

**User-Level Configuration** (like Traditional Platform global settings):
```json
# ~/.coreed/config.json
{
  "default_network": "galileo",
  "default_rpc_url": "https://evmrpc-testnet.0g.ai",
  "model_registry_address": "0xFA81366Ba81C19d848191B8e49eC0948230d4216",
  "space_registry_address": "0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C"
}
```

**Project-Level Configuration** (like Traditional Platform repo settings):
```json
# coreed.json (in your project directory)
{
  "rpc_url": "https://evmrpc-testnet.0g.ai",
  "chain_id": 16602,
  "storage_indexer": "https://indexer-storage-testnet-turbo.0g.ai",
  "model_registry_address": "0xFA81366Ba81C19d848191B8e49eC0948230d4216",
  "space_registry_address": "0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C",
  "model_name": "My LLM",
  "space_name": "My Chatbot",
  "template": "gradio",
  "port": 7860
}
```

### 4. Organizations (Equivalent to Traditional Platform Organizations)

Coreed uses **AgentRegistry** for multi-developer collaboration:

```bash
# Create an agent (organization) - equivalent to Traditional Platform Organization
# This is done via frontend or direct contract call
# AgentRegistry.sol handles developer tracking
```

**Comparison:**
| Traditional Platform Organizations | Coreed Agents |
|-----------------|----------------|
| Collaborate on private repos | Multi-developer agent spaces |
| Billing for compute | Gas payments on 0G Chain |
| Access control | On-chain permissions |
| Ownership transfer | Contract ownership transfer |

---

# Phase 4: Creating a Repository (Step-by-Step Fields)

**AI Platform**: New Model → Fill form (Owner, Name, Visibility, License) → Create → Upload files.

**Coreed**: Use CLI or frontend to create model/space repositories.

### Via CLI (Recommended - Equivalent to `repo create`)

#### Create a Model Repository (Equivalent to Traditional Platform Model Repo)

```bash
# Register your model - equivalent to:
# create-model --repo-id username/model-name --type model

push-to-coreed \
  --model-path models/my-model.gguf \
  --model-name "My LLM" \
  --model-desc "A 7B parameter Qwen model" \
  --architecture "Qwen2.5" \
  --parameters 7000000000 \
  --license "Apache-2.0" \
  --tags llm text-generation qwen \
  --register-only
```

**Field-by-Field Comparison:**

| Field | Traditional Platform | Coreed | Type | Required | Description |
|-------|----|--------|------|----------|-------------|
| Owner | Dropdown | Wallet Address | string | ✅ | Determines on-chain ownership |
| Repository Name | Text Input | Model Name | string | ✅ | Model identifier (max 128 chars) |
| Visibility | Radio Buttons | N/A (All public on-chain) | - | ❌ | Coreed is fully transparent |
| License | Dropdown | --license | string | ❌ | SPDX license identifier |
| Type | Model/Dataset/Space | Model/Space | enum | ✅ | Determined by command |

**Coreed-Specific Fields:**

| Field | Coreed Only | Type | Required | Description | Traditional Platform Equivalent |
|-------|-------------|------|----------|-------------|-----------------|
| architecture | Yes | string | ❌ | Model type (Qwen2.5, Llama3) | model-card metadata |
| parameters | Yes | uint256 | ❌ | Number of parameters | model-card metadata |
| tags | Yes | string[] | ❌ | Search keywords | tags in README |
| storageRootHash | Yes | bytes32 | ✅ | 0G Storage root hash | LFS pointer |

#### Via Frontend (Coming - Equivalent to Traditional Platform Web UI)

1. Click "New Model"
2. Fill form:
   - Owner: Your wallet address
   - Name: Model name
   - Description: What the model does
   - Architecture: Model type
   - Parameters: Model size
   - License: Usage license
   - Tags: Keywords
3. Click "Create"
4. Upload files via web interface or CLI

### Create a Space Repository (Equivalent to Traditional Platform Space)

```bash
# Deploy a new space - equivalent to:
# create-repo --repo-id username/space-name --type space --space-sdk gradio

push-to-coreed \
  --model-id 1 \
  --space-name "My Chatbot" \
  --description "Chatbot powered by my LLM" \
  --version "1.0.0" \
  --template gradio \
  --runtime python \
  --port 7860
```

**Field-by-Field Comparison:**

| Field | Traditional Platform | Coreed | Type | Required | Description |
|-------|----|--------|------|----------|-------------|
| Owner | Dropdown | Wallet Address | string | ✅ | Your address |
| Repository Name | Text Input | Space Name | string | ✅ | Space identifier |
| Description | Text Input | --description | string | ❌ | What the space does |
| SDK | Gradio/Streamlit/Docker | --template | enum | ✅ | UI framework |
| Hardware | CPU/GPU options | Runtime | enum | ✅ | python/node/docker |

**Coreed-Specific Fields:**

| Field | Coreed Only | Type | Required | Description | Traditional Platform Equivalent |
|-------|-------------|------|----------|-------------|-----------------|
| version | Yes | string | ❌ | Space version | Space settings |
| modelId | Yes | uint256 | ❌ | Linked model ID | Model dependency |
| endpointUrl | Yes | string | ✅ | Live URL | Space URL |
| port | Yes | uint16 | ✅ | Server port | Space settings |

---

# Phase 5: Inside the Repository (The Final Fields)

**AI Platform**: README.md with YAML metadata, Files & versions tab, Community tab, Settings tab.

**Coreed**: Model card (README.md), repository structure, on-chain metadata, health monitoring.

### 1. The Model Card (README.md - Equivalent to Traditional Platform Model Card)

Coreed uses **README.md** with YAML metadata at the top, just like AI Platform:

```markdown
---
# Coreed Model Card Metadata (Equivalent to Traditional Platform YAML block)

# Required fields (like Traditional Platform)
language: en                    # Model language (e.g., en, es, fr)
license: apache-2.0            # SPDX license identifier
model_id: 1                    # Coreed model ID (auto-assigned)

# Coreed-specific fields
tags:                           # Search keywords
  - llm
  - text-generation
  - qwen
pipeline_tag: text-generation  # Task type (activates inference widget)
architecture: Qwen2.5          # Model architecture
parameters: 7000000000         # Parameter count
storage_hash: 0xabc123...       # 0G Storage root hash

# Optional fields (like Traditional Platform)
datasets: []                   # Training datasets
metrics: []                    # Evaluation metrics
---

# My LLM

A 7B parameter Qwen model fine-tuned for conversational AI.

## Model Details
- **Architecture**: Qwen2.5
- **Parameters**: 7B
- **Quantization**: 4-bit
- **License**: Apache-2.0

## Usage

```python
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained("./models/my-model.gguf")
```

## Pipeline Tags (Coreed Equivalent to Traditional Platform Inference Widget)

Pipeline tags tell Coreed what kind of task this model performs. This enables the inference API.

Available tags:
- `text-generation` - Generate text from prompts
- `text-classification` - Classify text
- `question-answering` - Answer questions
- `image-classification` - Classify images
- `image-generation` - Generate images
- `translation` - Translate text
- `summarization` - Summarize text
- `text-to-speech` - Generate speech
- `automatic-speech-recognition` - Transcribe speech
```

### 2. Files and Versions (Equivalent to Traditional Platform Files Tab)

**AI Platform**: Uses Git LFS for large files (.bin, .safetensors, .onnx).

**Coreed**: Uses **0G Storage** for model files, with on-chain Merkle root hash.

```bash
# Upload to 0G Storage (equivalent to git lfs track + git add)
0g-storage-client upload \
  --url https://evmrpc-testnet.0g.ai \
  --key $PRIVATE_KEY \
  --indexer https://indexer-storage-testnet-turbo.0g.ai \
  --file models/my-model.gguf

# Output: root_hash = 0xabc123...
# This hash is stored on ModelRegistry contract

# Download from 0G Storage (equivalent to git lfs pull)
0g-storage-client download \
  --indexer https://indexer-storage-testnet-turbo.0g.ai \
  --root 0xabc123... \
  --file ./models/my-model.gguf \
  --proof
```

**Comparison:**

| Operation | AI Platform | Coreed |
|-----------|-------------|--------|
| Upload large file | `git lfs track + git add` | `0g-storage-client upload` |
| Download large file | `git lfs pull` | `0g-storage-client download` |
| Storage backend | Git LFS (centralized) | 0G Storage (decentralized) |
| Cost | Free (with limits) | ~95% cheaper than S3 |
| Verification | Git LFS pointers | Merkle tree proof |

**Repository Structure (Standard):**
```
my-repository/
├── README.md              # Model card + metadata (Like Traditional Platform)
├── .gitignore             # Ignore patterns
├── .env                   # Environment (SECRET! - Like Traditional Platform)
├── .env.example           # Example env vars
├── coreed.json            # Coreed config (Like Traditional Platform repo settings)
├── app.py                 # Main application (Spaces only)
├── requirements.txt       # Python deps
├── package.json           # Node.js deps (if applicable)
├── Dockerfile             # Docker config
└── models/                # Model files
    └── my-model.gguf      # Stored on 0G Storage
```

### 3. Commit (Equivalent to Traditional Platform Commits)

Every change in Coreed asks for a **commit message**, just like Git:

```bash
# Deploy with git commit
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My Chatbot" \
  --git-commit \
  --commit-message "Deploy v1.0.0"

# This will:
# 1. Deploy the space
# 2. git add .
# 3. git commit -m "Deploy v1.0.0"
# 4. git push

# Manual commit (like Traditional Platform)
git add .
git commit -m "Update model card"
git push
```

**Version History:**
- All model registrations are stored on-chain
- All space deployments are tracked on-chain
- Git commits track code changes
- 0G Storage provides file versioning via Merkle trees

### 4. Community & Settings Tabs

**Community Tab (Equivalent to Traditional Platform Discussions):**
- **Discussions**: Open issues or questions about the model/space
- **Pull Requests**: Submit changes to model card or code
- **Likes**: Like models (on-chain via ModelRegistry.likeModel())
- **Downloads**: Track downloads (on-chain via ModelRegistry.recordDownload())

**Settings Tab (Equivalent to Traditional Platform Repo Settings):**
```bash
# Rename repository - Not directly supported, but you can:
# 1. Deploy new space with new name
# 2. Update on-chain metadata

# Transfer ownership - Via contract
# Coreed uses on-chain ownership, transfer via:
# - ModelRegistry.transferOwnership()
# - AgentSpaceRegistry.transferOwnership()

# Make public/private - All Coreed repos are public (on-chain)
# This is by design - decentralized and transparent

# Delete repository - Via contract
# - ModelRegistry.deactivateModel()
# - AgentSpaceRegistry.deactivateSpace()
```

**Comparison:**

| Setting | AI Platform | Coreed |
|---------|-------------|--------|
| Rename | ✅ | ✅ (Deploy new + update metadata) |
| Transfer Ownership | ✅ | ✅ (On-chain transfer) |
| Public/Private | ✅ | ❌ (All public - on-chain) |
| Delete | ✅ | ✅ (Deactivate on-chain) |
| Collaborators | ✅ | ✅ (AgentRegistry operators) |

---

# Interface Level Guide

**For users who prefer the web interface (like coreed.ai)**

### Web Interface Navigation (Coming Soon)

While the full web UI is in development, here's how to use the CLI for all interface-level operations:

#### 1. Browse Models (Equivalent to Traditional Platform Models Hub)
```bash
# List all models (via contract query)
# This will be available in the web UI at /hub

# For now, use CLI to query:
python -c "
from web3 import Web3
w3 = Web3(Web3.HTTPProvider('https://evmrpc-testnet.0g.ai'))
contract = w3.eth.contract(address='0xFA81366Ba81C19d848191B8e49eC0948230d4216', abi=[...])
models = contract.functions.getModelsByCreator('YOUR_ADDRESS').call()
print(models)
"
```

#### 2. Create New Model (Equivalent to Traditional Platform New Model Button)
```bash
# Use push-to-coreed with --register-only
push-to-coreed \
  --model-path models/my-model.gguf \
  --model-name "My LLM" \
  --register-only
```

#### 3. Upload Files (Equivalent to Traditional Platform File Uploader)
```bash
# Upload to 0G Storage
0g-storage-client upload \
  --url https://evmrpc-testnet.0g.ai \
  --key $PRIVATE_KEY \
  --indexer https://indexer-storage-testnet-turbo.0g.ai \
  --file models/my-model.gguf

# Then register the model
push-to-coreed \
  --model-path models/my-model.gguf \
  --model-name "My LLM" \
  --register-only
```

#### 4. Edit Model Card (Equivalent to Traditional Platform README.md Editor)
```bash
# Edit README.md locally
nano README.md

# Update on-chain metadata (if needed)
# Model name, description, etc. are stored on-chain
# Use contract functions to update
```

#### 5. Deploy Space (Equivalent to Traditional Platform New Space Button)
```bash
# Deploy a space from your model
push-to-coreed \
  --model-id 1 \
  --space-name "My Chatbot" \
  --template gradio
```

---

# CLI Level Guide

**For users who prefer the command line (like `ai-platform-hub` CLI)**

### Installation

```bash
# Install Coreed CLI (equivalent to: pip install ai-platform-hub)
pip install -e ./cli
```

### Authentication

```bash
# Set private key (equivalent to: login)
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Verify authentication
push-to-coreed --dry-run
```

### Repository Operations

#### Create Model Repository (Equivalent to `create-repo`)
```bash
# Register a model
push-to-coreed \
  --model-path models/my-model.gguf \
  --model-name "My LLM" \
  --architecture "Qwen2.5" \
  --parameters 7000000000 \
  --license "Apache-2.0" \
  --tags llm text-generation \
  --register-only
```

#### Upload Files (Equivalent to `upload`)
```bash
# Method 1: Via push-to-coreed (recommended)
push-to-coreed \
  --model-path models/my-model.gguf \
  --model-name "My LLM" \
  --register-only

# Method 2: Manual upload to 0G Storage
0g-storage-client upload \
  --url https://evmrpc-testnet.0g.ai \
  --key $PRIVATE_KEY \
  --indexer https://indexer-storage-testnet-turbo.0g.ai \
  --file models/my-model.gguf

# Then register with the root hash
push-to-coreed \
  --model-path models/my-model.gguf \
  --storage-hash 0x... \
  --register-only
```

#### Download Files (Equivalent to `download`)
```bash
# Download from 0G Storage (equivalent to: download username/model file)
0g-storage-client download \
  --indexer https://indexer-storage-testnet-turbo.0g.ai \
  --root 0x... \
  --file ./models/my-model.gguf \
  --proof

# Or use Python SDK
from coreed_cli import download_model_from_storage
download_model_from_storage(
    root_hash="0x...",
    output_path="models/my-model.gguf"
)
```

#### Delete Repository (Equivalent to `delete-repo`)
```bash
# Deactivate model on-chain
# This is equivalent to deleting a repo on Traditional Platform
from web3 import Web3
w3 = Web3(Web3.HTTPProvider('https://evmrpc-testnet.0g.ai'))
contract = w3.eth.contract(address='0xFA81366Ba81C19d848191B8e49eC0948230d4216', abi=[...])
tx = contract.functions.deactivateModel(modelId).build_transaction({
    'from': w3.eth.account.from_key(PRIVATE_KEY).address,
    'nonce': w3.eth.get_transaction_count(w3.eth.account.from_key(PRIVATE_KEY).address),
})
signed_tx = w3.eth.account.from_key(PRIVATE_KEY).sign_transaction(tx)
w3.eth.send_raw_transaction(signed_tx.rawTransaction)
```

### Space Operations

#### Create Space (Equivalent to `repo create --type space`)
```bash
push-to-coreed \
  --model-id 1 \
  --space-name "My Chatbot" \
  --description "A chatbot interface" \
  --template gradio \
  --runtime python \
  --port 7860
```

#### Deploy Space (Equivalent to Traditional Platform Space deployment)
```bash
# Full deployment (upload + register + deploy)
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My Chatbot" \
  --template gradio

# Deploy existing model
push-to-coreed \
  --model-id 1 \
  --space-name "My Chatbot"
```

#### Update Space (Equivalent to Traditional Platform Space settings update)
```bash
# Update space metadata
from web3 import Web3
w3 = Web3(Web3.HTTPProvider('https://evmrpc-testnet.0g.ai'))
contract = w3.eth.contract(address='0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C', abi=[...])
tx = contract.functions.updateEndpoint(spaceId, newEndpoint).build_transaction({...})
# ... sign and send
```

---

# SDK Level Guide

**For users who prefer Python/JavaScript SDKs (like `ai-platform-hub` library)**

### Python SDK

```python
from coreed_cli import (
    push_to_coreed,
    deploy_space,
    register_model,
    download_model_from_storage,
    upload_to_0g_storage,
    CoreedConfig,
    PushResult,
    ModelMetadata,
    SpaceMetadata
)
```

#### Model Operations

**Register Model (Equivalent to `API().create_repo()`)**
```python
from coreed_cli import register_model, ModelMetadata

# Create model metadata
metadata = ModelMetadata(
    name="My LLM",
    description="A 7B parameter Qwen model",
    architecture="Qwen2.5",
    parameters=7000000000,
    license="Apache-2.0",
    tags=["llm", "text-generation", "qwen"],
    storage_root_hash="0x..."
)

# Register model
result = register_model(
    name="My LLM",
    model_path="models/my-model.gguf",
    description="A 7B parameter Qwen model",
    architecture="Qwen2.5",
    parameters=7000000000,
    license="Apache-2.0",
    tags=["llm", "text-generation"]
)

print(f"Model ID: {result.model_id}")
print(f"Storage Hash: {result.storage_root_hash}")
```

**Download Model (Equivalent to `API().download_file()`)**
```python
from coreed_cli import download_model_from_storage

success = download_model_from_storage(
    root_hash="0x...",
    output_path="models/my-model.gguf",
    indexer_url="https://indexer-storage-testnet-turbo.0g.ai"
)
```

#### Space Operations

**Deploy Space (Equivalent to Traditional Platform Space creation + deployment)**
```python
from coreed_cli import deploy_space, PushResult

result: PushResult = deploy_space(
    model_id="1",  # From ModelRegistry
    name="My Chatbot",
    description="A chatbot powered by my LLM",
    version="1.0.0",
    template="gradio",
    runtime="python",
    port=7860
)

print(f"Success: {result.success}")
print(f"Space ID: {result.space_id}")
print(f"Endpoint: {result.endpoint_url}")
```

**Full Deployment (Equivalent to Traditional Platform model upload + space creation)**
```python
from coreed_cli import push_to_coreed, CoreedConfig

# Using configuration object
config = CoreedConfig(
    model_name="My LLM",
    model_description="A 7B parameter Qwen model",
    model_architecture="Qwen2.5",
    model_parameters=7000000000,
    model_license="Apache-2.0",
    model_tags=["llm", "text-generation"],
    space_name="My Chatbot",
    space_description="A chatbot interface",
    space_version="1.0.0",
    runtime="python",
    template="gradio",
    port=7860,
    auto_deploy=True,
    verify_contracts=True
)

result = push_to_coreed(config=config)

# Check results
print(f"Success: {result.success}")
print(f"Model ID: {result.model_id}")
print(f"Space ID: {result.space_id}")
print(f"Endpoint: {result.endpoint_url}")
print(f"Storage Hash: {result.storage_root_hash}")
```

### JavaScript/TypeScript SDK

```typescript
import { 
    useAgentSpaceRegistry, 
    useModelRegistry 
} from "@/lib/useAgentSpaceRegistry";
```

#### Model Operations

**Register Model (Equivalent to Traditional Platform API model creation)**
```typescript
import { useModelRegistry } from "@/lib/useModelRegistry";

const { registerModel } = useModelRegistry();

const result = await registerModel(signer, {
  name: "My LLM",
  description: "A 7B parameter Qwen model",
  architecture: "Qwen2.5",
  parameters: 7000000000,
  license: "Apache-2.0",
  tags: ["llm", "text-generation"],
  storageRootHash: "0x..."
});

console.log(`Model ID: ${result.modelId}`);
```

**Get Model (Equivalent to `API().model_info()`)**
```typescript
const { getModel } = useModelRegistry();
const model = await getModel(signer, modelId);

console.log(`Name: ${model.name}`);
console.log(`Description: ${model.description}`);
console.log(`Architecture: ${model.architecture}`);
```

#### Space Operations

**Deploy Space (Equivalent to Traditional Platform Space creation)**
```typescript
import { useAgentSpaceRegistry } from "@/lib/useAgentSpaceRegistry";

const { deploySpace } = useAgentSpaceRegistry();

const result = await deploySpace(signer, {
  name: "My Chatbot",
  description: "A chatbot powered by my LLM",
  version: "1.0.0",
  modelId: "1",
  endpointUrl: "https://my-space.0g.compute",
  runtime: "python",
  template: "gradio",
  port: 7860
});

console.log(`Space ID: ${result.spaceId}`);
```

**Get Space (Equivalent to Traditional Platform Space info)**
```typescript
const { getSpace } = useAgentSpaceRegistry();
const space = await getSpace(spaceId);

console.log(`Name: ${space.name}`);
console.log(`Endpoint: ${space.endpointUrl}`);
console.log(`Status: ${space.isActive ? 'Active' : 'Inactive'}`);
```

**Update Health Status (Coreed-specific - automatic in Traditional Platform)**
```typescript
const { updateHealthStatus } = useAgentSpaceRegistry();

// Manually update health (usually automatic via /health endpoint)
await updateHealthStatus(signer, spaceId, true);
```

---

# Hosting Guide

**How to host your Coreed spaces on various platforms**

## Option 1: 0G Compute (Recommended - Equivalent to Traditional Platform Free Spaces)

**Why 0G Compute?**
- 90% cheaper than traditional cloud
- 50-100ms latency
- OpenAI SDK compatible
- TEE-secured
- Pay-per-use
- Decentralized (no single point of failure)

### Router API (Simplest - Equivalent to Traditional Platform default hosting)

```python
from openai import OpenAI

# Configure OpenAI SDK for 0G Compute Router
client = OpenAI(
    base_url="https://router-api.0g.ai/v1",
    api_key="sk-..."  # Get from https://pc.0g.ai
)

# Use any model available on 0G Compute
response = client.chat.completions.create(
    model="zai-org/GLM-5-FP8",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
```

### Direct SDK (More Control - For advanced users)

```python
from openai import OpenAI

# Each provider has its own endpoint and secret
client = OpenAI(
    base_url="https://PROVIDER_URL/v1/proxy",
    api_key="app-sk-..."  # From 0g-compute-cli
)

response = client.chat.completions.create(
    model="Qwen2.5-0.5B-Instruct",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### Using Coreed CLI with 0G Compute

```bash
# Simple deployment (recommended)
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My Chatbot" \
  --template gradio

# This automatically:
# 1. Uploads model to 0G Storage
# 2. Registers on ModelRegistry
# 3. Builds Docker image
# 4. Deploys to 0G Compute
# 5. Registers on AgentSpaceRegistry
```

### Using 0G Compute CLI Directly

```bash
# Install 0G Compute CLI
pnpm add -g @0gfoundation/0g-compute-ts-sdk

# Setup network
0g-compute-cli setup-network

# Login with wallet
0g-compute-cli login

# Deposit funds (like Traditional Platform billing)
0g-compute-cli deposit --amount 10

# List available providers
0g-compute-cli inference list-providers

# Deploy your space
0g-compute-cli deploy \
  --image your-image:tag \
  --name "My Chatbot" \
  --port 7860 \
  --env MODEL_PATH=/app/models/model.gguf

# Check deployments
0g-compute-cli deployments

# View logs
0g-compute-cli logs --deployment DEPLOYMENT_ID
```

## Option 2: Docker (Local Development - Equivalent to Traditional Platform Local Testing)

```bash
# Build Docker image
docker build -t my-coreed-space .

# Run with model mounted
docker run -p 7860:7860 \
  -e MODEL_PATH=/app/models/model.gguf \
  -e MODEL_NAME="My LLM" \
  -e SPACE_ID=1 \
  -e SPACE_VERSION=1.0.0 \
  -v $(pwd)/models:/app/models:ro \
  my-coreed-space

# Test health endpoint
curl http://localhost:7860/health

# Access Gradio UI
open http://localhost:7860
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  coreed-space:
    build: .
    ports:
      - "7860:7860"
    environment:
      - MODEL_PATH=/app/models/model.gguf
      - MODEL_NAME=My LLM
      - SPACE_ID=1
      - SPACE_VERSION=1.0.0
      - SERVER_PORT=7860
      - GRADIO_SERVER_NAME=0.0.0.0
    volumes:
      - ./models:/app/models:ro
```

```bash
# Start
docker-compose up -d

# Stop
docker-compose down
```

## Option 3: Google Cloud Run (Equivalent to Traditional Platform Paid Spaces)

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT/my-coreed-space

# Deploy to Cloud Run
gcloud run deploy my-coreed-space \
  --image gcr.io/PROJECT/my-coreed-space \
  --port 7860 \
  --set-env-vars "MODEL_PATH=/app/models/model.gguf,MODEL_NAME=My LLM,SPACE_ID=1" \
  --allow-unauthenticated

# Update deployment
gcloud run deploy my-coreed-space \
  --image gcr.io/PROJECT/my-coreed-space:new-version \
  --port 7860
```

## Option 4: Fly.io (Equivalent to Traditional Platform Alternative Hosting)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch new app
fly launch --name my-coreed-space
# Select: Dockerfile, port 7860

# Set secrets
fly secrets set MODEL_PATH=/app/models/model.gguf
fly secrets set MODEL_NAME="My LLM"
fly secrets set SPACE_ID=1
fly secrets set SPACE_VERSION=1.0.0

# Deploy
fly deploy

# Scale
fly scale count 2
```

## Option 5: Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create new project
railway init

# Add environment variables in Railway dashboard
# MODEL_PATH=/app/models/model.gguf
# MODEL_NAME=My LLM
# SPACE_ID=1
# SPACE_VERSION=1.0.0

# Deploy
railway up
```

---

# Comparison Table: AI Platform vs Coreed

| Feature | AI Platform | Coreed | Coreed Advantage |
|---------|-------------|--------|------------------|
| **Account Setup** | Email + Password | 0G Wallet | Decentralized identity |
| **Authentication** | API Tokens | Private Key | Unified authentication |
| **Storage** | Git LFS | 0G Storage | 95% cheaper, decentralized |
| **Compute** | Centralized (CPU/GPU) | 0G Compute | 90% cheaper, decentralized |
| **Model Registry** | Hub | ModelRegistry Contract | On-chain, transparent |
| **Space Registry** | Hub | AgentSpaceRegistry Contract | On-chain, transparent |
| **Repository Type** | Model, Dataset, Space | Model, Space | Simplified |
| **Visibility** | Public/Private | Public (on-chain) | Full transparency |
| **Versioning** | Git commits | Git + On-chain | Dual versioning |
| **Large Files** | Git LFS | 0G Storage | Decentralized, verified |
| **Health Checks** | Automatic | /health endpoint | Customizable |
| **Cost** | Free + Paid tiers | Pay-per-use | No subscriptions |
| **CLI** | `ai-platform-hub` | `push-to-coreed` | Feature-equivalent |
| **Python SDK** | `ai-platform-hub` | `coreed_cli` | Feature-equivalent |
| **JS SDK** | `AI Library` | Frontend hooks | React-ready |

---

# Onboarding Checklist

## For New Users

- [ ] **Get a 0G Wallet** (MetaMask or private key)
- [ ] **Get Testnet Tokens** from https://faucet.0g.ai
- [ ] **Install Coreed CLI**: `pip install -e ./cli`
- [ ] **Set Environment Variables**:
  ```bash
  export PRIVATE_KEY=0x...
  export MODEL_REGISTRY_ADDRESS=0xFA81366Ba81C19d848191B8e49eC0948230d4216
  export SPACE_REGISTRY_ADDRESS=0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
  ```
- [ ] **Verify Setup**: `push-to-coreed --dry-run`
- [ ] **Deploy First Model**: `push-to-coreed --model-path models/my-model.gguf --register-only`
- [ ] **Deploy First Space**: `push-to-coreed --model-id 1 --space-name "My Chatbot"`

## For Developers

- [ ] **Extend Templates**: Add new templates for different frameworks
- [ ] **Improve CLI**: Add more convenience functions
- [ ] **Add Tests**: Unit tests for CLI and deployment scripts
- [ ] **Monitoring**: Add space monitoring dashboard
- [ ] **CI/CD**: Set up automated testing and deployment

---

# Quick Reference Commands

## Model Operations

| Action | AI Platform | Coreed |
|--------|-------------|--------|
| Create model | `create-repo` | `push-to-coreed --register-only` |
| Upload files | `upload` | `push-to-coreed --model-path` |
| Download files | `download` | `0g-storage-client download` or `download_model_from_storage()` |
| List models | Browser / API | `ModelRegistry.getModelsByCreator()` |
| Delete model | Traditional Platform Settings | `ModelRegistry.deactivateModel()` |

## Space Operations

| Action | AI Platform | Coreed |
|--------|-------------|--------|
| Create space | New Space button | `push-to-coreed` |
| Deploy space | Traditional Platform Hosting | 0G Compute deployment |
| Update space | Space Settings | `AgentSpaceRegistry.updateEndpoint()` |
| Delete space | Space Settings | `AgentSpaceRegistry.deactivateSpace()` |

## Repository Operations

| Action | AI Platform | Coreed |
|--------|-------------|--------|
| Clone repo | `git clone` | `git clone` |
| Pull changes | `git pull` | `git pull` |
| Push changes | `git push` | `git push` + `push-to-coreed` |
| View files | Browser | Browser + `0g-storage-client` |

---

# Network Configuration

## Galileo Testnet (Default)

```
RPC URL:           https://evmrpc-testnet.0g.ai
Chain ID:          16602
Storage Indexer:   https://indexer-storage-testnet-turbo.0g.ai
Compute Router:    https://router-api.0g.ai/v1
Explorer:          https://chainscan-galileo.0g.ai
Storage Explorer:  https://storagescan-galileo.0g.ai
Faucet:            https://faucet.0g.ai
```

## Contract Addresses

```
ModelRegistry:      0xFA81366Ba81C19d848191B8e49eC0948230d4216
AgentRegistry:     0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
AgentSpaceRegistry: 0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
```

---

# Summary

**Coreed provides a AI Platform-like experience on 0G Chain.**

### For Users Familiar with AI Platform:
- **Same concepts**: Models, Spaces, Repositories
- **Same workflow**: Create → Upload → Deploy → Share
- **Same tools**: CLI, SDK, Git integration
- **Better infrastructure**: Decentralized storage and compute
- **Full transparency**: Everything on-chain

### Key Differences to Remember:
1. **Authentication**: Use wallet private key instead of API tokens
2. **Storage**: 0G Storage instead of Git LFS
3. **Compute**: 0G Compute instead of Traditional Platform hosting
4. **Visibility**: All repositories are public (on-chain transparency)
5. **Cost**: Pay-per-use on 0G instead of subscriptions

### Everything is Aligned!

✅ **Interface Level**: Web UI equivalent via CLI
✅ **CLI Level**: `push-to-coreed` equivalent to `ai-platform-hub` CLI
✅ **SDK Level**: Python and JavaScript SDKs equivalent to Traditional Platform SDKs
✅ **Hosting**: Multiple hosting options including 0G Compute (recommended)

**The AI Platform workflow you know, now on 0G Chain with decentralized superpowers!** 🚀

---

**Coreed: AI Platform for the Decentralized Age**

*Last updated: June 19, 2026*
