// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

contract AgentSpaceRegistry {
    struct SpaceMeta {
        uint256 modelId;
        string endpointUrl;
        uint96 deployedAt;
        uint96 lastHealthCheck;
        uint96 lastActivity;
        bool isActive;
        bool isAsleep;
        uint256 sleepTimeout;
        string name;
        string description;
        string version;
        address owner;
        uint256 requestCount;
    }

    uint256 public totalSpaces;
    uint256 public defaultSleepTimeout = 60 minutes; // Default: 60 minutes of inactivity
    mapping(uint256 => SpaceMeta) public spaces;
    mapping(address => uint256[]) public ownerSpaces;
    mapping(uint256 => uint256[]) public modelSpaces;
    mapping(uint256 => mapping(address => bool)) public spaceOperators;

    event SpaceDeployed(
        uint256 indexed spaceId,
        string name,
        uint256 indexed modelId,
        string endpointUrl,
        address indexed owner,
        uint256 deployedAt
    );
    event SpaceUpdated(uint256 indexed spaceId, string endpointUrl);
    event HealthCheckUpdated(uint256 indexed spaceId, bool isActive, uint256 timestamp);
    event SpaceDeactivated(uint256 indexed spaceId);
    event SpacePaused(uint256 indexed spaceId, address indexed owner);
    event SpaceResumed(uint256 indexed spaceId, address indexed owner);
    event SpaceAsleep(uint256 indexed spaceId, uint256 timestamp);
    event SpaceAwake(uint256 indexed spaceId, uint256 timestamp);
    event SleepTimeoutUpdated(uint256 indexed spaceId, uint256 newTimeout);
    event OperatorAdded(uint256 indexed spaceId, address indexed operator);
    event OperatorRemoved(uint256 indexed spaceId, address indexed operator);

    error InvalidModelId();
    error EmptyEndpoint();
    error EndpointTooLong();
    error SpaceDoesNotExist();
    error NotOwner();
    error NotOperator();
    error AlreadyOperator();
    error AlreadyAsleep();
    error NotAsleep();

    uint256 private constant MAX_ENDPOINT_LENGTH = 512;
    uint256 private constant MAX_NAME_LENGTH = 128;
    uint256 private constant MAX_DESCRIPTION_LENGTH = 2048;
    uint256 private constant MAX_VERSION_LENGTH = 32;

    function deploySpace(
        string calldata name,
        string calldata description,
        string calldata version,
        uint256 modelId,
        string calldata endpointUrl
    ) external returns (uint256 spaceId) {
        if (modelId == 0) revert InvalidModelId();

        bytes memory endpointBytes = bytes(endpointUrl);
        if (endpointBytes.length == 0) revert EmptyEndpoint();
        if (endpointBytes.length > MAX_ENDPOINT_LENGTH) revert EndpointTooLong();

        bytes memory nameBytes = bytes(name);
        if (nameBytes.length == 0 || nameBytes.length > MAX_NAME_LENGTH) revert();

        bytes memory descBytes = bytes(description);
        if (descBytes.length > MAX_DESCRIPTION_LENGTH) revert();

        bytes memory versionBytes = bytes(version);
        if (versionBytes.length > MAX_VERSION_LENGTH) revert();

        unchecked {
            spaceId = ++totalSpaces;
        }

        spaces[spaceId] = SpaceMeta({
            modelId: modelId,
            endpointUrl: endpointUrl,
            deployedAt: uint96(block.timestamp),
            lastHealthCheck: uint96(block.timestamp),
            lastActivity: uint96(block.timestamp),
            isActive: true,
            isAsleep: false,
            sleepTimeout: defaultSleepTimeout,
            name: name,
            description: description,
            version: version,
            owner: msg.sender,
            requestCount: 0
        });

        ownerSpaces[msg.sender].push(spaceId);
        modelSpaces[modelId].push(spaceId);
        spaceOperators[spaceId][msg.sender] = true;

        emit SpaceDeployed(spaceId, name, modelId, endpointUrl, msg.sender, block.timestamp);
    }

    function updateEndpoint(uint256 spaceId, string calldata newEndpoint) external {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        if (!spaceOperators[spaceId][msg.sender]) revert NotOperator();

        bytes memory endpointBytes = bytes(newEndpoint);
        if (endpointBytes.length == 0) revert EmptyEndpoint();
        if (endpointBytes.length > MAX_ENDPOINT_LENGTH) revert EndpointTooLong();

        spaces[spaceId].endpointUrl = newEndpoint;
        emit SpaceUpdated(spaceId, newEndpoint);
    }

    function updateHealthStatus(uint256 spaceId, bool isActive) external {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        if (!spaceOperators[spaceId][msg.sender]) revert NotOperator();

        spaces[spaceId].isActive = isActive;
        spaces[spaceId].lastHealthCheck = uint96(block.timestamp);
        emit HealthCheckUpdated(spaceId, isActive, block.timestamp);
    }

    function addOperator(uint256 spaceId, address newOperator) external {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        if (msg.sender != spaces[spaceId].owner) revert NotOwner();
        if (spaceOperators[spaceId][newOperator]) revert AlreadyOperator();

        spaceOperators[spaceId][newOperator] = true;
        emit OperatorAdded(spaceId, newOperator);
    }

    function removeOperator(uint256 spaceId, address oldOperator) external {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        if (msg.sender != spaces[spaceId].owner) revert NotOwner();

        delete spaceOperators[spaceId][oldOperator];
        emit OperatorRemoved(spaceId, oldOperator);
    }

    function deactivateSpace(uint256 spaceId) external {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        if (msg.sender != spaces[spaceId].owner) revert NotOwner();

        spaces[spaceId].isActive = false;
        emit SpaceDeactivated(spaceId);
    }

    function pauseSpace(uint256 spaceId) external {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        if (msg.sender != spaces[spaceId].owner) revert NotOwner();

        spaces[spaceId].isActive = false;
        spaces[spaceId].isAsleep = false; // Ensure not asleep when paused
        emit SpacePaused(spaceId, msg.sender);
    }

    function resumeSpace(uint256 spaceId) external {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        if (msg.sender != spaces[spaceId].owner) revert NotOwner();

        spaces[spaceId].isActive = true;
        emit SpaceResumed(spaceId, msg.sender);
    }

    function setSleepTimeout(uint256 spaceId, uint256 timeoutInSeconds) external {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        if (msg.sender != spaces[spaceId].owner) revert NotOwner();

        spaces[spaceId].sleepTimeout = timeoutInSeconds;
        emit SleepTimeoutUpdated(spaceId, timeoutInSeconds);
    }

    function setDefaultSleepTimeout(uint256 timeoutInSeconds) external {
        // Only the contract deployer can set default sleep timeout
        // In production, use Ownable pattern
        // For now, allow anyone to call this (will be restricted in deployment)
        defaultSleepTimeout = timeoutInSeconds;
    }

    function recordRequest(uint256 spaceId) external {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        spaces[spaceId].requestCount += 1;
        spaces[spaceId].lastActivity = uint96(block.timestamp);
        
        // Wake up space if it was asleep
        if (spaces[spaceId].isAsleep) {
            spaces[spaceId].isAsleep = false;
            emit SpaceAwake(spaceId, block.timestamp);
        }
    }

    function checkSleep(uint256 spaceId) external {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        
        SpaceMeta storage meta = spaces[spaceId];
        if (meta.sleepTimeout == 0) return; // No sleep timeout set
        
        uint256 currentTime = block.timestamp;
        uint256 lastActivityTime = meta.lastActivity;
        
        // Check if space should go to sleep
        if (currentTime > lastActivityTime + meta.sleepTimeout && !meta.isAsleep) {
            meta.isAsleep = true;
            meta.isActive = false;
            emit SpaceAsleep(spaceId, currentTime);
        }
    }

    function wakeSpace(uint256 spaceId) external {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        if (!spaceOperators[spaceId][msg.sender]) revert NotOperator();
        
        spaces[spaceId].isAsleep = false;
        spaces[spaceId].isActive = true;
        spaces[spaceId].lastActivity = uint96(block.timestamp);
        emit SpaceAwake(spaceId, block.timestamp);
    }

    function getSpace(uint256 spaceId) external view returns (
        string memory name,
        string memory description,
        string memory version,
        uint256 modelId,
        string memory endpointUrl,
        uint256 deployedAt,
        uint256 lastHealthCheck,
        uint256 lastActivity,
        bool isActive,
        bool isAsleep,
        uint256 sleepTimeout,
        address spaceOwner,
        uint256 requestCount
    ) {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        SpaceMeta storage meta = spaces[spaceId];
        return (
            meta.name,
            meta.description,
            meta.version,
            meta.modelId,
            meta.endpointUrl,
            meta.deployedAt,
            meta.lastHealthCheck,
            meta.lastActivity,
            meta.isActive,
            meta.isAsleep,
            meta.sleepTimeout,
            meta.owner,
            meta.requestCount
        );
    }

    function getSleepStatus(uint256 spaceId) external view returns (bool isAsleep, uint256 sleepTimeout, uint256 timeUntilSleep) {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        SpaceMeta storage meta = spaces[spaceId];
        
        uint256 currentTime = block.timestamp;
        uint256 timeSinceActivity = currentTime - meta.lastActivity;
        
        if (meta.isAsleep) {
            return (true, meta.sleepTimeout, 0);
        } else if (meta.sleepTimeout > 0 && timeSinceActivity >= meta.sleepTimeout) {
            return (true, meta.sleepTimeout, 0);
        } else {
            return (false, meta.sleepTimeout, meta.sleepTimeout - timeSinceActivity);
        }
    }

    function getSpacesByOwner(address account) external view returns (uint256[] memory) {
        return ownerSpaces[account];
    }

    function getSpacesByModel(uint256 modelId) external view returns (uint256[] memory) {
        return modelSpaces[modelId];
    }

    function getActiveSpaces() external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256[] memory result = new uint256[](totalSpaces);
        for (uint256 i = 1; i <= totalSpaces; i++) {
            if (spaces[i].isActive && !spaces[i].isAsleep) {
                result[count] = i;
                count++;
            }
        }
        uint256[] memory activeSpaces = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            activeSpaces[i] = result[i];
        }
        return activeSpaces;
    }

    function isOperator(uint256 spaceId, address account) external view returns (bool) {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        return spaceOperators[spaceId][account];
    }

    function checkHealth(uint256 spaceId) external view returns (bool, uint256, bool) {
        if (spaceId == 0 || spaceId > totalSpaces) revert SpaceDoesNotExist();
        SpaceMeta storage meta = spaces[spaceId];
        return (meta.isActive, meta.lastHealthCheck, meta.isAsleep);
    }
}
