const hre = require("hardhat");

async function main() {
  console.log(`Deploying AgentRegistry to network: ${hre.network.name}`);

  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`AgentRegistry deployed to: ${address}`);
  console.log(`\nNext steps:`);
  console.log(`1. Verify:  npx hardhat verify --network galileo ${address}`);
  console.log(`2. Copy this address into frontend/.env.local as NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS`);
  console.log(`3. View on explorer: https://chainscan-galileo.0g.ai/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
