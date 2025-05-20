// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.21 <0.9.0;

import {Test} from "forge-std/Test.sol";
import {HonkVerifier} from "../src/Verifier.sol";

contract HonkVerifierTest is Test {
    HonkVerifier public verifier;
    
    function setUp() public {
        // Deploy a new instance of HonkVerifier for testing
        verifier = new HonkVerifier();
    }

    function testVerifyValidProof() public {
        // Get proof from environment variable
        bytes memory proof = vm.envBytes("HONK_PROOF");
        require(proof.length == 440 * 32, "Invalid proof length from env var");
        
        bytes32[] memory publicInputs = new bytes32[](0); // 0 public inputs as per the contract

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
        bytes32[] memory invalidPublicInputs = new bytes32[](1); // Should be 0

        // The contract should revert with PublicInputsLengthWrong()
        vm.expectRevert(abi.encodeWithSignature("PublicInputsLengthWrong()"));
        verifier.verify(proof, invalidPublicInputs);
    }
} 