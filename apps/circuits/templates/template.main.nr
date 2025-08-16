mod trie_proof;

fn main(
    storage_proof: [u8; {{proof_length}}], // {{depth}} levels * 532 bytes
    value: [u8; 32],
    storage_root: pub [u8; 32], 
    padded_mapping_slot: [u8; 32],
    padded_array_index: [u8; 32],
    public_key: [u8; 64],
    message_hash: pub [u8; 32],
    signature: [u8; 64],
    voting_power_threshold: pub [u8; 32],
) {
   
    ///////////////////////
    // Verify signature on message_hash
    // Separate public key into x and y coordinates
    let mut pub_key_x = [0; 32];
    let mut pub_key_y = [0; 32];
    
    // Copy first 32 bytes into pub_key_x
    for i in 0..32 {
        pub_key_x[i] = public_key[i];
    }
    
    // Copy last 32 bytes into pub_key_y
    for i in 0..32 {
        pub_key_y[i] = public_key[i + 32];
    }

    let verified = std::ecdsa_secp256k1::verify_signature(pub_key_x, pub_key_y, signature, message_hash);
    assert(verified, "Signature verification failed");

    ///////////////////////
    // Verify padded index is <= 2^32 for security (avoid collision manufacturing)
    // Check that padded_array_index <= 2^32
    // ensure all bytes except last 4 are 0
    for i in 0..28 {
        assert(padded_array_index[i] == 0, f"Padded index is greater than 2^32 - 1");
    }

    ///////////////////////
    // Verify storage proof

    // Calculate padded_account_address from public key
    let pk_hash = std::hash::keccak256(public_key, 64);
    let mut padded_account_address = [0; 32];
    for i in 12..32 {
        padded_account_address[i] = pk_hash[i];
    }

    
    // Verify storage key is correctly derived
    // First get the storage slot for _checkpoints[account]
    let mut pre_image = [0; 64];
    for i in 0..32 {
        pre_image[i] = padded_account_address[i];
    }
    for i in 0..32 {
        pre_image[i + 32] = padded_mapping_slot[i];
    }
    let checkpoint_account_slot = std::hash::keccak256(pre_image, 64);

    let array_slot = std::hash::keccak256(checkpoint_account_slot, 32);

    // add array_slot + index_bytes with carry
    let mut computed_key = [0; 32];
    let mut carry = 0;
    for i in 0..32 {
        let pos = 31 - i;
        let sum = array_slot[pos] as u32 + padded_array_index[pos] as u32 + carry;
        computed_key[pos] = (sum % 256) as u8;
        carry = sum / 256;
    }

    let trie_proof = trie_proof::trie_proof::TrieProof {
        key: computed_key,
        proof: storage_proof,
        depth: {{depth}},
        value: value,
    };
    // assert(trie_proof.verify_storage_root(storage_root));

    ///////////////////////
    // Assert that voting power >= voting_power_threshold
    // Struct is packed voting_power (28 bytes) + block_number (4 bytes)
    
    // assert voting power >= voting_power_threshold
    let mut votes_equal_so_far = true;
    let mut voting_power_gte_threshold = true; // starts true since == is true
    for i in 0..28 {
        if votes_equal_so_far {
            if value[i] > voting_power_threshold[i] {
                voting_power_gte_threshold = true;
                votes_equal_so_far = false;
            } else if value[i] < voting_power_threshold[i] {
                voting_power_gte_threshold = false;
                votes_equal_so_far = false;
            }
        }
    }

    assert(voting_power_gte_threshold, "Voting power is less than threshold");

    // assert block number >= last block number
}
