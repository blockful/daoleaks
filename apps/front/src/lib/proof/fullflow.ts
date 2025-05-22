import { createBackend, generateProof, generateWitness, verifyProof } from "./generate-proof";
import { getStorageProofForAccount, serialise } from "./storage-proof";
import { getSignatureFromTransaction } from "./mock-signature";
import type { PublicClient } from "viem";
import { toHex } from "viem";

export async function fullFlow(client: PublicClient) {

    const start = performance.now();
    console.log('Starting full flow');

    const accountAddress = '0x983110309620D911731Ac0932219af06091b6744';
    const contractAddress = '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72'
    const mappingSlot = 7;

    const BLOCK_NUMBER = 22524300;
    const blockNumber = toHex(BLOCK_NUMBER);

    console.log('Block number', blockNumber);

    // Sample tx from delegate to fetch signature from
    const txHash = "0x6443d2846aa4df6c79ed90200153b70a69664baa01f6349b3c05c699c63f1eaa";
    const storageProof = await getStorageProofForAccount(client, accountAddress, contractAddress, mappingSlot, blockNumber);

    if (storageProof.isErr()) {
        throw new Error('Failed to get storage proof');
    }

    console.log('Storage proof retrieved');

    const signatureData = await getSignatureFromTransaction(txHash, accountAddress);

    if (!signatureData) {
        throw new Error('Failed to get signature data');
    }

    console.log('Signature data retrieved');

    // In generateWitness.ts, modify the voting_power_threshold initialization:
    // Structs are packed to the right (first bytes are last item in struct)
    const threshold = 107272232544679272610965n;
    // const threshold = 107272232544679272610965n + 1n;
    const thresholdHex = threshold.toString(16).padStart(56, '0'); // pad to 28 bytes for uint224 (voting power)
    const packedThresholdHex = thresholdHex + "00000000"; // add 4 bytes of zeros at the end for uint32 (block number)
    const votingPowerThreshold = serialise('0x' + packedThresholdHex, true);

    const proofData = {
        storage_proof: storageProof.value.storage_proof.storage_proof,
        value: storageProof.value.storage_proof.value,
        storage_root: storageProof.value.storage_proof.storage_root,
        padded_mapping_slot: storageProof.value.storage_proof.padded_mapping_slot,
        padded_array_index: storageProof.value.storage_proof.padded_array_index,
        public_key: signatureData.noirInputs.public_key,
        message_hash: signatureData.noirInputs.signed_hash,
        signature: signatureData.noirInputs.signature,
        voting_power_threshold: votingPowerThreshold,
    };

    const {noir, backend} = await createBackend(storageProof.value.depth);

    console.log('Backend created');

    const witness = await generateWitness(noir, proofData);

    if (witness.isErr()) {
        throw new Error('Failed to generate witness');
    }

    console.log('Witness generated');

    const proof = await generateProof(backend, witness.value);

    if (proof.isErr()) {
        throw new Error('Failed to generate proof');
    }

    console.log('Proof generated');

    const isValid = await verifyProof(backend, proof.value);

    if (isValid.isErr()) {
        throw new Error('Failed to verify proof');
    }

    console.log('Proof verified');

    const end = performance.now();
    console.log(`Time taken: ${((end - start) / 1000).toFixed(2)} seconds`);

    return isValid.value;   
}