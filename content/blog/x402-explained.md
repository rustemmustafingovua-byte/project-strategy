# x402 Explained: A Payment Protocol for the Open Web

x402 is an open payment protocol that lets agents and machines transact over HTTP without sign-ups, accounts, or KYC. Here is how it works, why it matters, and how you can integrate it today.

## The Problem with Web Payments

Every payment on the web today is gated. You need a merchant account, a processor, an acquirer, and often a bank relationship. Even “simple” solutions like Stripe require onboarding, underwriting, and monthly reconciliation.

For machine-to-machine transactions — API calls, AI inference, data feeds — this overhead is absurd. An agent should be able to pay for a resource the same way it fetches it: with a signed HTTP request.

## How x402 Works

x402 adds a `402 Payment Required` response with a machine-readable payment payload. The client completes the payment off-band (via crypto transfer, token, or stablecoin) and retries the request with a proof of payment.

The protocol has three parts:

1. **402 Response** — The server returns a JSON payload with:
   - `amount` — how much to pay
   - `asset` — chain/token address
   - `recipient` — server wallet
   - `nonce` — replay protection
   - `expiry` — time window

2. **Payment Proof** — The client signs a transaction and submits the hash.

3. **Retry** — The client retries the original request with `X-Payment-Proof` header.

If the proof is valid and the transaction is confirmed, the server returns `200 OK` with the resource.

## Why It Is Better Than Web Monetization

Web Monetization uses a browser extension and a wallet pointer. x402 is protocol-native: any HTTP client can pay, any server can accept, without plugins or browser support.

It is also chain-agnostic. The payload does not specify EVM or Solana. It uses a generic asset descriptor, so you can add chains by registering a new asset URI scheme.

## Integration Guide

On the server side:

```ts
app.get("/premium-api", (req, res) => {
  const proof = req.header("X-Payment-Proof");
  if (!proof || !verifyPayment(proof)) {
    return res.status(402).json({
      amount: "0.01",
      asset: "usdc:ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      recipient: process.env.SERVER_WALLET,
      nonce: crypto.randomUUID(),
      expiry: Date.now() + 60000,
    });
  }
  return res.json({ data: "premium content" });
});
```

On the client side:

```ts
const res = await fetch("/premium-api");
if (res.status === 402) {
  const payload = await res.json();
  const txHash = await sendPayment(payload);
  const retry = await fetch("/premium-api", {
    headers: { "X-Payment-Proof": txHash },
  });
  console.log(await retry.json());
}
```

## Security Considerations

- **Replay attacks:** The server must track used nonces.
- **Front-running:** A malicious relayer could see a payment proof and reuse it. Require the proof to include the request method and URL.
- **Slippage:** For volatile assets, lock the price for the `expiry` window or use a stablecoin.

## The Ecosystem

x402 is being adopted by data-marketplace protocols, AI inference providers, and IoT networks. If you build an HTTP API today, adding x402 support costs roughly half a day and makes your service accessible to autonomous clients.

That is the future: the web is no longer just for humans.
