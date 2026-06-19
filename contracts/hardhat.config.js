require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const GALILEO_RPC = process.env.GALILEO_RPC_URL || "https://evmrpc-testnet.0g.ai";
const GALILEO_CHAIN_ID = Number(process.env.GALILEO_CHAIN_ID || 16602);

module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "none",
      },
    },
  },
  networks: {
    hardhat: {},
    galileo: {
      url: GALILEO_RPC,
      chainId: GALILEO_CHAIN_ID,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      galileo: process.env.CHAINSCAN_API_KEY || "placeholder",
    },
    customChains: [
      {
        network: "galileo",
        chainId: GALILEO_CHAIN_ID,
        urls: {
          apiURL: "https://chainscan-galileo.0g.ai/open/api",
          browserURL: "https://chainscan-galileo.0g.ai",
        },
      },
    ],
  },
};
