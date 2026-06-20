# Mobile Wallet Detection Fix for Coreed on 0G Network

## Problem
On mobile devices, installed wallets like OKX Wallet and Trust Wallet were not being detected properly, preventing users from connecting their wallets to Coreed on the 0G network.

## Root Cause
The wallet detection logic in `useWallet.ts` was only checking for `window.ethereum` but mobile wallets often inject their providers in different ways:
- OKX Wallet Mobile: `window.okxwallet` or `window.ethereum.isOkxWallet`
- Trust Wallet Mobile: `window.Trust`, `window.trustwallet`, or `window.ethereum.isTrust`
- WalletConnect: `window.WalletConnect`

These globals were not typed in the TypeScript declarations, causing TypeScript errors.

## Solution Overview

### 1. Type Declarations (`frontend/lib/wallet.ts`)
- Added type declarations for mobile wallet globals: `window.okxwallet`, `window.WalletConnect`, `window.Trust`, `window.trustwallet`
- Extended `ExtendedEip1193Provider` interface with wallet identifier properties:
  - `isOkxWallet`, `isOKX` for OKX Wallet
  - `isTrust`, `isTrustWallet` for Trust Wallet
  - `isCoinbaseWallet`, `isRabby`, `isLedgerLive`, `isImToken`, `isBraveWallet` for other wallets

### 2. Enhanced Wallet Detection (`frontend/lib/hooks/useWallet.ts`)
- Created `getWalletProvider()` helper function that checks for:
  1. Standard `window.ethereum` (EIP-1193)
  2. Mobile wallet globals (`window.okxwallet`, `window.Trust`, etc.)
  3. Injected provider properties (`ethereum.isOkxWallet`, etc.)
- Updated `checkWalletAvailable()` to check all possible wallet injection methods
- Modified `connect()` and `handleReconnect()` to use the new provider detection
- Updated event listeners to work with mobile wallet providers

### 3. Enhanced Wallet Connector (`frontend/components/WalletConnector.tsx`)
- Updated OKX wallet detection to check both injected provider and mobile global
- Updated Trust Wallet detection to check all possible injection methods
- Updated WalletConnect detection to handle both injected and global instances
- Added `isMobileDevice()` utility to detect mobile browsers
- Enhanced mobile-specific messaging and wallet installation links
- Added mobile-specific UI hints for better user experience

### 4. 0G Network Configuration (`frontend/lib/wallet.ts`)
- Added comprehensive 0G network constants:
  - `GALILEO_CHAIN_ID` (16602) - Testnet
  - `ARISTOTLE_CHAIN_ID` (16661) - Mainnet
  - `GALILEO_CHAIN_ID_HEX`, `ARISTOTLE_CHAIN_ID_HEX`
  - RPC URLs for both networks
  - Explorer URLs for both networks
  - Default constants for development (defaults to testnet)
- Updated network ensuring logic to use the new constants

### 5. Comprehensive Wallet Utilities (`frontend/lib/utils/walletDetection.ts`)
Created a new utility file with:
- `WalletType` type for all supported wallets
- `WalletInfo` interface with wallet metadata and detection functions
- `detectWallet()` - Automatically detect the current wallet
- `isMobileDevice()` - Check if running on mobile
- `isInAppBrowser()` - Check if running in a wallet's in-app browser
- `getAvailableWallets()` - Get all available wallet options
- `getPrimaryWalletProvider()` - Get the primary available provider
- `hasWallet()` - Simple check for any wallet availability
- `getRecommendedMobileWallets()` / `getRecommendedDesktopWallets()` - Get platform-appropriate recommendations

### 6. Updated Files for Consistency
- `frontend/components/StatusStrip.tsx` - Updated to use `DEFAULT_CHAIN_ID`
- All existing imports remain backward compatible

## Mobile Wallet Detection Logic

The detection now follows this priority:

1. **Standard EIP-1193 Check**: `window.ethereum` (works for most desktop and mobile wallets)
2. **OKX Wallet**: 
   - `window.ethereum.isOkxWallet`
   - `window.ethereum.isOKX`
   - `window.okxwallet` (mobile global)
3. **Trust Wallet**:
   - `window.ethereum.isTrust`
   - `window.ethereum.isTrustWallet`
   - `window.Trust` (mobile global)
   - `window.trustwallet` (mobile global)
4. **WalletConnect**:
   - `window.WalletConnect` (global)
   - Injected provider check

## Usage Example

```typescript
// Detect current wallet
import { detectWallet, isMobileDevice } from "@/lib/utils/walletDetection";

const wallet = detectWallet(); // Returns "okx", "trust", "metamask", etc.
const onMobile = isMobileDevice();

// Get all available wallets
import { getAvailableWallets, getRecommendedMobileWallets } from "@/lib/utils/walletDetection";

const wallets = getAvailableWallets();
const mobileWallets = getRecommendedMobileWallets();

// Connect using the hook
import { useWalletContext } from "@/lib/contexts/WalletContext";

const { connect, disconnect, address, isConnected } = useWalletContext();
```

## Testing on Mobile Devices

To test mobile wallet detection:

1. **OKX Wallet Mobile**:
   - Open OKX app
   - Navigate to browser
   - Visit Coreed
   - Should automatically detect OKX Wallet

2. **Trust Wallet Mobile**:
   - Open Trust Wallet app
   - Navigate to browser
   - Visit Coreed
   - Should automatically detect Trust Wallet

3. **MetaMask Mobile**:
   - Open MetaMask app
   - Navigate to browser
   - Visit Coreed
   - Should automatically detect MetaMask

## Network Configuration

The app defaults to 0G Galileo Testnet (Chain ID: 16602) with:
- RPC: `https://evmrpc-testnet.0g.ai`
- Explorer: `https://chainscan-galileo.0g.ai`

Mainnet configuration is also available for production:
- Chain ID: 16661
- RPC: `https://evmrpc.0g.ai`
- Explorer: `https://chainscan.0g.ai`

## Backward Compatibility

All changes are backward compatible:
- Existing imports continue to work
- Old constants (`GALILEO_CHAIN_ID`, `GALILEO_RPC_URL`, etc.) are still exported
- New constants default to testnet values
- Desktop wallet detection remains unchanged

## Files Modified

1. `frontend/lib/wallet.ts` - Added type declarations and network constants
2. `frontend/lib/hooks/useWallet.ts` - Enhanced wallet detection and connection logic
3. `frontend/components/WalletConnector.tsx` - Updated wallet options and mobile detection
4. `frontend/components/StatusStrip.tsx` - Updated to use new constants
5. `frontend/lib/utils/walletDetection.ts` - New comprehensive wallet utility file

## Files Created

1. `frontend/lib/utils/walletDetection.ts` - Wallet detection utilities
2. `MOBILE_WALLET_FIX_SUMMARY.md` - This documentation

## Next Steps

To use these improvements:

1. Import wallet detection utilities where needed:
   ```typescript
   import { detectWallet, isMobileDevice, getAvailableWallets } from "@/lib/utils/walletDetection";
   ```

2. Use the enhanced wallet context for connections:
   ```typescript
   import { useWalletContext } from "@/lib/contexts/WalletContext";
   ```

3. Test on mobile devices with various wallets to ensure proper detection.

4. Consider adding more mobile-specific UI/UX improvements based on the detection results.
