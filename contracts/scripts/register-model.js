const hre = require("hardhat");

async function main() {
  const args = process.argv.slice(2);
  
  function getArg(flag) {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
  }

  const name = getArg("--name");
  const description = getArg("--description") || "";
  const architecture = getArg("--architecture") || "";
  const parameters = parseInt(getArg("--parameters") || "0", 10);
  const license = getArg("--license") || "MIT";
  const storageHash = getArg("--storage-hash");
  
  if (!name || !storageHash) {
    console.error("Error: --name and --storage-hash are required");
    process.exit(1);
  }

  const contractAddress = process.env.MODEL_REGISTRY_ADDRESS || "0xFA81366Ba81C19d848191B8e49eC0948230d4216";

  const ModelRegistry = await hre.ethers.getContractAt("ModelRegistry", contractAddress);
  
  console.log(`Registering model "${name}" on contract ${contractAddress}...`);
  const tx = await ModelRegistry.registerModel(
    name,
    description,
    architecture,
    parameters,
    license,
    storageHash
  );
  
  const receipt = await tx.wait();
  console.log(`tx: ${receipt.hash}`);
  
  const event = receipt.logs
    .map((l) => {
      try {
        return ModelRegistry.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "ModelRegistered");

  if (event) {
    console.log(`modelId: ${event.args.modelId.toString()}`);
  } else {
    console.log("modelId: unknown");
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
