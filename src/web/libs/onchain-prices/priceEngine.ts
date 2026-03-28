import { createPublicClient, http, type PublicClient, type Chain } from 'viem'
import { mainnet, arbitrum, optimism } from 'viem/chains'

import {
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V3_POOL_ABI,
  ZERO_ADDRESS,
  PRICE_CACHE_TTL_MS,
  CHAIN_CONFIGS,
  FALLBACK_RPCS,
  USDT_ADDRESSES,
  USDC_USDT_POOL_FEE
} from './constants'
import type {
  ChainPriceConfig,
  TokenPriceRequest,
  TokenPriceResult,
  PriceCacheKey,
  CachedPrice,
  PriceMap
} from './types'

const VIEM_CHAINS: Record<number, Chain> = {
  1: mainnet,

  42161: arbitrum,
  10: optimism
}

// In-memory caches
const priceCache: PriceMap = new Map()
const poolAddressCache = new Map<string, `0x${string}`>() // permanent cache
const clientCache = new Map<number, PublicClient>()

function getCacheKey(chainId: number, tokenAddress: string): PriceCacheKey {
  return `${chainId}:${tokenAddress.toLowerCase()}`
}

function getPoolCacheKey(chainId: number, tokenAddress: string, fee: number): string {
  return `${chainId}:${tokenAddress.toLowerCase()}:${fee}`
}

function getCachedPrice(chainId: number, tokenAddress: string): CachedPrice | null {
  const key = getCacheKey(chainId, tokenAddress)
  const cached = priceCache.get(key)
  if (!cached) return null
  if (Date.now() - cached.fetchedAt > PRICE_CACHE_TTL_MS) return null
  return cached
}

function setCachedPrice(chainId: number, tokenAddress: string, priceUSD: number | null): void {
  const key = getCacheKey(chainId, tokenAddress)
  priceCache.set(key, { priceUSD, fetchedAt: Date.now() })
}

function getClient(chainId: number, rpcUrl?: string): PublicClient {
  const cacheKey = chainId
  const existing = clientCache.get(cacheKey)
  if (existing) return existing

  const chain = VIEM_CHAINS[chainId]
  const url = rpcUrl || FALLBACK_RPCS[chainId]

  const client = createPublicClient({
    chain,
    transport: http(url, { batch: true, retryCount: 1, timeout: 10_000 }),
    batch: { multicall: true }
  })

  clientCache.set(cacheKey, client as PublicClient)
  return client as PublicClient
}

/**
 * Computes a USD price from Uniswap V3's sqrtPriceX96 value.
 *
 * sqrtPriceX96 = sqrt(price) * 2^96
 * where price = token1/token0 (amount of token1 per unit of token0)
 *
 * Uniswap V3 always orders tokens by address (lower address = token0).
 */
// Pre-computed constants to avoid BigInt ** operator (Babel compiles ** to Math.pow which breaks BigInt)
const Q96 = BigInt('79228162514264337593543950336') // 2^96
const PRECISION = BigInt('1000000000000000000') // 10^18

function computePriceFromSqrtPriceX96(
  sqrtPriceX96: bigint,
  tokenDecimals: number,
  usdcDecimals: number,
  tokenIsToken0: boolean
): number {
  if (sqrtPriceX96 === 0n) return 0

  const sqrtPriceScaled = (sqrtPriceX96 * PRECISION) / Q96
  const priceScaled = (sqrtPriceScaled * sqrtPriceScaled) / PRECISION
  const priceAsNumber = Number(priceScaled) / Number(PRECISION)

  if (tokenIsToken0) {
    const decimalAdjustment = Math.pow(10, tokenDecimals - usdcDecimals)
    return priceAsNumber * decimalAdjustment
  }
  // token is token1, USDC is token0 -> invert price and decimal adjustment
  if (priceAsNumber === 0) return 0
  const decimalAdjustment = Math.pow(10, tokenDecimals - usdcDecimals)
  return (1 / priceAsNumber) * decimalAdjustment
}

/**
 * Fetches prices for a list of tokens on a single chain.
 * Uses 2 batched multicalls: one for getPool, one for slot0.
 * ALL non-USDC tokens get on-chain price reads — no hardcoded prices.
 * Tokens with poolFee === 0 have no known USDC pool (price = null).
 */
async function fetchChainPrices(
  chainConfig: ChainPriceConfig,
  rpcUrl?: string
): Promise<TokenPriceResult[]> {
  const { chainId, factoryAddress, usdcAddress, usdcDecimals, tokens } = chainConfig
  const now = Date.now()
  const results: TokenPriceResult[] = []

  const noPoolTokens: TokenPriceRequest[] = []
  const pricedTokens: TokenPriceRequest[] = []
  let usdcToken: TokenPriceRequest | null = null

  for (const token of tokens) {
    // Check cache
    const cached = getCachedPrice(chainId, token.tokenAddress)
    if (cached) {
      results.push({
        tokenAddress: token.tokenAddress,
        symbol: token.symbol,
        chainId,
        priceUSD: cached.priceUSD,
        fetchedAt: cached.fetchedAt
      })
      continue
    }

    // USDC gets priced against USDT — pull it out before the poolFee check
    if (token.tokenAddress.toLowerCase() === usdcAddress.toLowerCase()) {
      usdcToken = token
      continue
    }

    if (token.poolFee === 0) {
      noPoolTokens.push(token)
    } else {
      pricedTokens.push(token)
    }
  }

  // Tokens without pools get null price (balance still shown)
  for (const token of noPoolTokens) {
    setCachedPrice(chainId, token.tokenAddress, null)
    results.push({
      tokenAddress: token.tokenAddress,
      symbol: token.symbol,
      chainId,
      priceUSD: null,
      fetchedAt: now
    })
  }

  if (pricedTokens.length === 0 && !usdcToken) return results

  // eslint-disable-next-line no-console
  console.log(`[onchain-prices] Fetching ${pricedTokens.length}${usdcToken ? '+USDC' : ''} prices for chain ${chainId} via ${rpcUrl || FALLBACK_RPCS[chainId]}`)

  const client = getClient(chainId, rpcUrl)

  try {
    // Price USDC against USDT if we have a USDT address for this chain
    if (usdcToken) {
      const usdtInfo = USDT_ADDRESSES[chainId]
      if (usdtInfo) {
        try {
          const poolResult = await client.readContract({
            address: factoryAddress,
            abi: UNISWAP_V3_FACTORY_ABI,
            functionName: 'getPool',
            args: [usdcAddress, usdtInfo.address, USDC_USDT_POOL_FEE]
          })

          if (poolResult && poolResult !== ZERO_ADDRESS) {
            const slot0Result = await client.readContract({
              address: poolResult as `0x${string}`,
              abi: UNISWAP_V3_POOL_ABI,
              functionName: 'slot0'
            })

            if (slot0Result) {
              const sqrtPriceX96 = (slot0Result as readonly [bigint, ...unknown[]])[0]
              if (sqrtPriceX96 && sqrtPriceX96 !== 0n) {
                const usdcIsToken0 = usdcAddress.toLowerCase() < usdtInfo.address.toLowerCase()
                const usdcPrice = computePriceFromSqrtPriceX96(
                  sqrtPriceX96,
                  usdcToken.decimals,
                  usdtInfo.decimals,
                  usdcIsToken0
                )
                setCachedPrice(chainId, usdcToken.tokenAddress, usdcPrice)
                results.push({
                  tokenAddress: usdcToken.tokenAddress,
                  symbol: usdcToken.symbol,
                  chainId,
                  priceUSD: usdcPrice,
                  fetchedAt: now
                })
              }
            }
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`[onchain-prices] Failed to price USDC via USDT pool on chain ${chainId}:`, err)
          setCachedPrice(chainId, usdcToken.tokenAddress, null)
          results.push({ tokenAddress: usdcToken.tokenAddress, symbol: usdcToken.symbol, chainId, priceUSD: null, fetchedAt: now })
        }
      } else {
        // No USDT on this chain — can't price USDC
        setCachedPrice(chainId, usdcToken.tokenAddress, null)
        results.push({ tokenAddress: usdcToken.tokenAddress, symbol: usdcToken.symbol, chainId, priceUSD: null, fetchedAt: now })
      }
    }

    if (pricedTokens.length === 0) return results
    // Step 1: Resolve pool addresses (check permanent cache first)
    const tokensNeedingPoolLookup: { token: TokenPriceRequest; index: number }[] = []
    const poolAddresses: (`0x${string}` | null)[] = new Array(pricedTokens.length).fill(null)

    for (let i = 0; i < pricedTokens.length; i++) {
      const token = pricedTokens[i]
      const poolKey = getPoolCacheKey(chainId, token.tokenAddress, token.poolFee)
      const cached = poolAddressCache.get(poolKey)
      if (cached) {
        poolAddresses[i] = cached
      } else {
        tokensNeedingPoolLookup.push({ token, index: i })
      }
    }

    // Multicall getPool for uncached pools
    if (tokensNeedingPoolLookup.length > 0) {
      const getPoolCalls = tokensNeedingPoolLookup.map(({ token }) => ({
        address: factoryAddress,
        abi: UNISWAP_V3_FACTORY_ABI,
        functionName: 'getPool' as const,
        args: [
          token.tokenAddress as `0x${string}`,
          usdcAddress,
          token.poolFee
        ] as const
      }))

      const poolResults = await client.multicall({
        contracts: getPoolCalls,
        allowFailure: true
      })

      for (let i = 0; i < tokensNeedingPoolLookup.length; i++) {
        const { token, index } = tokensNeedingPoolLookup[i]
        const result = poolResults[i]

        if (result.status === 'success' && result.result && result.result !== ZERO_ADDRESS) {
          const poolAddr = result.result as `0x${string}`
          poolAddresses[index] = poolAddr
          // Cache pool address permanently (immutable CREATE2)
          const poolKey = getPoolCacheKey(chainId, token.tokenAddress, token.poolFee)
          poolAddressCache.set(poolKey, poolAddr)
        }
      }
    }

    // Step 2: Read slot0 for all resolved pools
    const slot0Calls: { address: `0x${string}`; abi: typeof UNISWAP_V3_POOL_ABI; functionName: 'slot0' }[] = []
    const slot0TokenIndexes: number[] = []

    for (let i = 0; i < pricedTokens.length; i++) {
      const poolAddr = poolAddresses[i]
      if (poolAddr) {
        slot0Calls.push({
          address: poolAddr,
          abi: UNISWAP_V3_POOL_ABI,
          functionName: 'slot0'
        })
        slot0TokenIndexes.push(i)
      }
    }

    type MulticallResult = { status: 'success'; result: unknown } | { status: 'failure'; error: Error }
    let slot0Results: MulticallResult[] = []
    if (slot0Calls.length > 0) {
      slot0Results = await client.multicall({
        contracts: slot0Calls,
        allowFailure: true
      }) as MulticallResult[]
    }

    // Step 3: Compute prices
    for (let i = 0; i < pricedTokens.length; i++) {
      const token = pricedTokens[i]
      const slot0Idx = slot0TokenIndexes.indexOf(i)

      let priceUSD: number | null = null

      if (slot0Idx !== -1) {
        const result = slot0Results[slot0Idx]
        if (result.status === 'success' && result.result) {
          const tuple = result.result as readonly [bigint, ...unknown[]]
          const sqrtPriceX96 = tuple[0]
          if (sqrtPriceX96 && sqrtPriceX96 !== 0n) {
            const tokenIsToken0 =
              token.tokenAddress.toLowerCase() < usdcAddress.toLowerCase()
            priceUSD = computePriceFromSqrtPriceX96(
              sqrtPriceX96,
              token.decimals,
              usdcDecimals,
              tokenIsToken0
            )
          }
        }
      }

      setCachedPrice(chainId, token.tokenAddress, priceUSD)
      results.push({
        tokenAddress: token.tokenAddress,
        symbol: token.symbol,
        chainId,
        priceUSD,
        fetchedAt: now
      })
    }
  } catch (err) {
    // On RPC failure, cache null for all uncached tokens to avoid hammering
    for (const token of pricedTokens) {
      if (!getCachedPrice(chainId, token.tokenAddress)) {
        setCachedPrice(chainId, token.tokenAddress, null)
        results.push({
          tokenAddress: token.tokenAddress,
          symbol: token.symbol,
          chainId,
          priceUSD: null,
          fetchedAt: now
        })
      }
    }
    // eslint-disable-next-line no-console
    console.warn(`[onchain-prices] Failed to fetch prices for chain ${chainId}:`, err)
  }

  // eslint-disable-next-line no-console
  console.log(`[onchain-prices] Chain ${chainId} results:`, results.map((r) => `${r.symbol}=$${r.priceUSD}`).join(', '))
  return results
}

/**
 * Fetch token prices across all supported chains in parallel.
 * Returns a flat array of price results.
 *
 * @param rpcOverrides - Optional map of chainId → rpcUrl to use instead of defaults
 */
export async function fetchAllPrices(
  rpcOverrides?: Record<number, string>
): Promise<TokenPriceResult[]> {
  const promises = CHAIN_CONFIGS.map((config) =>
    fetchChainPrices(config, rpcOverrides?.[config.chainId])
  )

  const chainResults = await Promise.all(promises)
  return chainResults.flat()
}

/**
 * Fetch prices for a specific chain only.
 */
export async function fetchPricesForChain(
  chainId: number,
  rpcUrl?: string
): Promise<TokenPriceResult[]> {
  const config = CHAIN_CONFIGS.find((c) => c.chainId === chainId)
  if (!config) return []
  return fetchChainPrices(config, rpcUrl)
}

/**
 * Get the cached price for a specific token without making any RPC calls.
 * Returns null if not cached or expired.
 */
export function getCachedTokenPrice(
  chainId: number,
  tokenAddress: string
): number | null {
  const cached = getCachedPrice(chainId, tokenAddress)
  return cached?.priceUSD ?? null
}

/**
 * Look up a price for a native token (ETH) by resolving to WETH for the chain.
 */
export function getNativeTokenPrice(chainId: number): number | null {
  const config = CHAIN_CONFIGS.find((c) => c.chainId === chainId)
  if (!config) return null
  return getCachedTokenPrice(chainId, config.wethAddress)
}

/**
 * Clear all caches. Useful for testing or forced refresh.
 */
export function clearPriceCache(): void {
  priceCache.clear()
}

/**
 * Clear only expired price entries, keeping pool addresses (they're immutable).
 */
export function pruneExpiredPrices(): void {
  const now = Date.now()
  for (const [key, value] of priceCache.entries()) {
    if (now - value.fetchedAt > PRICE_CACHE_TTL_MS) {
      priceCache.delete(key)
    }
  }
}

/**
 * Update the viem client for a chain (e.g., when user changes RPC).
 */
export function updateChainClient(chainId: number, rpcUrl: string): void {
  clientCache.delete(chainId)
  getClient(chainId, rpcUrl)
}
