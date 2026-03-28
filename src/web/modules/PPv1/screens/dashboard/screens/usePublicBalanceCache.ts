import { useCallback, useEffect, useRef, useState } from 'react'

import { useOnChainPrices } from '@web/contexts/onChainPricesContext/onChainPricesContext'
import { fetchOnChainPortfolio } from '@web/libs/onchain-prices'

const SEPOLIA_CHAIN_ID = 11155111

const usePublicBalanceCache = ({
  accounts,
  accountAddr
}: {
  accounts: { addr: string }[]
  accountAddr: string | undefined
  portfolioIsAllReady?: boolean | undefined
  portfolioTotalBalance?: number | null | undefined
}) => {
  const { isLoading: pricesLoading } = useOnChainPrices()
  const [balanceCache, setBalanceCache] = useState<{ [addr: string]: number }>({})
  const [isLoadingPublicBalances, setIsLoadingPublicBalances] = useState(true)
  const isFetchingRef = useRef(false)

  const fetchAllBalances = useCallback(async () => {
    if (!accounts.length || !accountAddr || isFetchingRef.current || pricesLoading) return
    isFetchingRef.current = true

    try {
      // Fetch portfolio for all accounts in parallel using on-chain reads
      const results = await Promise.all(
        accounts.map(async (acct) => {
          try {
            const portfolio = await fetchOnChainPortfolio(acct.addr, SEPOLIA_CHAIN_ID)
            // eslint-disable-next-line no-console
            console.log(`[usePublicBalanceCache] ${acct.addr}: $${portfolio.totalUsdValue} | ${portfolio.tokens.map((t) => `${t.symbol}:bal=${t.formattedBalance},price=$${t.usdPrice},val=$${t.usdValue}`).join(' | ')}`)
            return { addr: acct.addr, balance: portfolio.totalUsdValue }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`[usePublicBalanceCache] Failed for ${acct.addr}:`, err)
            return { addr: acct.addr, balance: 0 }
          }
        })
      )

      const newCache: { [addr: string]: number } = {}
      for (const r of results) {
        newCache[r.addr] = r.balance
      }

      setBalanceCache(newCache)
      setIsLoadingPublicBalances(false)
    } catch {
      setIsLoadingPublicBalances(false)
    } finally {
      isFetchingRef.current = false
    }
  }, [accounts, accountAddr, pricesLoading])

  useEffect(() => {
    fetchAllBalances()
  }, [fetchAllBalances])

  const refreshPublicBalances = useCallback(() => {
    setIsLoadingPublicBalances(true)
    isFetchingRef.current = false
    fetchAllBalances()
  }, [fetchAllBalances])

  return { balanceCache, isLoadingPublicBalances, refreshPublicBalances }
}

export default usePublicBalanceCache
