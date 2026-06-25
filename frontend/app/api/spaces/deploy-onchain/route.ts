import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { privy } from '@/lib/privy';
import { ethers, Interface, JsonRpcProvider, Wallet } from 'ethers';
import agentSpaceRegistryAbi from '@/lib/agentSpaceRegistryAbi.json';

const AGENT_SPACE_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_AGENT_SPACE_REGISTRY_ADDRESS || '';
const GALILEO_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 16602);
const PRIVATE_KEY = process.env.PRIVATE_KEY;

export async function POST(request: Request) {
  try {
    const { email, spaceMeta } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    if (!spaceMeta || !spaceMeta.name || !spaceMeta.description) {
      return NextResponse.json({ error: 'Invalid spaceMeta parameters' }, { status: 400 });
    }

    if (!AGENT_SPACE_REGISTRY_ADDRESS) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_AGENT_SPACE_REGISTRY_ADDRESS is not set' }, { status: 500 });
    }

    // 1. Fetch user from DB to get wallet info
    const userRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not registered' }, { status: 404 });
    }
    const user = userRes.rows[0];
    const walletId = user.wallet_id;
    const walletAddress = user.wallet_address;

    // 2. Encode transaction function call
    const iface = new Interface(agentSpaceRegistryAbi);
    const encodedData = iface.encodeFunctionData('deploySpace', [
      spaceMeta.name,
      spaceMeta.description,
      spaceMeta.version || '1.0.0',
      spaceMeta.modelId || 0,
      spaceMeta.endpointUrl || ''
    ]);

    // 3. Determine if we are using Privy API or Sandbox Fallback
    const isPlaceholder = !process.env.NEXT_PUBLIC_PRIVY_APP_ID || 
                          process.env.NEXT_PUBLIC_PRIVY_APP_ID === 'your-app-id' ||
                          !process.env.PRIVY_APP_SECRET || 
                          process.env.PRIVY_APP_SECRET === 'your-app-secret';

    let txHash = '';

    if (!isPlaceholder && walletId && !walletId.startsWith('sandbox-')) {
      try {
        console.log(`[Privy Relay] Sending deploySpace tx for wallet: ${walletAddress} (${walletId})`);
        
        const response = await privy.wallets().ethereum().sendTransaction(walletId, {
          caip2: `eip155:${CHAIN_ID}`,
          params: {
            transaction: {
              to: AGENT_SPACE_REGISTRY_ADDRESS,
              data: encodedData,
              value: '0x0'
            }
          }
        });
        
        txHash = typeof response === 'string' ? response : (response?.hash || '');
        console.log(`[Privy Relay] Transaction submitted. Hash: ${txHash}`);
      } catch (privyErr: any) {
        console.error('Privy transaction sending failed, trying sandbox fallback:', privyErr.message);
        txHash = await sendSandboxTx(encodedData);
      }
    } else {
      console.log('[Privy Relay] Sandbox/Fallback active. Signing using system PRIVATE_KEY...');
      txHash = await sendSandboxTx(encodedData);
    }

    // 4. Wait for receipt to extract spaceId from event
    console.log(`[Privy Relay] Waiting for transaction receipt for: ${txHash}...`);
    const provider = new JsonRpcProvider(GALILEO_RPC_URL);
    const receipt = await provider.waitForTransaction(txHash);

    if (!receipt) {
      throw new Error('Transaction receipt was not found');
    }

    const deployedEvent = receipt.logs
      .map((log: any) => {
        try {
          return iface.parseLog({ topics: log.topics as string[], data: log.data });
        } catch {
          return null;
        }
      })
      .find((parsed: any) => parsed?.name === 'SpaceDeployed');

    if (!deployedEvent) {
      throw new Error('SpaceDeployed event not found in transaction receipt.');
    }

    const spaceId = deployedEvent.args.spaceId.toString();
    console.log(`[Privy Relay] On-chain Space deployed successfully. Space ID: ${spaceId}, Tx: ${txHash}`);

    return NextResponse.json({
      success: true,
      spaceId,
      txHash
    });

  } catch (error: any) {
    console.error('On-chain deploy relay error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function sendSandboxTx(data: string): Promise<string> {
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable is not configured for sandbox fallback');
  }
  const provider = new JsonRpcProvider(GALILEO_RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);
  
  const tx = await wallet.sendTransaction({
    to: AGENT_SPACE_REGISTRY_ADDRESS,
    data,
    value: 0
  });
  
  return tx.hash;
}
