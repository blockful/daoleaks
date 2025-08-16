/// Node type
pub global BRANCH: u32 = 2;
pub global EXTENSION: u32 = 0;
pub global LEAF: u32 = 1;

/// Constants for 32-byte long keys; TODO: Omit these when it is possible to replace constants with numeric generics.
pub global KEY_LENGTH: u32 = 32; // (fixed) key length in bytes
pub global NIBBLE_LENGTH: u32 = 64; // = 2*KEY_LENGTH

/// Maximum trie node length. For tries with 32-byte long keys, we we can bound the byte length of any node from above by this constant.
pub global MAX_TRIE_NODE_LENGTH: u32 = 532; // = MAX_RLP_LIST_HEADER_LENGTH (= 1 + MAX_LENGTH_BYTES)
//   + 16*MAX_RLP_ELEMENT_LENGTH (= 16*(1 + KEY_LENGTH))
// + LENGTH_OF_NULL_ELEMENT (= 1)

/// Maximum size of the value in a storage slot
pub global MAX_STORAGE_VALUE_LENGTH: u32 = 32;

/// Maximum number of bytes in an account state
pub global MAX_ACCOUNT_STATE_LENGTH: u32 = 134;

/// Maximum number of RLP-encoded elements in a trie node
pub global MAX_NUM_FIELDS: u32 = 17;
