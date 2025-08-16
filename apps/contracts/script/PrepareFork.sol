pragma solidity ^0.8.13;

import "forge-std/Script.sol";

contract PrepareFork is Script {
    address ENS_TOKEN = 0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72;
    address ENS_WHALE = 0x245445940B317E509002eb682E03f4429184059d;

    uint256 ENS_TRANSFER_AMOUNT = 10 * 10**18;

    function run() public {
        vm.startBroadcast();

        // Create fake account
        (address fakeAccount, uint256 fakePk) = makeAddrAndKey("fakeAccount");
        vm.deal(fakeAccount, 100 ether);

        // Add fake account as delegate to ENS
        // Check the whale's balance
        uint256 whaleBalance = ERC20Votes(ENS_TOKEN).balanceOf(ENS_WHALE);
        console.log("\nENS whale balance:", whaleBalance);
        
        // 2. Impersonate the whale
        vm.startPrank(ENS_WHALE);
        
        // 3. Send some tokens to our fake account (though not necessary to be a delegate)
        uint256 transferAmount = ENS_TRANSFER_AMOUNT; // 10 ENS tokens
        
        // Transfer ENS tokens to our fake account
        ERC20Votes(ENS_TOKEN).transfer(fakeAccount, transferAmount);
        console.log("\nTransferred ENS tokens to fake account");
        console.log("  Amount:", transferAmount);

        vm.stopPrank();
        
        // 4. IMPORTANT: Delegate voting power to our fake account
        ERC20Votes(ENS_TOKEN).delegate(fakeAccount);
        console.log("\nDelegated voting power to fake account");
        
        // Check voting power
        uint256 votingPower = ERC20Votes(ENS_TOKEN).getVotes(fakeAccount);
        console.log("  Voting power of fake account:", votingPower);
        
        // eth_getProof for fake account

        // sign message with fake account
        bytes32 hash = keccak256("Signed by Alice");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(fakePk, hash);

        // print everything to screen
        vm.stopBroadcast();
    }
}
