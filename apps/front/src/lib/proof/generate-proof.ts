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
import circuit11 from '@/../../circuits/target/dao_leaks_depth_11.json'
import circuit12 from '@/../../circuits/target/dao_leaks_depth_12.json'
import circuit13 from '@/../../circuits/target/dao_leaks_depth_13.json'
import circuit14 from '@/../../circuits/target/dao_leaks_depth_14.json'
import circuit15 from '@/../../circuits/target/dao_leaks_depth_15.json'
import circuit16 from '@/../../circuits/target/dao_leaks_depth_16.json'
import circuit17 from '@/../../circuits/target/dao_leaks_depth_17.json'
import circuit18 from '@/../../circuits/target/dao_leaks_depth_18.json'
import circuit19 from '@/../../circuits/target/dao_leaks_depth_19.json'
import circuit20 from '@/../../circuits/target/dao_leaks_depth_20.json'


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
    circuit11 as unknown as CompiledCircuit,
    circuit12 as unknown as CompiledCircuit,
    circuit13 as unknown as CompiledCircuit,
    circuit14 as unknown as CompiledCircuit,
    circuit15 as unknown as CompiledCircuit,
    circuit16 as unknown as CompiledCircuit,
    circuit17 as unknown as CompiledCircuit,
    circuit18 as unknown as CompiledCircuit,
    circuit19 as unknown as CompiledCircuit,
    circuit20 as unknown as CompiledCircuit,
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