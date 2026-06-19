// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

contract ModelRegistry {
    struct ModelMeta {
        bytes32 storageRootHash;
        address creator;
        uint96 createdAt;
        string name;
        string description;
        string architecture;
        uint256 parameters;
        string license;
        uint256 downloadCount;
        uint256 likeCount;
    }

    uint256 public totalModels;
    mapping(uint256 => ModelMeta) public models;
    mapping(address => uint256[]) public creatorModels;
    mapping(string => uint256[]) public architectureModels;
    mapping(string => uint256[]) public licenseModels;
    mapping(uint256 => mapping(address => bool)) public modelLikes;

    event ModelRegistered(
        uint256 indexed modelId,
        string name,
        bytes32 indexed storageRootHash,
        address indexed creator,
        uint256 parameters,
        string architecture
    );

    event ModelDownloaded(uint256 indexed modelId, address indexed downloader);
    event ModelLiked(uint256 indexed modelId, address indexed liker);

    error InvalidStoragePointer();
    error EmptyName();
    error NameTooLong();
    error DescriptionTooLong();
    error ModelDoesNotExist();
    error AlreadyLiked();

    uint256 private constant MAX_NAME_LENGTH = 128;
    uint256 private constant MAX_DESCRIPTION_LENGTH = 2048;
    uint256 private constant MAX_ARCHITECTURE_LENGTH = 64;
    uint256 private constant MAX_LICENSE_LENGTH = 64;

    function registerModel(
        string calldata name,
        string calldata description,
        string calldata architecture,
        uint256 parameters,
        string calldata license,
        bytes32 storageRootHash
    ) external returns (uint256 modelId) {
        if (storageRootHash == bytes32(0)) revert InvalidStoragePointer();
        
        bytes memory nameBytes = bytes(name);
        if (nameBytes.length == 0) revert EmptyName();
        if (nameBytes.length > MAX_NAME_LENGTH) revert NameTooLong();
        
        bytes memory descBytes = bytes(description);
        if (descBytes.length > MAX_DESCRIPTION_LENGTH) revert DescriptionTooLong();
        
        bytes memory archBytes = bytes(architecture);
        if (archBytes.length > MAX_ARCHITECTURE_LENGTH) revert();
        
        bytes memory licenseBytes = bytes(license);
        if (licenseBytes.length > MAX_LICENSE_LENGTH) revert();

        unchecked {
            modelId = ++totalModels;
        }

        models[modelId] = ModelMeta({
            storageRootHash: storageRootHash,
            creator: msg.sender,
            createdAt: uint96(block.timestamp),
            name: name,
            description: description,
            architecture: architecture,
            parameters: parameters,
            license: license,
            downloadCount: 0,
            likeCount: 0
        });

        creatorModels[msg.sender].push(modelId);
        architectureModels[architecture].push(modelId);
        licenseModels[license].push(modelId);

        emit ModelRegistered(modelId, name, storageRootHash, msg.sender, parameters, architecture);
    }

    function getModel(uint256 modelId) external view returns (
        string memory name,
        string memory description,
        string memory architecture,
        uint256 parameters,
        string memory license,
        bytes32 storageRootHash,
        address creator,
        uint256 createdAt,
        uint256 downloadCount,
        uint256 likeCount
    ) {
        if (modelId == 0 || modelId > totalModels) revert ModelDoesNotExist();
        ModelMeta storage meta = models[modelId];
        return (
            meta.name,
            meta.description,
            meta.architecture,
            meta.parameters,
            meta.license,
            meta.storageRootHash,
            meta.creator,
            meta.createdAt,
            meta.downloadCount,
            meta.likeCount
        );
    }

    function getModelsByCreator(address creator) external view returns (uint256[] memory) {
        return creatorModels[creator];
    }

    function getModelsByArchitecture(string calldata architecture) external view returns (uint256[] memory) {
        return architectureModels[architecture];
    }

    function getModelsByLicense(string calldata license) external view returns (uint256[] memory) {
        return licenseModels[license];
    }

    function recordDownload(uint256 modelId) external {
        if (modelId == 0 || modelId > totalModels) revert ModelDoesNotExist();
        models[modelId].downloadCount += 1;
        emit ModelDownloaded(modelId, msg.sender);
    }

    function likeModel(uint256 modelId) external {
        if (modelId == 0 || modelId > totalModels) revert ModelDoesNotExist();
        if (modelLikes[modelId][msg.sender]) revert AlreadyLiked();
        
        modelLikes[modelId][msg.sender] = true;
        models[modelId].likeCount += 1;
        emit ModelLiked(modelId, msg.sender);
    }

    function unlikeModel(uint256 modelId) external {
        if (modelId == 0 || modelId > totalModels) revert ModelDoesNotExist();
        if (!modelLikes[modelId][msg.sender]) revert();
        
        delete modelLikes[modelId][msg.sender];
        models[modelId].likeCount -= 1;
    }

    function didLikeModel(uint256 modelId, address user) external view returns (bool) {
        if (modelId == 0 || modelId > totalModels) revert ModelDoesNotExist();
        return modelLikes[modelId][user];
    }

    function searchModels(
        string calldata query,
        string calldata architectureFilter,
        string calldata licenseFilter,
        uint256 limit,
        uint256 offset
    ) external view returns (uint256[] memory) {
        uint256[] memory tempResults = new uint256[](totalModels);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= totalModels && count < limit; i++) {
            if (bytes(architectureFilter).length > 0 && keccak256(bytes(models[i].architecture)) != keccak256(bytes(architectureFilter))) {
                continue;
            }
            if (bytes(licenseFilter).length > 0 && keccak256(bytes(models[i].license)) != keccak256(bytes(licenseFilter))) {
                continue;
            }
            tempResults[count] = i;
            count++;
        }
        
        uint256[] memory results = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            results[i] = tempResults[i];
        }
        
        return results;
    }
}
