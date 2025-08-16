import { createPublicClient, http, keccak256, serializeTransaction, recoverPublicKey, bytesToHex, hexToBytes, toHex, Transaction, TransactionSerializable } from 'viem';
import { mainnet } from 'viem/chains';
import { publicKeyToAddress } from 'viem/accounts';

// Create a public client to interact with the Ethereum network
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth-mainnet.g.alchemy.com/v2/864ae0IHj8rlKM2OHei4_1CzTV3xUdB5'),
});

// Replace with the delegate account address you want to test
const delegateAddress = '0x983110309620D911731Ac0932219af06091b6744';

// Function to derive Ethereum address from public key - corrected version
function deriveEthereumAddress(publicKey: string): string {
  if (!publicKey.startsWith('0x')) {
    publicKey = `0x${publicKey}`;
  }
  return publicKeyToAddress(publicKey as `0x${string}`);
}

// Function to verify transaction sender matches expected address
async function verifyTransactionSender(txHash: `0x${string}`, expectedAddress: string): Promise<boolean> {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    if (!receipt) {
      console.error('Transaction receipt not found');
      return false;
    }

    const sender = receipt.from.toLowerCase();
    const expected = expectedAddress.toLowerCase();

    console.log('Transaction sender:', sender);
    console.log('Expected address:', expected);
    console.log('Match:', sender === expected);

    return sender === expected;
  } catch (error) {
    console.error('Error verifying transaction sender:', error);
    return false;
  }
}

export function getUnsignedTxFromTx(tx: Transaction): TransactionSerializable {
  const common = {
    chainId: tx.chainId as number,
    nonce: tx.nonce,
    to: tx.to,
    value: tx.value,
    data: tx.input,
    gas: tx.gas,
  };

  switch (tx.type) {
    case undefined:
    case 'legacy': // Legacy
      return {
        type: 'legacy',
        gasPrice: tx.gasPrice,
        ...common,
      };

    case 'eip2930': // EIP-2930
      return {
        type: 'eip2930',
        gasPrice: tx.gasPrice,
        accessList: tx.accessList ?? [],
        ...common,
      };

    case 'eip1559': // EIP-1559
      return {
        type: 'eip1559',
        maxFeePerGas: tx.maxFeePerGas!,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas!,
        accessList: tx.accessList ?? [],
        ...common,
      };

    case 'eip4844': // EIP-4844 (blob transactions)
      return {
        type: 'eip4844',
        maxFeePerGas: tx.maxFeePerGas!,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas!,
        accessList: tx.accessList ?? [],
        blobVersionedHashes: tx.blobVersionedHashes ?? [],
        ...common,
      };

    default:
      throw new Error(`Unsupported transaction type: ${tx.type}`);
  }
}

export function getSignedMessageHash(tx: Transaction): `0x${string}` {
  const unsignedTx = getUnsignedTxFromTx(tx);
  const serialized = serializeTransaction(unsignedTx);
  return keccak256(serialized);
}

async function getSignatureFromTransaction(txHash: `0x${string}`) {
  try {
    // First verify if the transaction is actually from our expected delegate address
    const isSenderMatch = await verifyTransactionSender(txHash, delegateAddress);
    if (!isSenderMatch) {
      console.warn('WARNING: Transaction is not from the expected delegate address!');
    } else {
      console.log('Transaction sender verified as the expected delegate address');
    }

    // Fetch the transaction
    const transaction = await publicClient.getTransaction({ hash: txHash });

    // Reconstruct the unsigned tx
    const signedMessageHash = getSignedMessageHash(transaction);

    if (!transaction) {
      console.error('Transaction not found');
      return null;
    }

    // Extract signature components
    const r = transaction.r as `0x${string}`;  // Already 0x-prefixed string
    const s = transaction.s as `0x${string}`;  // Already 0x-prefixed string
    const v = transaction.v;

    console.log('Transaction data:', transaction);
    console.log('Signature components:');
    console.log('r:', r);
    console.log('s:', s);
    console.log('v:', v);

    // The 64-byte signature for Noir (r + s concatenated)
    // Convert to byte arrays and concatenate
    const signature_r = hexToBytes(r);
    const signature_s = hexToBytes(s);
    const signature_64_bytes = [...signature_r, ...signature_s];

    console.log('64-byte signature for Noir:', signature_64_bytes);

    // The hash of this serialized transaction is what was sig
    // Try to recover the public key
    try {
      // Create a properly formatted signature for recovery
      // Format: 0x + r (32 bytes) + s (32 bytes) + v (1 byte)
      // Strip 0x prefix from r and s, then add v
      const rNoPrefix = r.slice(2);
      const sNoPrefix = s.slice(2);
      const vHex = v.toString(16).padStart(2, '0');

      const signature = `0x${rNoPrefix}${sNoPrefix}${vHex}` as `0x${string}`;

      console.log('Recovery signature:', signature);

      const publicKey = await recoverPublicKey({
        hash: signedMessageHash,
        signature: signature
      });

      console.log('Recovered public key:', publicKey);

      // Now derive the Ethereum address from the recovered public key
      const derivedAddress = deriveEthereumAddress(publicKey);
      console.log('\n=== ADDRESS VERIFICATION ===');
      console.log('Derived address from public key:', derivedAddress);
      console.log('Expected delegate address:', delegateAddress.toLowerCase());
      console.log('Address match:', derivedAddress.toLowerCase() == delegateAddress.toLowerCase());


      // Extract X and Y coordinates from uncompressed public key
      // Uncompressed public key format: 0x04 + x (32 bytes) + y (32 bytes)
      const publicKeyX = `0x${publicKey.slice(4, 68)}` as `0x${string}`;
      const publicKeyY = `0x${publicKey.slice(68, 132)}` as `0x${string}`;

      console.log('Public key X coordinate:', publicKeyX);
      console.log('Public key Y coordinate:', publicKeyY);
      console.log('Public key X bytes for Noir:', hexToBytes(publicKeyX));
      console.log('Public key Y bytes for Noir:', hexToBytes(publicKeyY));

      // For the Noir circuit, we need:
      const noirInputs = {
        public_key_x: hexToBytes(publicKeyX),
        public_key_y: hexToBytes(publicKeyY),
        signature: signature_64_bytes,
        signed_hash: hexToBytes(signedMessageHash)
      };

      console.log('\n=== FINAL NOIR CIRCUIT INPUTS ===');
      console.log('public_key_x:', noirInputs.public_key_x);
      console.log('public_key_y:', noirInputs.public_key_y);
      console.log('signature:', noirInputs.signature);
      console.log('signed_hash:', noirInputs.signed_hash);

      return {
        r,
        s,
        v,
        signature_64_bytes,
        signedMessageHash,
        signedHashBytes: hexToBytes(signedMessageHash),
        publicKeyX,
        publicKeyY,
        publicKeyXBytes: hexToBytes(publicKeyX),
        publicKeyYBytes: hexToBytes(publicKeyY),
        derivedAddress,
        addressMatch: derivedAddress.toLowerCase() == delegateAddress.toLowerCase(),
        noirInputs
      };

    } catch (pubKeyError) {
      console.error('Error recovering public key:', pubKeyError);
    }

    // For the address recovery from the transaction receipt
    const recoveredAddress = await publicClient.getTransactionReceipt({
      hash: txHash,
    }).then(receipt => receipt.from);

    console.log('Recovered address from receipt:', recoveredAddress);
    console.log('Expected address:', delegateAddress);
    console.log('Address matches (from receipt):', recoveredAddress?.toLowerCase() === delegateAddress.toLowerCase());

    return {
      r,
      s,
      v,
      signature_64_bytes,
      recoveredAddress
    };
  } catch (error) {
    console.error('Error getting transaction:', error);
    return null;
  }
}

// Main function to run the example
async function main() {
  // Extract from existing transaction
  const txHash = '0x6443d2846aa4df6c79ed90200153b70a69664baa01f6349b3c05c699c63f1eaa';
  console.log('Extracting signature from transaction:', txHash);
  const extractedSig = await getSignatureFromTransaction(txHash);

  console.log('\n=== EXTRACTED SIGNATURE SUMMARY ===');
  console.log(extractedSig);

  // Format a clean output for direct copy/paste into Noir
  if (extractedSig?.noirInputs) {
    console.log('\n=== COPY/PASTE FOR NOIR TESTING ===');
    console.log(`
// Testing signature verification for account ${delegateAddress}
// Address verification: ${extractedSig.addressMatch ? 'SUCCESSFUL ✓' : 'FAILED ✗'}
let public_key_x = [${extractedSig.noirInputs.public_key_x.join(', ')}];
let public_key_y = [${extractedSig.noirInputs.public_key_y.join(', ')}];
let signature = [${extractedSig.noirInputs.signature.join(', ')}];
let signed_hash = [${extractedSig.noirInputs.signed_hash.join(', ')}];
    `);
  }
}

// Run the script
main().catch(console.error);