# Generates target/circuit.json
nargo build

# Generates target/vk
bb write_vk -b ./target/circuit.json -o ./target --oracle_hash keccak

# Generates ../contracts/src/Verifier.sol
bb write_solidity_verifier -k ./target/vk -o ../contracts/src/Verifier.sol

# Generates target/Prover.toml
# Important: need to fill the parameters in Prover.toml
nargo check

# Generates target/witness.gz
nargo execute witness

# Generates target/proof
bb prove -b ./target/circuit.json -w ./target/witness.gz -o ./target --oracle_hash keccak

# Converts proof to hex
PROOF_HEX=$(cat ./target/proof | od -An -v -t x1 | tr -d $' \n' | sed 's/^.\{8\}//')

NUM_PUBLIC_INPUTS=0  # Replace this with the number of public inputs in your circuit
HEX_PUBLIC_INPUTS=${PROOF_HEX:0:$((32 * $NUM_PUBLIC_INPUTS * 2))}
SPLIT_HEX_PUBLIC_INPUTS=$(sed -e 's/.\{64\}/"0x&",/g' <<<$HEX_PUBLIC_INPUTS)

PROOF_WITHOUT_PUBLIC_INPUTS="${PROOF_HEX:$((NUM_PUBLIC_INPUTS * 32 * 2))}"

echo 0x$PROOF_WITHOUT_PUBLIC_INPUTS
echo "[${SPLIT_HEX_PUBLIC_INPUTS}]"