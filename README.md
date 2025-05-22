# DaoLeaks

## Run tests:
1. pnpm run circuits compile
2. pnpm run contracts anvil (keep running)
3. pnpm run contracts prepare-tests
4. pnpm run contracts ts generateWitness -> then copy proof, Concatenated hex string public inputs and Storage proof depth checkpoint: 2 to contract's .env
5. pnpm run contracts forge-test
6. kill anvil process