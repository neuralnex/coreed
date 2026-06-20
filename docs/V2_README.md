# Coreed v2.0 - Model Hub

**Coreed v2.0 transforms the platform from a simple agent registry into a full Model Hub on 0G Chain** — think "AI Platform meets decentralized storage".

## What's New in v2.0

### 🆕 Model Registry
- **Rich model metadata**: Name, description, architecture, parameters, license, tags
- **On-chain discovery**: Filter models by architecture, license, creator
- **Social features**: Like models, track downloads
- **Search & browse**: Full-text search across all models

### 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        COREED V2.0                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  ModelRegistry  │    │  AgentRegistry  │    │  0G Storage │ │
│  │  (New!)         │    │  (v1)           │    │             │ │
│  └────────┬────────┘    └────────┬────────┘    └──────┬──────┘ │
│           │                 │                     │           │
│           ▼                 ▼                     ▼           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    FRONTEND                                   │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐    │ │
│  │  │ /hub    │  │ /search │  │ /models │  │ /playground │    │ │
│  │  │         │  │         │  │ /[id]   │  │             │    │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Contracts

### 1. AgentRegistry.sol (v1 - Unchanged)
- Sequential Agentic ID minting
- Agent metadata storage
- Developer tracking

### 2. ModelRegistry.sol (v2 - NEW)
```solidity
contract ModelRegistry {
    struct ModelMeta {
        bytes32 storageRootHash;
        address creator;
        uint96 createdAt;
        string name;
        string description;
        string architecture;
        uint256 parameters;
        string license;
        uint256 downloadCount;
        uint256 likeCount;
    }
    
    // Functions:
    - registerModel() - Upload new model
    - getModel() - Get model by ID
    - getModelsByCreator() - List creator's models
    - getModelsByArchitecture() - Filter by architecture
    - getModelsByLicense() - Filter by license
    - searchModels() - Advanced search
    - likeModel() / unlikeModel() - Social features
    - recordDownload() - Track downloads
    - didLikeModel() - Check like status
}
```

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Launch agent (v1) |
| `/hub` | Hub | Trending & recent models |
| `/hub/search` | Search | Filter models |
| `/hub/models/[id]` | Model Detail | View model metadata |
| `/hub/my-models` | My Models | User's uploaded models |
| `/playground` | Playground | Query agents (v1) |

## Key Features

### 1. Model Upload Flow
```
User → Upload Model Modal → Drag & Drop Files → Enter Metadata → Upload to 0G Storage → Register on-chain → Success!
```

Metadata includes:
- **Name**: Model identifier (max 128 chars)
- **Description**: What the model does (max 2048 chars)
- **Architecture**: Qwen2.5, Llama3, Mistral, etc.
- **Parameters**: Number of parameters
- **License**: Apache-2.0, MIT, GPL-3.0, etc.
- **Tags**: Comma-separated labels

### 2. Model Discovery
- **Trending**: Models sorted by like count
- **Recent**: Models sorted by creation date
- **Search**: Filter by architecture, license, keyword
- **Creator Pages**: View all models by a specific creator

### 3. Social Features
- **Like/Unlike**: Users can like models (prevents duplicate likes)
- **Download Tracking**: Records how many times a model is downloaded
- **Creator Verification**: Models linked to creator's wallet address

### 4. Integration with v1
- Models can be used to **launch agents** (via /playground)
- Agents can reference model storage hashes
- Unified wallet connection across both systems

## File Structure

```
coreed/
├── contracts/
│   ├── contracts/
│   │   ├── AgentRegistry.sol      # v1 - Agent registry
│   │   └── ModelRegistry.sol       # v2 - Model registry
│   ├── scripts/
│   │   ├── deploy.js               # Deploy single contract
│   │   └── deploy-all.js           # Deploy both contracts
│   ├── test/
│   │   ├── AgentRegistry.test.js   # v1 tests (12 tests)
│   │   └── ModelRegistry.test.js   # v2 tests (20+ tests)
│   ├── hardhat.config.js
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── hub/
    │   │   ├── page.tsx             # Hub overview
    │   │   ├── search/
    │   │   │   └── page.tsx         # Search page
    │   │   └── models/
    │   │       └── [id]/
    │   │           └── page.tsx     # Model detail
    │   │       └── my-models/
    │   │           └── page.tsx     # User's models
    │   ├── page.tsx                 # Home (v1)
    │   ├── playground/
    │   │   └── page.tsx             # Agent lookup (v1)
    │   └── layout.tsx
    │
    ├── components/
    │   ├── hub/
    │   │   ├── index.ts
    │   │   ├── ModelCard.tsx         # Model card component
    │   │   └── UploadModelModal.tsx # Upload modal
    │   ├── ResolvingHash.tsx        # Animated hash (v1)
    │   ├── StatusStrip.tsx          # Wallet status (v1)
    │   └── Uploader.tsx             # Agent uploader (v1)
    │
    ├── lib/
    │   ├── agentRegistryAbi.json   # v1 ABI
    │   ├── modelRegistryAbi.json   # v2 ABI
    │   ├── modelStorage.ts          # Model upload service
    │   ├── useAgentRegistry.ts      # v1 hook
    │   ├── useModelRegistry.ts      # v2 hook
    │   ├── wallet.ts                # Wallet utilities
    │   └── zeroGStorage.ts          # 0G Storage service (v1)
    │
    ├── types/
    │   ├── index.ts
    │   ├── agent.ts                 # Agent types
    │   └── model.ts                 # Model types
    │
    └── package.json
```

## Technical Details

### Model Card Schema (TypeScript)
```typescript
interface ModelCard {
  name: string;              // Model name
  description: string;       // Description
  architecture: string;     // Architecture type
  parameters: number;       // Number of parameters
  license: string;          // License type
  tags?: string[];          // Search tags
  datasets?: string[];      // Training datasets
  framework?: string;       // Framework used
  quantization?: string;    // Quantization type
  format?: string;          // File format
  library?: string;         // Library version
  f16?: boolean;            // F16 support
}

interface ModelMeta extends ModelCard {
  modelId: string;
  storageRootHash: string;
  creator: string;
  createdAt: number;
  downloadCount: number;
  likeCount: number;
}
```

### Storage
- **0G Storage Indexer**: `https://indexer-storage-testnet-turbo.0g.ai`
- **EVM RPC**: `https://evmrpc-testnet.0g.ai`
- **Files supported**: `.gguf`, `.safetensors`, `.bin`, `.json`
- **Light files (<10MB)**: Uploaded via `MemData` (in-memory)
- **Heavy files**: Uploaded via `Blob` (streamed)

### Contracts on Galileo Testnet
- **Chain ID**: 16602
- **AgentRegistry**: (Deploy first)
- **ModelRegistry**: (Deploy second)

## Deployment

### Step 1: Deploy Contracts
```bash
cd contracts
npm install

# Deploy both contracts
npx hardhat run scripts/deploy-all.js --network galileo

# Or deploy individually
npx hardhat run scripts/deploy.js --network galileo
```

### Step 2: Configure Frontend
```bash
cd frontend
npm install

# Edit .env.local with deployed addresses
cp .env.local.example .env.local
# Add the addresses from deployment
```

### Step 3: Run Frontend
```bash
npm run dev
# Open http://localhost:3000
```

### Step 4: Run Tests
```bash
cd contracts
npx hardhat test

# Or test individual contracts
npx hardhat test test/AgentRegistry.test.js
npx hardhat test test/ModelRegistry.test.js
```

## Usage

### Upload a Model
1. Go to `/hub/my-models`
2. Click "Upload New Model"
3. Fill in metadata (name, description, architecture, etc.)
4. Drag & drop model files
5. Click "Upload Model"
6. Model is uploaded to 0G Storage and registered on-chain

### Browse Models
1. Go to `/hub` to see trending and recent models
2. Go to `/hub/search` to filter by architecture, license, or keyword
3. Click on any model to view details

### Launch Agent from Model
1. View a model detail page
2. Click "Launch Agent" button
3. Agent is created with the model's storage hash
4. Redirects to home page with new agent

## Environment Variables

### Contracts (.env)
```bash
PRIVATE_KEY=your_private_key_here
GALILEO_RPC_URL=https://evmrpc-testnet.0g.ai
GALILEO_CHAIN_ID=16602
CHAINSCAN_API_KEY=your_api_key
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_MODEL_REGISTRY_ADDRESS=0x...
```

## Dependencies

### Contracts
- Hardhat ^2.28.6
- @nomicfoundation/hardhat-toolbox ^5.0.0
- Solidity 0.8.26
- chai ^4.5.0

### Frontend
- Next.js 16.2.9
- React 19.2.4
- ethers ^6.13.1
- @0gfoundation/0g-storage-ts-sdk ^1.2.10
- react-dropzone ^14.2.3
- Tailwind CSS v4

## API Reference

### ModelRegistry Contract

#### registerModel
```solidity
function registerModel(
    string calldata name,
    string calldata description,
    string calldata architecture,
    uint256 parameters,
    string calldata license,
    bytes32 storageRootHash
) external returns (uint256 modelId)
```

#### getModel
```solidity
function getModel(uint256 modelId) external view returns (
    string memory name,
    string memory description,
    string memory architecture,
    uint256 parameters,
    string memory license,
    bytes32 storageRootHash,
    address creator,
    uint256 createdAt,
    uint256 downloadCount,
    uint256 likeCount
)
```

#### searchModels
```solidity
function searchModels(
    string calldata query,
    string calldata architectureFilter,
    string calldata licenseFilter,
    uint256 limit,
    uint256 offset
) external view returns (uint256[] memory)
```

#### likeModel / unlikeModel
```solidity
function likeModel(uint256 modelId) external
function unlikeModel(uint256 modelId) external
```

#### recordDownload
```solidity
function recordDownload(uint256 modelId) external
```

## Gas Estimates

| Function | Gas Cost (Estimate) |
|----------|---------------------|
| registerModel | ~120,000-150,000 |
| getModel | ~5,000-8,000 (view) |
| searchModels | ~20,000-50,000 (view) |
| likeModel | ~40,000-50,000 |
| recordDownload | ~35,000-45,000 |

## Limitations & Future Work

### Current Limitations
- Search is on-chain (expensive for large datasets)
- No full-text search (only exact matches)
- No pagination in search results (limited by gas)
- Model files are separate uploads (no automatic grouping)

### Planned for v2.1
- Off-chain indexing for better search
- Model versioning support
- Model collections/folders
- Collaborative models (multiple creators)
- Monetization (pay-per-download, subscriptions)

### Planned for v3.0 (Agent Spaces)
- Live agent deployment
- FastAPI/Docker templates
- Health endpoints
- Inference API
- Compute integration (0G Compute)

## Migration from v1

v2.0 is fully backward compatible with v1:

1. **AgentRegistry** contract is unchanged
2. **Existing agents** continue to work
3. **New ModelRegistry** is optional
4. **Frontend** now has both `/` (v1) and `/hub` (v2) routes

To migrate:
1. Deploy ModelRegistry alongside AgentRegistry
2. Update frontend .env with both addresses
3. New features become available automatically

## License

MIT License - See LICENSE file for details.

---

**Coreed v2.0: AI Platform for the 0G Chain** 🚀
