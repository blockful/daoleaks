mod trie_proof;

fn main(
    // Trie proof (5 levels * rlp encoded branch node size (532 bytes))
    // If you are working with larger tries, you will need to increase this
    proof: [u8; 3192], 
    
    // The storage slot we would like to prove
    key: [u8;32], 

    // The storage root we would like to prove against
    storage: [u8; 32], 

    // The value in the storage slot
    value: [u8; 32], 
) {
    // Perform trie proof of depth 5
    let depth = 6;

    let trie_proof = trie_proof::trie_proof::TrieProof {
        key,
        proof,
        depth,
        value
    };

    // Constrain the proof to be valid
    assert(trie_proof.verify_storage_root(storage));
}