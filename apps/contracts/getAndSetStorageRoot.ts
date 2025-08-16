import { createPublicClient, http, toHex } from "viem";
import { mainnet } from "viem/chains";
import { exec, execSync } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function main() {
  // Create a public client to interact with the blockchain
  const client = createPublicClient({
    chain: mainnet,
    transport: http("http://localhost:8545")
  });

  // Get the current block number
  const blockNumber = await client.getBlockNumber();
  console.log("Current Block Number:", blockNumber);

  console.log("Calling Foundry script PrepareForkStaging.s.sol...");
  try {
    // Use execSync with stdio: 'inherit' to stream output directly to the terminal
    execSync(
      `forge script script/PrepareForkTests.s.sol -v --rpc-url http://localhost:8545 --broadcast --unlocked`,
      { stdio: 'inherit' }
    );
    
    console.log("Foundry script executed successfully ✅");
  } catch (error) {
    console.error("Error executing Foundry script:", error);
    throw error;
  }

  // ENS token contract address
  const contractAddress = "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72";

  // Get the storage proof which includes the storage root
  console.log(`Getting storage root for contract: ${contractAddress}`);
  const proofResponse = await client.request({
    method: 'eth_getProof',
    params: [
      contractAddress,
      [], // empty array to get just the account proof without specific storage slots
      toHex(blockNumber)
    ]
  });

  // Extract the storage root
  const storageRoot = proofResponse.storageHash;
  console.log("Storage Root at block", blockNumber, ":", storageRoot);

  // Call the Foundry script with the storage root as a parameter
  console.log("Calling Foundry script PrepareForkStaging.s.sol...");
  try {
    // Use execSync with stdio: 'inherit' to stream output directly to the terminal
    execSync(
      `forge script script/DeployToStaging.s.sol -v --rpc-url http://localhost:8545 --broadcast --unlocked --sig "run(bytes32)" ${storageRoot} --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`,
      { stdio: 'inherit' }
    );
    
    console.log("Foundry script executed successfully ✅");
  } catch (error) {
    console.error("Error executing Foundry script:", error);
    throw error;
  }

  return { blockNumber, storageRoot };
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
