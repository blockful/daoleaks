// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.21;

import {Script} from "forge-std/Script.sol";
import {HonkVerifier} from "../src/DaoLeaksDepth.sol";

contract DeployHonkVerifier is Script {
    function run() public returns (HonkVerifier) {
        vm.startBroadcast();
        
        // Deploy the HonkVerifier contract
        HonkVerifier verifier = new HonkVerifier();
        
        vm.stopBroadcast();
        
        return verifier;
    }
} 