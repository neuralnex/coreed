# Coreed User Guide - Phase 3 (Agent Spaces)

**Coreed v3.0: Hugging Face for the 0G Chain**

This comprehensive guide covers everything you need to know to use Coreed like a pro - from model registration to live deployment on 0G Compute.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Core Concepts](#2-core-concepts)
3. [Model Registration](#3-model-registration)
4. [Agent Space Deployment](#4-agent-space-deployment)
5. [Git Workflow Integration](#5-git-workflow-integration)
6. [push_to_coreed Function](#6-push_to_coreed-function)
7. [0G Compute Integration](#7-0g-compute-integration)
8. [CLI Reference](#8-cli-reference)
9. [Templates](#9-templates)
10. [Health Monitoring](#10-health-monitoring)
11. [Best Practices](#11-best-practices)
12. [Troubleshooting](#12-troubleshooting)
13. [Hosting Guide](#13-hosting-guide)
14. [Space Sleep & Pause Management](#space-sleep--pause-management)

---

## 1. Quick Start

### Prerequisites

Before you begin, ensure you have:

- **0G Wallet**: Get testnet 0G from [faucet.0g.ai](https://faucet.0g.ai)
- **Private Key**: Export from MetaMask or create with `openssl rand -hex 32`
- **Git**: For version control integration
- **Docker**: For containerization
- **Python 3.8+**: For Gradio/FastAPI templates
- **Node.js 18+**: For Express template

### Installation

```bash
# Clone Coreed repository
git clone https://github.com/your-repo/coreed.git
cd coreed

# Install Coreed CLI
cd cli
pip install -e .

# Or use directly
python -m cli.coreed_cli
```

### One-Command Deployment

```bash
# From your project directory with a model file
push-to-coreed --model-path models/my-model.gguf --space-name "My LLM"
```

This will:
1. Upload your model to 0G Storage
2. Register it on ModelRegistry
3. Build a Docker image with Gradio UI
4. Deploy to 0G Compute
5. Register your space on AgentSpaceRegistry

---

## 2. Core Concepts

### Models vs Agents vs Spaces

| Concept | Description | Analogy |
|---------|-------------|---------|
| **Model** | AI model files (gguf, safetensors, etc.) stored on 0G Storage | Hugging Face Model |
| **Agent** | Registered entity on AgentRegistry (v1) | - |
| **Space** | Live deployment with an endpoint | Hugging Face Space |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        COREED ECOSYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  ModelRegistry  │    │  AgentRegistry  │    │ 0G Storage  │ │
│  │  (v2)           │    │  (v1)           │    │             │ │
│  └────────┬────────┘    └────────┬────────┘    └──────┬──────┘ │
│           │                 │                     │           │
│           ▼                 ▼                     ▼           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    AGENT SPACES                                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │ │
│  │  │  Gradio     │  │  FastAPI    │  │   Express       │     │ │
│  │  │  Template   │  │  Template   │  │   Template      │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    0G COMPUTE                                  │ │
│  │  Router API: https://router-api.0g.ai/v1                     │ │
│  │  Direct SDK: @0gfoundation/0g-compute-ts-sdk                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **ModelRegistry Contract**: On-chain registry for AI models
   - Stores model metadata (name, description, architecture, etc.)
   - Links to storage root hash on 0G Storage
   - Enables discovery and filtering

2. **AgentSpaceRegistry Contract**: On-chain registry for live deployments
   - Tracks space metadata (name, description, version)
   - Stores endpoint URLs
   - Monitors health status
   - Tracks request counts

3. **0G Storage**: Decentralized storage for model files
   - 95% cheaper than AWS S3
   - 200 MBPS retrieval speed
   - Merkle tree verification

4. **0G Compute**: Decentralized GPU marketplace
   - 90% cheaper than traditional cloud
   - OpenAI SDK compatible
   - TEE for secure processing

---

## 3. Model Registration

### Manual Registration

```bash
# Upload model to 0G Storage
0g-storage-client upload \
  --url https://evmrpc-testnet.0g.ai \
  --key $PRIVATE_KEY \
  --indexer https://indexer-storage-testnet-turbo.0g.ai \
  --file models/my-model.gguf

# Note the root hash from output: 0x...

# Register on ModelRegistry
npx hardhat run scripts/register-model.js --network galileo \
  --name "My LLM" \
  --description "A 7B parameter language model" \
  --architecture "Qwen2.5" \
  --parameters 7000000000 \
  --license "Apache-2.0" \
  --storage-hash 0x...
```

### Using Coreed CLI

```bash
# Register a model only
push-to-coreed --model-path models/my-model.gguf \
  --model-name "My LLM" \
  --model-desc "A 7B parameter language model" \
  --architecture "Qwen2.5" \
  --parameters 7000000000 \
  --license "Apache-2.0" \
  --register-only
```

### Model Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | ✅ Yes | Model identifier (max 128 chars) |
| description | string | ❌ No | What the model does (max 2048 chars) |
| architecture | string | ❌ No | Qwen2.5, Llama3, Mistral, etc. |
| parameters | uint256 | ❌ No | Number of parameters |
| license | string | ❌ No | Apache-2.0, MIT, GPL-3.0, etc. |
| tags | string[] | ❌ No | Comma-separated labels |
| storageRootHash | bytes32 | ✅ Yes | 0G Storage root hash |
| modelId | uint256 | ❌ No | Auto-assigned model ID from ModelRegistry |
| modelProvider | string | ❌ No | Provider/organization (e.g., "nexusbert", "Qwen") |
| pipelineTag | string | ❌ No | Task type (text-generation, text-classification, etc.) |
| language | string | ❌ No | Model language (en, es, fr, etc.) |
| datasets | string[] | ❌ No | Training datasets used |
| metrics | JSON | ❌ No | Evaluation metrics |

**Pipeline Tags** (for inference):
- `text-generation` - Generate text from prompts
- `text-classification` - Classify text
- `question-answering` - Answer questions
- `image-classification` - Classify images
- `image-generation` - Generate images
- `translation` - Translate text
- `summarization` - Summarize text
- `text-to-speech` - Generate speech
- `automatic-speech-recognition` - Transcribe speech

### Loading Models from Coreed (Like Hugging Face)

Just like Hugging Face's `from transformers import AutoModelForCausalLM`, you can load Coreed models using standard AI libraries. Coreed provides the **modelId** and **storageRootHash** for identification.

#### Python - Transformers (Recommended)

```python
# Method 1: Load from local path (after downloading from 0G Storage)
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# Download model first from Coreed
# Model ID: 1, Storage Hash: 0xabc123...
# Download: 0g-storage-client download --root 0xabc123... --file models/model-1.gguf

model_path = "./models/model-1.gguf"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(model_path)
model.eval()

if torch.cuda.is_available():
    model = model.to("cuda")

# Use the model
inputs = tokenizer("Hello, how are you?", return_tensors="pt").to(model.device)
outputs = model.generate(**inputs, max_new_tokens=50)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

```python
# Method 2: Using Coreed CLI to download and load
from coreed_cli import download_model_from_storage
from transformers import AutoModelForCausalLM, AutoTokenizer

# Download from Coreed by model ID
# First, get the storage hash from ModelRegistry
model_id = 1
storage_hash = "0xabc123..."  # From ModelRegistry.getModel(model_id)

# Download the model
download_model_from_storage(
    root_hash=storage_hash,
    output_path="models/model-1.gguf"
)

# Load with Transformers
tokenizer = AutoTokenizer.from_pretrained("./models/model-1.gguf")
model = AutoModelForCausalLM.from_pretrained("./models/model-1.gguf")
```

#### Python - Sentence Transformers

```python
from sentence_transformers import SentenceTransformer
from coreed_cli import download_model_from_storage

# Download model from Coreed
storage_hash = "0xabc123..."
download_model_from_storage(
    root_hash=storage_hash,
    output_path="models/embedding-model"
)

# Load embedding model
model = SentenceTransformer("models/embedding-model")

# Use for embeddings
embeddings = model.encode(["Hello world", "How are you?"])
print(embeddings.shape)  # (2, 384) or similar
```

#### Python - Llama.cpp (for GGUF models)

```python
# For GGUF models (common on Coreed)
import subprocess
from coreed_cli import download_model_from_storage

# Download GGUF model from Coreed
storage_hash = "0xabc123..."
download_model_from_storage(
    root_hash=storage_hash,
    output_path="models/llama-7b-q4.gguf"
)

# Use with llama-cpp-python
from llama_cpp import Llama

llm = Llama(
    model_path="models/llama-7b-q4.gguf",
    n_ctx=2048,
    n_threads=8,
    n_gpu_layers=32 if torch.cuda.is_available() else 0
)

# Generate text
output = llm(
    "What is machine learning?",
    max_tokens=100,
    temperature=0.7
)
print(output["choices"][0]["text"])
```

#### Python - Using Coreed Model ID Directly

```python
from coreed_cli import get_model_from_registry, download_model_from_storage
from transformers import AutoModelForCausalLM, AutoTokenizer

# Get model info from Coreed
model_id = 1
model_info = get_model_from_registry(model_id)

print(f"Model Name: {model_info['name']}")
print(f"Architecture: {model_info['architecture']}")
print(f"Parameters: {model_info['parameters']}")
print(f"Storage Hash: {model_info['storageRootHash']}")

# Download and load
storage_hash = model_info['storageRootHash']
download_model_from_storage(
    root_hash=storage_hash,
    output_path=f"models/{model_info['name']}.gguf"
)

# Load with appropriate library based on architecture
if model_info['architecture'].startswith('Qwen'):
    from transformers import AutoModelForCausalLM, AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained(f"models/{model_info['name']}.gguf")
    model = AutoModelForCausalLM.from_pretrained(f"models/{model_info['name']}.gguf")
elif model_info['architecture'].startswith('Llama'):
    from llama_cpp import Llama
    model = Llama(model_path=f"models/{model_info['name']}.gguf")
```

#### JavaScript - Transformers.js

```javascript
// Using @xenova/transformers
const { pipeline, env } = require('@xenova/transformers');
const { download_model_from_storage } = require('coreed-cli');

// Set local model directory
env.localModelPath = "./models";

// Download model from Coreed (via Node.js bindings)
// storageHash = "0xabc123..."
// Download to ./models directory

// Load model
async function loadModel() {
  const generator = await pipeline('text-generation', './models/my-model');
  
  const output = await generator('Hello, how are you?', {
    max_new_tokens: 100,
    temperature: 0.7
  });
  
  console.log(output[0].generated_text);
}

loadModel();
```

#### JavaScript - Using Fetch (Browser)

```javascript
// Load model from Coreed URL in browser
// Note: For large models, use a backend service

import { pipeline } from '@xenova/transformers';

async function loadCoreedModel() {
  // In production, your backend would download from 0G Storage
  // and serve via API. For demo purposes:
  
  const generator = await pipeline('text-generation', 'Xenova/qwen-0.5b');
  
  const result = await generator('Tell me about AI', {
    max_new_tokens: 100
  });
  
  console.log(result[0].generated_text);
}
```

#### Fast Inference Guide

**Quick Start - 30 Seconds:**
```python
# 1. Install requirements
pip install transformers torch llama-cpp-python

# 2. Download model from Coreed (model ID: 1, hash: 0xabc123...)
0g-storage-client download --root 0xabc123... --file models/model.gguf

# 3. Load and use
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("models/model.gguf")
tokenizer = AutoTokenizer.from_pretrained("models/model.gguf")

response = model.generate(**tokenizer("Hello", return_tensors="pt"), max_new_tokens=50)
print(tokenizer.decode(response[0]))
```

**Production Example:**
```python
import os
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from coreed_cli import get_model_from_registry, download_model_from_storage

class CoreedModelLoader:
    """Load models from Coreed by ID, like Hugging Face Hub"""
    
    def __init__(self, cache_dir="models"):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
    
    def load(self, model_id: int):
        """Load a model from Coreed by ID"""
        # Get model info from registry
        model_info = get_model_from_registry(model_id)
        
        # Download if not cached
        model_path = f"{self.cache_dir}/{model_info['name']}.gguf"
        if not os.path.exists(model_path):
            download_model_from_storage(
                root_hash=model_info['storageRootHash'],
                output_path=model_path
            )
        
        # Load based on architecture
        if model_info['architecture'] in ['Qwen', 'Llama', 'Mistral']:
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            model = AutoModelForCausalLM.from_pretrained(model_path)
            return pipeline('text-generation', model=model, tokenizer=tokenizer)
        else:
            raise ValueError(f"Unsupported architecture: {model_info['architecture']}")
    
    def generate(self, model_id: int, prompt: str, max_tokens: int = 100):
        """Generate text from a Coreed model"""
        pipe = self.load(model_id)
        return pipe(prompt, max_new_tokens=max_tokens)[0]['generated_text']

# Usage
loader = CoreedModelLoader()
result = loader.generate(model_id=1, prompt="Tell me a joke", max_tokens=50)
print(result)
```

**Model Provider Integration:**
```python
# Like Hugging Face's model hub, Coreed tracks providers
# You can filter models by provider

from coreed_cli import get_models_by_provider

# Get all models from "nexusbert"
models = get_models_by_provider("nexusbert")

for model in models:
    print(f"ID: {model['modelId']}, Name: {model['name']}, Provider: {model['modelProvider']}")

# Load a specific provider's model
model_id = models[0]['modelId']
loader = CoreedModelLoader()
result = loader.generate(model_id, "What is AI?")
```

---

## 4. Agent Space Deployment

### Quick Deployment

```bash
# Deploy from an existing model ID
push-to-coreed --model-id 1 --space-name "My Chatbot" \
  --description "A chatbot powered by my LLM" \
  --template gradio
```

### Full Deployment with Model Upload

```bash
# Upload and deploy in one command
push-to-coreed \
  --model-path models/my-model.gguf \
  --model-name "My LLM" \
  --space-name "My Chatbot" \
  --description "A chatbot interface for my LLM" \
  --architecture "Qwen2.5" \
  --parameters 7000000000 \
  --license "Apache-2.0" \
  --template gradio \
  --runtime python \
  --port 7860
```

### Custom Template Deployment

```bash
# Use FastAPI template
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My API" \
  --template fastapi \
  --port 8000

# Use Express template
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My Node API" \
  --template express \
  --runtime node \
  --port 3000

# Use custom Dockerfile
push-to-coreed \
  --space-name "My Custom Space" \
  --template docker \
  --runtime docker \
  --port 8080
```

### Deployment Steps

When you run `push-to-coreed`, it performs these steps:

1. **Validate Environment**: Checks for required tools (git, docker) and configuration
2. **Upload Model**: Uploads your model to 0G Storage (unless skipped)
3. **Register Model**: Registers the model on ModelRegistry (unless skipped)
4. **Build Docker Image**: Builds a container from your chosen template
5. **Deploy to 0G Compute**: Deploys the container to 0G's GPU network
6. **Register Space**: Registers your space on AgentSpaceRegistry
7. **Git Integration**: Optionally commits and pushes your changes

### Space Sleep & Pause Management

Coreed provides **automatic sleep mode** for spaces to save costs when inactive. This feature allows you to:

- Set a custom inactivity timeout (default: 60 minutes)
- Automatically pause spaces when no requests are received
- Wake spaces on-demand when requests arrive
- Manually pause/resume spaces at any time

#### How Sleep Mode Works

1. **Activity Tracking**: Every request to your space updates the `lastActivity` timestamp
2. **Timeout Check**: After `sleepTimeout` seconds of inactivity, the space automatically goes to sleep
3. **Auto-Wake**: When a new request arrives, the space wakes up automatically
4. **Cost Savings**: Sleeping spaces don't consume 0G Compute resources, reducing your costs

#### Sleep Configuration

**Default**: 60 minutes (3600 seconds) of inactivity

**Set custom timeout during deployment**:
```bash
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My Chatbot" \
  --sleep-timeout 1800  # 30 minutes in seconds
```

**Set custom timeout for existing space**:
```bash
# Using Coreed CLI
push-to-coreed --space-id 1 --set-sleep-timeout 3600

# Using contract directly
npx hardhat run scripts/set-sleep-timeout.js --network galileo \
  --space-id 1 \
  --timeout 3600
```

**Disable sleep mode** (set to 0):
```bash
push-to-coreed --space-id 1 --set-sleep-timeout 0
```

#### Manual Sleep Management

**Pause a space manually** (immediate):
```bash
# Using Coreed CLI
push-to-coreed --space-id 1 --pause

# Using contract
npx hardhat run scripts/pause-space.js --network galileo --space-id 1
```

**Resume a paused space**:
```bash
# Using Coreed CLI
push-to-coreed --space-id 1 --resume

# Using contract
npx hardhat run scripts/resume-space.js --network galileo --space-id 1
```

**Wake a sleeping space** (if auto-wake fails):
```bash
# Using Coreed CLI
push-to-coreed --space-id 1 --wake

# Using contract
npx hardhat run scripts/wake-space.js --network galileo --space-id 1
```

**Check sleep status**:
```bash
# Using Coreed CLI
push-to-coreed --space-id 1 --sleep-status

# Using contract
npx hardhat run scripts/get-sleep-status.js --network galileo --space-id 1
```

#### Sleep Management via Python SDK

```python
from coreed_cli import (
    set_sleep_timeout, pause_space, resume_space, wake_space, 
    get_sleep_status
)

# Set sleep timeout for space 1 to 30 minutes
await set_sleep_timeout(space_id=1, timeout=1800)

# Pause space immediately
await pause_space(space_id=1)

# Resume paused space
await resume_space(space_id=1)

# Wake sleeping space
await wake_space(space_id=1)

# Check current sleep status
sleep_config = await get_sleep_status(space_id=1)
print(f"Is asleep: {sleep_config.isAsleep}")
print(f"Timeout: {sleep_config.sleepTimeout} seconds")
print(f"Time until sleep: {sleep_config.timeUntilSleep} seconds")
```

#### Sleep Management via Frontend (React)

```typescript
import { useAgentSpaceRegistry } from '@/lib/useAgentSpaceRegistry';

const { 
  setSleepTimeout, 
  pauseSpace, 
  resumeSpace, 
  wakeSpace,
  getSleepStatus 
} = useAgentSpaceRegistry();

// Set sleep timeout to 30 minutes (1800 seconds)
await setSleepTimeout(signer, spaceId, 1800);

// Pause space
await pauseSpace(signer, spaceId);

// Resume space
await resumeSpace(signer, spaceId);

// Wake space
await wakeSpace(signer, spaceId);

// Get sleep status
const { isAsleep, sleepTimeout, timeUntilSleep } = await getSleepStatus(spaceId);
```

#### Sleep Configuration in coreed.json

```json
{
  "sleep_timeout": 1800,
  "auto_sleep": true,
  "auto_wake": true
}
```

#### Best Practices for Sleep Mode

1. **Set appropriate timeout**: Choose a timeout that balances cost savings with responsiveness
   - Development/testing: 5-10 minutes (300-600 seconds)
   - Production with occasional use: 30-60 minutes (1800-3600 seconds)
   - High-traffic production: 0 (disabled) or > 120 minutes

2. **Monitor wake latency**: The first request after sleep may have higher latency

3. **Use webhooks**: Set up notifications when spaces go to sleep or wake up

4. **Combine with health checks**: Sleep mode works alongside health monitoring

5. **Test sleep behavior**: Verify your space wakes up correctly before production deployment

---

## 5. Git Workflow Integration

### Like Hugging Face Spaces

Coreed's `push_to_coreed` mirrors Hugging Face's `push_to_hub` workflow:

```bash
# Make changes to your model or code
git add .
git commit -m "Update model to v2.0"

# Deploy with automatic git push
push-to-coreed --git-commit --commit-message "Deploy v2.0"

# Or deploy and manually push later
push-to-coreed
# Then manually:
git add .
git commit -m "Deploy to Coreed"
git push
```

### Workflow Example

```bash
# Initialize a new project
mkdir my-coreed-space
cd my-coreed-space

# Initialize git
git init
git config user.email "you@example.com"
git config user.name "Your Name"

# Create a README
cat > README.md << 'EOF'
# My Coreed Space

A chatbot powered by Coreed on 0G Chain.
EOF

# Initialize Coreed
echo "MODEL_PATH=./models/my-model.gguf" > .env
echo "MODEL_NAME=My LLM" >> .env
echo "SPACE_NAME=My Chatbot" >> .env

# Copy Gradio template
cp -r ../coreed/templates/gradio/* .

# Create models directory
mkdir -p models

# Add model file (download from 0G Storage if needed)
# models/my-model.gguf

# Create .gitignore
echo "models/*" > .gitignore
echo ".env" >> .gitignore
echo "venv/" >> .gitignore
echo "*.pyc" >> .gitignore

# Commit initial files
git add .
git commit -m "Initial commit"

# Connect to remote (optional)
git remote add origin https://github.com/your-repo/my-coreed-space.git

# Deploy!
push-to-coreed --model-path models/my-model.gguf --git-commit
```

### Environment Variables

Create a `.env` file for your project:

```bash
# Coreed Configuration
MODEL_PATH=./models/my-model.gguf
MODEL_NAME=My LLM
SPACE_ID=1
SPACE_VERSION=1.0.0
SPACE_NAME=My Chatbot

# 0G Chain Configuration
PRIVATE_KEY=0x...
GALILEO_RPC_URL=https://evmrpc-testnet.0g.ai
STORAGE_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai

# Gradio Configuration
SERVER_PORT=7860
GRADIO_SERVER_NAME=0.0.0.0

# Contract Addresses
MODEL_REGISTRY_ADDRESS=0x...
SPACE_REGISTRY_ADDRESS=0x...
```

### Git Hooks

For automated deployment, create a git hook:

```bash
# .git/hooks/post-commit
#!/bin/sh
push-to-coreed --git-commit --commit-message "Auto-deploy: $GIT_COMMIT"
```

Or use GitHub Actions:

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
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -e .[cli]
      
      - name: Deploy to Coreed
        run: |
          push-to-coreed \
            --model-path models/my-model.gguf \
            --space-name "My Chatbot" \
            --force
        env:
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
          MODEL_REGISTRY_ADDRESS: ${{ secrets.MODEL_REGISTRY_ADDRESS }}
          SPACE_REGISTRY_ADDRESS: ${{ secrets.SPACE_REGISTRY_ADDRESS }}
```

---

## 6. push_to_coreed Function

### Python API

```python
from coreed_cli import push_to_coreed, PushResult

# Basic usage
result: PushResult = push_to_coreed(
    model_path="models/my-model.gguf",
    space_name="My Chatbot",
    template="gradio"
)

print(f"Success: {result.success}")
print(f"Model ID: {result.model_id}")
print(f"Space ID: {result.space_id}")
print(f"Endpoint: {result.endpoint_url}")
print(f"Storage Hash: {result.storage_root_hash}")

# With configuration
from coreed_cli import CoreedConfig

config = CoreedConfig(
    model_name="My LLM",
    model_description="A 7B parameter language model",
    model_architecture="Qwen2.5",
    space_name="My Chatbot",
    space_version="1.0.0",
    template="gradio",
    runtime="python",
    port=7860,
)

result = push_to_coreed(config=config)

# With git integration
result = push_to_coreed(
    model_path="models/my-model.gguf",
    commit_message="Deploy v1.0.0"
)
```

### Convenience Functions

```python
from coreed_cli import register_model, deploy_space, download_model_from_storage

# Register a model only
result = register_model(
    name="My LLM",
    model_path="models/my-model.gguf",
    description="A 7B parameter language model",
    architecture="Qwen2.5",
    parameters=7000000000,
    license="Apache-2.0",
    tags=["llm", "text-generation"]
)

# Deploy a space from existing model
depoy_result = deploy_space(
    model_id="1",  # From ModelRegistry
    name="My Chatbot",
    description="A chatbot interface",
    version="1.0.0",
    template="gradio"
)

# Download a model from 0G Storage
success = download_model_from_storage(
    root_hash="0x...",
    output_path="models/my-model.gguf"
)
```

### CLI Reference

```bash
# Show help
push-to-coreed --help

# Dry run (validate without deploying)
push-to-coreed --dry-run

# Register model only
push-to-coreed --model-path models/my-model.gguf --register-only

# Deploy space from existing model
push-to-coreed --model-id 1 --space-name "My Space"

# With custom template
push-to-coreed --model-path models/my-model.gguf --template fastapi

# Skip storage upload (model already uploaded)
push-to-coreed --model-path models/my-model.gguf --skip-storage

# Force deployment even with warnings
push-to-coreed --force

# Save configuration
push-to-coreed --save-config

# With custom network configuration
push-to-coreed \
  --rpc-url https://evmrpc-testnet.0g.ai \
  --indexer-url https://indexer-storage-testnet-turbo.0g.ai \
  --chain-id 16602
```

### Configuration File

Create a `coreed.json` file:

```json
{
  "rpc_url": "https://evmrpc-testnet.0g.ai",
  "chain_id": 16602,
  "storage_indexer": "https://indexer-storage-testnet-turbo.0g.ai",
  "model_registry_address": "0xcF86ae04785D1d211954EcE5C819Ae333D622671",
  "space_registry_address": "0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A",
  "agent_registry_address": "0xFb7B78eD0F405568ce4FDbbA97B051E0248C33c4",
  "model_name": "My LLM",
  "model_description": "A 7B parameter language model",
  "model_architecture": "Qwen2.5",
  "model_parameters": 7000000000,
  "model_license": "Apache-2.0",
  "space_name": "My Chatbot",
  "space_version": "1.0.0",
  "runtime": "python",
  "template": "gradio",
  "port": 7860,
  "auto_deploy": true,
  "verify_contracts": true,
  "sleep_timeout": 3600,
  "auto_sleep": true,
  "auto_wake": true
}
```

**Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rpc_url` | string | `https://evmrpc-testnet.0g.ai` | 0G RPC URL |
| `chain_id` | number | `16602` | Chain ID (Galileo testnet) |
| `storage_indexer` | string | `https://indexer-storage-testnet-turbo.0g.ai` | Storage indexer URL |
| `model_registry_address` | string | - | ModelRegistry contract address |
| `space_registry_address` | string | - | AgentSpaceRegistry contract address |
| `model_name` | string | - | Model name |
| `model_description` | string | - | Model description |
| `model_architecture` | string | - | Model architecture (Qwen2.5, Llama3, etc.) |
| `model_parameters` | number | - | Number of parameters |
| `model_license` | string | `MIT` | Model license |
| `space_name` | string | - | Space name |
| `space_version` | string | `1.0.0` | Space version |
| `runtime` | string | `python` | Runtime: python, node, docker |
| `template` | string | `gradio` | Template: gradio, fastapi, express, docker |
| `port` | number | template-specific | Port number |
| `auto_deploy` | boolean | `true` | Automatically deploy after registration |
| `verify_contracts` | boolean | `true` | Verify contracts before deployment |
| `sleep_timeout` | number | `3600` | Sleep timeout in seconds (0 to disable) |
| `auto_sleep` | boolean | `true` | Enable auto-sleep when inactive |
| `auto_wake` | boolean | `true` | Enable auto-wake on request |

**Environment Variables:**

You can also use environment variables instead of a config file:

```bash
# Coreed settings
export COREED_RPC_URL=https://evmrpc-testnet.0g.ai
export COREED_CHAIN_ID=16602
export COREED_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
export MODEL_REGISTRY_ADDRESS=0xcF86ae04785D1d211954EcE5C819Ae333D622671
export SPACE_REGISTRY_ADDRESS=0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A
export AGENT_REGISTRY_ADDRESS=0xFb7B78eD0F405568ce4FDbbA97B051E0248C33c4

# Model settings
export MODEL_NAME="My LLM"
export MODEL_PATH=./models/my-model.gguf

# Space settings
export SPACE_NAME="My Chatbot"
export SPACE_VERSION=1.0.0
export SPACE_SLEEP_TIMEOUT=3600
export SPACE_AUTO_SLEEP=true
export SPACE_AUTO_WAKE=true

# Deployment settings
export TEMPLATE=gradio
export RUNTIME=python
export PORT=7860
```

Load it with:

```bash
push-to-coreed --config coreed.json
```

---

## 7. 0G Compute Integration

### Why 0G Compute?

Coreed spaces run on **0G Compute** - a decentralized GPU marketplace that's:

- **90% cheaper** than traditional cloud (e.g., $0.003 vs $0.03 per 1K tokens)
- **OpenAI SDK compatible** - drop-in replacement
- **TEE-secured** - Trusted Execution Environment for secure processing
- **50-100ms latency** - fast inference
- **Pay-per-use** - no subscriptions or minimums

### Router vs Direct

| Feature | Router API | Direct SDK |
|---------|-----------|-----------|
| Endpoint | Single: `https://router-api.0g.ai/v1` | Per-provider |
| Balance | Unified pool | Per-provider sub-accounts |
| Failover | Automatic | Manual |
| Best for | Server-side apps, prototypes | Browser dApps, on-chain control |

### Using Router API

```python
from openai import OpenAI

# Configure OpenAI SDK for 0G
client = OpenAI(
    base_url="https://router-api.0g.ai/v1",
    api_key="sk-..."  # From https://pc.0g.ai
)

# Chat completion
response = client.chat.completions.create(
    model="zai-org/GLM-5-FP8",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
```

### Using Direct SDK

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

### 0G Compute CLI

```bash
# Install CLI
pnpm add @0gfoundation/0g-compute-ts-sdk -g

# Setup network
0g-compute-cli setup-network

# Login with wallet
0g-compute-cli login

# Deposit funds
0g-compute-cli deposit --amount 10

# List providers
0g-compute-cli inference list-providers

# Transfer funds to provider
0g-compute-cli transfer-fund --provider 0x... --amount 5

# Get secret key for provider
0g-compute-cli inference get-secret --provider 0x...

# Deploy a space (Coreed uses this internally)
0g-compute-cli deploy --image my-image:tag --port 7860
```

---

## 8. CLI Reference

### push-to-coreed

```
push-to-coreed [PATH] [OPTIONS]

Arguments:
  PATH              Path to model or project directory (default: .)

Model Options:
  -m, --model-path PATH     Path to model file
  --model-name NAME         Model name
  --model-desc DESCRIPTION   Model description
  --architecture ARCH       Model architecture (Qwen2.5, Llama3, etc.)
  --parameters N            Number of parameters
  --license LICENSE         Model license (default: MIT)
  --tags TAG1 TAG2...        Model tags
  --model-id ID             Existing model ID to use

Space Options:
  -n, --space-name NAME      Space name
  -d, --description DESC    Space description
  -v, --version VERSION     Space version (default: 1.0.0)
  -r, --runtime RUNTIME     Runtime: python, node, docker (default: python)
  -t, --template TEMPLATE   Template: gradio, fastapi, express, docker (default: gradio)
  -p, --port PORT           Port number (default: template-specific)

Deployment Options:
  --auto-deploy             Automatically deploy after registration (default: True)
  --no-deploy               Skip deployment, only register
  --register-only           Only register model, don't deploy space
  --skip-storage           Skip uploading to 0G Storage
  -f, --force               Force deployment even with warnings

Sleep Options:
  --sleep-timeout SECONDS   Set sleep timeout in seconds (default: 3600)
  --auto-sleep              Enable auto-sleep when inactive (default: True)
  --auto-wake               Enable auto-wake on request (default: True)
  --pause                   Pause space immediately
  --resume                  Resume paused space
  --wake                    Wake sleeping space
  --sleep-status            Check sleep status of space

Git Options:
  --git-commit              Commit changes before deployment
  --commit-message MESSAGE  Git commit message

Configuration:
  -c, --config PATH         Config file path
  --save-config             Save configuration to coreed.json
  --dry-run                 Validate without actually deploying

Network:
  --rpc-url URL             0G RPC URL (default: https://evmrpc-testnet.0g.ai)
  --indexer-url URL         Storage indexer URL (default: https://indexer-storage-testnet-turbo.0g.ai)
  --chain-id ID              Chain ID (default: 16602)

Environment Variables:
  PRIVATE_KEY              Wallet private key
  MODEL_REGISTRY_ADDRESS   ModelRegistry contract address
  SPACE_REGISTRY_ADDRESS   AgentSpaceRegistry contract address
  GALILEO_RPC_URL          0G RPC URL
  STORAGE_INDEXER_URL      Storage indexer URL
```

### Examples

```bash
# Minimal deployment
push-to-coreed

# With custom model
push-to-coreed --model-path models/my-model.gguf --space-name "My LLM"

# Register model only
push-to-coreed --model-path models/my-model.gguf --register-only

# Deploy from existing model
push-to-coreed --model-id 1 --space-name "My Space"

# With git integration
push-to-coreed --git-commit --commit-message "Deploy v1.0.0"

# Dry run to validate
push-to-coreed --dry-run

# With custom network
push-to-coreed --rpc-url https://evmrpc.0g.ai --chain-id 16661

# With sleep configuration
push-to-coreed --model-path models/my-model.gguf --sleep-timeout 1800

# Disable sleep mode
push-to-coreed --model-path models/my-model.gguf --sleep-timeout 0

# Deploy and pause immediately
push-to-coreed --model-path models/my-model.gguf --pause

# Check sleep status
push-to-coreed --space-id 1 --sleep-status

# Wake a sleeping space
push-to-coreed --space-id 1 --wake

# Resume a paused space
push-to-coreed --space-id 1 --resume
```

---

## 9. Templates

### Gradio Template (Recommended)

**Best for**: Interactive web UIs, chatbots, demos

```python
# app.py
import os
import gradio as gr

# Load model
def load_model():
    # Your model loading code here
    pass

# Chat function
def chat(message, history):
    # Your inference code here
    return "Hello!"

# Create interface
with gr.Blocks() as demo:
    gr.Markdown("# My Chatbot")
    chatbot = gr.Chatbot()
    msg = gr.Textbox()
    msg.submit(chat, [msg, chatbot], [msg, chatbot])

# Mount with health endpoint
app = gr.mount_gradio_app(app, demo)
```

**Dockerfile**:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app.py .
COPY .env .
EXPOSE 7860
CMD ["python", "app.py"]
```

### FastAPI Template

**Best for**: REST APIs, programmatic access

```python
# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class PredictRequest(BaseModel):
    prompt: str
    max_tokens: int = 100
    temperature: float = 0.7

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/predict")
def predict(request: PredictRequest):
    # Your inference code here
    return {"generated_text": "Hello!"}

@app.post("/chat")
def chat(messages: list):
    # OpenAI-compatible endpoint
    return {
        "message": {"role": "assistant", "content": "Hello!"},
        "finish_reason": "stop"
    }
```

### Express Template

**Best for**: Node.js applications

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const { pipeline } = require('@xenova/transformers');

const app = express();
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Predict endpoint
app.post('/predict', async (req, res) => {
    const { prompt } = req.body;
    // Your inference code here
    res.json({ generated_text: "Hello!" });
});

// Chat endpoint (OpenAI-compatible)
app.post('/chat', async (req, res) => {
    const { messages } = req.body;
    // Your inference code here
    res.json({
        message: { role: 'assistant', content: 'Hello!' },
        finish_reason: 'stop'
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});
```

### Docker Template

**Best for**: Custom runtimes, bring your own code

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application
COPY . .

# Create models directory
RUN mkdir -p models

# Environment variables
ENV MODEL_PATH=/app/models/model.gguf
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000
CMD ["python", "app.py"]
```

---

## 10. Health Monitoring

### Health Endpoint

All Coreed spaces **must** provide a `/health` endpoint that returns:

```json
{
  "status": "healthy",
  "timestamp": 1718764800,
  "space_id": "1",
  "model_loaded": true,
  "version": "1.0.0"
}
```

The Coreed platform pings this endpoint **every 30 seconds** with:
- **Timeout**: 3 seconds
- **Max Retries**: 3
- **Expected Status**: 200 OK

If the endpoint fails, the space is marked as **inactive** on-chain.

### Updating Health Status

```python
from coreed_cli import update_health_status

# Manually update health status
await update_health_status(
    signer=signer,
    space_id=1,
    is_active=True
)
```

### Health Check in Templates

All Coreed templates include health check functionality:

**Gradio (app.py)**:
```python
@app.get("/health")
async def health_check():
    return _health_status
```

**FastAPI (main.py)**:
```python
@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}
```

**Express (server.js)**:
```javascript
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        model_loaded: model !== null 
    });
});
```

---

## 11. Best Practices

### Model Management

1. **Version your models**: Use semantic versioning (1.0.0, 1.1.0, 2.0.0)
2. **Tag appropriately**: Use descriptive tags (llm, text-generation, vision, etc.)
3. **Document thoroughly**: Include description, architecture, parameters, license
4. **Test before upload**: Verify your model works locally first
5. **Use compression**: Convert to gguf or quantized safetensors for smaller files

### Deployment

1. **Start small**: Test with small models first (< 1GB)
2. **Monitor costs**: 0G Compute is cheap but not free
3. **Use health checks**: Always implement `/health` endpoint
4. **Handle errors gracefully**: Return meaningful error messages
5. **Rate limit**: Consider adding rate limiting to prevent abuse

### Security

1. **Never commit private keys**: Add `PRIVATE_KEY` to `.gitignore`
2. **Use environment variables**: Store sensitive data in `.env`
3. **Validate inputs**: Sanitize all user inputs
4. **Use TEE**: For sensitive workloads, use TEE-enabled providers
5. **Monitor activity**: Check your space's request counts regularly

### Performance

1. **Use GPU**: Ensure your Docker image has CUDA support if using GPU
2. **Quantize models**: Use 4-bit or 8-bit quantization for faster inference
3. **Cache responses**: Cache frequent queries (respecting privacy)
4. **Batch requests**: Process multiple requests simultaneously when possible
5. **Optimize Docker**: Use multi-stage builds for smaller images

---

## 12. Troubleshooting

### Common Issues

#### Model Upload Fails

**Problem**: `Model file not found`

**Solution**: Verify the model path is correct and the file exists

```bash
ls -la models/my-model.gguf
```

**Problem**: `0G Storage upload timeout`

**Solution**: Try with a smaller file or use the CLI directly

```bash
0g-storage-client upload --url https://evmrpc-testnet.0g.ai --key $PRIVATE_KEY --indexer https://indexer-storage-testnet-turbo.0g.ai --file models/my-model.gguf
```

#### Contract Registration Fails

**Problem**: `PRIVATE_KEY not set`

**Solution**: Set your private key

```bash
export PRIVATE_KEY=0x...
```

**Problem**: `ModelRegistry ABI not found`

**Solution**: Compile your contracts first

```bash
cd contracts
npm install
npx hardhat compile
```

**Problem**: `Insufficient funds`

**Solution**: Get testnet 0G from the faucet

```bash
# Visit https://faucet.0g.ai
# Or use:
curl https://faucet.0g.ai/api/v1/faucet -X POST -H "Content-Type: application/json" -d '{"address":"YOUR_ADDRESS"}'
```

#### Docker Build Fails

**Problem**: `Docker not found`

**Solution**: Install Docker

```bash
# Ubuntu
curl -fsSL https://get.docker.com | sh

# Mac
brew install docker
```

**Problem**: `Build failed with exit code 1`

**Solution**: Check the Dockerfile and requirements

```bash
# Test build manually
docker build -t test-image .
```

#### Deployment Fails

**Problem**: `0G Compute deployment failed`

**Solution**: Check your balance and provider availability

```bash
# Check balance
0g-compute-cli account balance

# List available providers
0g-compute-cli inference list-providers
```

**Problem**: `Space registration failed`

**Solution**: Verify your endpoint is accessible

```bash
# Test your endpoint
curl http://localhost:7860/health
```

#### Health Check Fails

**Problem**: Space marked as inactive

**Solution**: Check your `/health` endpoint

```bash
# Test health endpoint
curl http://your-space-url/health

# Check Coreed UI for space status
```

#### Git Issues

**Problem**: `Not a git repository`

**Solution**: Initialize git in your project

```bash
git init
git config user.email "you@example.com"
git config user.name "Your Name"
git add .
git commit -m "Initial commit"
```

**Problem**: `Uncommitted changes`

**Solution**: Commit your changes first

```bash
git status
git add .
git commit -m "My changes"
```

### Debug Mode

Enable verbose logging:

```bash
# Set debug environment variable
DEBUG=1 push-to-coreed

# Or check logs
cat /tmp/coreed-deploy.log
```

### Getting Help

1. **Check logs**: Most errors are logged to stdout/stderr
2. **Validate**: Use `--dry-run` to validate before deploying
3. **Environment**: Use `push-to-coreed --save-config` and review `coreed.json`
4. **Community**: Ask in the Coreed Discord or GitHub Discussions

---

## 13. Hosting Guide

This comprehensive hosting guide covers all aspects of deploying and hosting your AI models on Coreed. Whether you're a developer, researcher, or enterprise, this guide will help you understand the complete hosting workflow on the 0G Chain.

### Overview

Coreed provides a **complete hosting solution** that combines:
- **Decentralized Storage** (0G Storage) for model files
- **On-chain Registry** (ModelRegistry & AgentSpaceRegistry) for discovery
- **Decentralized Compute** (0G Compute) for inference
- **Multiple Interface Options** (CLI, Python SDK, Frontend)

### Hosting Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE HOSTING STACK                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   Your Model     │    │   Coreed CLI     │    │   Coreed UI     │     │
│  │   (GGUF, etc.)   │    │   (Push)         │    │   (Dashboard)   │     │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘     │
│            │                 │                         │                 │
│            ▼                 ▼                         ▼                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    COREED PLATFORM                               │    │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │    │
│  │  │  ModelRegistry  │    │ AgentSpaceRegistry│    │ 0G Storage  │  │    │
│  │  │  (v2)           │    │  (v2)           │    │             │  │    │
│  │  └────────┬────────┘    └────────┬────────┘    └──────┬──────┘  │    │
│  │           │                 │                     │          │    │
│  └───────────┼─────────────────┼─────────────────────┼──────────────┘    │
│              │                 │                     │                │
│              ▼                 ▼                     ▼                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    0G CHAIN INFRASTRUCTURE                        │    │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │    │
│  │  │  0G Storage     │    │  0G Compute      │    │  0G Router   │  │    │
│  │  │  Network        │    │  Network        │    │  API        │  │    │
│  │  └─────────────────┘    └─────────────────┘    └─────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    USER INTERFACES                                 │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────  │    │
│  │  │  Gradio UI  │  │  FastAPI    │  │  Express    │  │   Custom   │  │    │
│  │  │  (Browser)  │  │  (REST)      │  │  (Node)     │  │  (Docker)  │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Hosting Options Comparison

| Feature | Coreed CLI | Python SDK | Frontend UI | Direct Contract |
|---------|-----------|------------|--------------|-----------------|
| Model Upload | ✅ | ✅ | ✅ | ❌ |
| Space Deployment | ✅ | ✅ | ✅ | ✅ |
| Sleep Management | ✅ | ✅ | ✅ | ✅ |
| Health Monitoring | ✅ | ✅ | ✅ | ✅ |
| Git Integration | ✅ | ✅ | ❌ | ❌ |
| Auto-Deployment | ✅ | ✅ | ❌ | ❌ |
| Best For | Developers | Programmatic | Visual Users | Advanced Users |

### Step-by-Step Hosting Workflow

#### 1. Prepare Your Model

**Supported Formats:**
- `.gguf` (Recommended - best compression & performance)
- `.safetensors` (PyTorch standard)
- `.bin` (Raw weights)
- `.json` (Config files)
- `.onnx` (ONNX runtime)

**Convert to GGUF (Recommended):**
```bash
# Install llama.cpp
pip install llama-cpp-python

# Convert from safetensors to GGUF
from llama_cpp import Llama

# Load and save as GGUF
model = Llama.from_pretrained("path/to/model")
model.save_pretrained("path/to/model.gguf")
```

**Quantize for Size/Speed:**
```bash
# Quantize to 4-bit (smallest, good quality)
llama-quantize model-fp32.gguf model-q4.gguf Q4_K_M

# Quantize to 8-bit (larger, better quality)
llama-quantize model-fp32.gguf model-q8.gguf Q8_0
```

#### 2. Upload to 0G Storage

**Method A: Using Coreed CLI**
```bash
push-to-coreed --model-path models/my-model.gguf --register-only
```

**Method B: Using 0G Storage CLI**
```bash
# Install 0G Storage CLI
npm install -g @0gfoundation/0g-storage-client

# Upload model
0g-storage-client upload \
  --url https://evmrpc-testnet.0g.ai \
  --key $PRIVATE_KEY \
  --indexer https://indexer-storage-testnet-turbo.0g.ai \
  --file models/my-model.gguf

# Note the root hash from output: 0x...
```

**Method C: Using Python SDK**
```python
from coreed_cli import upload_to_storage

storage_hash = upload_to_storage(
    file_path="models/my-model.gguf",
    private_key="0x...",
    rpc_url="https://evmrpc-testnet.0g.ai",
    indexer_url="https://indexer-storage-testnet-turbo.0g.ai"
)
print(f"Storage Hash: {storage_hash}")
```

#### 3. Register Model on Chain

**Method A: Using Coreed CLI**
```bash
push-to-coreed \
  --model-path models/my-model.gguf \
  --model-name "My LLM" \
  --model-desc "A 7B parameter language model" \
  --architecture "Qwen2.5" \
  --parameters 7000000000 \
  --license "Apache-2.0" \
  --tags "llm,text-generation" \
  --register-only
```

**Method B: Using Hardhat Script**
```bash
npx hardhat run scripts/register-model.js --network galileo \
  --name "My LLM" \
  --description "A 7B parameter language model" \
  --architecture "Qwen2.5" \
  --parameters 7000000000 \
  --license "Apache-2.0" \
  --storage-hash 0xabc123...
```

**Method C: Using Python SDK**
```python
from coreed_cli import register_model

result = register_model(
    name="My LLM",
    model_path="models/my-model.gguf",
    description="A 7B parameter language model",
    architecture="Qwen2.5",
    parameters=7000000000,
    license="Apache-2.0",
    tags=["llm", "text-generation"],
    model_provider="nexusbert",
    pipeline_tag="text-generation",
    language="en"
)
print(f"Model ID: {result.model_id}")
print(f"Storage Hash: {result.storage_root_hash}")
```

#### 4. Deploy Space with Sleep Configuration

**Basic Deployment:**
```bash
push-to-coreed \
  --model-id 1 \
  --space-name "My Chatbot" \
  --description "A chatbot powered by my LLM" \
  --template gradio \
  --sleep-timeout 1800  # 30 minutes
```

**Advanced Deployment:**
```bash
push-to-coreed \
  --model-path models/my-model.gguf \
  --model-name "My LLM" \
  --space-name "My Production API" \
  --description "Production LLM API" \
  --architecture "Qwen2.5" \
  --parameters 7000000000 \
  --license "Apache-2.0" \
  --template fastapi \
  --runtime python \
  --port 8000 \
  --sleep-timeout 3600  # 60 minutes
  --auto-sleep true \
  --git-commit \
  --commit-message "Deploy v1.0.0"
```

**Multi-Model Deployment:**
```bash
# Deploy multiple models as separate spaces
for model in model1.gguf model2.gguf model3.gguf; do
  push-to-coreed \
    --model-path models/$model \
    --space-name "${model%.*} API" \
    --template fastapi \
    --sleep-timeout 7200  # 120 minutes
    --no-deploy  # Only register, deploy later
done

# Batch deploy all registered models
push-to-coreed --deploy-all
```

#### 5. Choose Your Template

**Gradio (Interactive UI):**
- Best for: Demos, chatbots, visual interfaces
- Port: 7860
- Framework: Python + Gradio
- Auto-sleep: Works perfectly

**FastAPI (REST API):**
- Best for: Programmatic access, backend services
- Port: 8000
- Framework: Python + FastAPI
- Auto-sleep: Works perfectly

**Express (Node.js API):**
- Best for: JavaScript/TypeScript applications
- Port: 3000
- Framework: Node.js + Express
- Auto-sleep: Works perfectly

**Custom Docker:**
- Best for: Bring your own runtime
- Port: 8080 (configurable)
- Framework: Any
- Auto-sleep: Works with custom implementation

#### 6. Configure Sleep Settings

**Recommended Timeouts:**

| Use Case | Timeout | Reasoning |
|----------|---------|-----------|
| Development | 300s (5 min) | Quick testing, low cost |
| Staging | 1800s (30 min) | Balance of cost and availability |
| Production (Low Traffic) | 3600s (60 min) | Cost-effective for occasional use |
| Production (High Traffic) | 0 (disabled) | Always available |
| Critical Services | 0 (disabled) | Zero downtime tolerance |

**Set timeout during deployment:**
```bash
push-to-coreed --space-id 1 --set-sleep-timeout 3600
```

**Set default timeout for all spaces:**
```bash
# Contract owner only
npx hardhat run scripts/set-default-sleep-timeout.js --network galileo \
  --timeout 3600
```

#### 7. Monitor and Manage

**Check Space Status:**
```bash
# Get space details
push-to-coreed --space-id 1 --info

# Check sleep status
push-to-coreed --space-id 1 --sleep-status

# List all spaces
push-to-coreed --list-spaces

# List active spaces only
push-to-coreed --list-active-spaces
```

**Manual Control:**
```bash
# Pause space (manual)
push-to-coreed --space-id 1 --pause

# Resume space (manual)
push-to-coreed --space-id 1 --resume

# Wake space (if auto-wake fails)
push-to-coreed --space-id 1 --wake

# Deactivate space (permanent)
push-to-coreed --space-id 1 --deactivate
```

**Update Configuration:**
```bash
# Update sleep timeout
push-to-coreed --space-id 1 --set-sleep-timeout 7200

# Update endpoint URL
push-to-coreed --space-id 1 --endpoint https://new-url.example.com

# Update health status
push-to-coreed --space-id 1 --set-health true
```

#### 8. Scale and Optimize

**Vertical Scaling:**
- Use larger GPU instances on 0G Compute
- Upgrade from CPU to GPU for faster inference
- Use TEE-enabled providers for security

**Horizontal Scaling:**
- Deploy multiple instances of the same space
- Use load balancers with 0G Router API
- Distribute across multiple providers

**Cost Optimization:**
```bash
# Check your 0G Compute balance
0g-compute-cli account balance

# Monitor space costs
push-to-coreed --space-id 1 --cost-report

# Set budget alerts
0g-compute-cli alert set --threshold 10 --email you@example.com
```

**Performance Optimization:**
- Quantize models (Q4_K_M for best balance)
- Use GPU acceleration
- Implement request batching
- Enable response caching (where appropriate)
- Optimize Docker images (multi-stage builds)

### Hosting on Different Platforms

#### Local Development

**Quick Start:**
```bash
# Clone and setup
git clone https://github.com/coreed/coreed.git
cd coreed

# Create a test space
mkdir my-test-space
cd my-test-space

# Initialize
push-to-coreed --init

# Deploy locally (for testing)
push-to-coreed --local --port 7860
```

**Local with Sleep Testing:**
```bash
# Deploy with 30 second sleep timeout for testing
push-to-coreed \
  --model-path models/tiny.gguf \
  --space-name "Test Space" \
  --sleep-timeout 30 \
  --local

# Watch sleep behavior
watch -n 5 "push-to-coreed --space-id 1 --sleep-status"
```

#### Cloud Hosting (0G Compute)

**Deploy to 0G Compute:**
```bash
# Fund your account
0g-compute-cli deposit --amount 10

# Deploy space
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My LLM" \
  --template gradio \
  --sleep-timeout 3600
```

**Multi-Provider Deployment:**
```bash
# List available providers
0g-compute-cli inference list-providers

# Deploy to specific provider
0g-compute-cli deploy \
  --image my-image:tag \
  --port 7860 \
  --provider 0x...
```

#### Hybrid Hosting

**Combine local and cloud:**
```bash
# Deploy to both local and cloud
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My LLM" \
  --deploy-local \
  --deploy-cloud \
  --sleep-timeout 3600
```

**Failover Setup:**
```bash
# Primary space (cloud)
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "Primary LLM" \
  --endpoint https://primary.example.com \
  --sleep-timeout 0

# Fallback space (local)
push-to-coreed \
  --model-id 1 \
  --space-name "Fallback LLM" \
  --endpoint https://fallback.example.com \
  --sleep-timeout 0
```

### Hosting Templates

#### Gradio Template with Sleep Support

```python
# app.py
import os
import gradio as gr
from coreed_cli import record_request

# Load model (implement your loading logic)
def load_model():
    # Check if model is loaded, load if not
    # Use environment variables for model path
    model_path = os.getenv("MODEL_PATH", "./models/model.gguf")
    # Your model loading code here
    return model

model = load_model()

# Chat function with activity tracking
def chat(message, history):
    # Record request to update lastActivity timestamp
    space_id = os.getenv("SPACE_ID", "1")
    record_request(space_id)
    
    # Your inference code here
    # Use model to generate response
    response = "Hello! I'm your AI assistant."
    return response

# Create interface
with gr.Blocks() as demo:
    gr.Markdown("# My Coreed Chatbot")
    gr.Markdown("Powered by 0G Chain")
    chatbot = gr.Chatbot()
    msg = gr.Textbox()
    msg.submit(chat, [msg, chatbot], [msg, chatbot])

# Health endpoint
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "version": os.getenv("SPACE_VERSION", "1.0.0"),
        "space_id": os.getenv("SPACE_ID", "1")
    }

# Mount with health endpoint
app = gr.mount_gradio_app(app, demo)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 7860)))
```

**Dockerfile for Gradio:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app.py .
COPY .env .

# Create models directory
RUN mkdir -p models

# Environment variables
ENV MODEL_PATH=/app/models/model.gguf
ENV SPACE_ID=1
ENV SPACE_VERSION=1.0.0
ENV PORT=7860
ENV COREED_SLEEP_TIMEOUT=3600

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

EXPOSE 7860
CMD ["python", "app.py"]
```

#### FastAPI Template with Sleep Support

```python
# main.py
import os
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from coreed_cli import record_request, get_sleep_status

app = FastAPI(title="Coreed API", version="1.0.0")

# Load model
model = None
SPACE_ID = os.getenv("SPACE_ID", "1")

class PredictRequest(BaseModel):
    prompt: str
    max_tokens: int = 100
    temperature: float = 0.7

def load_model_if_needed():
    global model
    if model is None:
        # Check sleep status first
        sleep_config = get_sleep_status(SPACE_ID)
        if sleep_config.isAsleep:
            # Wake the space if asleep
            from coreed_cli import wake_space
            wake_space(SPACE_ID)
            time.sleep(2)  # Wait for wake
        
        # Load model
        model_path = os.getenv("MODEL_PATH", "./models/model.gguf")
        # Your model loading code here
        model = "loaded"  # Placeholder

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "version": os.getenv("SPACE_VERSION", "1.0.0"),
        "space_id": SPACE_ID
    }

@app.post("/predict")
def predict(request: PredictRequest):
    # Record request to update lastActivity
    record_request(SPACE_ID)
    
    # Load model if needed (handles wake from sleep)
    load_model_if_needed()
    
    # Your inference code here
    # Use model to generate response
    return {"generated_text": "Hello!", "model_loaded": True}

@app.post("/chat")
def chat(messages: list):
    record_request(SPACE_ID)
    load_model_if_needed()
    
    # OpenAI-compatible endpoint
    return {
        "message": {"role": "assistant", "content": "Hello!"},
        "finish_reason": "stop"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
```

**requirements.txt:**
```
fastapi>=0.100.0
uvicorn>=0.20.0
pydantic>=2.0.0
coreed-cli>=1.0.0
transformers>=4.30.0
llama-cpp-python>=0.2.0
```

### Security Considerations

**Environment Variables:**
```bash
# Never commit these to git
PRIVATE_KEY=0x...
GALILEO_RPC_URL=https://evmrpc-testnet.0g.ai
MODEL_REGISTRY_ADDRESS=0x...
SPACE_REGISTRY_ADDRESS=0x...

# Add to .gitignore
PRIVATE_KEY
.env
*.pem
```

**Access Control:**
```bash
# Add operators to manage your space
push-to-coreed --space-id 1 --add-operator 0xOperatorAddress

# Remove operators
push-to-coreed --space-id 1 --remove-operator 0xOperatorAddress

# Transfer ownership (contract level)
npx hardhat run scripts/transfer-ownership.js --network galileo \
  --space-id 1 \
  --new-owner 0xNewOwnerAddress
```

**Network Security:**
- Use HTTPS for all endpoints
- Implement rate limiting
- Validate all inputs
- Use TEE providers for sensitive workloads
- Monitor for suspicious activity

### Monitoring and Analytics

**Built-in Monitoring:**
```bash
# Check health status
push-to-coreed --space-id 1 --health

# Get request count
push-to-coreed --space-id 1 --stats

# List all spaces with status
push-to-coreed --list-spaces --verbose
```

**Custom Analytics:**
```python
from coreed_cli import get_space, get_spaces_by_owner

# Get all your spaces
spaces = get_spaces_by_owner("0xYourAddress")

# Analyze usage
for space in spaces:
    print(f"Space {space.spaceId}: {space.requestCount} requests")
    print(f"  Last activity: {space.lastActivity}")
    print(f"  Sleep status: {space.isAsleep}")
```

**Third-Party Integration:**
- Prometheus for metrics
- Grafana for dashboards
- ELK Stack for logging
- Datadog for APM

### Cost Management

**Pricing Model:**
- 0G Storage: ~$0.01/GB/month
- 0G Compute: ~$0.003 per 1K tokens
- Contract Gas: ~0.001-0.002 0G per transaction

**Cost Tracking:**
```bash
# Check 0G Compute balance
0g-compute-cli account balance

# Get transaction history
0g-compute-cli account history

# Estimate costs
push-to-coreed --estimate-cost \
  --model-size 7GB \
  --expected-requests 10000 \
  --sleep-timeout 3600
```

**Budget Alerts:**
```bash
# Set up alerts
0g-compute-cli alert set \
  --threshold 5 \
  --email you@example.com \
  --webhook https://your-webhook.example.com
```

### Advanced Hosting Scenarios

#### Multi-Model Ensemble

**Deploy multiple models together:**
```bash
# Deploy base model
push-to-coreed \
  --model-path models/base.gguf \
  --space-name "Ensemble Base" \
  --template fastapi \
  --port 8000

# Deploy specialist models
push-to-coreed \
  --model-path models/specialist1.gguf \
  --space-name "Ensemble Specialist 1" \
  --template fastapi \
  --port 8001

push-to-coreed \
  --model-path models/specialist2.gguf \
  --space-name "Ensemble Specialist 2" \
  --template fastapi \
  --port 8002

# Deploy orchestrator
push-to-coreed \
  --space-name "Ensemble Orchestrator" \
  --template docker \
  --port 8003
```

**Orchestrator code:**
```python
# orchestrator.py
import requests

MODELS = {
    "base": "http://localhost:8000",
    "specialist1": "http://localhost:8001",
    "specialist2": "http://localhost:8002"
}

def ensemble_predict(prompt):
    # Get predictions from all models
    results = []
    for name, url in MODELS.items():
        response = requests.post(f"{url}/predict", json={"prompt": prompt})
        results.append(response.json()["generated_text"])
    
    # Combine results (voting, averaging, etc.)
    return combine_results(results)
```

#### A/B Testing

**Deploy two versions of the same model:**
```bash
# Version A
push-to-coreed \
  --model-path models/model-v1.gguf \
  --space-name "Model A" \
  --template fastapi \
  --port 8000

# Version B
push-to-coreed \
  --model-path models/model-v2.gguf \
  --space-name "Model B" \
  --template fastapi \
  --port 8001

# Deploy traffic splitter
push-to-coreed \
  --space-name "AB Test Splitter" \
  --template docker \
  --port 8002
```

**Traffic splitter code:**
```python
# splitter.py
import random
import requests

MODELS = {
    "A": "http://localhost:8000",
    "B": "http://localhost:8001"
}

# 50/50 split
WEIGHTS = {"A": 0.5, "B": 0.5}

def ab_predict(prompt):
    # Choose model based on weights
    model = random.choices(list(MODELS.keys()), weights=list(WEIGHTS.values()))[0]
    
    # Forward request
    response = requests.post(f"{MODELS[model]}/predict", json={"prompt": prompt})
    
    # Track which model was used
    track_usage(model)
    
    return response.json()
```

#### Canary Deployments

**Gradually roll out new models:**
```bash
# Stable version (90% traffic)
push-to-coreed \
  --model-path models/stable.gguf \
  --space-name "Stable Model" \
  --template fastapi \
  --port 8000

# Canary version (10% traffic)
push-to-coreed \
  --model-path models/canary.gguf \
  --space-name "Canary Model" \
  --template fastapi \
  --port 8001 \
  --sleep-timeout 300  # Shorter timeout for canary

# Deploy traffic splitter
push-to-coreed \
  --space-name "Canary Splitter" \
  --template docker \
  --port 8002
```

**Canary splitter code:**
```python
# canary_splitter.py
import random
import requests

CANARY_PERCENTAGE = 0.1  # 10% traffic to canary

MODELS = {
    "stable": "http://localhost:8000",
    "canary": "http://localhost:8001"
}

def canary_predict(prompt):
    # 10% chance to use canary
    if random.random() < CANARY_PERCENTAGE:
        model = "canary"
    else:
        model = "stable"
    
    response = requests.post(f"{MODELS[model]}/predict", json={"prompt": prompt})
    
    # Log canary usage for monitoring
    if model == "canary":
        log_canary_request(prompt)
    
    return response.json()
```

#### Blue-Green Deployments

**Zero-downtime deployments:**
```bash
# Blue environment (current)
push-to-coreed \
  --model-path models/v1.gguf \
  --space-name "Blue Environment" \
  --template fastapi \
  --port 8000 \
  --endpoint https://blue.example.com

# Green environment (new)
push-to-coreed \
  --model-path models/v2.gguf \
  --space-name "Green Environment" \
  --template fastapi \
  --port 8001 \
  --endpoint https://green.example.com

# Deploy switcher
push-to-coreed \
  --space-name "Blue-Green Switcher" \
  --template docker \
  --port 8002 \
  --endpoint https://api.example.com
```

**Switcher code:**
```python
# switcher.py
import requests

ACTIVE_ENVIRONMENT = "blue"  # or "green"

ENVIRONMENTS = {
    "blue": "https://blue.example.com",
    "green": "https://green.example.com"
}

def switch_environment(new_env):
    global ACTIVE_ENVIRONMENT
    ACTIVE_ENVIRONMENT = new_env
    print(f"Switched to {new_env}")

def predict(prompt):
    # Route to active environment
    response = requests.post(
        f"{ENVIRONMENTS[ACTIVE_ENVIRONMENT]}/predict",
        json={"prompt": prompt}
    )
    return response.json()

# Admin endpoint to switch
@app.post("/switch")
def switch(endpoint: str):
    if endpoint in ENVIRONMENTS:
        switch_environment(endpoint)
        return {"status": "switched", "environment": endpoint}
    return {"error": "Invalid environment"}, 400
```

### Migration from Hugging Face

**If you're migrating from Hugging Face Spaces:**

| Hugging Face | Coreed Equivalent |
|--------------|-------------------|
| `push_to_hub` | `push-to-coreed` |
| Model Hub | ModelRegistry + 0G Storage |
| Spaces | AgentSpaceRegistry + 0G Compute |
| `.gitignore` | Same |
| `requirements.txt` | Same |
| `app.py` | Same (with minor modifications) |
| `Dockerfile` | Same (with health check) |

**Migration Steps:**

1. **Export your model from Hugging Face:**
```bash
# Download from Hugging Face
git lfs install
git clone https://huggingface.co/username/model-name
huggingface-cli download username/model-name --local-dir models/
```

2. **Upload to 0G Storage:**
```bash
push-to-coreed --model-path models/ --register-only
```

3. **Deploy to Coreed:**
```bash
# Use the same template as Hugging Face
push-to-coreed \
  --model-id 1 \
  --space-name "My Migrated Space" \
  --template gradio \
  --sleep-timeout 3600
```

4. **Update your code:**
- Add health endpoint if not present
- Add sleep management (optional)
- Update environment variables

**Example: Migrating a Gradio Space**

Hugging Face `app.py`:
```python
import gradio as gr

def chat(message, history):
    return "Hello!"

gr.ChatInterface(chat).launch()
```

Coreed `app.py`:
```python
import os
import gradio as gr
from coreed_cli import record_request

def chat(message, history):
    # Record request for sleep management
    space_id = os.getenv("SPACE_ID", "1")
    record_request(space_id)
    return "Hello!"

# Add health endpoint
@app.get("/health")
def health():
    return {"status": "healthy"}

# Mount with health endpoint
app = gr.mount_gradio_app(app, gr.ChatInterface(chat))
app.run(host="0.0.0.0", port=int(os.getenv("PORT", 7860)))
```

---

## Appendix

### Contract Addresses (Galileo Testnet)

```
ModelRegistry:      0xcF86ae04785D1d211954EcE5C819Ae333D622671
AgentRegistry:    0xFb7B78eD0F405568ce4FDbbA97B051E0248C33c4
AgentSpaceRegistry: 0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A
```

**Deployment Info:**
- Network: 0G Galileo Testnet (Chain ID: 16602)
- Deployer: `0x9BF31B4e9Cb0d49e17CAF356445Fd2b91c032A0A`
- Deployed: June 2026
- Verify on: [0GScan Galileo](https://chainscan-galileo.0g.ai)

**Redeploy Contracts:**
```bash
# Deploy all contracts (ModelRegistry + AgentRegistry)
npx hardhat run scripts/deploy-all.js --network galileo

# Deploy AgentSpaceRegistry separately
npx hardhat run scripts/deploy-space-registry.js --network galileo
```

### Network Configuration

```
RPC URL:           https://evmrpc-testnet.0g.ai
Chain ID:          16602
Storage Indexer:   https://indexer-storage-testnet-turbo.0g.ai
Compute Router:    https://router-api.0g.ai/v1
Explorer:          https://chainscan-galileo.0g.ai
Storage Explorer:  https://storagescan-galileo.0g.ai
Faucet:            https://faucet.0g.ai
```

### Supported Model Formats

- `.gguf` (Recommended)
- `.safetensors`
- `.bin`
- `.json`
- `.onnx`

### Gas Estimates

| Operation | Gas Cost (Estimate) |
|-----------|---------------------|
| registerModel | ~120,000-150,000 |
| deploySpace | ~150,000-200,000 |
| updateHealthStatus | ~40,000-50,000 |
| likeModel | ~40,000-50,000 |
| recordDownload | ~35,000-45,000 |

---

**Coreed v3.0: Build, Deploy, and Share AI on 0G Chain** 🚀

This guide is a work in progress. For the latest information, see:
- Documentation: https://docs.coreed.ai
- GitHub: https://github.com/coreed/coreed
- Discord: https://discord.gg/coreed

*Last updated: June 2026*
