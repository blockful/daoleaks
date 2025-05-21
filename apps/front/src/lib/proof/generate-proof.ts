import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import { type CompiledCircuit } from '@noir-lang/types';

import circuit1 from '@/../../circuits/target/dao_leaks_depth_1.json'
import circuit2 from '@/../../circuits/target/dao_leaks_depth_2.json'
import circuit3 from '@/../../circuits/target/dao_leaks_depth_3.json'
import circuit4 from '@/../../circuits/target/dao_leaks_depth_4.json'
import circuit5 from '@/../../circuits/target/dao_leaks_depth_5.json'
import circuit6 from '@/../../circuits/target/dao_leaks_depth_6.json'
import circuit7 from '@/../../circuits/target/dao_leaks_depth_7.json'
import circuit8 from '@/../../circuits/target/dao_leaks_depth_8.json'
import circuit9 from '@/../../circuits/target/dao_leaks_depth_9.json'
import circuit10 from '@/../../circuits/target/dao_leaks_depth_10.json'

import { ok, err } from 'neverthrow';
import type { ProofData } from '@aztec/bb.js';

const circuits = [
    circuit1 as unknown as CompiledCircuit,
    circuit2 as unknown as CompiledCircuit,
    circuit3 as unknown as CompiledCircuit,
    circuit4 as unknown as CompiledCircuit,
    circuit5 as unknown as CompiledCircuit,
    circuit6 as unknown as CompiledCircuit,
    circuit7 as unknown as CompiledCircuit,
    circuit8 as unknown as CompiledCircuit,
    circuit9 as unknown as CompiledCircuit,
    circuit10 as unknown as CompiledCircuit,
]

interface CircuitProofData {
    storage_proof: number[];
    value: number[];
    storage_root: number[];
    padded_mapping_slot: number[];
    padded_array_index: number[];
    public_key: number[];
    message_hash: number[];
    signature: number[];
    voting_power_threshold: number[];
}


export async function createBackend(depth: number) {
    const circuit = circuits[depth - 1];
    const noir = new Noir(circuit);
    const backend = new UltraHonkBackend(circuit.bytecode);
    return { noir, backend };
}

export async function generateWitness(noir: Noir,  proofData: CircuitProofData) {
    try {
        const { witness } = await noir.execute(proofData as any);
        return ok(witness);
    } catch (error) {
        return err(error);
    }
}

export async function generateProof(backend: UltraHonkBackend, witness: Uint8Array) {
    try {
        const proof = await backend.generateProof(witness, { keccak: true });
        return ok(proof);
    } catch (error) {
        return err(error);
    }
}

export async function verifyProof(backend: UltraHonkBackend, proof: ProofData) {
    try {
        const isValid = await backend.verifyProof(proof, { keccak: true });
        return ok(isValid);
    } catch (error) {
        return err(error);
    }
}