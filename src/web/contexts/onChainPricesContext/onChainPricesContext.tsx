import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

import {
  fetchAllPrices,
  fetchOnChainPortfolio,
  PRICE_CACHE_TTL_MS,
  CHAIN_CONFIGS,
  TESTNET_TO_MAINNET
} from '@web/libs/onchain-prices'
import type { OnChainPortfolioData, PortfolioToken } from '@web/libs/onchain-prices'

import { NetworksControllerStateContext } from '@web/contexts/networksControllerStateContext'

export interface OnChainPricesContextValue {
  /** Map of "chainId:tokenAddress(lowercase)" → priceUSD */
  prices: Record<string, number | null>
  isLoading: boolean
  lastFetchedAt: number | null
  getPrice: (chainId: number | bigint, tokenAddress: string) => number | null
  getEthPrice: (chainId: number | bigint) => number | null
  /** Full on-chain portfolio for a specific wallet+chain */
  getPortfolio: (walletAddress: string, chainId: number) => Promise<OnChainPortfolioData>
  /** Cached portfolio data (set after first fetch) */
  portfolioCache: Record<string, OnChainPortfolioData>
  refresh: () => Promise<void>
}

const OnChainPricesContext = createContext<OnChainPricesContextValue>({
  prices: {},
  isLoading: true,
  lastFetchedAt: null,
  getPrice: () => null,
  getEthPrice: () => null,
  getPortfolio: async () => ({ chainId: 0, walletAddress: '', totalUsdValue: 0, tokens: [], fetchedAt: 0 }),
  portfolioCache: {},
  refresh: async () => {}
})

export const OnChainPricesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const networksCtrl = useContext(NetworksControllerStateContext)
  const [prices, setPrices] = useState<Record<string, number | null>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null)
  const [portfolioCache, setPortfolioCache] = useState<Record<string, OnChainPortfolioData>>({})
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const isFetchingRef = useRef(false)

  const getRpcForChain = useCallback((chainId: number): string | undefined => {
    const networks = networksCtrl?.networks
    if (!networks) return undefined
    const network = networks.find((n: any) => Number(n.chainId) === chainId)
    return network?.selectedRpcUrl || network?.rpcUrls?.[0]
  }, [networksCtrl?.networks])

  const fetchPrices = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      const overrides: Record<number, string> = {}
      const networks = networksCtrl?.networks
      if (networks) {
        for (const network of networks) {
          const cid = Number(network.chainId)
          const rpc = network.selectedRpcUrl || network.rpcUrls?.[0]
          if (rpc && CHAIN_CONFIGS.some((c) => c.chainId === cid)) {
            overrides[cid] = rpc
          }
        }
      }

      const results = await fetchAllPrices(overrides)
      const priceMap: Record<string, number | null> = {}
      for (const r of results) {
        priceMap[`${r.chainId}:${r.tokenAddress.toLowerCase()}`] = r.priceUSD
      }

      setPrices(priceMap)
      setIsLoading(false)
      setLastFetchedAt(Date.now())
    } catch {
      setIsLoading(false)
    } finally {
      isFetchingRef.current = false
    }
  }, [networksCtrl?.networks])

  useEffect(() => {
    fetchPrices()
    intervalRef.current = setInterval(fetchPrices, PRICE_CACHE_TTL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchPrices])

  const resolveChainId = useCallback((chainId: number | bigint): number => {
    const cid = Number(chainId)
    return TESTNET_TO_MAINNET[cid] ?? cid
  }, [])

  const getPrice = useCallback(
    (chainId: number | bigint, tokenAddress: string): number | null => {
      const cid = resolveChainId(chainId)
      const key = `${cid}:${tokenAddress.toLowerCase()}`
      return prices[key] ?? null
    },
    [prices, resolveChainId]
  )

  const getEthPrice = useCallback(
    (chainId: number | bigint): number | null => {
      const cid = resolveChainId(chainId)
      const config = CHAIN_CONFIGS.find((c) => c.chainId === cid)
      if (!config) return null
      return getPrice(cid, config.wethAddress)
    },
    [getPrice, resolveChainId]
  )

  const getPortfolio = useCallback(
    async (walletAddress: string, chainId: number): Promise<OnChainPortfolioData> => {
      const cacheKey = `${chainId}:${walletAddress.toLowerCase()}`
      const cached = portfolioCache[cacheKey]
      if (cached && Date.now() - cached.fetchedAt < PRICE_CACHE_TTL_MS) {
        return cached
      }

      const rpcUrl = getRpcForChain(chainId)
      const data = await fetchOnChainPortfolio(walletAddress, chainId, rpcUrl)
      setPortfolioCache((prev) => ({ ...prev, [cacheKey]: data }))
      return data
    },
    [portfolioCache, getRpcForChain]
  )

  const value: OnChainPricesContextValue = {
    prices,
    isLoading,
    lastFetchedAt,
    getPrice,
    getEthPrice,
    getPortfolio,
    portfolioCache,
    refresh: fetchPrices
  }

  return (
    <OnChainPricesContext.Provider value={value}>{children}</OnChainPricesContext.Provider>
  )
}

export function useOnChainPrices(): OnChainPricesContextValue {
  return useContext(OnChainPricesContext)
}

export default OnChainPricesContext
