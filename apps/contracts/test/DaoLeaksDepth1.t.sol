// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.21;

import "./TestSetup.sol";

contract DaoLeaksDepth1Test is TestSetup {
    function setUp() public override {
        // Only deploy verifier, not DaoLeaks
        verifier = new HonkVerifier();
    }

    function testVerifyValidProof() public {
        bytes memory proof = getValidProof();
        bytes32[] memory publicInputs = getPublicInputs();

        // Test the verify function
        bool result = verifier.verify(proof, publicInputs);
        
        // The proof from env var should be valid
        assertTrue(result, "Verification failed for proof from env var");
    }

    function testVerifyInvalidProofLength() public {
        // Test with incorrect proof length
        bytes memory invalidProof = new bytes(100); // Too short
        bytes32[] memory publicInputs = new bytes32[](0);

        // The contract should revert with ProofLengthWrong()
        vm.expectRevert(abi.encodeWithSignature("ProofLengthWrong()"));
        verifier.verify(invalidProof, publicInputs);
    }

    function testVerifyInvalidPublicInputsLength() public {
        // Test with incorrect number of public inputs
        bytes memory proof = new bytes(440 * 32);
        bytes32[] memory invalidPublicInputs = new bytes32[](95); // Should be 0

        // The contract should revert with PublicInputsLengthWrong()
        vm.expectRevert(abi.encodeWithSignature("PublicInputsLengthWrong()"));
        verifier.verify(proof, invalidPublicInputs);
    }
} 