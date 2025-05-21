// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.21;

import "./TestSetup.sol";

contract DaoLeaksTest is TestSetup {
    // Test events
    event MessagePosted(string message, uint256 votingPowerLevel, uint256 timestamp);

    function setUp() public override {
        super.setUp();
    }

    function testPostMessage() public {
        bytes memory proof = getValidProof();
        bytes32[] memory publicInputs = getPublicInputs();
        string memory message = "Test message";
        uint256 votingPowerLevel = 100;

        // Expect the MessagePosted event to be emitted
        vm.expectEmit(true, true, true, true);
        emit MessagePosted(message, votingPowerLevel, block.timestamp);

        // Post the message
        daoLeaks.postMessage(proof, publicInputs, message, votingPowerLevel);

        // Get all messages and verify the first one
        DaoLeaks.Message[] memory messages = daoLeaks.getMessages(0, 1);
        assertEq(messages[0].message, message, "Message content mismatch");
        assertEq(messages[0].votingPowerLevel, votingPowerLevel, "Voting power level mismatch");
        assertGt(messages[0].timestamp, 0, "Timestamp should be set");
    }

    function testGetMessagesPagination() public {
        // Post multiple messages
        bytes memory proof = getValidProof();
        bytes32[] memory publicInputs = getPublicInputs();
        
        string[3] memory messages = ["Message 1", "Message 2", "Message 3"];
        uint256[] memory powers = new uint256[](3);
        powers[0] = 100;
        powers[1] = 200;
        powers[2] = 300;
        
        for(uint i = 0; i < 3; i++) {
            daoLeaks.postMessage(proof, publicInputs, messages[i], powers[i]);
        }

        // Test pagination with page size 2
        DaoLeaks.Message[] memory page1 = daoLeaks.getMessages(0, 2);
        assertEq(page1.length, 2, "First page should have 2 messages");
        assertEq(page1[0].message, messages[0], "First message mismatch");
        assertEq(page1[1].message, messages[1], "Second message mismatch");

        // Test last page
        DaoLeaks.Message[] memory page2 = daoLeaks.getMessages(1, 2);
        assertEq(page2.length, 1, "Last page should have 1 message");
        assertEq(page2[0].message, messages[2], "Last message mismatch");
    }

    function testGetTotalMessages() public {
        bytes memory proof = getValidProof();
        bytes32[] memory publicInputs = getPublicInputs();
        
        // Initially should be zero
        assertEq(daoLeaks.getTotalMessages(), 0, "Initial message count should be zero");

        // Post some messages
        daoLeaks.postMessage(proof, publicInputs, "Message 1", 100);
        daoLeaks.postMessage(proof, publicInputs, "Message 2", 200);

        assertEq(daoLeaks.getTotalMessages(), 2, "Message count should be 2");
    }

    function testGetTotalPages() public {
        bytes memory proof = getValidProof();
        bytes32[] memory publicInputs = getPublicInputs();
        
        // Post 5 messages
        for(uint i = 0; i < 5; i++) {
            daoLeaks.postMessage(proof, publicInputs, string(abi.encodePacked("Message ", i+1)), 100);
        }

        // Test with different page sizes
        assertEq(daoLeaks.getTotalPages(2), 2, "Should be 2 pages with page size 2");
        assertEq(daoLeaks.getTotalPages(3), 1, "Should be 1 page with page size 3");
        assertEq(daoLeaks.getTotalPages(5), 1, "Should be 1 page with page size 5");
        assertEq(daoLeaks.getTotalPages(6), 0, "Should be 0 pages with page size 6");
    }

    function testPostMessageWithInvalidProof() public {
        bytes memory invalidProof = new bytes(440 * 32);
        bytes32[] memory publicInputs = getPublicInputs();
        
        // Expect revert when proof verification fails
        vm.expectRevert();
        daoLeaks.postMessage(invalidProof, publicInputs, "Test message", 100);
    }
} 