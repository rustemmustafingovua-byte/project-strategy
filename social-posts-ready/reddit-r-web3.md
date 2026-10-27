# Reddit Post — r/web3
## Title: I built a Layer-1 blockchain in TypeScript — no Go, no Rust, just TS

Hey r/web3,

I spent the last 6 months building **Lumen Chain**, a Layer-1 blockchain designed for IoT and edge devices, written entirely in TypeScript.

**Why TypeScript?**  
Most blockchains use Go, Rust, or C++. I wanted something with strong static typing, a huge package ecosystem, and the ability to share code between on-chain and off-chain components. TypeScript fit the bill perfectly — its compiler catches ~80% of consensus bugs before they hit the network.

**Architecture at a glance:**
- PoA consensus (~2s block time, predictable finality)
- libp2p for P2P networking (mDNS, DHT, circuit relay)
- LevelDB + RocksDB for storage
- Custom bytecode VM for smart contracts (not EVM)
- Full Ethereum JSON-RPC compatibility

**Performance:**  
7-node testnet on Raspberry Pi 4 achieves 500+ TPS. Genesis sync takes ~30 seconds.

**What's ready now:**
- Full node software
- TypeScript SDK
- React block explorer (also TS)
- 100% open source

**Roadmap:**  
Light client protocol, zk-contracts, Flutter/React Native SDK.

I genuinely think TypeScript is underrated for blockchain development. If you're curious about how a consensus engine works under the hood, or if you need a lightweight L1 for your IoT project, the code is available.

GitHub: https://github.com/rustemmustafingovua-byte/lumen-chain  
Docs: https://docs.lumenchain.dev

Happy to answer questions about the VM design, consensus mechanics, or why I chose PoA over PoS.

---
*If this is useful, a star on GitHub helps a lot.*
