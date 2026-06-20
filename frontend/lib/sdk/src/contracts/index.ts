import AgentSpaceRegistryABI from './abis/AgentSpaceRegistry.json';
import ModelRegistryABI from './abis/ModelRegistry.json';
import AgentRegistryABI from './abis/AgentRegistry.json';

export { AgentSpaceRegistryABI, ModelRegistryABI, AgentRegistryABI };

// Default contract addresses for Galileo Testnet
export const DEFAULT_CONTRACT_ADDRESSES = {
  modelRegistry: '0xFA81366Ba81C19d848191B8e49eC0948230d4216',
  agentRegistry: '0xff34F1281A8D4F14d503c28E8A45cAF98Acc235C',
  agentSpaceRegistry: '0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A',
};

export const DEFAULT_NETWORK = {
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  chainId: 16602,
};
