import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { privy } from '@/lib/privy';
import { ethers } from 'ethers';

export async function POST(request: Request) {
  try {
    const { email, provider } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // 1. Check if user already exists in DB
    const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    
    if (res.rows.length > 0) {
      const user = res.rows[0];
      return NextResponse.json({
        success: true,
        email: user.email,
        address: user.wallet_address,
        walletId: user.wallet_id
      });
    }

    // 2. User doesn't exist, create a Privy wallet
    let walletId = '';
    let walletAddress = '';
    let isFallbackNeeded = false;

    const isPlaceholder = !process.env.NEXT_PUBLIC_PRIVY_APP_ID || 
                          process.env.NEXT_PUBLIC_PRIVY_APP_ID === 'your-app-id' ||
                          !process.env.PRIVY_APP_SECRET || 
                          process.env.PRIVY_APP_SECRET === 'your-app-secret';

    if (!isPlaceholder) {
      try {
        console.log(`[Privy] Creating embedded wallet for user: ${email}...`);
        const wallet = await privy.wallets().create({ chain_type: 'ethereum' });
        walletId = wallet.id;
        walletAddress = wallet.address;
        console.log(`[Privy] Embedded wallet created. Address: ${walletAddress}`);
      } catch (privyErr: any) {
        console.error('Failed to create wallet via Privy SDK, falling back:', privyErr.message);
        isFallbackNeeded = true;
      }
    } else {
      isFallbackNeeded = true;
    }

    if (isFallbackNeeded) {
      console.warn('[Privy] Privy API keys are not configured or rate-limited. Generating sandbox wallet fallback...');
      const fallbackWallet = ethers.Wallet.createRandom();
      walletId = `sandbox-${fallbackWallet.address.slice(2, 10)}`;
      walletAddress = fallbackWallet.address;
    }

    // 3. Register user in Postgres
    await query(`
      INSERT INTO users (email, privy_user_id, wallet_address, wallet_id)
      VALUES ($1, $2, $3, $4)
    `, [email, `did:privy:user-${walletId}`, walletAddress, walletId]);

    return NextResponse.json({
      success: true,
      email,
      address: walletAddress,
      walletId
    });

  } catch (error: any) {
    console.error('Privy auth error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
