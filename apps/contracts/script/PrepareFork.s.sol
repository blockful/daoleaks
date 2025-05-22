// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract PrepareFork is Script {
    address ENS_TOKEN = 0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72;
    address ENS_WHALE = 0x690F0581eCecCf8389c223170778cD9D029606F2;

    uint256 ENS_TRANSFER_AMOUNT = 1000 * 10 ** 18;

    // Storage slot for _checkpoints mapping in ENS token contract
    uint256 constant CHECKPOINT_MAPPING_SLOT = 7;

    /**
     * @notice Calculate the storage slot for a mapping with address keys
     * @param addr The address used as a key
     * @param mappingSlot The slot of the mapping
     * @return The calculated storage slot
     */
    function calculateMappingSlot(address addr, uint256 mappingSlot) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(bytes32(uint256(uint160(addr))), bytes32(mappingSlot)));
    }

    function run() public {
        // Create fake account
        (address fakeAccount, uint256 fakePk) = makeAddrAndKey("fakeAccount");

        // Add fake account as delegate to ENS
        // Check the whale's balance
        uint256 whaleBalance = ERC20Votes(ENS_TOKEN).balanceOf(ENS_WHALE);
        console.log("\nENS whale balance:", whaleBalance);

        // 2. Impersonate the whale
        vm.startBroadcast(ENS_WHALE);

        // 3. Send some tokens to our fake account (though not necessary to be a delegate)
        uint256 transferAmount = ENS_TRANSFER_AMOUNT; // 10 ENS tokens

        // // Transfer ENS tokens to our fake account
        ERC20Votes(ENS_TOKEN).transfer(fakeAccount, transferAmount);
        console.log("\nTransferred ENS tokens to fake account");
        console.log("  Amount:", transferAmount);

        // set balance of fake account
        payable(fakeAccount).transfer(1 ether);

        vm.stopBroadcast();

        // 4. IMPORTANT: Delegate voting power to our fake account
        vm.startBroadcast(fakeAccount);
        ERC20Votes(ENS_TOKEN).delegate(fakeAccount);
        console.log("\nDelegated voting power to fake account");
        vm.stopBroadcast();

        // Check voting power
        uint256 votingPower = ERC20Votes(ENS_TOKEN).getVotes(fakeAccount);
        console.log("Voting power of fake account:", votingPower);

        // sign message with fake account
        bytes32 hashV = keccak256("Signed by Alice");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(fakePk, hashV);
        // console.log("Signature:", v, r, s);

        bytes memory signature = abi.encodePacked(r, s, v);

        // Print fakeAccount
        console.log("Fake account:", fakeAccount);

        // Print the message hash
        console.logBytes32(hashV);
        console.log("Message hash (hex):", vm.toString(hashV));

        // Print the signature
        console.log("Signature length:", signature.length);
        console.log("Signature (hex):", vm.toString(signature));

        // Print the public key (derive it from the private key)
        address signer = vm.addr(fakePk);
        console.log("Signer address:", signer);
    }
}
