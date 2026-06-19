// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

contract AgentRegistry {
    struct AgentMeta {
        bytes32 storageRootHash;
        address developer;
        uint96 launchTimestamp;
        string name;
    }

    uint256 public totalAgentsLaunched;
    mapping(uint256 => AgentMeta) public registry;
    mapping(address => uint256[]) private developerAgents;

    event AgentLaunched(
        uint256 indexed agentId,
        string name,
        bytes32 indexed rootHash,
        address indexed developer,
        uint256 launchTimestamp
    );

    error InvalidStoragePointer();
    error EmptyName();
    error NameTooLong();
    error AgentDoesNotExist();

    uint256 private constant MAX_NAME_LENGTH = 128;

    function launchAgent(string calldata _name, bytes32 _rootHash) external returns (uint256 newAgentId) {
        if (_rootHash == bytes32(0)) revert InvalidStoragePointer();
        bytes memory nameBytes = bytes(_name);
        if (nameBytes.length == 0) revert EmptyName();
        if (nameBytes.length > MAX_NAME_LENGTH) revert NameTooLong();

        unchecked {
            newAgentId = ++totalAgentsLaunched;
        }

        registry[newAgentId] = AgentMeta({
            storageRootHash: _rootHash,
            developer: msg.sender,
            launchTimestamp: uint96(block.timestamp),
            name: _name
        });

        developerAgents[msg.sender].push(newAgentId);
        emit AgentLaunched(newAgentId, _name, _rootHash, msg.sender, block.timestamp);
    }

    function getAgent(uint256 agentId) external view returns (string memory name, bytes32 storageRootHash, address developer, uint256 launchTimestamp) {
        if (agentId == 0 || agentId > totalAgentsLaunched) revert AgentDoesNotExist();
        AgentMeta storage meta = registry[agentId];
        return (meta.name, meta.storageRootHash, meta.developer, meta.launchTimestamp);
    }

    function getAgentsByDeveloper(address developer) external view returns (uint256[] memory) {
        return developerAgents[developer];
    }
}
