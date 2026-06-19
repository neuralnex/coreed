# Coreed Agent Space Templates

Starter templates for deploying AI agents as live services (Agent Spaces) on Coreed.

---

## Available Templates

| Template | Language | Port | Health Endpoint | Best For |
|----------|----------|------|-----------------|----------|
| [Gradio](gradio/) | Python | 7860 | `/health` | Interactive UIs, chatbots |
| [FastAPI](fastapi/) | Python | 8000 | `/health` | REST APIs |
| [Express](express/) | Node.js | 3000 | `/health` | Node.js apps |
| [Docker](docker/) | Custom | 8080 | `/health` | Custom runtimes |

---

## Quick Start

### Choose a Template

- **Python with UI**: Use Gradio (Hugging Face-style interface)
- **Python API**: Use FastAPI
- **Node.js**: Use Express
- **Custom**: Use Docker

---

## Common Features

All templates provide:

- `/health` endpoint for health checks
- Model loading from local path
- Basic inference capabilities
- Docker support
- Environment variable configuration

---

## Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MODEL_PATH` | Path to the model file | Yes |
| `MODEL_NAME` | Name of your model/agent | Yes |
| `SPACE_ID` | Coreed Space ID | Yes |
| `SPACE_VERSION` | Version of your agent | No |
| `PORT` / `SERVER_PORT` | Server port | No |

---

## Health Checks

The Coreed platform monitors your space via the `/health` endpoint:

- **Frequency**: Every 30 seconds
- **Timeout**: 3 seconds
- **Max Retries**: 3

Expected response:
```json
{
  "status": "healthy",
  "timestamp": 1718764800,
  "space_id": "1",
  "model_loaded": true,
  "version": "1.0.0"
}
```

---

## Deployment

### Using Docker (Recommended)

```bash
# Build image
docker build -t my-coreed-space .

# Run container
docker run -p 8000:8000 \
  -e MODEL_PATH=/app/models/model.gguf \
  -e MODEL_NAME="My Agent" \
  -e SPACE_ID=1 \
  my-coreed-space
```

### Cloud Providers

**Google Cloud Run:**
```bash
gcloud run deploy my-space \
  --image myregistry/my-coreed-space:1.0.0 \
  --port 8000 \
  --allow-unauthenticated
```

**Fly.io:**
```bash
fly launch
fly secrets set MODEL_PATH=/app/models/model.gguf
fly secrets set MODEL_NAME="My Agent"
fly deploy
```

---

## Customizing Templates

Each template has its own structure. See individual template READMEs for details.

---

## Downloading Models from 0G Storage

```bash
0g-storage-client download \
  --indexer https://indexer-storage-testnet-turbo.0g.ai \
  --root 0x... \
  --file ./models/my-model.gguf
```

---

## Contributing

Add new templates by creating a folder in `templates/` with:
- Template code
- README explaining usage
- Required environment variables
- Example deployment instructions

---

**Coreed Agent Spaces** - Part of Coreed v3.0

*Last updated: June 2026*
