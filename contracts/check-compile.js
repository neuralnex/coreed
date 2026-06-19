const solc = require("solc");
const fs = require("fs");
const path = require("path");

const contractPath = path.join(__dirname, "contracts", "AgentRegistry.sol");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "AgentRegistry.sol": { content: source },
  },
  settings: {
    evmVersion: "cancun",
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.gasEstimates"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

let hasError = false;
if (output.errors) {
  for (const err of output.errors) {
    if (err.severity === "error") {
      hasError = true;
      console.error("ERROR:", err.formattedMessage);
    } else {
      console.warn("WARNING:", err.formattedMessage);
    }
  }
}

if (hasError) {
  process.exit(1);
}

const contract = output.contracts["AgentRegistry.sol"]["AgentRegistry"];
console.log("\n✅ Compiled successfully with solc " + solc.version());
console.log("Bytecode size:", contract.evm.bytecode.object.length / 2, "bytes");
console.log("\nDeployment gas estimate:", contract.evm.gasEstimates.creation.totalCost);
console.log("\nFunction gas estimates:");
console.log(JSON.stringify(contract.evm.gasEstimates.external, null, 2));

fs.writeFileSync(
  path.join(__dirname, "compile-output.json"),
  JSON.stringify({ abi: contract.abi, bytecode: "0x" + contract.evm.bytecode.object }, null, 2)
);
console.log("\nWrote ABI + bytecode to compile-output.json");
