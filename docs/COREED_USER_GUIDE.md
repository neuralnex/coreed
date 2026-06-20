# Coreed User Guide - Complete Reference
# "AI Platform for 0G Chain"

**The definitive guide to building, deploying, and sharing AI on Coreed**

---

## 📖 Table of Contents

### 🎯 Platform Guide (Interface Level)
1. [Setting Up Your Account](#1-setting-up-your-account)
2. [Navigating Coreed Platform](#2-navigating-coreed-platform)
3. [Profile & Settings](#3-profile--settings)
4. [Creating Repositories](#4-creating-repositories)
5. [Repository Structure & Metadata](#5-repository-structure--metadata)

### 💻 Development Methods
6. [CLI Level: push_to_coreed Command](#6-cli-level-push_to_coreed-command)
7. [SDK Level: Python & JavaScript](#7-sdk-level-python--javascript)
8. [Git Workflow Integration](#8-git-workflow-integration)

### ☁️ Hosting & Deployment
9. [Deploy to 0G Compute (Recommended)](#9-deploy-to-0g-compute-recommended)
10. [Alternative Hosting Options](#10-alternative-hosting-options)
11. [Health Monitoring](#11-health-monitoring)

### 🏗️ Templates & Customization
12. [Gradio Template (Interactive)](#12-gradio-template-interactive)
13. [FastAPI Template](#13-fastapi-template)
14. [Express Template](#14-express-template)
15. [Docker Template](#15-docker-template)

### ⚡ Quick Reference
16. [CLI Command Reference](#16-cli-command-reference)
17. [Network Configuration](#17-network-configuration)
18. [Troubleshooting](#18-troubleshooting)

---

# 🎯 Platform Guide (Interface Level)

This section covers using Coreed at the interface level, similar to AI Platform's web UI.

---

## 1. Setting Up Your Account

### Get a 0G Wallet

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

**Option B: Private Key (CLI Users)**
```bash
# Generate new private key
openssl rand -hex 32

# Export from MetaMask:
# Settings -> Security & Privacy -> Show Private Key
```

### Get Testnet Tokens

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

You need ~0.1 0G for:
- Model registration (gas: ~150K)
- Space deployment (gas: ~200K)
- 0G Compute deposit (funding)

### Install Coreed CLI

```bash
# Clone repository
git clone https://github.com/coreed/coreed.git
cd coreed

# Install CLI package
cd cli
pip install -e .
cd ..

# Verify
push-to-coreed --version
# or
python -m cli.coreed_cli --help
```

---

## 2. Navigating Coreed Platform

### Core Sections

| Section | Description | AI Platform Equivalent |
|---------|-------------|-------------------------|
| **Models** | Browse registered AI models | Models Hub |
| **Spaces** | Browse live deployments | Spaces |
| **Agents** | Browse registered agents | Organizations |
| **Create** | Create new model/space | New Model/New Space |
| **Dashboard** | Your content & activity | User Profile |

### Web Interface (Coming Soon)

While the web UI is being developed, the CLI provides full functionality:

```bash
# List all commands
push-to-coreed --help

# Validate your setup
push-to-coreed --dry-run

# Save configuration
push-to-coreed --save-config
```

---

## 3. Profile & Settings

### Authentication

Coreed uses your **wallet private key** for authentication (unlike traditional API token systems):

```bash
# Set private key (NEVER commit this!)
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Or use .env file
echo "PRIVATE_KEY=0xYOUR_PRIVATE_KEY" > .env
echo ".env" >> .gitignore
```

**Security Best Practices:**
- ✅ Use environment variables
- ✅ Add `.env` to `.gitignore`
- ✅ Use a dedicated wallet for deployments
- ❌ NEVER commit private keys to git
- ❌ NEVER share your private key

### Configuration Files

**`coreed.json`** (Project-level configuration):

```json
{
  "rpc_url": "https://evmrpc-testnet.0g.ai",
  "chain_id": 16602,
  "model_registry_address": "0xFA81366Ba81C19d848191B8e49eC0948230d4216",
  "space_registry_address": "0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C",
  "model_name": "My LLM",
  "space_name": "My Chatbot",
  "template": "gradio",
  "port": 7860
}
```

**`.coreed/config.json`** (User-level global config):

```json
{
  "default_network": "galileo",
  "default_rpc_url": "https://evmrpc-testnet.0g.ai",
  "model_registry_address": "0xFA81366Ba81C19d848191B8e49eC0948230d4216"
}
```

---

## 4. Creating Repositories

In Coreed, you create repositories for **models** and **spaces**:

### Create a Model Repository

#### Via CLI (Recommended)

```bash
# Register your model
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

#### Via Web Interface (Coming)

1. Click "New Model"
2. Fill form: Owner, Name, Visibility (Public/Private), License
3. Click "Create"
4. Upload files via web interface or CLI

### Create a Space Repository

#### Via CLI (Recommended)

```bash
# Deploy a new space from model
push-to-coreed \
  --model-id 1 \
  --space-name "My Chatbot" \
  --description "Chatbot powered by my LLM" \
  --version "1.0.0" \
  --template gradio \
  --runtime python \
  --port 7860
```

#### Via Web Interface (Coming)

1. Click "New Space"
2. Fill form: Owner, Name, Description, Model, Runtime, Template, Port
3. Click "Create"
4. Deploy using provided instructions

---

## 5. Repository Structure & Metadata

### Standard Repository Structure

```
my-repository/
├── README.md              # Model card + metadata
├── .gitignore             # Ignore patterns
├── .env                   # Environment (SECRET!)
├── .env.example           # Example env vars
├── coreed.json            # Coreed config
├── app.py                 # Main application (spaces)
├── requirements.txt       # Python deps
├── package.json           # Node.js deps (if applicable)
├── Dockerfile             # Docker config
└── models/                # Model files
    └── my-model.gguf
```

### Model Metadata Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| name | string | ✅ | Model name | "My LLM" |
| description | string | ❌ | What model does | "7B Qwen for chat" |
| architecture | string | ❌ | Model type | "Qwen2.5" |
| parameters | number | ❌ | Parameter count | 7000000000 |
| license | string | ❌ | Usage license | "Apache-2.0" |
| tags | array | ❌ | Search keywords | ["llm", "chat"] |
| storageRootHash | string | ✅ | 0G Storage hash | "0xabc123..." |

### Space Metadata Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| name | string | ✅ | Space name | "My Chatbot" |
| description | string | ❌ | What space does | "LLM chat interface" |
| version | string | ❌ | Space version | "1.0.0" |
| modelId | number | ❌ | Linked model | 1 |
| endpointUrl | string | ✅ | Live URL | "https://..." |
| runtime | string | ✅ | Runtime type | "python" |
| template | string | ✅ | UI template | "gradio" |
| port | number | ✅ | Server port | 7860 |

### Model Card (README.md)

Include metadata at the top of your README:

```markdown
---
language: en
tags:
  - llm
  - text-generation
  - qwen
pipeline_tag: text-generation
license: apache-2.0
model_id: 1
storage_hash: 0xabc123...
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
```

**Pipeline Tags:**
- `text-generation` - Generate text from prompts
- `text-classification` - Classify text
- `question-answering` - Answer questions
- `image-classification` - Classify images
- `image-generation` - Generate images
- `translation` - Translate text
- `summarization` - Summarize text

---

# 💻 Development Methods

---

## 6. CLI Level: push_to_coreed Command

The `push-to-coreed` CLI mirrors AI Platform's `push_to_coreed` but with blockchain superpowers.

### Installation

```bash
pip install -e ./cli
# or
pip install git+https://github.com/coreed/coreed.git#egg=coreed-cli
```

### Quick Start

```bash
# Minimal deployment
push-to-coreed

# With model path
push-to-coreed --model-path models/my-model.gguf --space-name "My Space"

# Register model only
push-to-coreed --model-path models/my-model.gguf --register-only

# Deploy existing model
push-to-coreed --model-id 1 --space-name "My Space"

# Validate without deploying
push-to-coreed --dry-run
```

### Complete Command Reference

```
push-to-coreed [PATH] [OPTIONS]

MODEL OPTIONS:
  -m, --model-path PATH      Path to model file
  --model-name NAME         Model name
  --model-desc DESCRIPTION  Model description
  --architecture ARCH      Model architecture
  --parameters N           Number of parameters
  --license LICENSE        Model license (default: MIT)
  --tags TAG1 TAG2...       Model tags
  --model-id ID            Existing model ID

SPACE OPTIONS:
  -n, --space-name NAME     Space name
  -d, --description DESC   Space description
  -v, --version VERSION    Space version (default: 1.0.0)
  -r, --runtime RUNTIME    Runtime: python, node, docker
  -t, --template TEMPLATE  Template: gradio, fastapi, express, docker
  -p, --port PORT          Port number

DEPLOYMENT OPTIONS:
  --auto-deploy            Auto deploy after registration (default: true)
  --no-deploy              Skip deployment, only register
  --register-only          Only register model
  --skip-storage          Skip 0G Storage upload
  -f, --force              Force even with warnings

GIT OPTIONS:
  --git-commit             Commit before deployment
  --commit-message MESSAGE Git commit message

CONFIGURATION:
  -c, --config PATH        Config file path
  --save-config           Save config to coreed.json
  --dry-run               Validate without deploying

NETWORK:
  --rpc-url URL           0G RPC URL
  --indexer-url URL       Storage indexer URL
  --chain-id ID           Chain ID

ENVIRONMENT:
  PRIVATE_KEY             Wallet private key
  MODEL_REGISTRY_ADDRESS  ModelRegistry address
  SPACE_REGISTRY_ADDRESS  AgentSpaceRegistry address
```

### Examples

**Full deployment:**
```bash
push-to-coreed \
  --model-path models/qwen-7b.gguf \
  --model-name "Qwen 7B" \
  --model-desc "7B parameter Qwen model" \
  --architecture "Qwen2.5" \
  --parameters 7000000000 \
  --license "Apache-2.0" \
  --tags llm text-generation \
  --space-name "Qwen Chatbot" \
  --description "Chatbot powered by Qwen 7B" \
  --version "1.0.0" \
  --template gradio \
  --runtime python \
  --port 7860
```

**With git integration:**
```bash
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My Space" \
  --git-commit \
  --commit-message "Deploy v1.0.0"
```

**Multiple models:**
```bash
# Register models
push-to-coreed --model-path models/model1.gguf --model-name "Model 1" --register-only
push-to-coreed --model-path models/model2.gguf --model-name "Model 2" --register-only

# Deploy space with first model
push-to-coreed --model-id 1 --space-name "Space with Model 1"
```

---

## 7. SDK Level: Python & JavaScript

### Python SDK

```python
from coreed_cli import (
    push_to_coreed,
    deploy_space,
    register_model,
    download_model_from_storage,
    CoreedConfig,
    PushResult
)

# Basic deployment
result: PushResult = push_to_coreed(
    model_path="models/my-model.gguf",
    space_name="My Chatbot",
    template="gradio"
)

print(f"Success: {result.success}")
print(f"Model ID: {result.model_id}")
print(f"Space ID: {result.space_id}")

# With configuration
config = CoreedConfig(
    model_name="My LLM",
    model_architecture="Qwen2.5",
    space_name="My Chatbot",
    template="gradio",
    port=7860
)
result = push_to_coreed(config=config)

# Register model only
model_result = register_model(
    name="My LLM",
    model_path="models/my-model.gguf",
    description="7B parameter model",
    architecture="Qwen2.5",
    parameters=7000000000,
    license="Apache-2.0",
    tags=["llm", "text-generation"]
)

# Deploy space from existing model
space_result = deploy_space(
    model_id="1",
    name="My Chatbot",
    version="1.0.0",
    template="gradio"
)
```

### JavaScript SDK (Frontend)

```typescript
import { useAgentSpaceRegistry, useModelRegistry } from "@/lib/useAgentSpaceRegistry";

// Deploy space
const { deploySpace } = useAgentSpaceRegistry();
await deploySpace(signer, {
  name: "My Chatbot",
  description: "A chatbot",
  version: "1.0.0",
  modelId: "1",
  endpointUrl: "https://my-space.0g.compute"
});

// Register model
const { registerModel } = useModelRegistry();
await registerModel(signer, {
  name: "My LLM",
  description: "7B model",
  architecture: "Qwen2.5",
  parameters: 7000000000,
  license: "Apache-2.0",
  storageRootHash: "0xabc123..."
});

// Get space
const { getSpace } = useAgentSpaceRegistry();
const space = await getSpace(1);

// Get model
const { getModel } = useModelRegistry();
const model = await getModel(1);
```

---

## 8. Git Workflow Integration

Like AI Platform, Coreed supports git-based workflows.

### Auto-Commit & Push

```bash
# Deploy with automatic git operations
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My Space" \
  --git-commit \
  --commit-message "Deploy v1.0.0"
```

This will:
1. Deploy your space
2. `git add .`
3. `git commit -m "Deploy v1.0.0"`
4. `git push`

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Coreed

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -e ./cli
      - run: |
          push-to-coreed \
            --model-path models/my-model.gguf \
            --space-name "My Space" \
            --force
        env:
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
          MODEL_REGISTRY_ADDRESS: ${{ secrets.MODEL_REGISTRY_ADDRESS }}
          SPACE_REGISTRY_ADDRESS: ${{ secrets.SPACE_REGISTRY_ADDRESS }}
```

### Git Hooks

**Post-commit hook:**
```bash
# .git/hooks/post-commit
#!/bin/sh
push-to-coreed --git-commit --commit-message "Auto-deploy: $GIT_COMMIT"
chmod +x .git/hooks/post-commit
```

---

# ☁️ Hosting & Deployment

---

## 9. Deploy to 0G Compute (Recommended)

### Why 0G Compute?

| Feature | 0G Compute | Traditional Cloud |
|---------|------------|-------------------|
| Cost | 90% cheaper | Expensive |
| Latency | 50-100ms | 100-500ms |
| OpenAI SDK | ✅ Compatible | ❌ |
| TEE Security | ✅ Yes | ❌ |
| Pay-per-use | ✅ Yes | Monthly fees |

### Router vs Direct

| Feature | Router API | Direct SDK |
|---------|------------|------------|
| Endpoint | Single URL | Per-provider |
| Balance | Unified | Per-provider |
| Failover | Automatic | Manual |
| Best for | Prototyping | Production |

### Deploy Using Coreed CLI

```bash
# Simple deployment (recommended)
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My Chatbot" \
  --template gradio

# This does everything:
# 1. Uploads model to 0G Storage
# 2. Registers on ModelRegistry
# 3. Builds Docker image
# 4. Deploys to 0G Compute
# 5. Registers on AgentSpaceRegistry
```

### Deploy Using 0G Compute CLI

```bash
# Install
pnpm add -g @0gfoundation/0g-compute-ts-sdk

# Setup
0g-compute-cli setup-network
0g-compute-cli login

# Deposit funds
0g-compute-cli deposit --amount 10

# Deploy
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

### Using Router API

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://router-api.0g.ai/v1",
    api_key="sk-..."  # From https://pc.0g.ai
)

response = client.chat.completions.create(
    model="zai-org/GLM-5-FP8",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

---

## 10. Alternative Hosting Options

### Docker (Local Development)

```bash
# Build
docker build -t my-space .

# Run
docker run -p 7860:7860 \
  -e MODEL_PATH=/app/models/model.gguf \
  -v $(pwd)/models:/app/models:ro \
  my-space

# With docker-compose
docker-compose up -d
```

### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT/my-space

# Deploy
gcloud run deploy my-space \
  --image gcr.io/PROJECT/my-space \
  --port 7860 \
  --allow-unauthenticated
```

### Fly.io

```bash
# Install
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly launch --name my-space
fly secrets set MODEL_PATH=/app/models/model.gguf
fly deploy
```

---

## 11. Health Monitoring

### Health Endpoint Requirement

All spaces MUST provide `/health` endpoint:

```json
{
  "status": "healthy",
  "timestamp": 1718764800,
  "space_id": "1",
  "model_loaded": true,
  "version": "1.0.0"
}
```

**Monitoring:**
- Frequency: Every 30 seconds
- Timeout: 3 seconds
- Max Retries: 3
- Status: If fails, space marked as **inactive**

### Implementation

**Gradio:**
```python
@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}
```

**FastAPI:**
```python
@app.get("/health")
def health():
    return _health_status
```

**Express:**
```javascript
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', model_loaded: model !== null });
});
```

---

# 🏗️ Templates & Customization

---

## 12. Gradio Template (AI Platform-style)

**Best for:** Interactive web UIs, chatbots, demos

**Port:** 7860

**File Structure:**
```
gradio/
├── app.py           # Main application
├── Dockerfile       # Multi-stage build
├── requirements.txt # Dependencies
├── .env.example     # Environment template
└── README.md        # Documentation
```

**Quick Start:**
```bash
cd templates/gradio
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
python app.py
```

**Customization:**
```python
# app.py - Replace placeholder functions
def load_model():
    from transformers import AutoModelForCausalLM, AutoTokenizer
    global model, tokenizer
    tokenizer = AutoTokenizer.from_pretrained(os.getenv("MODEL_PATH"))
    model = AutoModelForCausalLM.from_pretrained(os.getenv("MODEL_PATH"))
    if torch.cuda.is_available():
        model = model.to("cuda")
    _health_status["model_loaded"] = True

def chat(message, history):
    inputs = tokenizer(message, return_tensors="pt").to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=100)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
```

---

## 13. FastAPI Template

**Best for:** REST APIs, programmatic access

**Port:** 8000

**File Structure:**
```
fastapi/
├── main.py
├── Dockerfile
├── requirements.txt
└── .env.example
```

**Quick Start:**
```bash
cd templates/fastapi
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

---

## 14. Express Template

**Best for:** Node.js applications

**Port:** 3000

**File Structure:**
```
express/
├── server.js
├── package.json
├── Dockerfile
└── .env.example
```

**Quick Start:**
```bash
cd templates/express
npm install
cp .env.example .env
node server.js
```

---

## 15. Docker Template

**Best for:** Custom runtimes

**Port:** 8080

**File Structure:**
```
docker/
├── Dockerfile
└── .env.example
```

---

# ⚡ Quick Reference

---

## 16. CLI Command Reference

```bash
# Help
push-to-coreed --help

# Deploy
push-to-coreed --model-path models/model.gguf --space-name "My Space"

# Register only
push-to-coreed --model-path models/model.gguf --register-only

# Git integration
push-to-coreed --git-commit --commit-message "Deploy"

# Validate
push-to-coreed --dry-run

# Save config
push-to-coreed --save-config
```

---

## 17. Network Configuration

### Galileo Testnet (Default)

```
RPC URL:           https://evmrpc-testnet.0g.ai
Chain ID:          16602
Storage Indexer:   https://indexer-storage-testnet-turbo.0g.ai
Compute Router:    https://router-api.0g.ai/v1
Explorer:          https://chainscan-galileo.0g.ai
Faucet:            https://faucet.0g.ai

ModelRegistry:     0xFA81366Ba81C19d848191B8e49eC0948230d4216
AgentRegistry:    0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
```

---

## 18. Troubleshooting

### Common Issues

**PRIVATE_KEY not set**
```bash
export PRIVATE_KEY=0xYOUR_KEY
```

**Insufficient funds**
```bash
open https://faucet.0g.ai
```

**Model not found**
```bash
ls -la models/my-model.gguf
```

**Docker not found**
```bash
curl -fsSL https://get.docker.com | sh
```

**0G Storage upload failed**
```bash
0g-storage-client upload --url https://evmrpc-testnet.0g.ai --key $PRIVATE_KEY --indexer https://indexer-storage-testnet-turbo.0g.ai --file models/my-model.gguf
```

**Contract registration failed**
```bash
npx hardhat compile  # Compile contracts first
```

---

**Coreed: AI Platform for 0G Chain** 🚀

*Built with ❤️ on 0G*
*Last updated: June 2026*
