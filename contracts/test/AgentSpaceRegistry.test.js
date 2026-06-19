const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("AgentSpaceRegistry", function () {
  let registry;
  let deployer;
  let owner;
  let operator;
  let otherUser;

  const SAMPLE_ENDPOINT = "https://agent.example.com";
  const SAMPLE_NAME = "My Agent Space";
  const SAMPLE_DESCRIPTION = "A live AI agent";
  const SAMPLE_VERSION = "1.0.0";
  const INVALID_ENDPOINT = "";

  beforeEach(async function () {
    [deployer, owner, operator, otherUser] = await ethers.getSigners();
    const AgentSpaceRegistry = await ethers.getContractFactory("AgentSpaceRegistry");
    registry = await AgentSpaceRegistry.deploy();
  });

  describe("deploySpace", function () {
    it("should deploy a space with valid parameters", async function () {
      const tx = await registry.connect(owner).deploySpace(
        SAMPLE_NAME,
        SAMPLE_DESCRIPTION,
        SAMPLE_VERSION,
        1, // modelId
        SAMPLE_ENDPOINT
      );

      await expect(tx)
        .to.emit(registry, "SpaceDeployed")
        .withArgs(1, SAMPLE_NAME, 1, SAMPLE_ENDPOINT, owner.address, anyValue);

      const total = await registry.totalSpaces();
      expect(total).to.equal(1);
    });

    it("should assign sequential IDs starting at 1", async function () {
      await registry.connect(owner).deploySpace(
        "Space 1", "", "1.0.0", 1, SAMPLE_ENDPOINT
      );
      await registry.connect(owner).deploySpace(
        "Space 2", "", "1.0.0", 2, SAMPLE_ENDPOINT
      );

      const total = await registry.totalSpaces();
      expect(total).to.equal(2);
    });

    it("should revert with InvalidModelId when modelId is 0", async function () {
      await expect(
        registry.connect(owner).deploySpace(
          SAMPLE_NAME,
          SAMPLE_DESCRIPTION,
          SAMPLE_VERSION,
          0, // invalid modelId
          SAMPLE_ENDPOINT
        )
      ).to.be.revertedWithCustomError(registry, "InvalidModelId");
    });

    it("should revert with EmptyEndpoint when endpoint is empty", async function () {
      await expect(
        registry.connect(owner).deploySpace(
          SAMPLE_NAME,
          SAMPLE_DESCRIPTION,
          SAMPLE_VERSION,
          1,
          INVALID_ENDPOINT
        )
      ).to.be.revertedWithCustomError(registry, "EmptyEndpoint");
    });

    it("should revert with EndpointTooLong when endpoint exceeds max length", async function () {
      const longEndpoint = "a".repeat(513); // MAX_ENDPOINT_LENGTH = 512
      await expect(
        registry.connect(owner).deploySpace(
          SAMPLE_NAME,
          SAMPLE_DESCRIPTION,
          SAMPLE_VERSION,
          1,
          longEndpoint
        )
      ).to.be.revertedWithCustomError(registry, "EndpointTooLong");
    });

    it("should store all space metadata correctly", async function () {
      await registry.connect(owner).deploySpace(
        SAMPLE_NAME,
        SAMPLE_DESCRIPTION,
        SAMPLE_VERSION,
        42,
        SAMPLE_ENDPOINT
      );

      const space = await registry.getSpace(1);
      expect(space.name).to.equal(SAMPLE_NAME);
      expect(space.description).to.equal(SAMPLE_DESCRIPTION);
      expect(space.version).to.equal(SAMPLE_VERSION);
      expect(space.modelId).to.equal(42);
      expect(space.endpointUrl).to.equal(SAMPLE_ENDPOINT);
      expect(space.owner).to.equal(owner.address);
      expect(space.isActive).to.equal(true);
      expect(space.requestCount).to.equal(0);
    });

    it("should track owner spaces", async function () {
      await registry.connect(owner).deploySpace(
        "Owner Space 1", "", "1.0.0", 1, SAMPLE_ENDPOINT
      );
      await registry.connect(owner).deploySpace(
        "Owner Space 2", "", "1.0.0", 2, SAMPLE_ENDPOINT
      );
      await registry.connect(otherUser).deploySpace(
        "Other Space", "", "1.0.0", 3, SAMPLE_ENDPOINT
      );

      const ownerSpaces = await registry.getSpacesByOwner(owner.address);
      expect(ownerSpaces.map(n => Number(n))).to.deep.equal([1, 2]);
    });

    it("should track model spaces", async function () {
      await registry.connect(owner).deploySpace(
        "Space 1", "", "1.0.0", 100, SAMPLE_ENDPOINT
      );
      await registry.connect(owner).deploySpace(
        "Space 2", "", "1.0.0", 100, SAMPLE_ENDPOINT
      );
      await registry.connect(owner).deploySpace(
        "Space 3", "", "1.0.0", 200, SAMPLE_ENDPOINT
      );

      const model100Spaces = await registry.getSpacesByModel(100);
      expect(model100Spaces.map(n => Number(n))).to.deep.equal([1, 2]);

      const model200Spaces = await registry.getSpacesByModel(200);
      expect(model200Spaces.map(n => Number(n))).to.deep.equal([3]);
    });

    it("should set owner as operator on deploy", async function () {
      await registry.connect(owner).deploySpace(
        SAMPLE_NAME, SAMPLE_DESCRIPTION, SAMPLE_VERSION, 1, SAMPLE_ENDPOINT
      );

      const isOp = await registry.isOperator(1, owner.address);
      expect(isOp).to.equal(true);
    });
  });

  describe("getSpace", function () {
    it("should revert for non-existent space ID", async function () {
      await expect(registry.getSpace(999))
        .to.be.revertedWithCustomError(registry, "SpaceDoesNotExist");
      await expect(registry.getSpace(0))
        .to.be.revertedWithCustomError(registry, "SpaceDoesNotExist");
    });

    it("should return complete space data", async function () {
      const deployTime = Math.floor(Date.now() / 1000);
      await registry.connect(owner).deploySpace(
        SAMPLE_NAME, SAMPLE_DESCRIPTION, SAMPLE_VERSION, 1, SAMPLE_ENDPOINT
      );

      const space = await registry.getSpace(1);
      expect(space.name).to.equal(SAMPLE_NAME);
      expect(space.description).to.equal(SAMPLE_DESCRIPTION);
      expect(space.version).to.equal(SAMPLE_VERSION);
      expect(space.modelId).to.equal(1);
      expect(space.endpointUrl).to.equal(SAMPLE_ENDPOINT);
      expect(space.owner).to.equal(owner.address);
      expect(space.isActive).to.equal(true);
      expect(space.requestCount).to.equal(0);
    });
  });

  describe("updateEndpoint", function () {
    beforeEach(async function () {
      await registry.connect(owner).deploySpace(
        SAMPLE_NAME, SAMPLE_DESCRIPTION, SAMPLE_VERSION, 1, SAMPLE_ENDPOINT
      );
    });

    it("should update endpoint URL", async function () {
      const newEndpoint = "https://new-endpoint.example.com";
      await registry.connect(owner).updateEndpoint(1, newEndpoint);

      const space = await registry.getSpace(1);
      expect(space.endpointUrl).to.equal(newEndpoint);
    });

    it("should emit SpaceUpdated event", async function () {
      const newEndpoint = "https://new-endpoint.example.com";
      await expect(registry.connect(owner).updateEndpoint(1, newEndpoint))
        .to.emit(registry, "SpaceUpdated")
        .withArgs(1, newEndpoint);
    });

    it("should revert with SpaceDoesNotExist for invalid space ID", async function () {
      await expect(
        registry.connect(owner).updateEndpoint(999, "https://test.com")
      ).to.be.revertedWithCustomError(registry, "SpaceDoesNotExist");
    });

    it("should revert with NotOperator for non-operator", async function () {
      await expect(
        registry.connect(otherUser).updateEndpoint(1, "https://test.com")
      ).to.be.revertedWithCustomError(registry, "NotOperator");
    });

    it("should revert with EmptyEndpoint for empty endpoint", async function () {
      await expect(
        registry.connect(owner).updateEndpoint(1, "")
      ).to.be.revertedWithCustomError(registry, "EmptyEndpoint");
    });
  });

  describe("updateHealthStatus", function () {
    beforeEach(async function () {
      await registry.connect(owner).deploySpace(
        SAMPLE_NAME, SAMPLE_DESCRIPTION, SAMPLE_VERSION, 1, SAMPLE_ENDPOINT
      );
    });

    it("should update health status", async function () {
      await registry.connect(owner).updateHealthStatus(1, false);

      const space = await registry.getSpace(1);
      expect(space.isActive).to.equal(false);

      await registry.connect(owner).updateHealthStatus(1, true);
      const updatedSpace = await registry.getSpace(1);
      expect(updatedSpace.isActive).to.equal(true);
    });

    it("should emit HealthCheckUpdated event", async function () {
      await expect(registry.connect(owner).updateHealthStatus(1, false))
        .to.emit(registry, "HealthCheckUpdated")
        .withArgs(1, false, anyValue);
    });

    it("should revert with SpaceDoesNotExist for invalid space ID", async function () {
      await expect(
        registry.connect(owner).updateHealthStatus(999, true)
      ).to.be.revertedWithCustomError(registry, "SpaceDoesNotExist");
    });

    it("should revert with NotOperator for non-operator", async function () {
      await expect(
        registry.connect(otherUser).updateHealthStatus(1, false)
      ).to.be.revertedWithCustomError(registry, "NotOperator");
    });
  });

  describe("addOperator / removeOperator", function () {
    beforeEach(async function () {
      await registry.connect(owner).deploySpace(
        SAMPLE_NAME, SAMPLE_DESCRIPTION, SAMPLE_VERSION, 1, SAMPLE_ENDPOINT
      );
    });

    it("should allow owner to add operator", async function () {
      await registry.connect(owner).addOperator(1, operator.address);

      const isOp = await registry.isOperator(1, operator.address);
      expect(isOp).to.equal(true);
    });

    it("should emit OperatorAdded event", async function () {
      await expect(registry.connect(owner).addOperator(1, operator.address))
        .to.emit(registry, "OperatorAdded")
        .withArgs(1, operator.address);
    });

    it("should allow owner to remove operator", async function () {
      await registry.connect(owner).addOperator(1, operator.address);
      await registry.connect(owner).removeOperator(1, operator.address);

      const isOp = await registry.isOperator(1, operator.address);
      expect(isOp).to.equal(false);
    });

    it("should emit OperatorRemoved event", async function () {
      await registry.connect(owner).addOperator(1, operator.address);
      await expect(registry.connect(owner).removeOperator(1, operator.address))
        .to.emit(registry, "OperatorRemoved")
        .withArgs(1, operator.address);
    });

    it("should revert with SpaceDoesNotExist for invalid space ID", async function () {
      await expect(
        registry.connect(owner).addOperator(999, operator.address)
      ).to.be.revertedWithCustomError(registry, "SpaceDoesNotExist");
    });

    it("should revert with NotOwner for non-owner", async function () {
      await expect(
        registry.connect(operator).addOperator(1, otherUser.address)
      ).to.be.revertedWithCustomError(registry, "NotOwner");
    });

    it("should revert with AlreadyOperator when adding existing operator", async function () {
      await registry.connect(owner).addOperator(1, operator.address);
      await expect(
        registry.connect(owner).addOperator(1, operator.address)
      ).to.be.revertedWithCustomError(registry, "AlreadyOperator");
    });

    it("should allow operator to update endpoint", async function () {
      await registry.connect(owner).addOperator(1, operator.address);
      const newEndpoint = "https://operator-updated.example.com";
      await registry.connect(operator).updateEndpoint(1, newEndpoint);

      const space = await registry.getSpace(1);
      expect(space.endpointUrl).to.equal(newEndpoint);
    });

    it("should allow operator to update health status", async function () {
      await registry.connect(owner).addOperator(1, operator.address);
      await registry.connect(operator).updateHealthStatus(1, false);

      const space = await registry.getSpace(1);
      expect(space.isActive).to.equal(false);
    });
  });

  describe("deactivateSpace", function () {
    beforeEach(async function () {
      await registry.connect(owner).deploySpace(
        SAMPLE_NAME, SAMPLE_DESCRIPTION, SAMPLE_VERSION, 1, SAMPLE_ENDPOINT
      );
    });

    it("should deactivate space", async function () {
      await registry.connect(owner).deactivateSpace(1);

      const space = await registry.getSpace(1);
      expect(space.isActive).to.equal(false);
    });

    it("should emit SpaceDeactivated event", async function () {
      await expect(registry.connect(owner).deactivateSpace(1))
        .to.emit(registry, "SpaceDeactivated")
        .withArgs(1);
    });

    it("should revert with SpaceDoesNotExist for invalid space ID", async function () {
      await expect(
        registry.connect(owner).deactivateSpace(999)
      ).to.be.revertedWithCustomError(registry, "SpaceDoesNotExist");
    });

    it("should revert with NotOwner for non-owner", async function () {
      await expect(
        registry.connect(otherUser).deactivateSpace(1)
      ).to.be.revertedWithCustomError(registry, "NotOwner");
    });
  });

  describe("recordRequest", function () {
    beforeEach(async function () {
      await registry.connect(owner).deploySpace(
        SAMPLE_NAME, SAMPLE_DESCRIPTION, SAMPLE_VERSION, 1, SAMPLE_ENDPOINT
      );
    });

    it("should increment request count", async function () {
      await registry.recordRequest(1);
      await registry.recordRequest(1);
      await registry.recordRequest(1);

      const space = await registry.getSpace(1);
      expect(space.requestCount).to.equal(3);
    });

    it("should revert with SpaceDoesNotExist for invalid space ID", async function () {
      await expect(
        registry.recordRequest(999)
      ).to.be.revertedWithCustomError(registry, "SpaceDoesNotExist");
    });
  });

  describe("getActiveSpaces", function () {
    beforeEach(async function () {
      await registry.connect(owner).deploySpace(
        "Active 1", "", "1.0.0", 1, SAMPLE_ENDPOINT
      );
      await registry.connect(owner).deploySpace(
        "Inactive 1", "", "1.0.0", 2, SAMPLE_ENDPOINT
      );
      await registry.connect(owner).deploySpace(
        "Active 2", "", "1.0.0", 3, SAMPLE_ENDPOINT
      );

      // Deactivate space 2
      await registry.connect(owner).deactivateSpace(2);
    });

    it("should return only active spaces", async function () {
      const active = await registry.getActiveSpaces();
      expect(active.map(n => Number(n))).to.deep.equal([1, 3]);
    });

    it("should return empty array when no active spaces", async function () {
      await registry.connect(owner).deactivateSpace(1);
      await registry.connect(owner).deactivateSpace(3);

      const active = await registry.getActiveSpaces();
      expect(active.length).to.equal(0);
    });
  });

  describe("checkHealth", function () {
    beforeEach(async function () {
      await registry.connect(owner).deploySpace(
        SAMPLE_NAME, SAMPLE_DESCRIPTION, SAMPLE_VERSION, 1, SAMPLE_ENDPOINT
      );
    });

    it("should return health status", async function () {
      const health = await registry.checkHealth(1);
      expect(health[0]).to.equal(true); // isActive
      expect(health[1]).to.be.gt(0); // timestamp > 0
    });

    it("should revert with SpaceDoesNotExist for invalid space ID", async function () {
      await expect(registry.checkHealth(999))
        .to.be.revertedWithCustomError(registry, "SpaceDoesNotExist");
    });
  });
});
