# Gradio Template

**Interactive UI for Coreed Agent Spaces**

This template provides a Gradio-based interface for your AI model, similar to AI deployment platforms.

---

## Quick Start

```bash
cd templates/gradio

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy example env and configure
cp .env.example .env
# Edit .env with your MODEL_PATH

# Run locally
python app.py
```

Your Gradio UI will be available at `http://localhost:7860`

---

## Configuration

Edit `app.py` and implement:

1. **`load_model()`**: Load your model and tokenizer
2. **`chat()`**: Implement chat completion
3. **`predict()`**: Implement text generation

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

def load_model():
    global model, tokenizer
    model = AutoModelForCausalLM.from_pretrained(
        os.getenv("MODEL_PATH")
    )
    tokenizer = AutoTokenizer.from_pretrained(
        os.getenv("MODEL_PATH")
    )
    # Update health status
    _health_status["model_loaded"] = True

def chat(message, history):
    inputs = tokenizer(message, return_tensors="pt").to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=100)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MODEL_PATH` | Yes | Path to model file |
| `MODEL_NAME` | No | Name of your model |
| `SPACE_ID` | No | Coreed Space ID |
| `SPACE_VERSION` | No | Version (default: 1.0.0) |
| `SERVER_PORT` | No | Port (default: 7860) |

---

## Docker Deployment

```bash
# Build image
docker build -t my-gradio-space .

# Run container
docker run -p 7860:7860 \
  -e MODEL_PATH=/app/models/model.gguf \
  -v $(pwd)/models:/app/models:ro \
  my-gradio-space
```

---

## Health Check

The `/health` endpoint is automatically provided:

```bash
curl http://localhost:7860/health
# Returns: {"status": "healthy", "model_loaded": true, ...}
```

---

## Downloading Models

```bash
# From 0G Storage
0g-storage-client download \
  --indexer https://indexer-storage-testnet-turbo.0g.ai \
  --root 0x... \
  --file ./models/model.gguf
```

---

**Gradio Template** - Part of Coreed v3.0

*Last updated: June 2026*
