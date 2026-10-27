# How I Built a Blockchain in TypeScript

I built a functional blockchain prototype in TypeScript in under 2,000 lines. Here is the exact process, the mistakes I made, and why I still think TypeScript is the right choice for experimental distributed systems.

## Why TypeScript?

Most blockchains are written in Rust, Go, or C++. These languages give you memory safety and speed, but they also slow down iteration. For a prototype, I wanted a language with a low barrier to entry, strong tooling, and enough type safety to catch logic errors before they hit a testnet.

TypeScript satisfied all three. It compiles to clean JavaScript, works in Node.js, and has a mature ecosystem for networking and cryptography.

## The Block Structure

Every block contains:

- `index` — position in the chain
- `timestamp` — Unix time in milliseconds
- `transactions` — array of signed transfers
- `previousHash` — SHA-256 of the parent block
- `hash` — SHA-256 of the block’s own contents
- `nonce` — proof-of-work counter

```ts
interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
}
```

## The Chain Logic

The chain is a singly-linked list of blocks. To add a new block, we:

1. Validate every transaction in the candidate block.
2. Ensure the candidate’s `previousHash` matches the current head’s `hash`.
3. Mine the block by incrementing the `nonce` until the hash starts with four zeroes.
4. Append the block and broadcast it.

Validation is the hardest part. A transaction must have:
- A valid Ed25519 signature.
- A sender balance greater than or equal to the amount.
- No double-spend within the same block.

## State Management

Rather than replaying the entire chain to calculate a balance, I maintain a `UTXOSet` — a Map from public key to unspent outputs. Every time a block is added, I remove spent outputs and add new ones. This makes balance lookups O(1).

```ts
class UTXOSet {
  private utxos = new Map<string, bigint>();
  getBalance(pubKey: string): bigint { /* ... */ }
  apply(block: Block): void { /* ... */ }
}
```

## Networking

I used Node.js `ws` for peer-to-peer messaging. The protocol is dead simple: `INV`, `GET_BLOCKS`, `BLOCK`, `GET_TRANSACTION`, `TRANSACTION`.

Peers gossip transactions and blocks using a flood-fill strategy with seen-set deduplication. A 50-node local testnet synced a 1,000-block chain in under 12 seconds.

## What Went Wrong

1. **Race conditions in the mempool.** Two peers broadcasted the same transaction simultaneously. I fixed this by adding an idempotency key and a 30-second lock window.
2. **Reorgs after chain splits.** When two miners found a block at the same height, the chain forked. I implemented a “longest chain wins” rule with a one-block tolerance.
3. **Memory leaks.** The UTXO map grew unbounded because I never pruned spent outputs. I added a garbage-collect pass every 100 blocks.

## Is It Production-Ready?

No. It lacks sharding, BFT consensus, Merkle proof compression, and formal verification. But it proved that TypeScript is viable for rapid prototyping of distributed systems.

If you want to try it yourself, the code is open source under MIT. Clone, run `npm test`, and point two instances at each other on port 3000.

The full source is roughly 1,800 lines. That is small enough to understand end-to-end, and fast enough to iterate.
