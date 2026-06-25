import { PrivyClient } from '@privy-io/node';

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
const appSecret = process.env.PRIVY_APP_SECRET || '';

// Initialize Privy Node Client
export const privy = new PrivyClient({
  appId,
  appSecret
});
