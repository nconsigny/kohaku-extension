import { createPublicClient, http, erc20Abi, formatUnits, type PublicClient, type Chain } from 'viem'
import { mainnet, base, arbitrum, optimism, sepolia } from 'viem/chains'

import { getTokensForChain, type TokenEntry } from './tokenRegistry'
import { FALLBACK_RPCS, TESTNET_TO_MAINNET } from './constants'
import { getCachedTokenPrice, getNativeTokenPrice, fetchPricesForChain } from './priceEngine'

const VIEM_CHAINS: Record<number, Chain> = {
  1: mainnet,
  8453: base,
  42161: arbitrum,
  10: optimism,
  11155111: sepolia
}

export interface PortfolioToken {
  symbol: string
  name: string
  address: string
  decimals: number
  balance: string
  formattedBalance: string
  usdPrice: number | null
  usdValue: number | null
  isNative: boolean
}

export interface OnChainPortfolioData {
  chainId: number
  walletAddress: string
  totalUsdValue: number
  tokens: PortfolioToken[]
  fetchedAt: number
}

const clientCache = new Map<number, PublicClient>()

function getClient(chainId: number, rpcUrl?: string): PublicClient {
  const existing = clientCache.get(chainId)
  if (existing) return existing

  const chain = VIEM_CHAINS[chainId]
  const url = rpcUrl || FALLBACK_RPCS[chainId]

  const client = createPublicClient({
    chain,
    transport: http(url, { batch: true, retryCount: 1, timeout: 15_000 }),
    batch: { multicall: true }
  })

  clientCache.set(chainId, client as PublicClient)
  return client as PublicClient
}

function formatBalance(value: bigint, decimals: number): string {
  const formatted = formatUnits(value, decimals)
  const num = Number(formatted)
  if (num === 0) return '0'
  if (num < 0.0001) return '<0.0001'
  if (num < 1) return num.toFixed(4)
  if (num < 1000) return num.toFixed(2)
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/**
 * Fetch portfolio for a wallet on a single chain entirely on-chain.
 * Uses multicall for ERC-20 balances + native getBalance.
 * Prices come from the Uniswap V3 price engine.
 */
export async function fetchOnChainPortfolio(
  walletAddress: string,
  chainId: number,
  rpcUrl?: string
): Promise<OnChainPortfolioData> {
  const tokens = getTokensForChain(chainId)
  if (tokens.length === 0) {
    return { chainId, walletAddress, totalUsdValue: 0, tokens: [], fetchedAt: Date.now() }
  }

  const client = getClient(chainId, rpcUrl)
  const addr = walletAddress as `0x${string}`

  const nativeEntry = tokens.find((t) => t.address === 'native')
  const erc20Entries = tokens.filter((t) => t.address !== 'native')

  // Resolve which chain to use for prices (testnet → mainnet)
  const priceChainId = TESTNET_TO_MAINNET[chainId] ?? chainId

  // Fetch balances and prices in parallel
  const [nativeBalance, erc20Results, _prices] = await Promise.all([
    nativeEntry
      ? client.getBalance({ address: addr }).catch(() => 0n)
      : Promise.resolve(0n),

    erc20Entries.length > 0
      ? client.multicall({
          contracts: erc20Entries.map((token) => ({
            address: token.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf' as const,
            args: [addr] as const
          })),
          allowFailure: true
        }).catch(() => erc20Entries.map(() => ({ status: 'failure' as const, error: new Error('multicall failed'), result: undefined })))
      : Promise.resolve([]),

    // Ensure prices are fetched/cached — use the price chain's own RPC, not the balance chain's
    fetchPricesForChain(priceChainId)
  ])

  // Assemble portfolio tokens
  const result: PortfolioToken[] = []

  // Native token
  if (nativeEntry) {
    const balance = nativeBalance
    const formatted = formatBalance(balance, nativeEntry.decimals)
    const usdPrice = getNativeTokenPrice(priceChainId)
    const balanceNum = Number(formatUnits(balance, nativeEntry.decimals))
    const usdValue = usdPrice != null ? balanceNum * usdPrice : null

    result.push({
      symbol: nativeEntry.symbol,
      name: nativeEntry.name,
      address: 'native',
      decimals: nativeEntry.decimals,
      balance: balance.toString(),
      formattedBalance: formatted,
      usdPrice,
      usdValue,
      isNative: true
    })
  }

  // ERC-20 tokens
  for (let i = 0; i < erc20Entries.length; i++) {
    const entry = erc20Entries[i]
    const balResult = erc20Results[i]
    const balance =
      balResult && balResult.status === 'success' && balResult.result != null
        ? (balResult.result as bigint)
        : 0n

    const formatted = formatBalance(balance, entry.decimals)
    const balanceNum = Number(formatUnits(balance, entry.decimals))

    // Use mainnetAddress for price lookup if available (testnet tokens map to mainnet prices)
    const priceAddress = entry.mainnetAddress || entry.address
    const usdPrice = getCachedTokenPrice(priceChainId, priceAddress)
    const usdValue = usdPrice != null ? balanceNum * usdPrice : null

    result.push({
      symbol: entry.symbol,
      name: entry.name,
      address: entry.address,
      decimals: entry.decimals,
      balance: balance.toString(),
      formattedBalance: formatted,
      usdPrice,
      usdValue,
      isNative: false
    })
  }

  // Sort: non-zero USD value desc, then non-zero balance, then zero
  result.sort((a, b) => {
    const aVal = a.usdValue ?? 0
    const bVal = b.usdValue ?? 0
    if (aVal > 0 && bVal > 0) return bVal - aVal
    if (aVal > 0) return -1
    if (bVal > 0) return 1
    const aHas = a.balance !== '0'
    const bHas = b.balance !== '0'
    if (aHas && !bHas) return -1
    if (!aHas && bHas) return 1
    return 0
  })

  const totalUsdValue = result.reduce((sum, t) => sum + (t.usdValue ?? 0), 0)

  return {
    chainId,
    walletAddress,
    totalUsdValue,
    tokens: result,
    fetchedAt: Date.now()
  }
}
