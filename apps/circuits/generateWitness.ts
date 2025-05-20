import { Network, Alchemy } from "alchemy-sdk";
import { UltraHonkBackend } from '@aztec/bb.js';
// @ts-ignore -- ESM import works at runtime despite TypeScript warning
import { Noir } from '@noir-lang/noir_js';
import { CompiledCircuit } from '@noir-lang/types';
import circuitData from "./target/dao_leaks.json";

import { keccak256, concat, pad, toHex, http, createPublicClient, hexToBigInt, toRlp } from "viem";
import { mainnet } from "viem/chains";

const circuit = circuitData as unknown as CompiledCircuit;

type StorageProof = {
    storage_proof: number[];
    storage_key: number[]
    value: number[]
    storage_root: number[]
}

function createSerialsFromProof(proofResponse: {
    storageHash: string;
    storageProof: Array<{
        key: string;
        value: string;
        proof: string[];
    }>;
}): StorageProof[] {
    const MAX_TRIE_NODE_LENGTH = 532;

    return proofResponse.storageProof.map(proofItem => {
        // Create proof path string by padding and concatenating all proof elements
        let proofPath: string = "";
        for (let layer of proofItem.proof) {
            layer = layer.replace("0x", "").padEnd(MAX_TRIE_NODE_LENGTH * 2, '0');
            proofPath = proofPath + layer;
        }

        return {
            storage_proof: serialise(proofPath),
            storage_key: serialise(proofItem.key),
            value: serialise(proofItem.value, true),
            storage_root: serialise(proofResponse.storageHash)
        };
    });
}

function serialise(val: string, pad: boolean = false) {
    let x = val.replace("0x", "")
    if (pad && x.length < 64) {
        x = x.padStart(64, '0')
    }
    const result = Array.from(Buffer.from(x, "hex"))
    console.log("result length", result.length);
    return result;
}


function serialiseAccountProof(proof: string[]): number[] {
    const MAX_TRIE_NODE_LENGTH = 532;
    let proofPath: string = "";

    // Concatenate all proof elements with padding
    for (let i = 0; i < proof.length; i++) {
        let layer = proof[i] as string;
        layer = layer.replace("0x", "").padEnd(MAX_TRIE_NODE_LENGTH * 2, '0')
        proofPath = proofPath + layer
    }

    return Array.from(Buffer.from(proofPath, "hex"));
}

function encodeAccountData(nonce: `0x${string}`, balance: `0x${string}`, storageRoot: `0x${string}`, codeHash: `0x${string}`): `0x${string}` {
    return toRlp([
        hexToBigInt(nonce) === 0n ? '0x' : nonce,
        hexToBigInt(balance) === 0n ? '0x' : balance,
        storageRoot,
        codeHash
    ]);
}

// Calculate storage slot for mapping with address keys using viem
function calculateMappingSlot(address: string, mappingSlot: number): `0x${string}` {
    // Pad address to 32 bytes
    const paddedAddress = pad(address as `0x${string}`, { size: 32 });

    // Pad slot to 32 bytes
    const paddedSlot = pad(toHex(mappingSlot), { size: 32 });

    // Concatenate and hash
    const concatenated = concat([paddedAddress, paddedSlot]);
    const slot = keccak256(concatenated);

    console.log(`Mapping slot calculation: ${address} at slot ${mappingSlot} = ${slot}`);
    return slot;
}

// Calculate array element slot
function calculateArrayElementSlot(arraySlot: `0x${string}`, index: number): `0x${string}` {
    // In Solidity, array elements are stored at: keccak256(arraySlot) + index
    const baseSlot = keccak256(arraySlot);
    const indexBigInt = BigInt(index);
    const elementSlotBigInt = hexToBigInt(baseSlot) + indexBigInt;
    const elementSlot = `0x${elementSlotBigInt.toString(16)}` as `0x${string}`;

    console.log(`Array element slot calculation: array at ${arraySlot}, index ${index} = ${elementSlot}`);
    return elementSlot;
}

// Setup: npm install alchemy-sdk
// Github: https://github.com/alchemyplatform/alchemy-sdk-js
async function main() {

    const BLOCK_NUMBER = 22524300;

    const client = createPublicClient({
        chain: mainnet,
        transport: http("https://eth-mainnet.g.alchemy.com/v2/864ae0IHj8rlKM2OHei4_1CzTV3xUdB5")
    });

    // First, get the block to get the state root
    const block = await client.getBlock({ blockNumber: BigInt(BLOCK_NUMBER) });
    const stateRoot = block.stateRoot;
    console.log("State root at block", BLOCK_NUMBER, ":", stateRoot);


    // ENS token contract
    const contractAddress = "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72";
    // Slot for _checkpoints mapping is 7
    const mappingSlot = 7;

    // Calculate the storage slot for the delegate account nick.eth
    const delegateAccount = "0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5";
    const calculatedMappingSlotForKey = calculateMappingSlot(delegateAccount, mappingSlot);
    console.log("calculatedSlot", calculatedMappingSlotForKey);

    const arrayLengthRes = await client.request({
        method: 'eth_getProof',
        params: [
            contractAddress,
            [calculatedMappingSlotForKey],
            toHex(BLOCK_NUMBER)
        ]
    });


    const arrayLengthProof = arrayLengthRes.storageProof[0];
    console.log(arrayLengthRes);

    const arrayLength = hexToBigInt(arrayLengthProof.value);
    console.log(`Array length: ${arrayLength}`);

    // If array is empty, stop here
    if (arrayLength === 0n) {
        console.log("Array is empty, no checkpoints to fetch.");
        return;
    }
    // Step 2: Calculate slots for array elements and fetch them
    // Note: For demonstration, we'll fetch the first checkpoint (index 0)
    // You can loop through all indices if needed
    const indexToFetch = Number(arrayLength) - 1; // Change this to fetch different checkpoints

    // Calculate the base slot for array data
    // For dynamic arrays, elements are stored at keccak256(slot) + index
    const arrayElementSlot = calculateArrayElementSlot(calculatedMappingSlotForKey, indexToFetch);


    // Now we need to fetch this slot to get the checkpoint data
    const checkpointRes = await client.request({
        method: 'eth_getProof',
        params: [
            contractAddress,
            [arrayElementSlot],
            toHex(BLOCK_NUMBER)
        ]
    });

    console.log(`Checkpoint at index ${indexToFetch} proof result:`, checkpointRes);

    const checkpointProof = checkpointRes.storageProof[0];
    console.log(`Checkpoint value: ${checkpointProof.value}`);

    // ERC20Votes.Checkpoint typically has two fields:
    // - fromBlock (uint32)
    // - votes (uint224)
    // Both can be packed into a single 32-byte storage slot

    // Let's decode the checkpoint
    const checkpointValue = checkpointProof.value;

    // The last 8 hex chars (4 bytes) for fromBlock (uint32)
    const fromBlockHex = `0x${checkpointValue.slice(-8)}` as `0x${string}`;
    // Everything except the last 8 hex chars for votes (uint224)
    const votesHex = `0x${checkpointValue.slice(2, -8)}` as `0x${string}`;

    const fromBlock = hexToBigInt(fromBlockHex);
    const votes = hexToBigInt(votesHex);

    console.log("fromBlock", fromBlock);
    console.log("votes", votes);

    // Print proof depths
    console.log("Account proof depth:", checkpointRes.accountProof.length);
    console.log("Account proof depth:", arrayLengthRes.accountProof.length);
    console.log("Storage proof depth checkpoint:", checkpointRes.storageProof[0].proof.length);
    console.log("Storage proof depth array length:", arrayLengthRes.storageProof[0].proof.length);


    const checkpointProofData = createSerialsFromProof(checkpointRes)[0];

    // Convert array index to padded bytes
    const indexBytes = pad(toHex(indexToFetch), { size: 32 });
    const paddedArrayIndex = serialise(indexBytes);

    // Convert mapping slot to padded bytes
    const mappingSlotBytes = pad(toHex(mappingSlot), { size: 32 });
    const paddedMappingSlot = serialise(mappingSlotBytes);

    // Convert delegate account to padded bytes - now properly padded to 32 bytes
    const paddedAccountBytes = pad(delegateAccount as `0x${string}`, { size: 32 });
    const paddedAccountAddress = serialise(paddedAccountBytes);


    const proofData = {
        storage_proof: checkpointProofData.storage_proof,
        // storage_key: checkpointProofData.storage_key,
        value: checkpointProofData.value,
        storage_root: checkpointProofData.storage_root,
        padded_mapping_slot: paddedMappingSlot,
        padded_account_address: paddedAccountAddress,
        padded_array_index: paddedArrayIndex,
    }

    // Initialize Noir and the proving backend
    const noir = new Noir(circuit);
    const backend = new UltraHonkBackend(circuit.bytecode);

    try {
        console.log("Generating witness...");
        const { witness } = await noir.execute(proofData);
        console.log("Generated witness ✅");

        console.log("Generating proof...");
        const proof = await backend.generateProof(witness);
        console.log("Generated proof ✅");

        console.log("Verifying proof...");
        const isValid = await backend.verifyProof(proof);
        console.log(`Proof is ${isValid ? "valid ✅" : "invalid ❌"}`);

        return { proof, isValid };
    } catch (error) {
        console.error("Error during proving:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
