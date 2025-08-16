// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract PrepareFork is Script {
    uint256 NUM_USERS = 10;
    address ENS_TOKEN = 0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72;
    address ENS_WHALE = 0x690F0581eCecCf8389c223170778cD9D029606F2;

    uint256[] ENS_TRANSFER_AMOUNT = [1_000 * 10 ** 18, 10_000 * 10 ** 18, 50_000 * 10 ** 18];

    function run() public {
        for (uint256 i = 0; i < NUM_USERS; i++) {
            string memory fakeAccountName = string.concat("fakeAccount", vm.toString(i));
            (address fakeAccount, uint256 fakePk) = makeAddrAndKey(fakeAccountName);

            vm.startBroadcast(ENS_WHALE);
            uint256 transferAmount = ENS_TRANSFER_AMOUNT[i % 3];
            ERC20Votes(ENS_TOKEN).transfer(fakeAccount, transferAmount);
            payable(fakeAccount).transfer(1 ether);
            vm.stopBroadcast();

            vm.startBroadcast(fakeAccount);
            ERC20Votes(ENS_TOKEN).delegate(fakeAccount);
            vm.stopBroadcast();

            console.log(string.concat("Test Account ", vm.toString(i), " pk: ", vm.toString(fakePk)));
        }
    }
}
