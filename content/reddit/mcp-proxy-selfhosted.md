**Title: MCP Proxy — self-hosted proxy for the Model Context Protocol**

Hey r/selfhosted,

I built **MCP Proxy**, a lightweight self-hosted proxy for the Model Context Protocol (MCP). It lets you route, transform, and cache MCP requests without touching your clients.

**Why does this exist?**  
MCP is growing fast, but if you run multiple MCP servers or want to add auth, rate limiting, or caching, you're currently stuck writing custom glue code. MCP Proxy solves that.

**Features:**
- Route requests to multiple MCP backends
- Request/response transformation
- Built-in caching for expensive tool calls
- Simple auth layer (API key or OAuth)
- Logging and metrics
- Single binary, no runtime dependencies

**Use cases:**
- Aggregating multiple MCP servers behind one endpoint
- Adding rate limiting to public MCP tools
- Caching slow database-backed MCP calls
- Central auth for team MCP usage

**Tech stack:**  
Go, single binary, ~15MB memory footprint. Works on ARM (RPi, VPS) and x86.

**Links:**
- GitHub: https://github.com/yourname/mcp-proxy
- Docker image available

Config is a single YAML file. Setup takes ~2 minutes.

I'm curious how the self-hosted community would use this. Feature requests and PRs are welcome.

---

*Control your AI tooling stack.*
