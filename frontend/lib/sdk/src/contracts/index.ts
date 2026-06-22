import AgentSpaceRegistryABI from './abis/AgentSpaceRegistry.json';
import ModelRegistryABI from './abis/ModelRegistry.json';
import AgentRegistryABI from './abis/AgentRegistry.json';

// Re-export the ABIs
export { AgentSpaceRegistryABI, ModelRegistryABI, AgentRegistryABI };

// Also export as default for flexibility
export default {
  AgentSpaceRegistryABI,
  ModelRegistryABI,
  AgentRegistryABI,
};

// Default contract addresses for Galileo Testnet
export const DEFAULT_CONTRACT_ADDRESSES = {
  modelRegistry: '0x2F8af0c73d86D029027AE723411fDE55da5D781F',
  agentRegistry: '0x147C73A88313Dd8E1C5161Ff84E5f0FbFb00D5D9',
  agentSpaceRegistry: '0xEcD7F1a7446be7bf6035Bb417b76C43C349003FB',
};

export const DEFAULT_NETWORK = {
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  chainId: 16602,
};
