const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ModelRegistry", function () {
  let ModelRegistry;
  let modelRegistry;
  let owner;
  let creator1;
  let creator2;
  let user1;
  let user2;

  const VALID_HASH = ethers.hexlify(ethers.randomBytes(32));
  const ZERO_HASH = ethers.ZeroHash;
  const VALID_NAME = "FinanceBot-7B";
  const LONG_NAME = "a".repeat(129);
  const VALID_DESC = "A financial analysis LLM model";
  const LONG_DESC = "a".repeat(2049);
  const VALID_ARCH = "Qwen2.5";
  const VALID_LICENSE = "Apache-2.0";
  const VALID_PARAMS = 7000000000;

  beforeEach(async function () {
    [owner, creator1, creator2, user1, user2] = await ethers.getSigners();
    ModelRegistry = await ethers.getContractFactory("ModelRegistry");
    modelRegistry = await ModelRegistry.deploy();
  });

  describe("Deployment", function () {
    it("Should deploy with totalModels = 0", async function () {
      const total = await modelRegistry.totalModels();
      expect(total).to.equal(0);
    });
  });

  describe("registerModel", function () {
    it("Should register first model with ID = 1", async function () {
      const tx = await modelRegistry.connect(creator1).registerModel(
        VALID_NAME,
        VALID_DESC,
        VALID_ARCH,
        VALID_PARAMS,
        VALID_LICENSE,
        VALID_HASH
      );

      await expect(tx)
        .to.emit(modelRegistry, "ModelRegistered")
        .withArgs(1, VALID_NAME, VALID_HASH, creator1.address, VALID_PARAMS, VALID_ARCH);

      const total = await modelRegistry.totalModels();
      expect(total).to.equal(1);
    });

    it("Should increment ID for each registration", async function () {
      await modelRegistry.connect(creator1).registerModel(
        "Model1", VALID_DESC, VALID_ARCH, VALID_PARAMS, VALID_LICENSE, VALID_HASH
      );
      await modelRegistry.connect(creator2).registerModel(
        "Model2", VALID_DESC, VALID_ARCH, VALID_PARAMS, VALID_LICENSE, VALID_HASH
      );
      await modelRegistry.connect(creator1).registerModel(
        "Model3", VALID_DESC, VALID_ARCH, VALID_PARAMS, VALID_LICENSE, VALID_HASH
      );

      const total = await modelRegistry.totalModels();
      expect(total).to.equal(3);
    });

    it("Should revert with InvalidStoragePointer when hash is zero", async function () {
      await expect(
        modelRegistry.connect(creator1).registerModel(
          VALID_NAME,
          VALID_DESC,
          VALID_ARCH,
          VALID_PARAMS,
          VALID_LICENSE,
          ZERO_HASH
        )
      ).to.be.revertedWithCustomError(modelRegistry, "InvalidStoragePointer");
    });

    it("Should revert with EmptyName when name is empty", async function () {
      await expect(
        modelRegistry.connect(creator1).registerModel(
          "",
          VALID_DESC,
          VALID_ARCH,
          VALID_PARAMS,
          VALID_LICENSE,
          VALID_HASH
        )
      ).to.be.revertedWithCustomError(modelRegistry, "EmptyName");
    });

    it("Should revert with NameTooLong when name exceeds 128 chars", async function () {
      await expect(
        modelRegistry.connect(creator1).registerModel(
          LONG_NAME,
          VALID_DESC,
          VALID_ARCH,
          VALID_PARAMS,
          VALID_LICENSE,
          VALID_HASH
        )
      ).to.be.revertedWithCustomError(modelRegistry, "NameTooLong");
    });

    it("Should revert with DescriptionTooLong when description exceeds 2048 chars", async function () {
      await expect(
        modelRegistry.connect(creator1).registerModel(
          VALID_NAME,
          LONG_DESC,
          VALID_ARCH,
          VALID_PARAMS,
          VALID_LICENSE,
          VALID_HASH
        )
      ).to.be.revertedWithCustomError(modelRegistry, "DescriptionTooLong");
    });

    it("Should accept maximum length name (128 chars)", async function () {
      const maxName = "a".repeat(128);
      await expect(
        modelRegistry.connect(creator1).registerModel(
          maxName,
          VALID_DESC,
          VALID_ARCH,
          VALID_PARAMS,
          VALID_LICENSE,
          VALID_HASH
        )
      ).to.not.be.reverted;
    });

    it("Should store all model metadata correctly", async function () {
      await modelRegistry.connect(creator1).registerModel(
        VALID_NAME,
        VALID_DESC,
        VALID_ARCH,
        VALID_PARAMS,
        VALID_LICENSE,
        VALID_HASH
      );

      const model = await modelRegistry.getModel(1);

      expect(model.name).to.equal(VALID_NAME);
      expect(model.description).to.equal(VALID_DESC);
      expect(model.architecture).to.equal(VALID_ARCH);
      expect(model.parameters).to.equal(VALID_PARAMS);
      expect(model.license).to.equal(VALID_LICENSE);
      expect(model.storageRootHash).to.equal(VALID_HASH);
      expect(model.creator).to.equal(creator1.address);
      expect(model.downloadCount).to.equal(0);
      expect(model.likeCount).to.equal(0);
    });
  });

  describe("getModelsByCreator", function () {
    beforeEach(async function () {
      await modelRegistry.connect(creator1).registerModel(
        "Model1", VALID_DESC, VALID_ARCH, VALID_PARAMS, VALID_LICENSE, VALID_HASH
      );
      await modelRegistry.connect(creator1).registerModel(
        "Model2", VALID_DESC, VALID_ARCH, VALID_PARAMS, VALID_LICENSE, VALID_HASH
      );
      await modelRegistry.connect(creator2).registerModel(
        "Model3", VALID_DESC, VALID_ARCH, VALID_PARAMS, VALID_LICENSE, VALID_HASH
      );
    });

    it("Should return all models for a creator", async function () {
      const models = await modelRegistry.getModelsByCreator(creator1.address);
      expect(models.length).to.equal(2);
      expect(models[0]).to.equal(1);
      expect(models[1]).to.equal(2);
    });

    it("Should return empty array for creator with no models", async function () {
      const models = await modelRegistry.getModelsByCreator(user1.address);
      expect(models.length).to.equal(0);
    });
  });

  describe("getModelsByArchitecture", function () {
    beforeEach(async function () {
      await modelRegistry.connect(creator1).registerModel(
        "QwenModel", VALID_DESC, "Qwen2.5", VALID_PARAMS, VALID_LICENSE, VALID_HASH
      );
      await modelRegistry.connect(creator1).registerModel(
        "LlamaModel", VALID_DESC, "Llama3", VALID_PARAMS, VALID_LICENSE, VALID_HASH
      );
      await modelRegistry.connect(creator2).registerModel(
        "MistralModel", VALID_DESC, "Qwen2.5", VALID_PARAMS, VALID_LICENSE, VALID_HASH
      );
    });

    it("Should return all models with matching architecture", async function () {
      const models = await modelRegistry.getModelsByArchitecture("Qwen2.5");
      expect(models.length).to.equal(2);
    });

    it("Should return empty array for non-existent architecture", async function () {
      const models = await modelRegistry.getModelsByArchitecture("NonExistent");
      expect(models.length).to.equal(0);
    });
  });

  describe("getModelsByLicense", function () {
    beforeEach(async function () {
      await modelRegistry.connect(creator1).registerModel(
        "Model1", VALID_DESC, VALID_ARCH, VALID_PARAMS, "Apache-2.0", VALID_HASH
      );
      await modelRegistry.connect(creator1).registerModel(
        "Model2", VALID_DESC, VALID_ARCH, VALID_PARAMS, "MIT", VALID_HASH
      );
      await modelRegistry.connect(creator2).registerModel(
        "Model3", VALID_DESC, VALID_ARCH, VALID_PARAMS, "Apache-2.0", VALID_HASH
      );
    });

    it("Should return all models with matching license", async function () {
      const models = await modelRegistry.getModelsByLicense("Apache-2.0");
      expect(models.length).to.equal(2);
    });
  });

  describe("recordDownload", function () {
    beforeEach(async function () {
      await modelRegistry.connect(creator1).registerModel(
        VALID_NAME, VALID_DESC, VALID_ARCH, VALID_PARAMS, VALID_LICENSE, VALID_HASH
      );
    });

    it("Should increment download count", async function () {
      await modelRegistry.connect(user1).recordDownload(1);
      const model = await modelRegistry.getModel(1);
      expect(model.downloadCount).to.equal(1);
    });

    it("Should emit ModelDownloaded event", async function () {
      await expect(modelRegistry.connect(user1).recordDownload(1))
        .to.emit(modelRegistry, "ModelDownloaded")
        .withArgs(1, user1.address);
    });

    it("Should revert for non-existent model", async function () {
      await expect(modelRegistry.connect(user1).recordDownload(999))
        .to.be.revertedWithCustomError(modelRegistry, "ModelDoesNotExist");
    });
  });

  describe("likeModel / unlikeModel", function () {
    beforeEach(async function () {
      await modelRegistry.connect(creator1).registerModel(
        VALID_NAME, VALID_DESC, VALID_ARCH, VALID_PARAMS, VALID_LICENSE, VALID_HASH
      );
    });

    it("Should increment like count on first like", async function () {
      await modelRegistry.connect(user1).likeModel(1);
      const model = await modelRegistry.getModel(1);
      expect(model.likeCount).to.equal(1);
    });

    it("Should emit ModelLiked event", async function () {
      await expect(modelRegistry.connect(user1).likeModel(1))
        .to.emit(modelRegistry, "ModelLiked")
        .withArgs(1, user1.address);
    });

    it("Should revert if already liked", async function () {
      await modelRegistry.connect(user1).likeModel(1);
      await expect(modelRegistry.connect(user1).likeModel(1))
        .to.be.revertedWithCustomError(modelRegistry, "AlreadyLiked");
    });

    it("Should decrement like count on unlike", async function () {
      await modelRegistry.connect(user1).likeModel(1);
      await modelRegistry.connect(user1).unlikeModel(1);
      const model = await modelRegistry.getModel(1);
      expect(model.likeCount).to.equal(0);
    });

    it("Should revert unlike if not liked", async function () {
      await expect(modelRegistry.connect(user1).unlikeModel(1))
        .to.be.reverted;
    });

    it("Should track individual likes", async function () {
      await modelRegistry.connect(user1).likeModel(1);
      const didLike = await modelRegistry.didLikeModel(1, user1.address);
      expect(didLike).to.be.true;
      const didNotLike = await modelRegistry.didLikeModel(1, user2.address);
      expect(didNotLike).to.be.false;
    });

    it("Should revert for non-existent model", async function () {
      await expect(modelRegistry.connect(user1).likeModel(999))
        .to.be.revertedWithCustomError(modelRegistry, "ModelDoesNotExist");
    });
  });

  describe("searchModels", function () {
    let freshRegistry;
    
    beforeEach(async function () {
      const FreshRegistry = await ethers.getContractFactory("ModelRegistry");
      freshRegistry = await FreshRegistry.deploy();
      
      await freshRegistry.connect(creator1).registerModel(
        "Qwen7B", "Qwen model", "Qwen2.5", 7000000000, "Apache-2.0", VALID_HASH
      );
      await freshRegistry.connect(creator1).registerModel(
        "Llama70B", "Llama model", "Llama3", 70000000000, "MIT", VALID_HASH
      );
      await freshRegistry.connect(creator2).registerModel(
        "Mistral8x7B", "Mistral model", "Mistral", 8000000000, "Apache-2.0", VALID_HASH
      );
    });

    it("Should return models filtered by architecture", async function () {
      const models = await freshRegistry.searchModels("", "Qwen2.5", "", 10, 0);
      expect(models.length).to.equal(1);
      expect(models[0]).to.equal(1);
    });

    it("Should return models filtered by license", async function () {
      const models = await freshRegistry.searchModels("", "", "Apache-2.0", 10, 0);
      expect(models.length).to.equal(2);
    });

    it("Should respect limit parameter", async function () {
      const models = await freshRegistry.searchModels("", "", "", 1, 0);
      expect(models.length).to.equal(1);
    });

    it("Should return empty array for no matches", async function () {
      const models = await freshRegistry.searchModels("", "NonExistent", "", 10, 0);
      expect(models.length).to.equal(0);
    });
  });

  describe("getModel edge cases", function () {
    it("Should revert for model ID 0", async function () {
      await expect(modelRegistry.getModel(0))
        .to.be.revertedWithCustomError(modelRegistry, "ModelDoesNotExist");
    });

    it("Should revert for model ID > totalModels", async function () {
      await expect(modelRegistry.getModel(999))
        .to.be.revertedWithCustomError(modelRegistry, "ModelDoesNotExist");
    });
  });
});
