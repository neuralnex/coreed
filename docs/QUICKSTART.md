# Coreed Quick Start Guide

**Deploy AI Models & Agents to 0G Chain in Minutes**

---

## 🚀 One-Command Deployment

```bash
# From your project directory with a model file
push-to-coreed --model-path models/my-model.gguf --space-name "My Chatbot"
```

That's it! This single command will:
1. ✅ Upload your model to 0G Storage
2. ✅ Register it on ModelRegistry
3. ✅ Build a Docker image with Gradio UI
4. ✅ Deploy to 0G Compute
5. ✅ Register your space on AgentSpaceRegistry

---

## 📋 Prerequisites

### Install Required Tools

```bash
# Git (for version control)
sudo apt install git  # Ubuntu/Debian

# Docker (for containerization)
curl -fsSL https://get.docker.com | sh

# Python 3.8+ (for CLI and Gradio)
sudo apt install python3 python3-pip python3-venv

# Node.js 18+ (for smart contracts)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# pnpm (recommended for 0G tools)
npm install -g pnpm

# 0G Compute CLI
pnpm add -g @0gfoundation/0g-compute-ts-sdk

# 0G Storage CLI (optional)
go install github.com/0gfoundation/0g-storage-client@latest
```

### Get Testnet 0G Tokens

```bash
# Visit the faucet
open https://faucet.0g.ai

# Or use API
curl https://faucet.0g.ai/api/v1/faucet \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"address":"YOUR_WALLET_ADDRESS"}'
```

---

## 💡 Setup Coreed

### 1. Clone Repository

```bash
git clone https://github.com/your-repo/coreed.git
cd coreed
```

### 2. Set Environment Variables

```bash
# Create .env file
echo "PRIVATE_KEY=YOUR_PRIVATE_KEY" > .env
echo "MODEL_REGISTRY_ADDRESS=0xFA81366Ba81C19d848191B8e49eC0948230d4216" >> .env
echo "SPACE_REGISTRY_ADDRESS=0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C" >> .env
echo "GALILEO_RPC_URL=https://evmrpc-testnet.0g.ai" >> .env
echo "STORAGE_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai" >> .env
```

> **⚠️ NEVER commit your .env file with private keys!**
> Add `.env` to your `.gitignore`

### 3. Install Coreed CLI

```bash
cd cli
pip install -e .
cd ..
```

---

## 🎯 Three Ways to Deploy

### Option 1: Quick Start (Recommended)

```bash
# Create a new project directory
mkdir my-first-space
cd my-first-space

# Copy Gradio template
cp -r ../coreed/templates/gradio/* .

# Create models directory
mkdir models

# Download or place your model file
# cp /path/to/your-model.gguf models/my-model.gguf

# Or download from 0G Storage:
0g-storage-client download \
  --indexer https://indexer-storage-testnet-turbo.0g.ai \
  --root 0xYOUR_STORAGE_HASH \
  --file ./models/my-model.gguf \
  --proof

# Deploy!
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My First Space" \
  --description "My first Coreed deployment" \
  --template gradio
```

### Option 2: Register Model Only

```bash
# Register your model without deploying a space
push-to-coreed \
  --model-path models/my-model.gguf \
  --model-name "My LLM" \
  --architecture "Qwen2.5" \
  --parameters 7000000000 \
  --license "MIT" \
  --register-only
```

### Option 3: Deploy Existing Model

```bash
# Deploy a space from an already registered model
push-to-coreed \
  --model-id 1 \
  --space-name "My Chatbot" \
  --template gradio
```

---

## 📁 Project Structure

```
my-first-space/
├── app.py              # Gradio application
├── Dockerfile          # Docker configuration
├── requirements.txt    # Python dependencies
├── .env                # Environment variables (SECRET!)
├── .env.example        # Example environment variables
├── models/             # Model files
│   └── my-model.gguf   # Your AI model
└── coreed.json         # Coreed configuration (optional)
```

---

## 🐍 Customize Your Space

### Edit `app.py`

Replace the placeholder functions with your model code:

```python
# Load your model
def load_model():
    from transformers import AutoModelForCausalLM, AutoTokenizer
    import torch
    
    global model, tokenizer
    
    model_path = os.getenv("MODEL_PATH")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForCausalLM.from_pretrained(model_path)
    model.eval()
    
    if torch.cuda.is_available():
        model = model.to("cuda")
    
    _health_status["model_loaded"] = True
    _health_status["status"] = "healthy"

# Chat function
def chat(message, history):
    inputs = tokenizer(message, return_tensors="pt").to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=100)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
```

### Edit `requirements.txt`

Add your dependencies:

```
gradio>=4.0.0
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
python-dotenv>=1.0.0
torch>=2.1.0
transformers>=4.38.0
accelerate>=0.27.0
```

---

## 🚀 Deploy to Different Platforms

### Deploy to 0G Compute (Recommended)

```bash
# Using Coreed CLI (automatic)
push-to-coreed --model-path models/my-model.gguf --space-name "My Space"

# Manual deployment
0g-compute-cli login
0g-compute-cli deposit --amount 10
0g-compute-cli deploy --image my-image:tag --port 7860
```

### Deploy to Docker (Local)

```bash
# Build image
docker build -t my-space .

# Run container
docker run -p 7860:7860 \
  -e MODEL_PATH=/app/models/my-model.gguf \
  -e MODEL_NAME="My Space" \
  -e SPACE_ID=1 \
  -v $(pwd)/models:/app/models:ro \
  my-space
```

### Deploy to Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT/my-space

# Deploy
gcloud run deploy my-space \
  --image gcr.io/YOUR_PROJECT/my-space \
  --port 7860 \
  --allow-unauthenticated
```

### Deploy to Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly launch --name my-space
fly deploy
```

---

## 🔍 Check Your Deployment

### Test Locally

```bash
# Run Gradio app
python app.py

# Or with uvicorn
uvicorn app:app --reload --port 7860

# Test health endpoint
curl http://localhost:7860/health

# Expected response:
# {"status": "healthy", "timestamp": 1234567890, "space_id": "1", "model_loaded": true, "version": "1.0.0"}
```

### Check On-Chain

```bash
# Query your space
npx hardhat run scripts/get-space.js --network galileo --space-id 1

# Check health status
npx hardhat run scripts/check-health.js --network galileo --space-id 1
```

---

## 🔄 Git Workflow (Like Hugging Face)

### Auto-Commit & Push

```bash
# Deploy with automatic git commit and push
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My Space" \
  --git-commit \
  --commit-message "Deploy v1.0.0"
```

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
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
          pip install -e ./cli
      
      - name: Deploy
        run: |
          push-to-coreed \
            --model-path models/my-model.gguf \
            --space-name "My Space" \
            --force
        env:
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
          MODEL_REGISTRY_ADDRESS: ${{ secrets.MODEL_REGISTRY_ADDRESS }}
          SPACE_REGISTRY_ADDRESS: ${{ secrets.SPACE_REGISTRY_ADDRESS }}
```

---

## 🎨 Template Options

| Template | Language | Port | Use Case |
|----------|----------|------|----------|
| **Gradio** | Python | 7860 | Interactive web UI, chatbots |
| **FastAPI** | Python | 8000 | REST API, programmatic access |
| **Express** | Node.js | 3000 | JavaScript/TypeScript apps |
| **Docker** | Any | 8080 | Custom runtimes |

**Example: Use FastAPI template**
```bash
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My API" \
  --template fastapi \
  --port 8000
```

**Example: Use Express template**
```bash
push-to-coreed \
  --model-path models/my-model.gguf \
  --space-name "My Node API" \
  --template express \
  --runtime node \
  --port 3000
```

---

## 🐛 Troubleshooting

### Common Issues

**Model not found**
```bash
# Verify model exists
ls -la models/my-model.gguf

# Check MODEL_PATH in .env
cat .env | grep MODEL_PATH
```

**Docker not found**
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
```

**PRIVATE_KEY not set**
```bash
# Set private key
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

**Insufficient funds**
```bash
# Get testnet 0G
open https://faucet.0g.ai
```

**Health check failing**
```bash
# Test health endpoint
curl http://localhost:7860/health

# Check model loading
python -c "import os; print(os.getenv('MODEL_PATH'))"
```

---

## 📖 Learn More

- **Full User Guide**: [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
- **Phase 3 Summary**: [PHASE3_SUMMARY.md](PHASE3_SUMMARY.md)
- **Gradio Template**: [templates/gradio/README.md](templates/gradio/README.md)
- **All Templates**: [templates/README.md](templates/README.md)

---

## 🎯 Next Steps

1. **Deploy your first space** → `push-to-coreed --model-path models/my-model.gguf --space-name "My Space"`
2. **Explore templates** → Check out FastAPI, Express, and Docker templates
3. **Integrate with git** → Set up auto-deployment with GitHub Actions
4. **Customize your UI** → Edit the Gradio template for your needs
5. **Monitor your space** → Check health status and request counts

---

## 📞 Get Help

- **Documentation**: https://docs.coreed.ai
- **GitHub**: https://github.com/coreed/coreed
- **0G Documentation**: https://docs.0g.ai
- **0G Storage**: https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk
- **0G Compute**: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/overview

---

**Coreed: Hugging Face for the 0G Chain** 🚀

*Built with ❤️ on 0G*
