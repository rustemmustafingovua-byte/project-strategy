# Building an AMM from Scratch: A Deep Dive into Constant Product Markets

Automated Market Makers are one of the most influential innovations in decentralized finance. By replacing order books with mathematical formulas, they enable permissionless, continuous liquidity for any token pair. But despite their prominence, many developers treat AMMs as black boxes: deposit tokens, receive LP shares, and trust that the formula works. In this post, we build an AMM from first principles, explain the constant product invariant, derive the pricing model, and walk through the implementation details that separate a toy contract from production-grade infrastructure.

## The Problem with Order Books

Traditional exchanges rely on limit order books. Buyers post bids, sellers post asks, and a matching engine pairs them when prices overlap. This model works well when there are enough participants to provide depth, but it breaks down in illiquid markets. If there are no sellers at the current price, a buyer cannot execute. In a permissionless, global market where any token can be listed at any time, thin liquidity is the norm, not the exception.

AMMs solve this by replacing the order book with a deterministic pricing function. Instead of waiting for a counterparty, a trader swaps directly against a pool of assets. The price is computed automatically from the pool's state, and liquidity is always available as long as the pool has assets. This guarantees execution at the cost of slippage, which increases as the trade size grows relative to the pool depth.

## The Constant Product Formula

The most common AMM design uses the constant product invariant: `x * y = k`. In this model, a pool holds two reserves, `x` and `y`, representing the quantities of two tokens. When a trader deposits `dx` of token `x`, the pool must adjust its reserves so that the product remains constant. The new reserve of `x` becomes `x + dx`, so the new reserve of `y` must be `y' = k / (x + dx)`. The trader receives `dy = y - y'` of token `y`.

This formula has elegant properties. First, it is always solvable as long as both reserves are positive. Second, it provides liquidity across the entire price curve, from zero to infinity. Third, it is asymmetric: larger trades consume more reserves and therefore have higher prices. The price of `y` in terms of `x` at any moment is simply `y / x`, and the marginal price after a trade of `dx` is `(y - dy) / (x + dx)`.

To implement this, we need three core operations: add liquidity, remove liquidity, and swap. Adding liquidity requires the provider to deposit both tokens in the current ratio. The pool mints LP shares proportional to the existing supply or the geometric mean of the reserves, depending on whether the pool already exists. Removing liquidity burns shares and returns tokens in the same ratio. Swapping deposits one token and withdraws the other according to the constant product formula, with a small fee taken for the liquidity providers.

## Implementing the Core Pool

Let us write a minimal AMM in Solidity to make this concrete. The state is simple: two reserve balances, a total supply of LP shares, and a fee denominator, typically one thousand for a thirty basis point fee. The `swap` function is the heart of the system. It takes an input amount `dx`, calculates the output amount `dy` using the formula `dy = (y * dx * 997) / (x * 1000 + dx * 997)`, and transfers the tokens. The `997` and `1000` represent the fee: the pool keeps three tenths of a percent of the input.

```solidity
function swap(address tokenIn, uint256 amountIn, address tokenOut) external returns (uint256 amountOut) {
    require(tokenIn != tokenOut, "identical tokens");
    IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
    (uint256 reserveIn, uint256 reserveOut) = _getReserves(tokenIn, tokenOut);
    uint256 amountInWithFee = amountIn * 997 / 1000;
    uint256 numerator = reserveOut * amountInWithFee;
    uint256 denominator = reserveIn + amountInWithFee;
    amountOut = numerator / denominator;
    uint256 newReserveOut = reserveOut - amountOut;
    IERC20(tokenOut).transfer(msg.sender, amountOut);
    _updateReserves(tokenIn, tokenOut, reserveIn + amountIn, newReserveOut);
}
```

This code is intentionally minimal. It does not handle reentrancy, does not support flash swaps, and does not include a metatx relayer. But it captures the economic logic. The fee is applied to the input before the price is calculated, which means the effective price the trader pays includes the fee. The reserves are updated atomically after the transfer, which prevents front-running through reentrancy if we add a reentrancy guard.

## Slippage and Impermanent Loss

Every swap in a constant product pool experiences slippage. If a trader wants to swap one hundred tokens against a pool with one thousand tokens on each side, the output is not simply fifty tokens. Using the formula, the output is `(1000 * 100 * 997) / (1000 * 1000 + 100 * 997)`, which is approximately ninety-one tokens. The trader pays an implicit price of about 1.1 input tokens per output token instead of the mid-market price of one.

Slippage is unavoidable in AMMs. It is the cost of guaranteed liquidity. As the pool grows deeper, slippage decreases. For large trades, traders split orders across multiple pools or use concentrated liquidity models such as Uniswap V3, where liquidity providers can allocate capital to specific price ranges. Concentrated liquidity increases capital efficiency but adds complexity: providers must actively manage their positions, and the invariant becomes piecewise.

Impermanent loss is another cost of providing liquidity. If the price of one token in the pool doubles relative to the other, the pool is left holding more of the cheaper token and less of the expensive one. The provider's share is worth less in terms of the overall portfolio than if they had simply held both tokens separately. The loss is "impermanent" only if the price returns to its original level; otherwise, it becomes permanent.

Both slippage and impermanent loss are features of the constant product model, not bugs. They compensate liquidity providers for the risk of holding volatile assets and for the service of continuous liquidity. Understanding these dynamics is essential before deploying or using an AMM.

## Concentrated Liquidity and Modern Variants

The original constant product AMM treats liquidity as uniform across all prices. This is simple but capital inefficient. A stablecoin pool might spend ninety percent of its capital at prices between 0.99 and 1.01 and almost nothing elsewhere, yet the constant product model forces providers to allocate capital across the entire curve.

Uniswap V3 introduced concentrated liquidity, where each provider specifies a price range. The invariant within a range is still `x * y = k`, but outside the range, one of the reserves is exhausted and the pool behaves like a single-asset pool. This increases capital efficiency by an order of magnitude for stable pairs and enables tighter spreads for correlated assets. The tradeoff is that providers must manage their ranges, and the contract logic becomes significantly more complex.

Other variants include Curve's StableSwap, which uses a hybrid invariant that approximates constant sum near the peg and constant product far from it. Curve is optimized for assets that should trade at par, such as USDC, USDT, and DAI. Its AMM achieves much lower slippage for stablecoin pairs but performs poorly for uncorrelated tokens. Balancer uses weighted geometric mean invariants that allow pools with more than two tokens and custom weights. Each invariant choice reflects a different assumption about the relationship between the assets in the pool.

## Security Considerations

AMMs are high-value targets. A single vulnerability in the swap or liquidity logic can drain the pool. When building an AMM from scratch, the most important security properties are:

- **Reentrancy protection**: All token transfers must happen after state updates, or the contract must use a reentrancy guard.
- **Integer overflow and underflow**: Solidity 0.8.x handles this automatically, but if you use an older version or inline assembly, you must check bounds explicitly.
- **Front-running**: Public mempools allow bots to observe pending swaps and insert transactions with higher gas prices. While front-running cannot be eliminated, the constant product formula itself does not introduce additional MEV beyond what any DEX faces.
- **Oracle manipulation**: If the AMM is used as a price oracle for other contracts, an attacker can manipulate the price with a flash loan. Always use time-weighted average prices or external oracles for sensitive operations.
- **Fee-on-transfer tokens**: Some tokens deduct fees on transfer, which breaks the assumption that `amountIn` equals the change in reserves. The contract must account for this explicitly or reject fee-on-transfer tokens.

## Conclusion

Building an AMM from scratch is an excellent way to understand the mechanics of decentralized trading. The constant product invariant is simple to derive, easy to implement, and surprisingly powerful. But simplicity is not the same as safety. Production AMMs require careful handling of fees, slippage, reentrancy, and edge cases. Before deploying any AMM, audit the code, test extensively with parameterized fuzzing, and start with a small liquidity pool. The math may be elegant, but the blockchain is unforgiving of mistakes.

---

*This post is part of the Lumen Chain blog series on decentralized exchange design and smart contract engineering.*
