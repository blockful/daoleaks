import { Network, Alchemy } from "alchemy-sdk";
import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import { CompiledCircuit } from '@noir-lang/types';
import circuitData from "./target/dao_leaks.json";

import TOML from "@iarna/toml";
import fs from "fs";

const circuit = circuitData as unknown as CompiledCircuit;

type Serial = {
    proof: number[];
    key: number[]
    value: number[]
    storage: number[]
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

// Setup: npm install alchemy-sdk
// Github: https://github.com/alchemyplatform/alchemy-sdk-js
async function main() {
    // Optional config object, but defaults to demo api-key and eth-mainnet.
    const settings = {
        apiKey: "864ae0IHj8rlKM2OHei4_1CzTV3xUdB5",
        network: Network.ETH_MAINNET,
    };
    const alchemy = new Alchemy(settings);

    // Data to get the first owner of cryptopunk #1
    const res = await alchemy.core.send('eth_getProof', [
        //   '0xb47e3cd837dDF8e4c57f05d70ab865de6e193bbb',
        "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
        //   ["0xfac7a1f594eb2c58f468ed8bbf8a12ef2719fd3a2b3dcc78b27879140dc745a4"],
        ["0x000000000000000000000000000000000000000000000000000000000000004"],
        "latest",
    ]);

    console.log(res);

    const MAX_TRIE_NODE_LENGTH = 532;
    const { storageProof, storageHash } = res;
    const punkProof = storageProof[0];

    const depth = punkProof.proof.length;
    console.log("Storage proof depth:", depth);

    let proofPath: string = "";
    for (let i = 0; i < punkProof.proof.length; i++) {
        let layer = punkProof.proof[i];
        layer = layer.replace("0x", "").padEnd(MAX_TRIE_NODE_LENGTH * 2, '0')
        proofPath = proofPath + layer
    }

    // encode this into bytes which can be interpreted by the prover
    // The rlp encoded proof path is right padded at each node with 0s and then concatenated
    const key = serialise(punkProof.key);
    const value = serialise(punkProof.value, true)
    const proof = serialise(proofPath);
    const storage = serialise(storageHash);

    const proofData: Serial = {
        proof,
        key,
        storage,
        value,
    };

    console.log(proofData);

    console.log("proof.value", punkProof.value);
    console.log("value", value);

    const proofAsToml = TOML.stringify(proofData);
    fs.writeFileSync("Prover.toml", proofAsToml);

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

main().catch(console.error);
