# Coreed Deployment Guide

**Complete guide to deploying Coreed frontend, CLI, and SDK for public access**

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Contract Deployment](#3-contract-deployment)
4. [Frontend Deployment](#4-frontend-deployment)
5. [CLI Deployment](#5-cli-deployment)
6. [SDK Deployment](#6-sdk-deployment)
7. [Complete System Deployment](#7-complete-system-deployment)
8. [Post-Deployment Configuration](#8-post-deployment-configuration)
9. [Monitoring and Maintenance](#9-monitoring-and-maintenance)
10. [Troubleshooting](#10-troubleshooting)
11. [What's Implemented vs What's Left](#11-whats-implemented-vs-whats-left)

---

## Overview

This guide covers deploying all Coreed components so users can access them without cloning the repository:

- **Frontend**: Next.js web application for browsing models and spaces
- **CLI**: `push-to-coreed` command-line tool (Python package)
- **SDK**: Python and JavaScript libraries for programmatic access
- **Contracts**: Smart contracts on 0G Chain with pause/sleep functionality

**Features Implemented:**
- Model registration on-chain
- Space deployment with Gradio/FastAPI/Express templates
- Health monitoring with automatic status updates
- Git workflow integration
- 0G Compute deployment support
- Auto-sleep/pause functionality for inactive spaces
- User-controlled sleep timeout configuration

**Estimated Time:** 2-4 hours  
**Estimated Cost:** $0-50 (domain only, all services have free tiers)  
**Prerequisites:** GitHub account, Node.js 18+, Python 3.8+

---

## Prerequisites

### Required Tools

```bash
# Node.js & npm (for frontend)
node --version  # >= 18.0.0
npm --version   # >= 9.0.0

# Python (for CLI and SDK)
python --version  # >= 3.8.0
pip --version

# Docker (for containerized deployment)
docker --version

# Git
git --version
```

### Required Accounts

1. **0G Wallet** with testnet tokens (Get from: https://faucet.0g.ai)
2. **GitHub Account** (for package publishing and CI/CD)
3. **Vercel Account** (for frontend hosting - recommended)
4. **PyPI Account** (for Python package)
5. **npm Account** (for JavaScript SDK)

---

## 3. Contract Deployment

### Compile Contracts

```bash
cd contracts
npm install
npx hardhat compile
```

### Deploy to 0G Galileo Testnet

```bash
npx hardhat run scripts/deploy-all.js --network galileo
```

### Update Contract Addresses

Update these in all configuration files. Current addresses:

```
ModelRegistry:     0xFA81366Ba81C19d848191B8e49eC0948230d4216
AgentRegistry:    0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
AgentSpaceRegistry: 0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A
```

---

## 4. Frontend Deployment

### Option A: Vercel (Recommended)

```bash
npm install -g vercel
vercel login
cd frontend
npm install
vercel --prod
```

### Option B: Netlify

```bash
npm install -g netlify-cli
ntl login
cd frontend
ntl deploy --prod
```

### Option C: Docker

```bash
docker build -t coreed/frontend -f frontend/Dockerfile .
docker push coreed/frontend:latest
```

---

## 5. CLI Deployment

### Build and Publish to PyPI

```bash
cd cli
pip install setuptools wheel twine
python setup.py sdist bdist_wheel
twine upload dist/* -u __token__ -p YOUR_PYPI_TOKEN
```

**Result:** Users can install with `pip install coreed-cli`

### Docker Deployment

```bash
docker build -t coreed/cli -f cli/Dockerfile .
docker push coreed/cli:latest
```

---

## 6. SDK Deployment

### Python SDK

Bundled with CLI. After PyPI publication:
```python
pip install coreed-cli
from coreed_cli import push_to_coreed, pause_space, resume_space, set_auto_sleep
```

### JavaScript/TypeScript SDK

```bash
cd frontend/lib/sdk
npm install
npm run build
npm publish --access public
```

**Result:** Users can install with `npm install @coreed/sdk`

---

## 7. Complete System Deployment

### Automated Script

Create `deploy-all.sh`:

```bash
#!/bin/bash
set -e

cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy-all.js --network galileo

cd ../cli
pip install -e .

cd ../frontend
npm install
npm run build
vercel --prod --token $VERCEL_TOKEN

cd ../cli
python setup.py sdist bdist_wheel
twine upload dist/* -u __token__ -p $PYPI_TOKEN
```

---

## 8. Post-Deployment Configuration

### Environment Variables

**.env.example for Frontend:**
```env
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_MODEL_REGISTRY_ADDRESS=0xFA81366Ba81C19d848191B8e49eC0948230d4216
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
NEXT_PUBLIC_AGENT_SPACE_REGISTRY_ADDRESS=0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A
NEXT_PUBLIC_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
NEXT_PUBLIC_COMPUTE_ROUTER=https://router-api.0g.ai/v1
```

**.env.example for CLI:**
```env
PRIVATE_KEY=0xyour_private_key_here
RPC_URL=https://evmrpc-testnet.0g.ai
CHAIN_ID=16602
MODEL_REGISTRY_ADDRESS=0xFA81366Ba81C19d848191B8e49eC0948230d4216
SPACE_REGISTRY_ADDRESS=0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
```

---

## 9. Monitoring and Maintenance

- **Frontend**: Vercel Analytics, Sentry for errors
- **CLI**: PyPI download stats, GitHub issues
- **Contracts**: Block explorer monitoring
- **Health Checks**: Regular verification of all components

---

## 10. Troubleshooting

### Common Issues

**PyPI upload fails:** Use unique package name like `coreed-cli-official`

**npm publish fails:** Use scoped package like `@coreed/sdk`

**Vercel deploy fails:** Add all required env vars in dashboard

**Contract deployment fails:** Get more testnet tokens from faucet

---

## 11. What's Implemented vs What's Left

### What's Implemented in the UI

**Models Page:**
- Browse all registered models
- Filter by tags, architecture, license
- View model details and metadata
- Like and download models

**Spaces Page:**
- Browse all live deployments
- Filter by status (active/inactive)
- View space details and endpoint
- Access health status
- **Pause/Resume functionality**
- **Auto-sleep configuration**

**Create Pages:**
- Create new model repository
- Create new space from existing model
- Configure deployment options
- Set auto-sleep timeout

**Dashboard:**
- View your models and spaces
- Manage your deployments
- Monitor health status
- Configure pause/sleep settings

**Search & Discovery:**
- Search models and spaces
- Advanced filtering
- Sorting options

**Space Management:**
- Pause active spaces
- Resume paused spaces
- Set auto-sleep timeout (in seconds)
- View sleep status and remaining time

### What's Left to Implement

**High Priority:**
- Real-time health monitoring dashboard
- Usage analytics for spaces
- Model versioning UI
- Space collaboration features
- Template customization in UI

**Medium Priority:**
- Advanced search with filters
- Model comparison tool
- Space cloning
- Batch operations
- Export/import configurations

**Low Priority:**
- Dark mode
- Mobile optimization
- Notifications system
- Social sharing
- API documentation viewer

---

## Network Configuration

```
RPC URL:           https://evmrpc-testnet.0g.ai
Chain ID:          16602
Storage Indexer:   https://indexer-storage-testnet-turbo.0g.ai
Compute Router:    https://router-api.0g.ai/v1
Explorer:          https://chainscan-galileo.0g.ai
Faucet:            https://faucet.0g.ai

ModelRegistry:     0xFA81366Ba81C19d848191B8e49eC0948230d4216
AgentRegistry:    0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
AgentSpaceRegistry: 0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A
```

---

**Coreed v3.0: AI Platform for 0G Chain**  
*Last updated: June 2026*
