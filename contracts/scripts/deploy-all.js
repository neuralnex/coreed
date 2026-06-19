const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting Coreed contracts deployment...\n");

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

  console.log("📦 Deploying AgentRegistry...");
  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log(`✅ AgentRegistry deployed to: ${agentRegistryAddress}\n`);

  console.log("📦 Deploying ModelRegistry...");
  const ModelRegistry = await hre.ethers.getContractFactory("ModelRegistry");
  const modelRegistry = await ModelRegistry.deploy();
  await modelRegistry.waitForDeployment();
  const modelRegistryAddress = await modelRegistry.getAddress();
  console.log(`✅ ModelRegistry deployed to: ${modelRegistryAddress}\n`);

  console.log("=" .repeat(60));
  console.log("✨ Deployment complete!");
  console.log("=" .repeat(60));
  console.log("\nContract Addresses:");
  console.log(`  AgentRegistry: ${agentRegistryAddress}`);
  console.log(`  ModelRegistry: ${modelRegistryAddress}`);
  console.log("\n");
  console.log("Next steps:");
  console.log("1. Add these addresses to frontend/.env.local:");
  console.log(`   NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=${agentRegistryAddress}`);
  console.log(`   NEXT_PUBLIC_MODEL_REGISTRY_ADDRESS=${modelRegistryAddress}`);
  console.log("\n2. Run frontend:");
  console.log("   cd ../frontend");
  console.log("   npm install");
  console.log("   npm run dev");
  console.log("\n3. Verify contracts on 0Gscan (if available):");
  console.log(`   npx hardhat verify --network galileo ${agentRegistryAddress}`);
  console.log(`   npx hardhat verify --network galileo ${modelRegistryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
