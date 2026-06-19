const solc = require("solc");
const fs = require("fs");
const path = require("path");
const ganache = require("ganache");
const { ethers } = require("ethers");

function compile() {
  const contractPath = path.join(__dirname, "contracts", "AgentRegistry.sol");
  const source = fs.readFileSync(contractPath, "utf8");
  const input = {
    language: "Solidity",
    sources: { "AgentRegistry.sol": { content: source } },
    settings: {
      evmVersion: "paris",
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors && output.errors.some((e) => e.severity === "error")) {
    output.errors.forEach((e) => console.error(e.formattedMessage));
    throw new Error("Compilation failed");
  }
  return output.contracts["AgentRegistry.sol"]["AgentRegistry"];
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

async function expectRevert(promise, expectedErrorName, label) {
  try {
    await promise;
    assert(false, `${label} (expected revert but it succeeded)`);
  } catch (err) {
    const selectorHex = err?.info?.error?.data?.result || err?.data || "";
    const expectedSelector = ethers.id(`${expectedErrorName}()`).slice(0, 10);
    const hit = typeof selectorHex === "string" && selectorHex.startsWith(expectedSelector);
    assert(hit, `${label}`);
  }
}

async function main() {
  console.log("Compiling AgentRegistry.sol with npm solc 0.8.26...");
  const contract = compile();
  console.log("Compiled OK.\n");

  const provider = new ethers.BrowserProvider(
    ganache.provider({
      logging: { quiet: true },
      chain: { hardfork: "shanghai" },
    })
  );

  const accounts = await provider.send("eth_accounts", []);
  const developer = await provider.getSigner(accounts[0]);
  const otherDeveloper = await provider.getSigner(accounts[1]);

  const factory = new ethers.ContractFactory(contract.abi, contract.evm.bytecode.object, developer);

  const SAMPLE_ROOT_HASH = "0x" + "ab".repeat(32);
  const ZERO_HASH = "0x" + "00".repeat(32);
  const SAMPLE_NAME = "FinanceBot-7B";

  console.log("Test: deploy + launch + sequential IDs");
  {
    const registry = await factory.deploy();
    await registry.waitForDeployment();

    const tx = await registry.connect(developer).launchAgent(SAMPLE_NAME, SAMPLE_ROOT_HASH);
    const receipt = await tx.wait();
    const event = receipt.logs
      .map((l) => {
        try {
          return registry.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "AgentLaunched");

    assert(event !== undefined, "AgentLaunched event was emitted");
    assert(event.args.agentId.toString() === "1", "first agent gets ID 1");
    assert(event.args.name === SAMPLE_NAME, "event carries correct name");
    assert(event.args.rootHash === SAMPLE_ROOT_HASH, "event carries correct root hash");
    assert(event.args.developer.toLowerCase() === accounts[0].toLowerCase(), "event carries correct developer address");

    const total = await registry.totalAgentsLaunched();
    assert(total.toString() === "1", "totalAgentsLaunched is 1 after one launch");
  }

  console.log("\nTest: metadata retrieval");
  {
    const registry = await factory.deploy();
    await registry.waitForDeployment();
    await (await registry.connect(developer).launchAgent(SAMPLE_NAME, SAMPLE_ROOT_HASH)).wait();

    const agent = await registry.getAgent(1);
    assert(agent.name === SAMPLE_NAME, "getAgent returns correct name");
    assert(agent.storageRootHash === SAMPLE_ROOT_HASH, "getAgent returns correct root hash");
    assert(agent.developer.toLowerCase() === accounts[0].toLowerCase(), "getAgent returns correct developer");
    assert(agent.launchTimestamp > 0n, "getAgent returns nonzero timestamp");
  }

  console.log("\nTest: multiple developers, sequential IDs across launches");
  {
    const registry = await factory.deploy();
    await registry.waitForDeployment();
    await (await registry.connect(developer).launchAgent("Agent A", SAMPLE_ROOT_HASH)).wait();
    await (await registry.connect(otherDeveloper).launchAgent("Agent B", SAMPLE_ROOT_HASH)).wait();

    const total = await registry.totalAgentsLaunched();
    assert(total.toString() === "2", "totalAgentsLaunched is 2 after two launches");

    const agentB = await registry.getAgent(2);
    assert(agentB.developer.toLowerCase() === accounts[1].toLowerCase(), "second agent attributed to second developer");
  }

  console.log("\nTest: per-developer agent index");
  {
    const registry = await factory.deploy();
    await registry.waitForDeployment();
    await (await registry.connect(developer).launchAgent("Agent A", SAMPLE_ROOT_HASH)).wait();
    await (await registry.connect(developer).launchAgent("Agent C", SAMPLE_ROOT_HASH)).wait();
    await (await registry.connect(otherDeveloper).launchAgent("Agent B", SAMPLE_ROOT_HASH)).wait();

    const devAgents = await registry.getAgentsByDeveloper(accounts[0]);
    assert(
      devAgents.map((n) => n.toString()).join(",") === "1,2",
      "developer's agent list contains exactly their own IDs in order"
    );
  }

  console.log("\nTest: revert conditions");
  {
    const registry = await factory.deploy();
    await registry.waitForDeployment();

    await expectRevert(
      registry.connect(developer).launchAgent(SAMPLE_NAME, ZERO_HASH),
      "InvalidStoragePointer",
      "reverts on zero root hash"
    );
    await expectRevert(
      registry.connect(developer).launchAgent("", SAMPLE_ROOT_HASH),
      "EmptyName",
      "reverts on empty name"
    );
    await expectRevert(
      registry.connect(developer).launchAgent("a".repeat(129), SAMPLE_ROOT_HASH),
      "NameTooLong",
      "reverts on name > 128 chars"
    );
    await expectRevert(registry.getAgent(999), "AgentDoesNotExist", "reverts on out-of-range agent ID");
    await expectRevert(registry.getAgent(0), "AgentDoesNotExist", "reverts on agent ID 0");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
