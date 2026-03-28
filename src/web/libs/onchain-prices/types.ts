export interface TokenPriceRequest {
  tokenAddress: string
  decimals: number
  symbol: string
  poolFee: number // Uniswap V3 fee tier (500, 3000, 10000) or 0 for stablecoins
}

export interface TokenPriceResult {
  tokenAddress: string
  symbol: string
  chainId: number
  priceUSD: number | null
  fetchedAt: number
}

export interface ChainPriceConfig {
  chainId: number
  factoryAddress: `0x${string}`
  usdcAddress: `0x${string}`
  usdcDecimals: number
  wethAddress: `0x${string}`
  tokens: TokenPriceRequest[]
  rpcUrl?: string
}

export type PriceCacheKey = `${number}:${string}` // chainId:tokenAddress

export interface CachedPrice {
  priceUSD: number | null
  fetchedAt: number
}

export type PriceMap = Map<PriceCacheKey, CachedPrice>
