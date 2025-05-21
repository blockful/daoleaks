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

    
    // Events

    // When someone posts a message: message, voting power, timestamp
    event MessagePosted(string message, uint256 votingPowerLevel, uint256 timestamp);


    function postMessage(bytes calldata proof, string memory message, uint256 votingPowerLevel) public {
        // Get the public inputs
        bytes32[] memory publicInputs = new bytes32[](96);
        // Verify the proof
        HonkVerifier.verify(proof, publicInputs);


        // Add the message to the array
        messages.push(Message({message: message, votingPowerLevel: votingPowerLevel, timestamp: block.timestamp}));

        // Post the message
        emit MessagePosted(message, votingPowerLevel, block.timestamp);
    }

    function getMessages() public view returns (Message[] memory) {
        return messages;
    }
    

}