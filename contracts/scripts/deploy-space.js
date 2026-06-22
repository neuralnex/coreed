const hre = require("hardhat");

async function main() {
  const args = process.argv.slice(2);
  
  function getArg(flag) {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
  }

  const name = getArg("--name");
  const description = getArg("--description") || "";
  const version = getArg("--version") || "1.0.0";
  const modelId = parseInt(getArg("--model-id") || "0", 10);
  const endpoint = getArg("--endpoint");

  if (!name || !endpoint) {
    console.error("Error: --name and --endpoint are required");
    process.exit(1);
  }

  const contractAddress = process.env.SPACE_REGISTRY_ADDRESS || "0xedF4958de1e22979EaE3dec3ECb84C4D63cA510A";

  const AgentSpaceRegistry = await hre.ethers.getContractAt("AgentSpaceRegistry", contractAddress);
  
  console.log(`Deploying space "${name}" on contract ${contractAddress}...`);
  const tx = await AgentSpaceRegistry.deploySpace(
    name,
    description,
    version,
    modelId,
    endpoint
  );
  
  const receipt = await tx.wait();
  console.log(`tx: ${receipt.hash}`);
  
  const event = receipt.logs
    .map((l) => {
      try {
        return AgentSpaceRegistry.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "SpaceDeployed");

  if (event) {
    console.log(`spaceId: ${event.args.spaceId.toString()}`);
  } else {
    console.log("spaceId: unknown");
  }
}

// Set up the network programmatically from args
const args = process.argv.slice(2);
const networkIdx = args.indexOf("--network");
if (networkIdx !== -1 && networkIdx + 1 < args.length) {
  process.env.HARDHAT_NETWORK = args[networkIdx + 1];
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
