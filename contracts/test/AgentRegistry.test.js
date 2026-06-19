const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("AgentRegistry", function () {
  let registry;
  let developer, otherDeveloper;

  const SAMPLE_ROOT_HASH = "0x" + "ab".repeat(32);
  const SAMPLE_NAME = "FinanceBot-7B";

  beforeEach(async function () {
    [developer, otherDeveloper] = await ethers.getSigners();
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    registry = await AgentRegistry.deploy();
  });

  it("launches an agent and assigns sequential IDs starting at 1", async function () {
    const tx = await registry.connect(developer).launchAgent(SAMPLE_NAME, SAMPLE_ROOT_HASH);
    
    await expect(tx)
      .to.emit(registry, "AgentLaunched")
      .withArgs(1, SAMPLE_NAME, SAMPLE_ROOT_HASH, developer.address, anyValue);

    expect(await registry.totalAgentsLaunched()).to.equal(1);
  });

  it("stores and retrieves full agent metadata correctly", async function () {
    await registry.connect(developer).launchAgent(SAMPLE_NAME, SAMPLE_ROOT_HASH);
    const agent = await registry.getAgent(1);

    expect(agent.name).to.equal(SAMPLE_NAME);
    expect(agent.storageRootHash).to.equal(SAMPLE_ROOT_HASH);
    expect(agent.developer).to.equal(developer.address);
    expect(agent.launchTimestamp).to.be.gt(0);
  });

  it("increments IDs across multiple launches from different developers", async function () {
    await registry.connect(developer).launchAgent("Agent A", SAMPLE_ROOT_HASH);
    await registry.connect(otherDeveloper).launchAgent("Agent B", SAMPLE_ROOT_HASH);

    expect(await registry.totalAgentsLaunched()).to.equal(2);
    const agentB = await registry.getAgent(2);
    expect(agentB.developer).to.equal(otherDeveloper.address);
  });

  it("tracks per-developer agent lists", async function () {
    await registry.connect(developer).launchAgent("Agent A", SAMPLE_ROOT_HASH);
    await registry.connect(developer).launchAgent("Agent C", SAMPLE_ROOT_HASH);
    await registry.connect(otherDeveloper).launchAgent("Agent B", SAMPLE_ROOT_HASH);

    const devAgents = await registry.getAgentsByDeveloper(developer.address);
    expect(devAgents.map((n) => Number(n))).to.deep.equal([1, 2]);
  });

  it("reverts on a zero root hash", async function () {
    const zeroHash = "0x" + "00".repeat(32);
    await expect(
      registry.connect(developer).launchAgent(SAMPLE_NAME, zeroHash)
    ).to.be.revertedWithCustomError(registry, "InvalidStoragePointer");
  });

  it("reverts on an empty name", async function () {
    await expect(
      registry.connect(developer).launchAgent("", SAMPLE_ROOT_HASH)
    ).to.be.revertedWithCustomError(registry, "EmptyName");
  });

  it("reverts on a name exceeding the max length", async function () {
    const tooLong = "a".repeat(129);
    await expect(
      registry.connect(developer).launchAgent(tooLong, SAMPLE_ROOT_HASH)
    ).to.be.revertedWithCustomError(registry, "NameTooLong");
  });

  it("accepts maximum length name (128 chars)", async function () {
    const maxName = "a".repeat(128);
    await expect(
      registry.connect(developer).launchAgent(maxName, SAMPLE_ROOT_HASH)
    ).to.not.be.reverted;
  });

  it("reverts when querying a non-existent agent ID", async function () {
    await expect(registry.getAgent(999)).to.be.revertedWithCustomError(registry, "AgentDoesNotExist");
    await expect(registry.getAgent(0)).to.be.revertedWithCustomError(registry, "AgentDoesNotExist");
  });

  it("returns empty array for developer with no agents", async function () {
    const agents = await registry.getAgentsByDeveloper(otherDeveloper.address);
    expect(agents.length).to.equal(0);
  });

  it("maintains correct developer-agent mappings with interleaved launches", async function () {
    await registry.connect(developer).launchAgent("A1", SAMPLE_ROOT_HASH);
    await registry.connect(otherDeveloper).launchAgent("B1", SAMPLE_ROOT_HASH);
    await registry.connect(developer).launchAgent("A2", SAMPLE_ROOT_HASH);
    await registry.connect(otherDeveloper).launchAgent("B2", SAMPLE_ROOT_HASH);

    const d1Agents = await registry.getAgentsByDeveloper(developer.address);
    expect(d1Agents).to.deep.equal([1, 3]);

    const d2Agents = await registry.getAgentsByDeveloper(otherDeveloper.address);
    expect(d2Agents).to.deep.equal([2, 4]);
  });
});
