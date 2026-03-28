import { ChainPriceConfig } from './types'

export const PRICE_CACHE_TTL_MS = 60_000 // 1 minute

// Pool addresses are immutable (CREATE2) so cache them forever
export const POOL_CACHE_TTL_MS = Infinity

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

// USDT addresses per chain — used to price USDC (the quote currency) via USDC/USDT pools
export const USDT_ADDRESSES: Record<number, { address: `0x${string}`; decimals: number }> = {
  1: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },

  42161: { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
  10: { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 }
}

// Fee tier for USDC/USDT pools (0.01% — deepest stablecoin liquidity)
export const USDC_USDT_POOL_FEE = 100

// Map testnet chainIds to the mainnet chainId whose prices should be used.
// Testnet pools lack liquidity, so we proxy mainnet prices instead.
export const TESTNET_TO_MAINNET: Record<number, number> = {
  11155111: 1 // Sepolia → Ethereum Mainnet
}

// Minimal Uniswap V3 Factory ABI - only getPool
export const UNISWAP_V3_FACTORY_ABI = [
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'fee', type: 'uint24' }
    ],
    name: 'getPool',
    outputs: [{ name: 'pool', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// Minimal Uniswap V3 Pool ABI - only slot0
export const UNISWAP_V3_POOL_ABI = [
  {
    inputs: [],
    name: 'slot0',
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'feeProtocol', type: 'uint8' },
      { name: 'unlocked', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// Fee tiers: 500 = 0.05%, 3000 = 0.30%, 10000 = 1%, 100 = 0.01%

export const CHAIN_CONFIGS: ChainPriceConfig[] = [
  // Ethereum Mainnet
  {
    chainId: 1,
    factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    usdcDecimals: 6,
    wethAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    tokens: [
      {
        tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        decimals: 18,
        symbol: 'ETH',
        poolFee: 500
      },
      {
        tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        symbol: 'USDC',
        poolFee: 0
      },
      {
        tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        symbol: 'USDT',
        poolFee: 0
      },
      {
        tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
        symbol: 'DAI',
        poolFee: 0
      },
      {
        tokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        decimals: 8,
        symbol: 'WBTC',
        poolFee: 3000
      },
      {
        tokenAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        decimals: 18,
        symbol: 'UNI',
        poolFee: 3000
      },
      {
        tokenAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        decimals: 18,
        symbol: 'LINK',
        poolFee: 3000
      },
      {
        tokenAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        decimals: 18,
        symbol: 'AAVE',
        poolFee: 3000
      },
      {
        tokenAddress: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
        decimals: 18,
        symbol: 'stETH',
        poolFee: 100
      }
    ]
  },
  // Arbitrum
  {
    chainId: 42161,
    factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    usdcDecimals: 6,
    wethAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    tokens: [
      {
        tokenAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        decimals: 18,
        symbol: 'ETH',
        poolFee: 500
      },
      {
        tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        decimals: 6,
        symbol: 'USDC',
        poolFee: 0
      },
      {
        tokenAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        decimals: 6,
        symbol: 'USDT',
        poolFee: 0
      },
      {
        tokenAddress: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
        decimals: 8,
        symbol: 'WBTC',
        poolFee: 3000
      },
      {
        tokenAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
        decimals: 18,
        symbol: 'ARB',
        poolFee: 3000
      },
      {
        tokenAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        decimals: 18,
        symbol: 'DAI',
        poolFee: 0
      },
      {
        tokenAddress: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
        decimals: 18,
        symbol: 'LINK',
        poolFee: 3000
      }
    ]
  },
  // Optimism
  {
    chainId: 10,
    factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    usdcDecimals: 6,
    wethAddress: '0x4200000000000000000000000000000000000006',
    tokens: [
      {
        tokenAddress: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        symbol: 'ETH',
        poolFee: 500
      },
      {
        tokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        decimals: 6,
        symbol: 'USDC',
        poolFee: 0
      },
      {
        tokenAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
        decimals: 6,
        symbol: 'USDT',
        poolFee: 0
      },
      {
        tokenAddress: '0x4200000000000000000000000000000000000042',
        decimals: 18,
        symbol: 'OP',
        poolFee: 3000
      },
      {
        tokenAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        decimals: 18,
        symbol: 'DAI',
        poolFee: 0
      }
    ]
  }
]

// Public fallback RPCs - used when the extension's configured RPC is unavailable
export const FALLBACK_RPCS: Record<number, string> = {
  1: 'https://ethereum-rpc.publicnode.com',

  42161: 'https://arbitrum-one-rpc.publicnode.com',
  10: 'https://optimism-rpc.publicnode.com',
  11155111: 'https://ethereum-sepolia-rpc.publicnode.com'
}
