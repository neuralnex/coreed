# Coreed Testing Guide

## ✅ Build Status

**Last Build:** ✅ SUCCESSFUL
- TypeScript compilation: PASSED
- All routes compiled: 13 routes (11 static, 2 dynamic)
- New API route: `/api/spaces/create`

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/spaces/create    ← NEW: 0G Compute integration
├ ○ /docs
├ ○ /hub
├ ƒ /hub/models/[id]
├ ○ /hub/models/new
├ ○ /hub/my-models
├ ○ /hub/search
├ ○ /playground
├ ○ /spaces
├ ƒ /spaces/[id]         ← UPDATED: Shows ComputeStatus
└ ○ /spaces/new          ← UPDATED: Calls 0G Compute API
```

---

## 🚀 Quick Test (No Server Required)

### 1. Verify Build
```bash
cd frontend
npm run build
```
✅ Expected: `Finished TypeScript in ~10s` with no errors

---

## 🧪 Manual Testing with Server

### Step 1: Start Development Server
```bash
npm run dev
```
Server starts at: `http://localhost:3000`

### Step 2: Test Space Creation Flow

#### Test A: Without 0G Compute API Key (Expected Behavior)
1. Open browser: `http://localhost:3000/spaces/new`
2. Connect wallet (MetaMask, etc.)
3. Fill form:
   - Space name: `test-space-1`
   - Description: `Testing Coreed on 0G`
   - SDK: `Gradio`
   - License: `MIT`
4. Click **Create Space**
5. ✅ Expected:
   - On-chain transaction confirmed
   - Redirect to `/spaces/{spaceId}`
   - **ComputeStatus component shows**:
     ```
     0G Compute Deployment
     Not connected to 0G Compute Router
     
     To enable AI inference:
     1. Get an API key from https://pc.0g.ai
     2. Add to .env: OG_COMPUTE_API_KEY=sk-...
     3. Deposit 0G tokens
     4. Refresh this page
     ```

#### Test B: With 0G Compute API Key (Full Integration)

**Prerequisites:**
```bash
# 1. Get API key from https://pc.0g.ai
# 2. Deposit 0G tokens (testnet or mainnet)
# 3. Add to .env.local:
cp .env.local.example.compute .env.local
# Edit .env.local with your API key
```

**Test:**
1. Restart dev server (to pick up new .env)
2. Create a new space as above
3. ✅ Expected:
   - On-chain registration succeeds
   - ComputeStatus shows:
     ```
     ✓ Connected to router-api.0g.ai/v1
     
     Available Models (10):
     [zai-org/GLM-4-Flash] [GLM-5-FP8] [Qwen2.5-7B] ...
     
     0G Compute: Deployed
     Model: zai-org/GLM-4-Flash
     Endpoint: https://router-api.0g.ai/v1/chat/completions
     
     [Chat Interface]
     Type a message → Get AI response
     ```

---

## 🔍 API Endpoint Testing

### Test 1: GET /api/spaces/create
**Check configuration**
```bash
curl http://localhost:3000/api/spaces/create
```

✅ Expected Response (200 OK):
```json
{
  "configuration": {
    "rpcUrl": "https://evmrpc-testnet.0g.ai",
    "chainId": "16602",
    "compute": {
      "baseUrl": "https://router-api.0g.ai/v1",
      "hasApiKey": false
    }
  },
  "message": "Coreed Space creation API is ready"
}
```

### Test 2: POST /api/spaces/create
**Create a space with 0G Compute connection**
```bash
curl -X POST http://localhost:3000/api/spaces/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-api-space",
    "description": "Testing via API",
    "sdk": "gradio",
    "owner": "0x1234567890abcdef1234567890abcdef12345678"
  }'
```

#### Without API Key:
✅ Expected (200 OK):
```json
{
  "success": true,
  "space": {
    "name": "test-api-space",
    "slug": "test-api-space",
    "endpointUrl": "https://1234567890abcdef.test-api-space.coreed.ai",
    "status": "registered"
  },
  "compute": {
    "connected": false,
    "baseUrl": "https://router-api.0g.ai/v1",
    "requiresApiKey": true,
    "error": "0G Compute API key not configured..."
  },
  "deployment": {},
  "nextSteps": [
    "1. Get a 0G Compute API key from https://pc.0g.ai",
    "2. Add it to your .env: OG_COMPUTE_API_KEY=sk-...",
    "3. Deposit 0G tokens to your Router account",
    "4. Refresh this page"
  ]
}
```

#### With API Key:
✅ Expected (200 OK):
```json
{
  "success": true,
  "space": {
    "name": "test-api-space",
    "slug": "test-api-space",
    "endpointUrl": "https://1234567890abcdef.test-api-space.coreed.ai",
    "status": "deployed_to_compute"
  },
  "compute": {
    "connected": true,
    "baseUrl": "https://router-api.0g.ai/v1",
    "requiresApiKey": false,
    "models": [
      {"id": "zai-org/GLM-4-Flash", "name": "GLM-4-Flash"},
      {"id": "zai-org/GLM-5-FP8", "name": "GLM-5-FP8"},
      ...
    ]
  },
  "deployment": {
    "id": "coreed-test-api-space-1234567890",
    "model": "zai-org/GLM-4-Flash",
    "endpoint": "https://router-api.0g.ai/v1/chat/completions",
    "status": "ready"
  },
  "nextSteps": [
    "Your space is connected to 0G Compute!",
    "Use the endpoint: https://router-api.0g.ai/v1/chat/completions",
    "Start chatting with your deployed model"
  ]
}
```

### Test 3: GET /api/spaces/create?spaceId=123
**Retrieve deployment info**
```bash
curl http://localhost:3000/api/spaces/create?spaceId=123
```

✅ Expected (200 OK if exists, 404 if not):
```json
// If found:
{
  "spaceId": "123",
  "compute": { ... },
  "deployment": { ... },
  "deployedAt": 1234567890
}

// If not found:
{
  "error": "Space deployment not found",
  "spaceId": "123"
}
```

---

## 📊 Test Cases Matrix

| Test | Description | Expected | Status |
|------|-------------|----------|--------|
| B1 | Build compiles | No errors | ✅ PASS |
| B2 | TypeScript checks pass | No type errors | ✅ PASS |
| F1 | Space creation form loads | Form visible | ✅ PASS |
| F2 | Form requires wallet | Shows connect prompt | ✅ PASS |
| F3 | Form requires name | Validation error | ✅ PASS |
| F4 | Create without API key | Shows setup instructions | ⏳ PENDING |
| F5 | Create with API key | Shows chat interface | ⏳ PENDING |
| F6 | Chat sends message | Gets AI response | ⏳ PENDING |
| A1 | GET /api/spaces/create | Returns config | ⏳ PENDING |
| A2 | POST /api/spaces/create | Returns deployment | ⏳ PENDING |
| A3 | GET /api/spaces/create?spaceId=X | Returns info | ⏳ PENDING |

---

## 🛠️ Troubleshooting

### Build Fails
```bash
# Check for TypeScript errors
npm run build

# If errors:
# 1. Check the specific line number in the error
# 2. Verify all imports exist
# 3. Check type definitions
```

### API Key Not Working
1. Verify `.env.local` exists in `frontend/` directory
2. Check spelling: `OG_COMPUTE_API_KEY` (not `COMPUTE_API_KEY`)
3. Restart dev server after adding key
4. Test key directly:
   ```bash
   curl https://router-api.0g.ai/v1/models \
     -H "Authorization: Bearer sk-your-key"
   ```

### No Models Available
1. Deposit 0G tokens to your Router account
2. Check balance at https://pc.0g.ai
3. For testnet, use testnet tokens from https://faucet.0g.ai

### Chat Not Responding
1. Check browser console for errors
2. Verify API key is set in `.env.local`
3. Ensure you have token balance
4. Try a simpler model: `zai-org/GLM-4-Flash`

---

## 🎯 Success Criteria

You'll know everything works when:

1. ✅ `npm run build` completes without errors
2. ✅ Space creation form submits without errors
3. ✅ Space detail page shows **0G Compute Status** section
4. ✅ If API key is set: Shows connected models + chat interface
5. ✅ If API key not set: Shows clear instructions to set it up
6. ✅ Chat messages send and receive AI responses

---

## 📝 Current Implementation Summary

### What's Working
- ✅ Frontend form with space creation
- ✅ On-chain registration via AgentSpaceRegistry
- ✅ 0G Compute Router connection logic
- ✅ API routes for space creation and status
- ✅ ComputeStatus component with chat UI
- ✅ Build passes all checks

### What Needs API Key
- ⏳ Connection to 0G Compute Router
- ⏳ Model listing
- ⏳ Inference/test chat
- ⏳ Deployment verification

### What's Not Implemented (from PLAN.md)
- ❌ Git repository creation on server
- ❌ Docker build engine
- ❌ Template scaffolding
- ❌ Real-time log streaming
- ❌ Health check endpoint

**Note:** These are not needed for Option A (0G Compute Router integration). They're for the full Git-to-Docker pipeline.

---

## 🚀 Ready to Test?

Run these commands:

```bash
# 1. Verify build
npm run build

# 2. Start server
npm run dev

# 3. Open browser
#    http://localhost:3000/spaces/new

# 4. Create a space and check the detail page
```

Then:
- Without API key: See setup instructions
- With API key: Chat with AI models on 0G!
