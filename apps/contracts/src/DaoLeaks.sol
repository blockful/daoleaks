// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import {HonkVerifier} from "./verifiers/DaoLeaksDepth1.sol";

import {console} from "forge-std/console.sol";

contract DaoLeaks {
    // State variables
    struct Message {
        string message;
        uint224 votingPowerLevel;
        uint256 timestamp;
    }

    Message[] public messages;

    HonkVerifier[] public verifiers;

    mapping(uint8 => uint224) public votingPowerLevels;

    bytes32 public storageRoot;

    // Constructor
    constructor(address[] memory _verifiers, bytes32 _storageRoot) {
        for (uint256 i = 0; i < _verifiers.length; i++) {
            verifiers.push(HonkVerifier(_verifiers[i]));
        }

        storageRoot = _storageRoot;
        votingPowerLevels[0] = 1_000 * 10 ** 18;
        votingPowerLevels[1] = 10_000 * 10 ** 18;
        votingPowerLevels[2] = 50_000 * 10 ** 18;
    }

    // Events

    // When someone posts a message: message, voting power, timestamp
    event MessagePosted(string message, uint224 votingPowerLevel, uint256 timestamp);

    // Functions

    // Helper function to generate public inputs
    function generatePublicInputs(string memory message, uint224 votingPowerLevel)
        public
        view
        returns (bytes32[] memory)
    {
        bytes32[] memory publicInputs = new bytes32[](96);

        // Get the message hash
        bytes32 messageHash = hashMessage(message);

        // Convert votingPowerLevel to bytes32
        bytes32 powerBytes = bytes32(abi.encodePacked(votingPowerLevel, uint32(0)));

        // Combine all 3 inputs (each 32 bytes) and split them into 96 inputs (each representing 1 byte)
        bytes memory combined = abi.encodePacked(storageRoot, messageHash, powerBytes);

        // Fill the first 96 inputs (1 byte per input)
        for (uint256 i = 0; i < 96; i++) {
            if (i < combined.length) {
                // Take 1 byte and pad it to a full bytes32
                publicInputs[i] = bytes32(uint256(uint8(combined[i])));
            } else {
                // Pad with zeros if we've run out of data (unlikely but safe)
                publicInputs[i] = bytes32(0);
            }
        }

        return publicInputs;
    }

    // When someone posts a message: proof, message, voting power level
    function postMessage(bytes calldata proof, string memory message, uint8 votingPowerLevel, uint256 storageProofDepth)
        public
    {
        // Generate public inputs from message and voting power
        bytes32[] memory publicInputs = generatePublicInputs(message, votingPowerLevels[votingPowerLevel]);

        // Verify the proof
        verifiers[storageProofDepth - 1].verify(proof, publicInputs);

        // Add the message to the array
        messages.push(
            Message({
                message: message,
                votingPowerLevel: votingPowerLevels[votingPowerLevel],
                timestamp: block.timestamp
            })
        );

        // Post the message
        emit MessagePosted(message, votingPowerLevels[votingPowerLevel], block.timestamp);
    }

    // Get all messages paginated
    function getMessages(uint256 page, uint256 pageSize) public view returns (Message[] memory) {
        // Get the start and end index
        uint256 startIndex = page * pageSize;
        uint256 endIndex = startIndex + pageSize;

        // Make sure endIndex doesn't exceed array length
        if (endIndex > messages.length) {
            endIndex = messages.length;
        }

        // Calculate actual size of the return array
        uint256 resultSize = endIndex - startIndex;

        // Create a new array in memory with the correct size
        Message[] memory result = new Message[](resultSize);

        // Copy elements to the new array
        for (uint256 i = 0; i < resultSize; i++) {
            result[i] = messages[startIndex + i];
        }

        return result;
    }

    // Get the total number of messages
    function getTotalMessages() public view returns (uint256) {
        return messages.length;
    }

    // Get the total number of pages
    function getTotalPages(uint256 pageSize) public view returns (uint256) {
        return messages.length / pageSize;
    }

    // Hash message
    function hashMessage(string memory message) public pure returns (bytes32) {
        // return keccak256(abi.encodePacked(message));
        // bytes memory data = hex"02f8cf018203ed841dcd6500844070862b830713eb940000000000572fa1d5fc39988ed0785af08b0d9980b8a47e5c4c080000000000000000000000000000000000000000000000000000000000000040069064e4d68b5b51667b8ff5604ba5eed9260574f85c6ed1c8b2b022ab305488000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000003635c9adc5dea0000000000000000000000000000000000000000000000000010f0cf064dd59200000c0";

        return keccak256(abi.encodePacked(message));
    }

    function getVotingPowerLevel(uint8 level) public view returns (uint224) {
        return votingPowerLevels[level];
    }
}
