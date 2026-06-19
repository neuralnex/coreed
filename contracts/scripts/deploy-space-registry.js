const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying AgentSpaceRegistry...\n");

  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Connected to network: ${network.name} (chainId: ${network.chainId})`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 Deploying from: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceEth = hre.ethers.formatEther(balance);
  console.log(`💰 Balance: ${balanceEth} OG\n`);

  if (balance === 0n) {
    throw new Error("❌ Deployer has zero balance. Fund the wallet first.");
  }

  console.log("📦 Deploying AgentSpaceRegistry...");
  const AgentSpaceRegistry = await hre.ethers.getContractFactory("AgentSpaceRegistry");
  const agentSpaceRegistry = await AgentSpaceRegistry.deploy();
  await agentSpaceRegistry.waitForDeployment();
  const agentSpaceRegistryAddress = await agentSpaceRegistry.getAddress();
  console.log(`✅ AgentSpaceRegistry deployed to: ${agentSpaceRegistryAddress}\n`);

  console.log("=".repeat(60));
  console.log("✨ Deployment complete!");
  console.log("=".repeat(60));
  console.log(`\nAgentSpaceRegistry Address: ${agentSpaceRegistryAddress}\n`);

  console.log("Next steps:");
  console.log("1. Add address to frontend/.env.local:");
  console.log(`   NEXT_PUBLIC_AGENT_SPACE_REGISTRY_ADDRESS=${agentSpaceRegistryAddress}`);
  console.log("\n2. Update documentation with the new address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
