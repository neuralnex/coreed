# Coreed - AI Agent Spaces on 0G Chain

**Decentralized Hugging Face Spaces Alternative on 0G Infrastructure**

Coreed is a **Spaces-first platform** for deploying AI applications on **0G Chain**. Unlike traditional platforms that require model registration first, Coreed enables developers to deploy live applications without any model registry overhead. 

**✅ Key Philosophy:** Load open-source models from **anywhere** (transformers, Hugging Face Hub, custom sources, local files) at runtime. No model registration required. Built for AI engineers who want to use standard Python libraries.

---

## 🎯 Core Vision: Spaces-First Architecture

Coreed prioritizes **Agent Spaces** as the primary deployment unit:

- **No Model Registration** - Load models directly in your code
- **Open Source Friendly** - Use `transformers`, `torch`, `sentence-transformers`, `peft`, `accelerate`, etc.
- **Flexible Loading** - Models from Hugging Face Hub, local files, URLs, or any source
- **Git-Native Workflow** - Every Space is a Git repository
- **0G Infrastructure** - Decentralized storage and compute
- **Pay-as-you-go** - Only pay for actual compute used via 0G Compute Router

### The Coreed Difference

| Feature | Hugging Face Spaces | Coreed Spaces |
|---------|---------------------|---------------|
| Model Registration | Required | **❌ Not Required** |
| Model Loading | From Hub only | **From Anywhere** |
| Infrastructure | Centralized | **Decentralized (0G)** |
| Git Workflow | ✅ | ✅ |
| Blockchain | ❌ | **✅ 0G Chain** |
| Cost Model | Centralized pricing | **Pay-as-you-go** |
| AI Libraries | Limited | **Full Python support** |

---

## 🚀 Quick Start

### For Developers: Create a Space

```bash
# 1. Start the Coreed frontend
cd frontend
npm install
npm run dev

# 2. Create a space via web UI
#    Open: http://localhost:3000/spaces/new
#    Fill form: name, description, SDK (Gradio/FastAPI/Express)
#    Click: Create Space

# 3. Clone your generated Git repo
git clone file:///C:/Users/HP/coreed/frontend/storage/repos/0xYOUR_ADDRESS/space-name
cd space-name

# 4. Install dependencies and run
pip install -r requirements.txt
python app.py

# 5. Access your space at http://localhost:7860
```

### For AI Engineers: Use Your Own Code

```bash
# 1. Create space and get Git repo URL from UI
# 2. Clone the repo
# 3. Add your AI code with any Python libraries

# Example: Transformers chatbot
cat > app.py << 'EOF'
from transformers import pipeline
import gradio as gr

# Load any model at runtime
pipe = pipeline("text-generation", model="mistralai/Mistral-7B-Instruct-v0.2")

def generate(text):
    return pipe(text, max_new_tokens=200)[0]["generated_text"]

ui = gr.Interface(fn=generate, inputs="text", outputs="text")
ui.launch(server_name="0.0.0.0", server_port=7860)
EOF

# 4. Update requirements.txt
echo "transformers>=4.38.0" >> requirements.txt
echo "gradio==4.31.0" >> requirements.txt
echo "torch>=2.1.0" >> requirements.txt

# 5. Run
pip install -r requirements.txt
python app.py
```

### Using 0G Compute Router (Recommended)

```python
# In your app.py - No local GPU needed!
import requests
import os
import gradio as gr

def chat(message, history):
    response = requests.post(
        "https://router-api.0g.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {os.getenv('OG_COMPUTE_API_KEY')}"},
        json={
            "model": "zai-org/GLM-4-Flash",
            "messages": [{"role": "user", "content": message}],
            "max_tokens": 100
        }
    )
    return response.json()["choices"][0]["message"]["content"]

ui = gr.ChatInterface(fn=chat, title="My AI Chat")
ui.launch(server_name="0.0.0.0", server_port=7860)
```

---

## ✨ Key Features

### 🎯 For AI Engineers
- **Full Python Support** - Use any Python AI library
- **Transformers Native** - Load models from Hugging Face Hub directly
- **Dependency Management** - Auto-generated `requirements.txt`
- **Flexible Model Sources** - Hugging Face, local files, URLs, custom
- **0G Compute Integration** - Decentralized GPU inference

### 🏗️ Platform Features
- **No Model Registration** - Load models in your code, not in a registry
- **Git-Native Workflow** - Every space is a Git repository
- **Spaces-First Architecture** - Spaces are the primary deployment unit
- **0G Chain Integration** - Smart contracts for space management
- **0G Compute Router** - Pay-as-you-go AI inference
- **0G Storage Ready** - Decentralized file storage
- **Multi-SDK Support** - Gradio, FastAPI, Express, Static, Docker

---

## 📁 Space Configuration

### Generated Space Structure

```
my-space/
├── README.md              # Configuration with YAML frontmatter
├── app.py                 # Main application with 0G integration
├── requirements.txt       # Python dependencies (auto-generated)
└── .git/                  # Git repository
```

### README.md Configuration

```yaml
---
title: My AI Space
owner: 0xYourAddress
sdk: gradio
template: blank
app_port: 7860
runtime: python
status: created
---

# My AI Space
A chatbot using open-source models from Hugging Face Hub.

## Quick Start
1. git clone <repo-url>
2. cd my-space
3. pip install -r requirements.txt
4. python app.py
5. Open http://localhost:7860
```

---

## 💡 Use Cases

### 1. Deploy a Transformers Chatbot

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import gradio as gr

model_name = "mistralai/Mistral-7B-Instruct-v0.2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

def generate(text):
    inputs = tokenizer(text, return_tensors="pt")
    outputs = model.generate(**inputs, max_new_tokens=200)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

ui = gr.Interface(fn=generate, inputs="text", outputs="text")
ui.launch()
```

### 2. Build a RAG Application

```python
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from sentence_transformers import SentenceTransformer
import chromadb
import gradio as gr

# Load models
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-large")
model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-large")

# ChromaDB for vector store
client = chromadb.Client()
collection = client.create_collection(name="docs")

def query_rag(query):
    # Embed query
    query_embedding = embedding_model.encode(query)
    
    # Search similar documents
    results = collection.query(query_embeddings=[query_embedding.tolist()], n_results=3)
    
    # Generate answer
    context = "\n".join(results["documents"][0])
    prompt = f"Answer based on context: {context}\nQuestion: {query}"
    
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(**inputs)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

ui = gr.Interface(fn=query_rag, inputs="text", outputs="text")
ui.launch()
```

### 3. Use 0G Compute for Inference (No GPU Needed)

```python
import requests
import os
import gradio as gr

OG_API_KEY = os.getenv("OG_COMPUTE_API_KEY")

def chat(message, history):
    response = requests.post(
        "https://router-api.0g.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {OG_API_KEY}"},
        json={
            "model": "zai-org/GLM-4-Flash",
            "messages": [{"role": "user", "content": message}],
            "max_tokens": 500,
            "temperature": 0.7
        }
    )
    return response.json()["choices"][0]["message"]["content"]

ui = gr.ChatInterface(fn=chat, title="0G-Powered Chat")
ui.launch()
```

### 4. Multi-Modal Image + Text

```python
from transformers import BlipProcessor, BlipForConditionalGeneration
import gradio as gr
from PIL import Image

processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

def caption_image(image):
    raw_image = Image.open(image).convert("RGB")
    inputs = processor(raw_image, return_tensors="pt")
    output = model.generate(**inputs)
    return processor.decode(output[0], skip_special_tokens=True)

ui = gr.Interface(
    fn=caption_image,
    inputs=gr.Image(type="pil"),
    outputs="text",
    title="Image Captioning"
)
ui.launch()
```

### 5. Fine-tuning with PEFT

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model
from datasets import load_dataset
import torch

# Load base model
model_name = "mistralai/Mistral-7B-Instruct-v0.2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.bfloat16)

# Add LoRA adapter
peft_config = LoraConfig(
    task_type="CAUSAL_LM",
    inference_mode=False,
    r=8,
    lora_alpha=32,
    lora_dropout=0.1
)
model = get_peft_model(model, peft_config)

# Load dataset
Dataset = load_dataset("json", data_files={"train": "train.json"})

# Training loop would go here...
# model.save_pretrained("my-finetuned-model")
```

---

## 📦 Supported Python Libraries

Coreed supports **all standard Python AI libraries** with no restrictions:

| Category | Libraries | Use Case |
|----------|-----------|----------|
| **Model Hubs** | `transformers`, `diffusers`, `sentence-transformers` | Model loading, diffusion |
| **Frameworks** | `torch`, `tensorflow`, `jax` | Deep learning |
| **Inference** | `accelerate`, `vllm`, `text-generation-inference` | Fast inference |
| **Fine-tuning** | `peft`, `bitsandbytes`, `qlora` | Parameter-efficient tuning |
| **Vector DB** | `chromadb`, `faiss-cpu`, `weaviate-client` | Embedding storage |
| **Orchestration** | `langchain`, `llama-index`, `haystack` | LLM workflows |
| **Local LLMs** | `llama-cpp-python`, `ctranslate2` | Offline inference |
| **Evaluation** | `evaluate`, `ragas`, `trulens` | Model evaluation |
| **Web UIs** | `gradio`, `streamlit`, `fastapi` | Interactive demos |

### Example Dependency Sets:

**Gradio Chatbot:**
```
gradio==4.31.0
transformers>=4.38.0
torch>=2.1.0
accelerate>=0.27.0
requests>=2.31.0
```

**RAG Application:**
```
gradio==4.31.0
transformers>=4.38.0
torch>=2.1.0
sentence-transformers>=2.2.0
chromadb>=0.4.0
```

**Fine-tuning:**
```
transformers>=4.38.0
peft>=0.8.0
bitsandbytes>=0.41.0
accelerate>=0.27.0
datasets>=2.16.0
```

---

## 🏗️ Project Structure

```
coreed/
├── frontend/                # Next.js Web Application
│   ├── app/                 # App Router pages
│   │   ├── api/spaces/create/  # Space creation API
│   │   └── spaces/          # Spaces management
│   ├── components/          # React components
│   │   └── space/          # Space-related
│   ├── lib/                 # Utilities
│   │   ├── git/            # Git management
│   │   └── docker/         # Docker builds
│   ├── storage/repos/       # Auto-created Git repos
│   └── README.md           # Frontend docs
│
├── contracts/               # Smart Contracts
│   └── AgentSpaceRegistry.sol  # Space registry
│
└── README.md                # Project overview
```

---

## 🔗 Network Configuration

### 0G Galileo Testnet (Primary)

```
RPC URL:           https://evmrpc-testnet.0g.ai
Chain ID:          16602 (0x40DA)
Storage Indexer:   https://indexer-storage-testnet-turbo.0g.ai
Compute Router:    https://router-api.0g.ai/v1
Explorer:          https://chainscan-galileo.0g.ai
Faucet:            https://faucet.0g.ai
```

### Contract Addresses

```
AgentSpaceRegistry: 0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A
ModelRegistry:     0xFA81366Ba81C19d848191B8e49eC0948230d4216
AgentRegistry:    0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
```

### 0G SDK Integration

- **Storage**: `@0gfoundation/0g-storage-ts-sdk`
- **Compute**: Direct HTTP calls to `router-api.0g.ai/v1`
- **Chain**: ethers.js v6 for smart contracts

---

## 🎛️ Space Management

### Auto-Sleep (Cost Optimization)

Spaces can automatically sleep after inactivity:

```bash
# Deploy with auto-sleep
# (Configured in README.md frontmatter)
autoSleep: true
sleepTimeout: 3600  # 1 hour
```

### Manual Control

```bash
# Pause a space
# (Via frontend UI or future API)

# Resume a space  
# (Via frontend UI or future API)
```

---

## 🌐 Web Interface

### Features
- **Browse Spaces** - Discover all deployed agent spaces
- **Create Spaces** - Deploy new spaces with Git integration
- **Space Details** - View status, health, configuration
- **Git Integration** - Clone URL, commit history
- **0G Compute Status** - Connection and model info
- **Wallet Integration** - Connect any EIP-1193 wallet

### Supported Wallets
MetaMask, OKX Wallet, Trust Wallet, WalletConnect, Coinbase Wallet, Rabby, Ledger Live, imToken, Brave Wallet, and all EIP-1193 compatible wallets.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

MIT License

---

## 🎯 Summary

**Coreed** - AI Agent Spaces on 0G Chain

- ✅ **Spaces-First Architecture** - No model registration required
- ✅ **Git-Native Workflow** - Every space is a Git repository
- ✅ **Full Python Support** - Use any AI library (transformers, torch, etc.)
- ✅ **0G-Powered** - Decentralized storage and compute
- ✅ **AI Engineer Friendly** - Built for developers, not platforms

**Perfect for:** AI engineers, ML researchers, developers who want to deploy AI applications without infrastructure management.

---

*Built on 0G Galileo Testnet | Spaces-First | Git-Native | Open Source Friendly*
*Last updated: June 2026*