import { describe, it, expect, beforeEach, jest, beforeAll } from '@jest/globals';
import { Interface } from 'ethers';
import agentSpaceRegistryAbi from '@/lib/agentSpaceRegistryAbi.json';

const originalConsoleError = console.error;

// Mock child_process and 0G Space Manager to isolate tests
jest.mock('child_process', () => ({
  exec: jest.fn().mockImplementation((cmd: any, options: any, cb: any) => {
    const callback = typeof options === 'function' ? options : cb;
    if (callback) callback(null, 'mock stdout', '');
    return { stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn(), kill: jest.fn() };
  }),
  spawn: jest.fn().mockImplementation(() => {
    return {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn()
    };
  }),
  execSync: jest.fn().mockReturnValue('mock stdout')
}));

jest.mock('@/lib/zeroGSpaceManager', () => ({
  zeroGSpaceManager: {
    downloadAndUnpack: jest.fn(() => Promise.resolve()) as any,
    downloadDependencyCache: jest.fn(() => Promise.resolve(true)) as any,
    uploadDependencyCache: jest.fn(() => Promise.resolve({ rootHash: '0xmockroot', txHash: '0xmocktx' })) as any
  }
}));

// Mock database helper
jest.mock('@/lib/db', () => {
  const actual = jest.requireActual('@/lib/db') as any;
  return {
    ...actual,
    get pool() {
      return (global as any).mockPoolState;
    },
    query: jest.fn()
  };
});

// Mock Privy Node SDK Client
const mockPrivyCreate = jest.fn() as any;
const mockPrivySendTransaction = jest.fn() as any;

jest.mock('@/lib/privy', () => ({
  privy: {
    wallets: () => ({
      create: mockPrivyCreate,
      ethereum: () => ({
        sendTransaction: mockPrivySendTransaction
      })
    })
  }
}));

// Setup realistic receipt event logs encoding using standard BigInt() constructors
const iface = new Interface(agentSpaceRegistryAbi);
const sampleLog = iface.encodeEventLog('SpaceDeployed', [
  BigInt(123), // spaceId
  'test-space', // name
  BigInt(0), // modelId
  'https://test-space.coreed.app', // endpointUrl
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // owner
  BigInt(Math.floor(Date.now() / 1000)) // deployedAt
]);

// Mock ethers provider and wallet
const mockProviderWaitForTransaction = jest.fn() as any;
const mockWalletSendTransaction = jest.fn() as any;

jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers') as any;
  return {
    ...actual,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      waitForTransaction: mockProviderWaitForTransaction
    })),
    Wallet: jest.fn().mockImplementation(() => ({
      sendTransaction: mockWalletSendTransaction
    }))
  };
});

describe('Spaces PostgreSQL / InMemory Fallback Store Tests', () => {
  const sampleSpace = {
    spaceId: 'test-space',
    name: 'Test Space',
    slug: 'test-space',
    description: 'A test space description',
    sdk: 'gradio',
    template: 'blank',
    owner: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    endpointUrl: 'https://test-space.coreed.app',
    createdAt: 1719349281,
    status: 'created' as const,
    gitRepo: {
      cloneUrl: 'file:///storage/repos/owner/test-space',
      repoPath: '/storage/repos/owner/test-space'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PostgreSQL Database Enabled Flow', () => {
    let spacesStore: any;
    let dbQuery: any;

    beforeAll(() => {
      (global as any).mockPoolState = {}; // simulate database active
      jest.resetModules();
      spacesStore = require('@/lib/spacesStore');
      dbQuery = require('@/lib/db').query;
    });

    it('should query select space by ID from database', async () => {
      dbQuery.mockResolvedValue({
        rows: [{
          space_id: 'test-space',
          name: 'Test Space',
          slug: 'test-space',
          description: 'A test space description',
          sdk: 'gradio',
          template: 'blank',
          owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          endpoint_url: 'https://test-space.coreed.app',
          created_at: '1719349281',
          status: 'created'
        }]
      });

      const space = await spacesStore.getSpaceById('test-space');
      expect(space).toBeDefined();
      expect(space?.spaceId).toBe('test-space');
      expect(dbQuery).toHaveBeenCalledWith('SELECT * FROM spaces WHERE space_id = $1', ['test-space']);
    });

    it('should query insert space into database', async () => {
      dbQuery.mockReset();
      dbQuery.mockResolvedValue({ rowCount: 1 });

      await spacesStore.addSpace(sampleSpace);
      expect(dbQuery).toHaveBeenCalled();
      const firstArg = dbQuery.mock.calls[0][0] as string;
      expect(firstArg).toContain('INSERT INTO spaces');
    });

    it('should query update status in database', async () => {
      dbQuery.mockReset();
      dbQuery.mockResolvedValue({ rowCount: 1 });

      await spacesStore.updateSpaceStatus('test-space', 'running');
      expect(dbQuery).toHaveBeenCalledWith(
        'UPDATE spaces SET status = $1 WHERE space_id = $2',
        ['running', 'test-space']
      );
    });

    it('should delete space from database', async () => {
      dbQuery.mockReset();
      dbQuery.mockResolvedValue({ rowCount: 1 });

      const deleted = await spacesStore.deleteSpace('test-space');
      expect(deleted).toBe(true);
      expect(dbQuery).toHaveBeenCalledWith('DELETE FROM spaces WHERE space_id = $1', ['test-space']);
    });
  });

  describe('InMemory Fallback Mode Flow (PostgreSQL pool is null)', () => {
    let spacesStore: any;
    let dbQuery: any;

    beforeAll(() => {
      (global as any).mockPoolState = null; // simulate database disabled
      jest.resetModules();
      spacesStore = require('@/lib/spacesStore');
      dbQuery = require('@/lib/db').query;
    });

    it('should perform operations on local map instead of database', async () => {
      dbQuery.mockReset();
      
      await spacesStore.addSpace(sampleSpace);
      expect(dbQuery).not.toHaveBeenCalled();

      const space = await spacesStore.getSpaceById('test-space');
      expect(space).toBeDefined();
      expect(space?.spaceId).toBe('test-space');

      const ownerSpaces = await spacesStore.getSpacesByOwner(sampleSpace.owner);
      expect(ownerSpaces.length).toBe(1);

      const allSpaces = await spacesStore.getAllSpaces();
      expect(allSpaces.length).toBe(1);

      await spacesStore.updateSpaceStatus('test-space', 'deployed');
      const updated = await spacesStore.getSpaceById('test-space');
      expect(updated?.status).toBe('deployed');

      const deleted = await spacesStore.deleteSpace('test-space');
      expect(deleted).toBe(true);

      const missing = await spacesStore.getSpaceById('test-space');
      expect(missing).toBeUndefined();
    });
  });
});

describe('Privy Authentication Endpoint (/api/auth/privy) Tests', () => {
  let authPost: any;
  let dbQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).mockPoolState = {}; // reset db pool to enabled
    process.env.NEXT_PUBLIC_PRIVY_APP_ID = 'your-app-id';
    process.env.PRIVY_APP_SECRET = 'your-app-secret';
    
    jest.resetModules();
    authPost = require('@/app/api/auth/privy/route').POST;
    dbQuery = require('@/lib/db').query;
  });

  it('should return 400 if email is missing', async () => {
    const request = new Request('http://localhost/api/auth/privy', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await authPost(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Email parameter is required');
  });

  it('should return existing user directly if they exist in Postgres DB', async () => {
    dbQuery.mockResolvedValue({
      rows: [{
        email: 'test@example.com',
        wallet_address: '0x1234567890123456789012345678901234567890',
        wallet_id: 'privy-wallet-id'
      }]
    });

    const request = new Request('http://localhost/api/auth/privy', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' })
    });

    const response = await authPost(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.address).toBe('0x1234567890123456789012345678901234567890');
    expect(body.walletId).toBe('privy-wallet-id');
  });

  it('should create real Privy wallet and register new user if configured', async () => {
    // 1. Simulate user not found
    dbQuery.mockResolvedValueOnce({ rows: [] });
    // 2. Mock Privy SDK embedded wallet creation success
    process.env.NEXT_PUBLIC_PRIVY_APP_ID = 'real-app-id';
    process.env.PRIVY_APP_SECRET = 'real-app-secret';
    mockPrivyCreate.mockResolvedValue({
      id: 'privy-real-wallet-id',
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
    });
    // 3. Mock registration INSERT success
    dbQuery.mockResolvedValueOnce({ rowCount: 1 });

    const request = new Request('http://localhost/api/auth/privy', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com' })
    });

    const response = await authPost(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.walletId).toBe('privy-real-wallet-id');
    expect(body.address).toBe('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  });

  it('should fallback to sandbox wallet generator if Privy API keys are placeholders', async () => {
    // 1. User not found
    dbQuery.mockResolvedValueOnce({ rows: [] });
    // 2. Privy credentials left as default placeholders
    process.env.NEXT_PUBLIC_PRIVY_APP_ID = 'your-app-id';
    process.env.PRIVY_APP_SECRET = 'your-app-secret';
    // 3. Registration INSERT success
    dbQuery.mockResolvedValueOnce({ rowCount: 1 });

    const request = new Request('http://localhost/api/auth/privy', {
      method: 'POST',
      body: JSON.stringify({ email: 'sandbox@example.com' })
    });

    const response = await authPost(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.walletId).toContain('sandbox-');
    expect(body.address).toBeDefined();
    expect(body.address.startsWith('0x')).toBe(true);
  });
});

describe('On-Chain deploy-onchain Relay Endpoint Tests', () => {
  const sampleMeta = {
    name: 'test-space',
    description: '{"description":"test description"}',
    version: '1.0.0',
    modelId: 0,
    endpointUrl: 'https://test.coreed.app'
  };

  let deployPost: any;
  let dbQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = originalConsoleError;
    (global as any).mockPoolState = {};
    
    // Set environment variables BEFORE requiring the module
    process.env.NEXT_PUBLIC_AGENT_SPACE_REGISTRY_ADDRESS = '0xEcD7F1a7446be7bf6035Bb417b76C43C349003FB';
    process.env.PRIVATE_KEY = '0xb3c4b894036d929f7f8e3bb22095cad792e58b1648033330f49f70c4e6edf2d6';
    process.env.NEXT_PUBLIC_PRIVY_APP_ID = 'real-app-id';
    process.env.PRIVY_APP_SECRET = 'real-app-secret';

    jest.resetModules();
    deployPost = require('@/app/api/spaces/deploy-onchain/route').POST;
    dbQuery = require('@/lib/db').query;
  });

  it('should deploy onchain using Privy sendTransaction relay', async () => {
    // 1. Mock user query from DB
    dbQuery.mockResolvedValue({
      rows: [{
        email: 'social@example.com',
        wallet_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        wallet_id: 'privy-user-wallet-id'
      }]
    });

    // 2. Mock Privy sendTransaction response
    mockPrivySendTransaction.mockResolvedValue({
      hash: '0xmockedprivytxhash'
    });

    // 3. Mock provider waiting for receipt
    mockProviderWaitForTransaction.mockResolvedValue({
      hash: '0xmockedprivytxhash',
      logs: [{
        topics: sampleLog.topics,
        data: sampleLog.data,
        address: '0xEcD7F1a7446be7bf6035Bb417b76C43C349003FB'
      }]
    });

    const request = new Request('http://localhost/api/spaces/deploy-onchain', {
      method: 'POST',
      body: JSON.stringify({
        email: 'social@example.com',
        spaceMeta: sampleMeta
      })
    });

    const response = await deployPost(request);
    
    // Print error details if status is not 200
    if (response.status !== 200) {
      const errorText = await response.text();
      console.log('Deploy Relay Error response body:', errorText);
    }

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.spaceId).toBe('123');
    expect(body.txHash).toBe('0xmockedprivytxhash');
    expect(mockPrivySendTransaction).toHaveBeenCalled();
  });

  it('should fallback to local PRIVATE_KEY transaction in sandbox mode', async () => {
    // 1. Mock user query from DB (sandbox wallet)
    dbQuery.mockResolvedValue({
      rows: [{
        email: 'sandbox@example.com',
        wallet_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        wallet_id: 'sandbox-12345'
      }]
    });

    // 2. Mock fallback ethers sendTransaction
    mockWalletSendTransaction.mockResolvedValue({
      hash: '0xmockedsandboxtxhash'
    });

    // 3. Mock provider waiting for receipt
    mockProviderWaitForTransaction.mockResolvedValue({
      hash: '0xmockedsandboxtxhash',
      logs: [{
        topics: sampleLog.topics,
        data: sampleLog.data,
        address: '0xEcD7F1a7446be7bf6035Bb417b76C43C349003FB'
      }]
    });

    const request = new Request('http://localhost/api/spaces/deploy-onchain', {
      method: 'POST',
      body: JSON.stringify({
        email: 'sandbox@example.com',
        spaceMeta: sampleMeta
      })
    });

    const response = await deployPost(request);
    
    // Print error details if status is not 200
    if (response.status !== 200) {
      const errorText = await response.text();
      console.log('Sandbox Deploy Error response body:', errorText);
    }

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.spaceId).toBe('123');
    expect(body.txHash).toBe('0xmockedsandboxtxhash');
    expect(mockWalletSendTransaction).toHaveBeenCalled();
  });
});

describe('Spaces Sleep & Wake-on-Demand Manager Tests', () => {
  let spaceRunner: any;
  let dbQuery: any;

  beforeAll(() => {
    (global as any).mockPoolState = {};
    jest.resetModules();
    spaceRunner = require('@/lib/spaceRunner');
    dbQuery = require('@/lib/db').query;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track and update space activity successfully', async () => {
    dbQuery.mockResolvedValue({ rowCount: 1 });
    
    await spaceRunner.updateLastActivity('test-space');
    
    expect(dbQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE spaces SET last_activity'),
      [expect.any(Number), 'test-space']
    );
  });

  it('should stop running space and update sleep state', async () => {
    dbQuery.mockResolvedValue({ rowCount: 1 });
    
    const result = spaceRunner.stopSpace('test-space');
    expect(result).toBe(false); // because it was not in active runningSpaces Map
    
    expect(dbQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE spaces SET is_asleep = $1, status = $2'),
      [true, 'deployed', 'test-space']
    );
  });

  it('should get running spaces maps and start checks', () => {
    expect(spaceRunner.getRunningSpaces).toBeDefined();
    expect(spaceRunner.startIdleCheckInterval).toBeDefined();
  });

  it('should trigger startSpace when proxy is requested and space is stopped', async () => {
    // 1. Mock getSpaceById to return a valid space
    dbQuery.mockResolvedValue({
      rows: [{
        space_id: 'test-space',
        name: 'Test Space',
        slug: 'test-space',
        sdk: 'gradio',
        owner: '0x123',
        git_repo_path: '/tmp/test-space'
      }]
    });

    // 2. Mock startSpace spy
    jest.spyOn(spaceRunner, 'startSpace').mockResolvedValue({ success: true, port: 7860 });
    jest.spyOn(spaceRunner, 'getSpacePort').mockReturnValue(undefined);

    const proxyRoute = require('@/app/api/spaces/[spaceId]/proxy/[[...path]]/route');
    const request = new Request('http://localhost/api/spaces/test-space/proxy', {
      method: 'GET'
    });

    const context = {
      params: Promise.resolve({ spaceId: 'test-space' })
    };

    try {
      await proxyRoute.GET(request, context);
    } catch (e) {
      // catch connection errors if it tries to dial the un-listened local port
    }

    expect(spaceRunner.startSpace).toHaveBeenCalledWith('test-space', '/tmp/test-space', 'gradio');
  });
});
