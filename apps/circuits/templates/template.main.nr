mod trie_proof;

fn main(
    storage_proof: [u8; {{proof_length}}], // {{depth}} levels * 532 bytes
    value: [u8; 32],
    storage_root: [u8; 32], 
    padded_mapping_slot: [u8; 32],
    padded_array_index: [u8; 32],
    public_key: [u8; 64],
    message_hash: [u8; 32],
    signature: [u8; 64],
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
    let mut preimage = [0; 64];
    for i in 0..32 {
        preimage[i] = padded_account_address[i];
    }
    for i in 0..32 {
        preimage[i + 32] = padded_mapping_slot[i];
    }
    let first_level = std::hash::keccak256(preimage, 64);

    let array_location = std::hash::keccak256(first_level, 32);

    // add array_location + index_bytes with carry
    let mut computed_key = [0; 32];
    let mut carry = 0;
    for i in 0..32 {
        let pos = 31 - i;
        let sum = array_location[pos] as u32 + padded_array_index[pos] as u32 + carry;
        computed_key[pos] = (sum % 256) as u8;
        carry = sum / 256;
    }


    let trie_proof = trie_proof::trie_proof::TrieProof {
        key: computed_key,
        proof: storage_proof,
        depth: {{depth}},
        value: value,
    };
    assert(trie_proof.verify_storage_root(storage_root));
}
