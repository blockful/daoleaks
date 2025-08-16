mod trie_proof;

fn main(
    ///////////////////
    // checkpoint proof
    ///////////////////
    storage_proof: [u8; 3724], // 7 levels * 532 bytes
    
    // The storage slot we would like to prove
    // storage_key: [u8;32], 

    // The value in the storage slot
    value: [u8; 32],

    // The storage root we would like to prove against
    storage_root: [u8; 32], 

    ///////////////////
    // key derivation
    ///////////////////
    padded_mapping_slot: [u8; 32],
    padded_account_address: [u8; 32],
    padded_array_index: [u8; 32],
 
) {
    // Verify padded index is <= 2^32
    // Check that padded_array_index <= 2^32
    // First ensure all bytes except last 4 are 0
    for i in 0..28 {
        assert(padded_array_index[i] == 0);
    }
    // Then check the last 4 bytes form a number <= 2^32 - 1
    let index_value = (padded_array_index[28] as u32 * 16777216) + // 256^3
                     (padded_array_index[29] as u32 * 65536) +     // 256^2
                     (padded_array_index[30] as u32 * 256) +       // 256^1
                     padded_array_index[31] as u32;                // 256^0
    assert(index_value <= 4294967295, "Padded index is greater than 2^32 - 1");


    // Verify storage key is correctly derived
    // First get the storage slot for _checkpoints[account]
    let mut preimage = [0; 64];
    for i in 0..32 {
        preimage[i] = padded_account_address[i];
    }
    for i in 0..32 {
        preimage[i + 32] = padded_mapping_slot[i];
    }
    let first_level = std::hash::keccak256(preimage, 64);

    let array_location = std::hash::keccak256(first_level, 32);

    // Now add array_location + index_bytes with carry
    let mut computed_key = [0; 32];
    let mut carry = 0;

     // Add from right to left with carry
    for i in 0..32 {
        let pos = 31 - i;
        let sum = array_location[pos] as u32 + padded_array_index[pos] as u32 + carry;
        computed_key[pos] = (sum % 256) as u8;
        carry = sum / 256;
    }

    // Verify the computed key matches the provided storage key
    // assert(computed_key == storage_key);

    // Verify storage proofs
    let depth_checkpoint = 7;

    let trie_proof = trie_proof::trie_proof::TrieProof {
        key: computed_key,
        proof: storage_proof,
        depth: depth_checkpoint,
        value: value,
    };

    // Constrain the proof to be valid
    assert(trie_proof.verify_storage_root(storage_root));
}