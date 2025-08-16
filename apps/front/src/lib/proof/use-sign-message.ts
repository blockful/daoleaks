// apps/front/src/lib/proof/sign-message.ts
import { hashTypedData } from 'viem';
import { useSignTypedData } from 'wagmi';


// Define the types for the Message struct
const types = {
    Message: [
        { name: 'message', type: 'string' }
    ]
};

/**
 * Hooks for signing a message using wagmi
 */
export function useSignMessage({ name, version, chainId, verifyingContract }: { name: string, version: string, chainId: number, verifyingContract: `0x${string}` }) {
    const { isPending, signTypedData, data: signature, error } = useSignTypedData();

    const domain = {
        name,
        version,
        chainId,
        verifyingContract
    };

    /**
     * Sign a message using EIP-712 typed data
     * @param message The message to sign
     * @returns The signature
     */
    const signMessage = async (message: string) => {
        const value = {
            message
        };

        return signTypedData({
            domain,
            types,
            primaryType: 'Message',
            message: value
        });
    };

    /**
     * Calculate the message hash for a given message
     * @param message The message to hash
     * @returns The typed data hash
     */
    const getMessageHash = (message: string): `0x${string}` => {
        return hashTypedData({
            domain,
            types,
            primaryType: 'Message',
            message: {
                message
            }
        });
    };

    return {
        signMessage,
        signature,
        getMessageHash,
        isLoading: isPending,
        error
    };
}

/**
 * Utility functions for handling signatures
 */
export const signatureUtils = {
    /**
     * Remove the recovery byte (last 2 characters) from a signature
     * @param signature The full signature with recovery byte
     * @returns The signature without recovery byte (64 bytes)
     */
    removeRecoveryByte: (signature: string): string => {
        return signature.slice(0, -2);
    },

    /**
     * Get the message hash using EIP-712 typed data format
     * @param message The message to hash
     * @returns The typed data hash
     */
    getMessageHash: (message: string, domain: {name: string, version: string, chainId: number, verifyingContract: `0x${string}`}): `0x${string}` => {
        return hashTypedData({
            domain,
            types,
            primaryType: 'Message',
            message: {
                message
            }
        });
    }
};