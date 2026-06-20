# Coreed CLI v3

**Deploy AI models and agents to Coreed on 0G Chain**

Coreed CLI is a command-line tool that allows you to deploy AI models and create agent spaces on the Coreed platform, built on 0G Chain infrastructure.

## Quick Start

```bash
# Install from PyPI
pip install coreed-cli-v3

# Deploy your model and space
push-to-coreed --model-path models/my-model.gguf --space-name "My Chatbot"
```

## Features

- **Model Registration**: Register models on-chain with metadata
- **Space Deployment**: Deploy live agent spaces with templates
- **0G Integration**: Automatic deployment to 0G Storage and Compute
- **Git Workflow**: Auto-commit and push integration
- **Health Monitoring**: Built-in health check support
- **Pause/Sleep**: Manage space lifecycle with auto-sleep functionality

## Usage

```bash
# Register a model
push-to-coreed --model-path models/qwen-7b.gguf --model-name "Qwen 7B" --register-only

# Deploy a space from existing model
push-to-coreed --model-id 1 --space-name "Qwen Chatbot" --template gradio

# Full deployment (model + space)
push-to-coreed \
  --model-path models/model.gguf \
  --model-name "My LLM" \
  --space-name "My Chatbot" \
  --template gradio \
  --auto-sleep true \
  --sleep-timeout 3600
```

## Templates

- **Gradio**: Interactive web UI (port 7860)
- **FastAPI**: REST API (port 8000)
- **Express**: Node.js applications (port 3000)
- **Docker**: Custom runtime (port 8080)

## Configuration

Create a `.env` file:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
RPC_URL=https://evmrpc-testnet.0g.ai
CHAIN_ID=16602
MODEL_REGISTRY_ADDRESS=0xFA81366Ba81C19d848191B8e49eC0948230d4216
SPACE_REGISTRY_ADDRESS=0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
AGENT_SPACE_REGISTRY_ADDRESS=0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A
```

> **Note**: Never commit `.env` to git. Add it to `.gitignore`.

## Requirements

- Python 3.8+
- pip
- 0G Wallet with testnet tokens

## Network Configuration

### Galileo Testnet (Default)

```
RPC URL: https://evmrpc-testnet.0g.ai
Chain ID: 16602
Faucet: https://faucet.0g.ai

ModelRegistry:     0xFA81366Ba81C19d848191B8e49eC0948230d4216
AgentRegistry:    0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
AgentSpaceRegistry: 0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A
```

## License

MIT License

---

**Coreed CLI v3.0** - AI Deployment Platform for 0G Chain  
*Last updated: June 2026*