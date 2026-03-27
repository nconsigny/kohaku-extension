/**
 * Decentralized ETH/USD price provider using eth-prices WASM library.
 *
 * Fetches the ETH price from the mainnet Uniswap V3 WETH/USDC pool on-chain,
 * then applies it as the ETH price for all networks (testnet PoC).
 */

// Mainnet Uniswap V3 WETH/USDC 0.05% pool
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const UNISWAP_V3_WETH_USDC_POOL = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640'

// Public mainnet RPC — used only for reading Uniswap pool state
const MAINNET_RPC = 'https://eth.llamarpc.com'

// Cache: price + timestamp
let cachedPrice: { usd: number; fetchedAt: number } | null = null
const CACHE_TTL_MS = 60_000 // 1 minute

let quoterPromise: Promise<any> | null = null

async function initWasm() {
  // Dynamic imports so WASM loads lazily
  const wasmModule = await import('./eth_prices_bg.wasm')
  const bg = await import('./eth_prices_bg.js')

  // Wire WASM exports into the bg.js glue code
  bg.__wbg_set_wasm(wasmModule)

  // Init the externref table if available
  if (typeof bg.__wbindgen_init_externref_table === 'function') {
    bg.__wbindgen_init_externref_table()
  }

  return bg
}

async function getQuoter(): Promise<any> {
  if (!quoterPromise) {
    quoterPromise = (async () => {
      const bg = await initWasm()
      return bg.createQuoter({
        rpcUrl: MAINNET_RPC,
        quoters: {
          uniswap_v3: [{ pool_address: UNISWAP_V3_WETH_USDC_POOL }]
        }
      })
    })()
  }
  return quoterPromise
}

/**
 * Returns the current ETH/USD price by querying the mainnet Uniswap V3 pool.
 * Cached for 1 minute to avoid excessive RPC calls.
 */
export async function getEthUsdPrice(): Promise<number> {
  if (cachedPrice && Date.now() - cachedPrice.fetchedAt < CACHE_TTL_MS) {
    return cachedPrice.usd
  }

  const quoter = await getQuoter()
  // Quote 1 ETH (1e18 wei) → USDC amount (6 decimals)
  const usdcRaw = await quoter.getRate(WETH, USDC, '1000000000000000000')
  const usdPrice = Number(usdcRaw) / 1e6

  cachedPrice = { usd: usdPrice, fetchedAt: Date.now() }
  console.log(`[eth-prices] ETH/USD on-chain price: $${usdPrice.toFixed(2)}`)
  return usdPrice
}

/**
 * Resets the quoter (e.g., if RPC changes). Next call to getEthUsdPrice
 * will re-initialize.
 */
export function resetQuoter(): void {
  quoterPromise = null
  cachedPrice = null
}
