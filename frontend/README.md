# Coreed Frontend

**Next.js Web Application for Agent Spaces on 0G Chain**

The Coreed frontend provides a web interface for browsing, deploying, and managing AI Agent Spaces on the 0G Chain. This is a Spaces-first platform where users can deploy live applications without requiring model registration.

**✅ Key Philosophy**: Load open-source models from anywhere (transformers, Hugging Face Hub, or custom sources) at runtime. No model registration required.

---

## ✨ Features

- **Browse Spaces**: Discover all deployed agent spaces with filtering and search
- **Deploy Spaces**: Create new spaces without model registration
- **Space Details**: View live deployment status, health, and configuration
- **Space Management**: Pause, resume, wake, and configure auto-sleep
- **Git Integration**: Git-based workflow for space configuration
- **Health Monitoring**: Automatic health checks and status updates
- **Wallet Integration**: Connect any EIP-1193 compatible wallet
- **Template Selection**: Choose from Gradio, FastAPI, Express, or Custom templates

---

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+
- Git

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### Configuration

Copy the example environment file and update with your settings:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration. Required variables:

```env
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_MODEL_REGISTRY_ADDRESS=0xFA81366Ba81C19d848191B8e49eC0948230d4216
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
NEXT_PUBLIC_AGENT_SPACE_REGISTRY_ADDRESS=0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A
NEXT_PUBLIC_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
NEXT_PUBLIC_COMPUTE_ROUTER=https://router-api.0g.ai/v1
```

> **Note**: Never commit `.env.local` to git. It's in `.gitignore`.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Build for Production

```bash
npm run build
npm run start
```

---

## Deployment

For production deployment, see the [Deployment Guide](../docs/DEPLOYMENT_GUIDE.md).

### Recommended: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Alternative: Netlify

```bash
npm install -g netlify-cli
ntl login
ntl deploy --prod
```

### Docker

```bash
docker build -t coreed/frontend .
docker run -p 3000:3000 coreed/frontend
```

---

## 🏗️ Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── hub/               # Models hub (legacy, optional)
│   ├── spaces/            # Spaces page and API routes
│   │   ├── new/          # Create new space
│   │   └── [id]/        # Space details
│   ├── playground/       # Model playground
│   ├── docs/             # Documentation pages
│   └── page.tsx          # Home page
│
├── lib/                    # Library and utilities
│   ├── contracts/         # Contract ABIs and interactions
│   │   └── agentSpaceRegistryAbi.json
│   ├── hooks/             # React hooks
│   │   ├── useWallet.ts         # Wallet connection
│   │   └── useAgentSpaceRegistry.ts  # Space registry
│   ├── contexts/          # React contexts
│   │   ├── WalletContext.tsx
│   │   └── ThemeContext.tsx
│   └── wallet.ts          # Wallet utilities
│
├── components/            # Reusable React components
│   ├── ui/                # UI components (Button, Card, etc.)
│   ├── space/            # Space-related components
│   │   ├── SpaceCard.tsx
│   │   └── SpaceManagement.tsx
│   └── WalletConnector.tsx  # Wallet connection modal
│
├── public/                # Static assets
├── styles/                # CSS and styling
└── types/                 # TypeScript type definitions
    └── space.ts          # Space type definitions
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_RPC_URL` | Yes | 0G Chain RPC URL (https://evmrpc-testnet.0g.ai) |
| `NEXT_PUBLIC_CHAIN_ID` | Yes | Chain ID (16602 for Galileo) |
| `NEXT_PUBLIC_AGENT_SPACE_REGISTRY_ADDRESS` | Yes | **Primary**: AgentSpaceRegistry contract address |
| `NEXT_PUBLIC_STORAGE_INDEXER` | Yes | 0G Storage indexer URL |
| `NEXT_PUBLIC_COMPUTE_ROUTER` | Yes | 0G Compute router URL |
| `NEXT_PUBLIC_MODEL_REGISTRY_ADDRESS` | No | Legacy: ModelRegistry contract address |
| `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` | No | Legacy: AgentRegistry contract address |

---

## Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

---

## 🛠️ Technologies Used

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: React Context
- **Blockchain**: ethers.js v6
- **Storage**: 0G Storage TS SDK
- **UI Icons**: Lucide React

---

## 🔗 Network Configuration

Coreed operates on **0G Galileo Testnet** with full 0G infrastructure integration:

### Galileo Testnet

```
RPC URL:           https://evmrpc-testnet.0g.ai
Chain ID:          16602 (0x40DA)
Explorer:          https://chainscan-galileo.0g.ai
Faucet:            https://faucet.0g.ai
Storage Indexer:   https://indexer-storage-testnet-turbo.0g.ai
Compute Router:    https://router-api.0g.ai/v1
```

### 📝 Primary Contract Addresses

The **AgentSpaceRegistry** is the primary contract for the Spaces-first architecture:

```
AgentSpaceRegistry: 0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A
```

Legacy contracts (still supported):
```
ModelRegistry:     0xFA81366Ba81C19d848191B8e49eC0948230d4216
AgentRegistry:    0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
```

**✅ 0G SDK Integration:**
- Storage operations use `@0gfoundation/0g-storage-ts-sdk`
- All smart contracts deployed on 0G Galileo Testnet

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📜 License

MIT License

---

**Coreed Frontend** - AI Agent Spaces Platform on 0G Chain

*🎯 Spaces-First Architecture*
*🚀 Git-Based Deployment*
*✅ Built on 0G Galileo Testnet*

*Last updated: June 2026*
