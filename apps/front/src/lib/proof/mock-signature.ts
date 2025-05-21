import { createPublicClient, http, keccak256, serializeTransaction, recoverPublicKey, hexToBytes, type Transaction, type TransactionSerializable } from 'viem';
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

export async function getSignatureFromTransaction(txHash: `0x${string}`, sender: `0x${string}`) {
    // Fetch the transaction
    const transaction = await publicClient.getTransaction({ hash: txHash });

    if (!transaction) {
        console.error('Transaction not found');
        return null;
    }

    const senderCheck = transaction.from;

    if (senderCheck.toLowerCase() !== sender.toLowerCase()) {
        throw new Error('Transaction sender does not match expected sender');
    }

    // Reconstruct the unsigned tx
    const signedMessageHash = getSignedMessageHash(transaction);


    // Extract signature components
    const r = transaction.r as `0x${string}`;  // Already 0x-prefixed string
    const s = transaction.s as `0x${string}`;  // Already 0x-prefixed string
    const v = transaction.v;

    // The 64-byte signature for Noir (r + s concatenated)
    // Convert to byte arrays and concatenate
    const signature_r = hexToBytes(r);
    const signature_s = hexToBytes(s);
    const signature_64_bytes = [...signature_r, ...signature_s];

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

        const publicKey = await recoverPublicKey({
            hash: signedMessageHash,
            signature: signature
        });

        // Now derive the Ethereum address from the recovered public key
        const derivedAddress = deriveEthereumAddress(publicKey);

        if (derivedAddress.toLowerCase() !== delegateAddress.toLowerCase()) {
            throw new Error('Address does not match expected delegate address');
        }

        // Extract X and Y coordinates from uncompressed public key
        // Uncompressed public key format: 0x04 + x (32 bytes) + y (32 bytes)
        const publicKeyX = `0x${publicKey.slice(4, 68)}` as `0x${string}`;
        const publicKeyY = `0x${publicKey.slice(68, 132)}` as `0x${string}`;
        const publicKeyFull = `0x${publicKey.slice(4, 132)}` as `0x${string}`;

        // For the Noir circuit, we need:
        const noirInputs = {
            public_key_x: hexToBytes(publicKeyX),
            public_key_y: hexToBytes(publicKeyY),
            public_key: Array.from(hexToBytes(publicKeyFull)),
            signature: signature_64_bytes,
            signed_hash: Array.from(hexToBytes(signedMessageHash))
        };

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
}
