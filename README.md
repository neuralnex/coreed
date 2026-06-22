# Coreed - AI Agent Spaces on 0G Chain

**Decentralized Hugging Face Spaces Alternative on 0G Infrastructure**

Coreed is a Spaces-first platform for deploying and managing AI agent applications on the 0G Chain. Inspired by Hugging Face Spaces but built for Web3, Coreed enables users to deploy live applications without requiring model registration. Users can load open-source models from anywhere (transformers, Hugging Face Hub, or any external source) at runtime.

**✅ Key Philosophy**: No model registration required. Load models from code, dependencies, or external sources. Focus on deploying live agent spaces with minimal infrastructure overhead.

## 🎯 Core Vision: Spaces-First Architecture

Unlike traditional platforms that require model registration first, Coreed prioritizes **Agent Spaces** as the primary deployment unit. This approach:

- **Eliminates infrastructure costs** by not storing heavy model weights on-chain
- **Enables flexibility** - users can load any open-source model at runtime
- **Simplifies deployment** - focus on the application, not the model registry
- **Git-native workflow** - every Space is a Git repository, just like Hugging Face

### The Coreed Difference

| Feature | Hugging Face Spaces | Coreed Spaces |
|---------|---------------------|---------------|
| Model Registration | Required | **Optional** |
| Model Loading | From Hub | **From Anywhere** |
| Infrastructure | Centralized | **Decentralized (0G)** |
| Git Workflow | ✅ | ✅ |
| Blockchain | ❌ | **✅ 0G Chain** |
| Cost | Centralized | **User-controlled** |

---

## 🚀 Quick Start

### 1. Deploy a Space Without Model Registration

```bash
# Install the Coreed CLI
pip install coreed-cli

# Deploy a space that loads models at runtime
push-to-coreed \\
  --space-name "My AI Chatbot" \\
  --endpoint-url "https://my-gradio-app.example.com" \\
  --template gradio \\
  --description "A chatbot using open-source models"
```

**What this does:**
- Registers your space on the AgentSpaceRegistry smart contract
- Your app can load any model from Hugging Face Hub, transformers, or custom sources
- No model needs to be registered on Coreed

### 2. Deploy with Git Integration

```bash
# Clone or create your space repository
git clone https://huggingface.co/spaces/your-username/your-space-name
cd your-space-name

# Initialize your space with Coreed configuration
# Add a README.md with YAML frontmatter (see below)

# Deploy via Coreed CLI
push-to-coreed \\
  --space-name "My Space" \\
  --git-repo "https://huggingface.co/spaces/your-username/your-space-name" \\
  --template gradio
```

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **No Model Registration** | Load models from anywhere at runtime |
| **Space Deployment** | AgentSpaceRegistry contract (on-chain) |
| **CLI Tool** | `push-to-coreed` command |
| **Git Integration** | Git-native workflow like Hugging Face |
| **Web UI Templates** | Gradio, FastAPI, Express, Custom |
| **Health Monitoring** | Automatic health checks and status |
| **Decentralized Storage** | ✅ 0G Storage TS SDK |
| **On-Chain Registry** | All spaces registered on 0G Chain |
| **Pause/Sleep Spaces** | Cost optimization for inactive spaces |

---

## 📁 Space Configuration: Git-Based (Like Hugging Face)

Every Coreed Space is configured through Git, exactly like Hugging Face Spaces. The configuration is defined in the **README.md** file with YAML frontmatter.

### Example README.md for a Coreed Space

```yaml
---
# Coreed Space Configuration
title: My AI Agent
description: A conversational AI using open-source LLMs
emoji: 🤖
colorFrom: blue
colorTo: green
sdk: gradio
sdk_version: 4.19.0
app_file: app.py
pinned: false
license: mit
# Coreed-specific
template: gradio
runtime: python
port: 7860
healthEndpoint: /health
autoSleep: true
sleepTimeout: 3600
---

# My AI Agent

This space runs a Gradio interface for an AI chatbot. 
The model is loaded directly from Hugging Face Hub at runtime.

## Features
- Uses `transformers` library
- Loads `mistralai/Mistral-7B-Instruct-v0.2` on demand
- No model weights stored on Coreed
```

### Required Files for a Coreed Space

```
my-space/
├── README.md          # Configuration with YAML frontmatter
├── app.py             # Your main application (Gradio, FastAPI, Express)
├── requirements.txt   # Python dependencies
└── .gitignore         # Standard git ignore
```

### Space Templates Available

| Template | Runtime | Port | Health Endpoint | Use Case |
|----------|---------|------|-----------------|----------|
| **Gradio** | Python | 7860 | `/health` | Interactive UIs, chatbots |
| **FastAPI** | Python | 8000 | `/health` | REST APIs, backend services |
| **Express** | Node.js | 3000 | `/health` | Node.js applications |
| **Custom** | Any | Custom | Custom | Bring your own runtime |

---

## Prerequisites

- **0G Galileo Testnet**: Get testnet 0G from [faucet.0g.ai](https://faucet.0g.ai)
- **Private Key**: Set via `PRIVATE_KEY` environment variable
- **Supported Wallets**: MetaMask, OKX Wallet, Trust Wallet, WalletConnect, Coinbase Wallet, and all EIP-1193 compatible wallets
- **Mobile Support**: Full mobile wallet detection and in-app browser support
- **Git**: For version control integration
- **Docker**: For containerization
- **Python 3.8+**: For Gradio/FastAPI templates
- **Node.js 18+**: For Express template and frontend

---

## 🔗 Git Deployment Workflow

Coreed follows the same Git-based deployment pattern as Hugging Face Spaces:

### Step 1: Create Your Space Repository

```bash
# Create a new git repository for your space
mkdir my-ai-space
cd my-ai-space
git init

# Add your space files
# - README.md with configuration
# - app.py (or your main file)
# - requirements.txt

git add .
git commit -m "Initial space setup"
```

### Step 2: Configure for Coreed

Create a **README.md** with the YAML frontmatter configuration (see above).

### Step 3: Deploy to Coreed

```bash
# Register your space on-chain
push-to-coreed \\
  --space-name "My AI Space" \\
  --git-repo "https://github.com/your-username/my-ai-space" \\
  --endpoint-url "https://my-ai-space.example.com" \\
  --template gradio
```

**Behind the scenes:**
1. Coreed reads your README.md configuration
2. Validates the space settings
3. Registers the space on the AgentSpaceRegistry contract
4. Your space is now live and discoverable

### Step 4: Update Your Space

```bash
# Make changes to your space
git add .
git commit -m "Updated model configuration"
git push origin main

# Coreed detects the push and updates the space
# (Webhook integration coming soon)
```

---

## 📝 Usage Examples

### Deploy a Space with Any Model

```bash
push-to-coreed \\
  --space-name "Mistral Chatbot" \\
  --endpoint-url "https://my-gradio-app.example.com" \\
  --template gradio \\
  --description "Chatbot using Mistral-7B from Hugging Face Hub"
```

### Deploy with Auto-Sleep

```bash
push-to-coreed \\
  --space-name "My AI Assistant" \\
  --endpoint-url "https://my-app.example.com" \\
  --auto-sleep true \\
  --sleep-timeout 3600  # Sleep after 1 hour of inactivity
```

### Deploy with Custom Configuration

```bash
push-to-coreed \\
  --space-name "API Server" \\
  --endpoint-url "https://api.example.com" \\
  --template fastapi \\
  --port 8000 \\
  --health-endpoint "/health" \\
  --description "REST API for AI inference"
```

### Python API

```python
from coreed_cli import push_to_coreed, CoreedConfig, pause_space, resume_space

# Deploy a space (no model registration needed)
config = CoreedConfig(
    space_name="My Chatbot",
    endpoint_url="https://my-gradio-app.example.com",
    template="gradio",
    auto_sleep=True,
    sleep_timeout=3600  # 1 hour
)

result = push_to_coreed(config=config)
print(f"Success: {result.success}")
print(f"Space ID: {result.space_id}")

# Pause a space
pause_space(space_id=1)

# Resume a space
resume_space(space_id=1)
```

### JavaScript SDK

```javascript
import { CoreedClient } from '@coreed/sdk';

const client = new CoreedClient({
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  privateKey: process.env.PRIVATE_KEY,
  chainId: 16602,
});

// Deploy space with auto-sleep (no model ID required)
await client.deploySpace({
  name: 'My Chatbot',
  endpointUrl: 'https://my-gradio-app.example.com',
  template: 'gradio',
  autoSleep: true,
  sleepTimeout: 3600
});

// Pause space
await client.pauseSpace(1);

// Resume space
await client.resumeSpace(1);
```

---

## 🏗️ Project Structure

```
coreed/
├── cli/                      # CLI Package
│   ├── __init__.py           # Package exports
│   ├── coreed_cli.py        # Main implementation
│   └── requirements.txt     # Dependencies
│
├── contracts/               # Smart Contracts (0G Chain)
│   ├── AgentSpaceRegistry.sol  # Primary: Space registry
│   ├── ModelRegistry.sol      # Legacy: Model registry
│   ├── AgentRegistry.sol      # Legacy: Agent registry
│   └── scripts/
│       └── deploy-all.js
│
├── frontend/                # Next.js Web Application
│   ├── app/
│   │   ├── spaces/          # Spaces browsing and management
│   │   │   ├── page.tsx    # List all spaces
│   │   │   └── new/        # Create new space
│   │   └── layout.tsx      # Main layout
│   ├── components/
│   │   └── space/          # Space-related components
│   └── lib/
│       ├── hooks/          # React hooks
│       │   └── useWallet.ts # Wallet connection
│       └── contexts/        # Context providers
│
├── templates/               # Space Templates
│   ├── gradio/
│   │   ├── app.py
│   │   └── Dockerfile
│   ├── fastapi/
│   │   ├── main.py
│   │   └── Dockerfile
│   ├── express/
│   │   ├── server.js
│   │   └── Dockerfile
│   └── docker/
│       └── Dockerfile
│
└── docs/                    # Documentation
    ├── SPACES_GUIDE.md      # Spaces documentation
    └── GIT_INTEGRATION.md   # Git workflow details
```

---

## 💡 Use Cases

### 1. Deploy a Chatbot with Any Model

```python
# app.py - Load model from Hugging Face Hub
from transformers import pipeline
import gradio as gr

# Load model at runtime (not stored on Coreed)
pipe = pipeline("text-generation", model="mistralai/Mistral-7B-Instruct-v0.2")

def generate(text):
    return pipe(text, max_new_tokens=200)[0]["generated_text"]

iface = gr.Interface(fn=generate, inputs="text", outputs="text")
iface.launch()
```

### 2. Deploy a REST API

```python
# main.py - FastAPI with model loading
from fastapi import FastAPI
from transformers import pipeline

app = FastAPI()
model = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")

@app.post("/predict")
def predict(text: str):
    return model(text)
```

### 3. Deploy with Custom Docker

```dockerfile
# Dockerfile - Custom runtime
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

CMD ["python", "app.py"]
```

---

## 📊 Templates

| Template | Language | Port | Health Endpoint | Use Case |
|----------|---------|------|-----------------|----------|
| **Gradio** | Python | 7860 | `/health` | Interactive UIs, chatbots |
| **FastAPI** | Python | 8000 | `/health` | REST APIs, backend services |
| **Express** | Node.js | 3000 | `/health` | Node.js applications |
| **Custom** | Any | Custom | Custom | Bring your own runtime |

---

## 📚 Documentation

- [Spaces Guide](docs/SPACES_GUIDE.md) - Complete guide to deploying spaces
- [Git Integration](docs/GIT_INTEGRATION.md) - Git workflow details
- [Templates Guide](docs/TEMPLATES_GUIDE.md) - Available templates and customization
- [CLI Reference](docs/CLI_REFERENCE.md) - All CLI commands

---

## Network Configuration

Coreed is currently running on **0G Galileo Testnet** with full 0G SDK integration:

### Galileo Testnet (Default)

```
RPC URL:           https://evmrpc-testnet.0g.ai
Chain ID:          16602 (0x40DA)
Storage Indexer:   https://indexer-storage-testnet-turbo.0g.ai
Compute Router:    https://router-api.0g.ai/v1
Explorer:          https://chainscan-galileo.0g.ai
Faucet:            https://faucet.0g.ai

ModelRegistry:     0xFA81366Ba81C19d848191B8e49eC0948230d4216
AgentRegistry:    0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
AgentSpaceRegistry: 0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A
```

**✅ 0G SDK Integration:**
- Storage operations use `@0gfoundation/0g-storage-ts-sdk`
- Compute operations use `@0gfoundation/0g-compute-ts-sdk`
- All smart contracts deployed on 0G Galileo Testnet

---

## 🎛️ Space Management Features

### Auto-Sleep for Cost Optimization

Spaces can automatically sleep after a period of inactivity to save resources:

```bash
# Deploy with auto-sleep enabled
push-to-coreed \\
  --space-name "My Chatbot" \\
  --endpoint-url "https://my-app.example.com" \\
  --auto-sleep true \\
  --sleep-timeout 3600  # Sleep after 1 hour of inactivity
```

### Manual Pause/Resume

```bash
# Pause a space (stops serving requests)
push-to-coreed --space-id 1 --pause

# Resume a paused space
push-to-coreed --space-id 1 --resume
```

### Update Space Settings

```bash
# Update endpoint URL
push-to-coreed --space-id 1 --update-endpoint "https://new-url.example.com"

# Update sleep settings
push-to-coreed --space-id 1 --set-auto-sleep true --sleep-timeout 7200
```

---

## 🌐 Web Interface Features

The Coreed frontend provides:

- **Browse Spaces**: Discover all deployed agent spaces
- **Create Spaces**: Deploy new spaces with Git integration
- **Space Management**: Pause, resume, configure auto-sleep
- **Health Monitoring**: View status and uptime
- **Wallet Integration**: Connect any EIP-1193 compatible wallet

### Supported Wallets

✅ MetaMask, OKX Wallet, Trust Wallet, WalletConnect, Coinbase Wallet, Rabby, Ledger Live, imToken, Brave Wallet, and all EIP-1193 compatible wallets.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

---

**Coreed: AI Agent Spaces on 0G Chain**

*🎯 Spaces-First Architecture*
*🚀 No Model Registration Required*
*🔗 Git-Based Deployment*
*✅ Built on 0G Galileo Testnet*

*Last updated: June 2026*
