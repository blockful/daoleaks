pragma solidity >=0.8.21;
import {HonkVerifier} from "./DaoLeaksDepth.sol";

contract DaoLeaks {

    // State variables
    struct Message {
        string message;
        uint256 votingPowerLevel;
        uint256 timestamp;
    }
    Message[] public messages;

    HonkVerifier public verifier;

    // Constructor
    constructor(address _verifier) {
        verifier = HonkVerifier(_verifier);
    }

    // Events

    // When someone posts a message: message, voting power, timestamp
    event MessagePosted(string message, uint256 votingPowerLevel, uint256 timestamp);

    // Functions

    // When someone posts a message: proof, public inputs, message, voting power level
    function postMessage(bytes calldata proof, bytes32[] memory publicInputs, string memory message, uint256 votingPowerLevel) public {
        // Get the public inputs
        // bytes32[] memory publicInputs = new bytes32[](96);

        // Verify the proof
        verifier.verify(proof, publicInputs);

        // Add the message to the array
        messages.push(Message({message: message, votingPowerLevel: votingPowerLevel, timestamp: block.timestamp}));

        // Post the message
        emit MessagePosted(message, votingPowerLevel, block.timestamp);
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
}