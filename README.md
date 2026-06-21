# Coreed v3.0 

**AI Deployment Platform for 0G Chain** 

Coreed is a complete Web3 AI agent launchpad built on the **0G Modular Infrastructure Stack**. It provides a seamless experience for deploying, managing, and discovering AI models and live agent spaces, all powered by decentralized infrastructure.

**✅ Properly Integrated with 0G SDK** - Coreed leverages the official 0G TypeScript SDKs for storage and compute, ensuring full compatibility with the 0G ecosystem on Galileo Testnet.

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
│  │                    push_to_coreed                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │ │
│  │  │ Git Workflow │  │ Docker Build│  │ 0G Compute      │    │ │
│  │  │ Integration  │  │             │  │ Deployment      │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    AGENT SPACES                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │ │
│  │  │  Gradio     │  │  FastAPI    │  │   Express       │     │ │
│  │  │             │  │  Template   │  │                 │     │ │
│  │  │             │  │             │  │                 │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Coreed Implementation |
|---------|----------------------|
| **Model Registry** | ModelRegistry contract (on-chain) |
| **Space Deployment** | AgentSpaceRegistry contract (on-chain) |
| **CLI Tool** | `push-to-coreed` command |
| **Git Integration** | Auto-commit and push workflow |
| **Docker Support** | Multi-stage builds for all templates |
| **Web UI Templates** | Gradio, FastAPI, Express, Docker |
| **API Endpoints** | REST API support via FastAPI |
| **Health Monitoring** | Automatic health checks and status updates |
| **Decentralized Storage** | ✅ 0G Storage TS SDK (`@0gfoundation/0g-storage-ts-sdk`) |
| **Decentralized Compute** | ✅ 0G Compute TS SDK (`@0gfoundation/0g-compute-ts-sdk`) |
| **On-Chain Registry** | All registries on 0G Chain |
| **Pause/Sleep Spaces** | Manual and auto-sleep for inactive spaces |

---

## Quick Start

### Without Cloning (Recommended)

```bash
# Install CLI
pip install coreed-cli

# Deploy your model and space in one command
push-to-coreed --model-path models/my-model.gguf --space-name "My Chatbot"
```

### With Repository Clone

```bash
# 1. Clone the repository
git clone https://github.com/coreed/coreed.git
cd coreed

# 2. Install CLI
cd cli
pip install -e .
cd ..

# 3. Set up environment (create .env file)
# See .env.example for required variables

# 4. Get testnet tokens
open https://faucet.0g.ai

# 5. Deploy
push-to-coreed --model-path models/my-model.gguf --space-name "My Chatbot"
```

This single command will:
1. Upload your model to **0G Storage**
2. Register it on **ModelRegistry** (on-chain)
3. Build a Docker image from the **Gradio** template
4. Deploy to **0G Compute** (decentralized GPUs)
5. Register your space on **AgentSpaceRegistry** (on-chain)
6. Optionally commit and push to git

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

## Usage Examples

### Deploy with Gradio UI

```bash
push-to-coreed \
  --model-path models/qwen-7b.gguf \
  --model-name "Qwen 7B" \
  --space-name "Qwen Chatbot" \
  --template gradio
```

### Register Model Only

```bash
push-to-coreed \
  --model-path models/my-model.gguf \
  --model-name "My LLM" \
  --architecture "Qwen2.5" \
  --parameters 7000000000 \
  --license "Apache-2.0" \
  --register-only
```

### Deploy Existing Model

```bash
push-to-coreed \
  --model-id 1 \
  --space-name "My Chatbot" \
  --template gradio
```

### Deploy with Auto-Sleep

```bash
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My Chatbot" \
  --auto-sleep true \
  --sleep-timeout 3600  # Sleep after 1 hour of inactivity
```

### Python API

```python
from coreed_cli import push_to_coreed, CoreedConfig, pause_space, resume_space

# Deploy space
config = CoreedConfig(
    model_path="models/my-model.gguf",
    space_name="My Chatbot",
    template="gradio",
    auto_sleep=True,
    sleep_timeout=3600  # 1 hour
)

result = push_to_coreed(config=config)
print(f"Success: {result.success}")
print(f"Model ID: {result.model_id}")
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

// Deploy space with auto-sleep
await client.deploySpace({
  name: 'My Chatbot',
  modelId: 1,
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

## Project Structure

```
coreed/
├── cli/                      # CLI Package
│   ├── __init__.py           # Package exports
│   ├── coreed_cli.py        # Main implementation
│   ├── setup.py             # Package configuration
│   └── requirements.txt     # Dependencies
│
├── contracts/               # Smart Contracts
│   ├── contracts/
│   │   ├── AgentRegistry.sol
│   │   ├── ModelRegistry.sol
│   │   └── AgentSpaceRegistry.sol
│   ├── hardhat.config.js
│   └── scripts/
│       └── deploy-all.js
│
├── frontend/                # Next.js Web Application
│   ├── app/
│   ├── lib/
│   ├── components/
│   └── public/
│
├── templates/               # Agent Space Templates
│   ├── gradio/              # Interactive (RECOMMENDED)
│   │   ├── app.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
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
    ├── DEPLOYMENT_GUIDE.md
    ├── USER_GUIDE.md
    └── COREED_USER_GUIDE.md
```

---

## Templates

| Template | Language | Port | Health Endpoint | Best For |
|----------|----------|------|-----------------|----------|
| [Gradio](templates/gradio/) | Python | 7860 | `/health` | Interactive UIs, chatbots |
| [FastAPI](templates/fastapi/) | Python | 8000 | `/health` | REST APIs |
| [Express](templates/express/) | Node.js | 3000 | `/health` | Node.js apps |
| [Docker](templates/docker/) | Custom | 8080 | `/health` | Custom runtimes |

---

## Documentation

- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - How to deploy Coreed for public access
- [User Guide](docs/COREED_USER_GUIDE.md) - Comprehensive usage guide
- [Quick Start](docs/QUICKSTART.md) - Quick start tutorial

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

## Space Management Features

### Pause/Resume Spaces

Coreed now supports pausing and resuming spaces to save resources:

```bash
# Pause a space (stops the deployment)
push-to-coreed --space-id 1 --pause

# Resume a paused space
push-to-coreed --space-id 1 --resume
```

### Auto-Sleep for Inactive Spaces

Spaces can automatically go to sleep after a period of inactivity:

```bash
# Deploy with auto-sleep enabled
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My Chatbot" \
  --auto-sleep true \
  --sleep-timeout 3600  # Sleep after 1 hour

# Update auto-sleep settings for existing space
push-to-coreed \
  --space-id 1 \
  --set-auto-sleep true \
  --sleep-timeout 7200  # Change to 2 hours

# Disable auto-sleep
push-to-coreed \
  --space-id 1 \
  --set-auto-sleep false
```

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

**Coreed v3.0: AI Deployment Platform for 0G Chain** 

*✅ Properly Built on 0G Chain using Official SDKs*

*🏗️ Currently on 0G Galileo Testnet*

*Last updated: June 2026*
