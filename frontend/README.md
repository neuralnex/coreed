# Coreed Frontend - AI Agent Spaces on 0G Chain

**Next.js Web Application for Spaces-First AI Deployment on 0G**

Coreed provides a **Hugging Face Spaces alternative** built on **0G Chain**, enabling developers to deploy AI applications **without model registration**. Users can load open-source models from **anywhere** (transformers, Hugging Face Hub, custom sources, local files) at runtime.

**✅ Key Philosophy:** No model registration required. Load models directly in your code using standard Python libraries like `transformers`, `torch`, `sentence-transformers`, `peft`, `accelerate`, etc. Coreed handles the deployment infrastructure while you focus on your AI logic.

---

## ✨ Features

### For AI Engineers:
- **Native Python Support** - Use `transformers`, `torch`, `sentence-transformers`, `peft`, `accelerate`, etc.
- **Dependency Management** - Auto-generated `requirements.txt` with all needed packages
- **Flexible Model Loading** - Load from Hugging Face Hub, local files, or any URL
- **0G Compute Integration** - Seamless AI inference via 0G's decentralized GPU network
- **Git-Native Workflow** - Every space is a Git repository (just like Hugging Face)

### Platform Features:
- **Browse Spaces** - Discover all deployed agent spaces with filtering and search
- **Deploy Spaces** - Create new spaces without model registration
- **Space Details** - View live deployment status, health, and configuration
- **Space Management** - Pause, resume, wake, and configure auto-sleep
- **Wallet Integration** - Connect any EIP-1193 compatible wallet (MetaMask, etc.)
- **Template Selection** - Choose from Gradio, FastAPI, Express, Static, or Docker templates
- **0G Compute Ready** - All templates pre-configured with 0G Router integration

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Git
- 0G Compute API Key (get at [https://pc.0g.ai](https://pc.0g.ai))

### Installation
```bash
cd frontend
npm install
```

### Configuration
Copy `.env.example` to `.env.local` and configure:

```env
# REQUIRED: 0G Chain
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_CHAIN_ID=16602

# REQUIRED: Smart Contracts
NEXT_PUBLIC_AGENT_SPACE_REGISTRY_ADDRESS=0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A

# REQUIRED: 0G Services
NEXT_PUBLIC_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
NEXT_PUBLIC_COMPUTE_ROUTER=https://router-api.0g.ai/v1

# REQUIRED: Your 0G Compute API Key (get from https://pc.0g.ai)
# IMPORTANT: Each space you create will require users to set THEIR OWN API key
#            This key is for the platform itself (optional for basic functionality)
OG_COMPUTE_API_KEY=your-api-key-here

# Application Settings
REPO_STORAGE_PATH=./storage/repos
PORT=3000
NEXT_PUBLIC_APP_DOMAIN=localhost
```

> **⚠️ IMPORTANT:** When users create spaces, the generated code **requires them to set their own `OG_COMPUTE_API_KEY`** environment variable. The platform does NOT hardcode or share API keys. Each user must get their own key from [https://pc.0g.ai](https://pc.0g.ai) and set it when running their space.

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Python Dependencies Handling

Coreed is **designed for AI engineers** and supports all standard Python AI libraries.

### Supported Libraries
| Library | Purpose | Example |
|---------|---------|---------|
| `transformers` | HF models | Text generation, classification |
| `torch` | PyTorch | Model inference |
| `sentence-transformers` | Embeddings | Semantic search, RAG |
| `accelerate` | Optimization | Faster inference |
| `peft` | Fine-tuning | LoRA, adapters |
| `llama-cpp-python` | Local LLM | Offline models |
| `langchain` | Orchestration | Complex workflows |

### Example `requirements.txt`
```
gradio==4.31.0
requests>=2.31.0
transformers>=4.38.0
torch>=2.1.0
accelerate>=0.27.0
```

### Loading Models
```python
from transformers import AutoModelForCausalLM, AutoTokenizer

# Load from Hugging Face Hub
model = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-Instruct-v0.2")

# Or use 0G Compute
import requests
response = requests.post(
    "https://router-api.0g.ai/v1/chat/completions",
    headers={"Authorization": "Bearer YOUR_KEY"},
    json={"model": "zai-org/GLM-4-Flash", "messages": [...]}
)
```

---

## 🏗️ Project Structure

```
frontend/
├── app/
│   ├── api/spaces/create/      # Space creation
│   └── spaces/
│       ├── new/               # Create form
│       └── [id]/               # Space details
├── components/space/
│   ├── ComputeStatus.tsx      # 0G connection status
│   └── SpaceCard.tsx          # Space display
├── lib/
│   ├── git/repoManager.ts     # Git repo creation
│   └── docker/buildEngine.ts   # Docker builds
├── storage/repos/             # Auto-created Git repos
└── README.md                  # This file
```

---

## 🎯 Templates

### Gradio (Python)
```bash
pip install -r requirements.txt
python app.py  # http://localhost:7860
```

### FastAPI (Python)
```bash
pip install -r requirements.txt  
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Express (Node.js)
```bash
npm install
node index.js  # http://localhost:3000
```

---

## 🌐 Space URL Provisioning

Coreed **automatically provisions public URLs** for your spaces based on the deployment environment:

### Local Development
When running on `localhost`:
```
Space: my-space
Owner: 0x9BF31B4e9Cb0d49e17CAF356445Fd2b91c032A0A

Provisioned URL: https://9BF31B4e.my-space.coreed.app
Local URL:      http://localhost:7860
```

### Production (Vercel, etc.)
When deployed with a custom domain:
```
Host: coreed.ai
Provisioned URL: https://9BF31B4e.my-space.coreed.ai
```

### URL Format
```
{owner-short}.{space-slug}.{base-domain}

Where:
- owner-short: First 8 characters of owner address (without 0x)
- space-slug: Lowercase, hyphenated space name
- base-domain: coreed.app (localhost) or your custom domain
```

**Note:** All spaces are also accessible via their local development URL for testing.

---

## 🔗 0G Network Configuration

```
RPC URL:           https://evmrpc-testnet.0g.ai
Chain ID:          16602
Compute Router:    https://router-api.0g.ai/v1
Faucet:            https://faucet.0g.ai
```

---

## 📜 License

MIT License

---

**Coreed Frontend** - AI Agent Spaces on 0G Chain  
*Spaces-First | Git-Native | 0G-Powered | AI Engineer Friendly*