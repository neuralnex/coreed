# Coreed Frontend

**Next.js Web Application for Coreed Platform**

The Coreed frontend provides a web interface for browsing, deploying, and managing AI models and spaces on the 0G Chain.

---

## Features

- **Browse Models**: Discover registered AI models with filtering and search
- **Browse Spaces**: View live deployments and their status
- **Create Models**: Register new models with metadata
- **Create Spaces**: Deploy new spaces from existing models
- **Dashboard**: Manage your models and spaces
- **Space Management**: Pause, resume, and configure auto-sleep for spaces
- **Health Monitoring**: View health status of all deployments

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

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── models/            # Models page and API routes
│   ├── spaces/            # Spaces page and API routes
│   ├── create/            # Create new model/space
│   ├── dashboard/         # User dashboard
│   └── page.tsx           # Home page
│
├── lib/                    # Library and utilities
│   ├── contracts/         # Contract ABIs and interactions
│   ├── hooks/             # React hooks
│   └── utils/             # Utility functions
│
├── components/            # Reusable React components
│   ├── ui/                # UI components (Button, Card, etc.)
│   ├── models/            # Model-related components
│   └── spaces/            # Space-related components
│
├── public/                # Static assets
├── styles/                # CSS and styling
└── types/                 # TypeScript type definitions
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_RPC_URL` | Yes | 0G Chain RPC URL |
| `NEXT_PUBLIC_CHAIN_ID` | Yes | Chain ID (16602 for Galileo) |
| `NEXT_PUBLIC_MODEL_REGISTRY_ADDRESS` | Yes | ModelRegistry contract address |
| `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` | Yes | AgentRegistry contract address |
| `NEXT_PUBLIC_AGENT_SPACE_REGISTRY_ADDRESS` | Yes | AgentSpaceRegistry contract address |
| `NEXT_PUBLIC_STORAGE_INDEXER` | Yes | 0G Storage indexer URL |
| `NEXT_PUBLIC_COMPUTE_ROUTER` | Yes | 0G Compute router URL |

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

## Technologies Used

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **State Management**: React Context
- **Blockchain**: ethers.js v6

---

## Network Configuration

### Galileo Testnet

```
RPC URL:           https://evmrpc-testnet.0g.ai
Chain ID:          16602
Explorer:          https://chainscan-galileo.0g.ai
Faucet:            https://faucet.0g.ai
```

### Contract Addresses

```
ModelRegistry:     0xFA81366Ba81C19d848191B8e49eC0948230d4216
AgentRegistry:    0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C
AgentSpaceRegistry: 0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

MIT License

---

**Coreed Frontend** - Part of Coreed v3.0

*Last updated: June 2026*
