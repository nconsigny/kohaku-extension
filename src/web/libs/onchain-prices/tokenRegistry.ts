/**
 * Curated on-chain token registry. No external API calls needed.
 * Metadata follows ethereum-lists/tokens format (github.com/ethereum-lists/tokens).
 * Native tokens use "native" as address with wrappedAddress for Uniswap price lookup.
 * ALL tokens get on-chain price reads via Uniswap V3 — no hardcoded prices.
 * Tokens with poolFee 0 have no known USDC pool — balance shown, price = null.
 */

export interface TokenEntry {
  symbol: string
  name: string
  address: string // checksummed ERC-55 address, or "native" for chain native token
  decimals: number
  wrappedAddress?: string // for native tokens, the WETH-equivalent used for price lookup
  poolFee: number // Uniswap V3 fee tier: 500 (0.05%), 3000 (0.30%), 100 (0.01%), 0 = no pool
  mainnetAddress?: string // for testnet tokens: the mainnet address to look up price against
}

// ---------------------------------------------------------------------------
// Ethereum Mainnet — Top 100 by market cap
// ---------------------------------------------------------------------------
const ETHEREUM_TOKENS: TokenEntry[] = [
  // #1 Native ETH
  { symbol: 'ETH', name: 'Ethereum', address: 'native', decimals: 18, wrappedAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', poolFee: 500 },
  // #2 USDC
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, poolFee: 0 },
  // #3 USDT
  { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, poolFee: 100 },
  // #4 stETH
  { symbol: 'stETH', name: 'Lido Staked ETH', address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', decimals: 18, poolFee: 100 },
  // #5 USDe
  { symbol: 'USDe', name: 'Ethena USDe', address: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3', decimals: 18, poolFee: 500 },
  // #6 WBTC
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, poolFee: 3000 },
  // #7 LEO
  { symbol: 'LEO', name: 'UNUS SED LEO', address: '0x2AF5D2aD76741191D15Dfe7bF6aC92d4Bd912Ca3', decimals: 18, poolFee: 3000 },
  // #8 wstETH
  { symbol: 'wstETH', name: 'Wrapped stETH', address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', decimals: 18, poolFee: 100 },
  // #9 WBETH
  { symbol: 'WBETH', name: 'Wrapped Beacon ETH', address: '0xa2E3356610840701BDf5611a53974510Ae27E2e1', decimals: 18, poolFee: 3000 },
  // #10 WETH
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, poolFee: 500 },
  // #11 sUSDe
  { symbol: 'sUSDe', name: 'Ethena USDe', address: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3', decimals: 18, poolFee: 500 },
  // #12 LINK
  { symbol: 'LINK', name: 'ChainLink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, poolFee: 3000 },
  // #13 DAI
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, poolFee: 100 },
  // #14 BOB
  { symbol: 'BOB', name: 'BOB', address: '0xB0B195aEFA3650A6908f15CdaC7D92F8a5791B0B', decimals: 18, poolFee: 10000 },
  // #15 RNDR
  { symbol: 'RNDR', name: 'Render Token', address: '0x6De037ef9aD2725EB40118Bb1702EBb27e4Aeb24', decimals: 18, poolFee: 3000 },
  // #16 SHIB
  { symbol: 'SHIB', name: 'Shiba Inu', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', decimals: 18, poolFee: 3000 },
  // #17 TON
  { symbol: 'TON', name: 'TON Coin (bridged)', address: '0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1', decimals: 9, poolFee: 3000 },
  // #18 sUSDS
  { symbol: 'sUSDS', name: 'sUSDS', address: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD', decimals: 18, poolFee: 500 },
  // #19 UNI
  { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, poolFee: 3000 },
  // #20 XAUt
  { symbol: 'XAUt', name: 'Tether Gold', address: '0x68749665FF8D2d112Fa859AA293F07A622dc6F08', decimals: 6, poolFee: 3000 },
  // #21 OKB
  { symbol: 'OKB', name: 'OKB', address: '0x75231F58b43240C9718Dd58B4967c5114342a86c', decimals: 18, poolFee: 3000 },
  // #22 PAXG
  { symbol: 'PAXG', name: 'PAX Gold', address: '0x45804880De22913dAFE09f4980848ECE6EcbAf78', decimals: 18, poolFee: 3000 },
  // #23 BGB
  { symbol: 'BGB', name: 'Bitget Token', address: '0x19de6b897Ed14A376Dda0Fe53a5420D2aC828a28', decimals: 18, poolFee: 10000 },
  // #24 PEPE
  { symbol: 'PEPE', name: 'Pepe', address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', decimals: 18, poolFee: 3000 },
  // #25 PYUSD
  { symbol: 'PYUSD', name: 'PayPal USD', address: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8', decimals: 6, poolFee: 100 },
  // #26 FTM — ERC-20 on Ethereum
  { symbol: 'FTM', name: 'Fantom', address: '0x4E15361FD6b4BB609Fa63C81A2be19d873717870', decimals: 18, poolFee: 3000 },
  // #27 MKR
  { symbol: 'MKR', name: 'Maker', address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', decimals: 18, poolFee: 3000 },
  // #28 FDUSD
  { symbol: 'FDUSD', name: 'First Digital USD', address: '0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409', decimals: 18, poolFee: 500 },
  // #29 MATIC/POL
  { symbol: 'MATIC', name: 'Polygon', address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', decimals: 18, poolFee: 3000 },
  // #30 AGIX/ASI
  { symbol: 'FET', name: 'Artificial Superintelligence Alliance', address: '0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85', decimals: 18, poolFee: 10000 },
  // #31 WLD
  { symbol: 'WLD', name: 'Worldcoin', address: '0x163f8C2467924be0ae7B5347228CABF260318753', decimals: 18, poolFee: 3000 },
  // #32 ONDO
  { symbol: 'ONDO', name: 'Ondo Finance', address: '0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3', decimals: 18, poolFee: 3000 },
  // #33 ENA
  { symbol: 'ENA', name: 'Ethena', address: '0x57e114B691Db790C35207b2e685D4A43181e6061', decimals: 18, poolFee: 3000 },
  // #34 QNT
  { symbol: 'QNT', name: 'Quant', address: '0x4a220E6096B25EADb88358cb44068A3248254675', decimals: 18, poolFee: 3000 },
  // #35 RLUSD
  { symbol: 'RLUSD', name: 'Ripple USD', address: '0x8292Bb45bf1Ee4d140127049757C2C8A07a9045c', decimals: 18, poolFee: 500 },
  // #36 CRO
  { symbol: 'CRO', name: 'Crypto.com Chain', address: '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b', decimals: 8, poolFee: 3000 },
  // #37 KCS
  { symbol: 'KCS', name: 'KuCoin Shares', address: '0xf34960d9d60be18cC1D5Afc1A6F012A723a28811', decimals: 6, poolFee: 10000 },
  // #38 USDG
  { symbol: 'USDG', name: 'Global Dollar', address: '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590', decimals: 6, poolFee: 500 },
  // #39 MORPHO
  { symbol: 'MORPHO', name: 'Morpho', address: '0x58D97B57BB95320F9a05dC918Aef65434969c2B2', decimals: 18, poolFee: 3000 },
  // #40 NEXO
  { symbol: 'NEXO', name: 'Nexo', address: '0xB62132e35a6c13ee1EE0f84dC5d40bad8d815206', decimals: 18, poolFee: 10000 },
  // #41 TUSD
  { symbol: 'TUSD', name: 'TrueUSD', address: '0x0000000000085d4780B73119b644AE5ecd22b376', decimals: 18, poolFee: 100 },
  // #42 VIRTUAL
  { symbol: 'VIRTUAL', name: 'Virtual Protocol', address: '0x44ff8620b8cA30902395A7bD3F2407e1A091BF73', decimals: 18, poolFee: 10000 },
  // #43 ZRO
  { symbol: 'ZRO', name: 'LayerZero', address: '0x6985884C4392D348587B19cb9eAAf157F13271cd', decimals: 18, poolFee: 3000 },
  // #44 XDCE
  { symbol: 'XDCE', name: 'XinFin Network', address: '0x41AB1b6fcbB2fA9DCEd81aCbdeC13Ea6315F2Bf2', decimals: 18, poolFee: 10000 },
  // #45 FET (duplicate of #30, skipped)
  // #46 CHZ
  { symbol: 'CHZ', name: 'Chiliz', address: '0x3506424F91fD33084466F402d5D97f05F8e3b4AF', decimals: 18, poolFee: 10000 },
  // #47 CRV
  { symbol: 'CRV', name: 'Curve DAO Token', address: '0xD533a949740bb3306d119CC777fa900bA034cd52', decimals: 18, poolFee: 3000 },
  // #48 GHO
  { symbol: 'GHO', name: 'GHO', address: '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f', decimals: 18, poolFee: 500 },
  // #49 GNO
  { symbol: 'GNO', name: 'Gnosis', address: '0x6810e776880C02933D47DB1b9fc05908e5386b96', decimals: 18, poolFee: 3000 },
  // #50 IMX
  { symbol: 'IMX', name: 'Immutable', address: '0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF', decimals: 18, poolFee: 10000 },
  // #51 NIZA
  { symbol: 'NIZA', name: 'Niza Global', address: '0xb58E26aC9CC14e3C0e4C73B5Ef87B8fCE776cFCf', decimals: 18, poolFee: 0 },
  // #52 INJ
  { symbol: 'INJ', name: 'Injective Protocol', address: '0xe28b3B32B6c345A34Ff64674606124Dd5Aceca30', decimals: 18, poolFee: 10000 },
  // #53 FRAX
  { symbol: 'FRAX', name: 'Frax', address: '0x853d955aCEf822Db058eb8505911ED77F175b99e', decimals: 18, poolFee: 500 },
  // #54 cbETH
  { symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', address: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704', decimals: 18, poolFee: 3000 },
  // #55 SYRUP
  { symbol: 'SYRUP', name: 'Maple Finance', address: '0x643C4E15d7d62Ad0aBeC4a9BD4b001aA3Ef52d66', decimals: 18, poolFee: 10000 },
  // #56 GRT
  { symbol: 'GRT', name: 'The Graph', address: '0xc944E90C64B2c07662A292be6244BDf05Cda44a7', decimals: 18, poolFee: 3000 },
  // #57 LDO
  { symbol: 'LDO', name: 'Lido DAO', address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32', decimals: 18, poolFee: 3000 },
  // #58 FLOKI
  { symbol: 'FLOKI', name: 'Floki Inu', address: '0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E', decimals: 9, poolFee: 3000 },
  // #59 JASMY
  { symbol: 'JASMY', name: 'JasmyCoin', address: '0x7420B4b9a0110cdC71fB720908340C03F9Bc03EC', decimals: 18, poolFee: 10000 },
  // #60 ETHFI
  { symbol: 'ETHFI', name: 'ether.fi', address: '0xFe0c30065B384F05761f15d0CC899D4F9F9Cc0eB', decimals: 18, poolFee: 3000 },
  // #61 EURC
  { symbol: 'EURC', name: 'EURC', address: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c', decimals: 6, poolFee: 500 },
  // #62 BTSE
  { symbol: 'BTSE', name: 'BTSE Token', address: '0x666d875C600AA06AC1cf15770a3363F67C7f54a2', decimals: 8, poolFee: 0 },
  // #63 LBTC (Lombard)
  { symbol: 'LBTC', name: 'Lombard Staked BTC', address: '0x8236a87084f8B84306f72007F36F2618A5634494', decimals: 8, poolFee: 3000 },
  // #64 TEL
  { symbol: 'TEL', name: 'Telcoin', address: '0x467Bccd9d29f223BcE8043b84E8C8B282827790F', decimals: 2, poolFee: 10000 },
  // #65 OP — lives on Optimism, not mainnet
  // #66 ENS
  { symbol: 'ENS', name: 'Ethereum Name Service', address: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72', decimals: 18, poolFee: 3000 },
  // #67 SAND
  { symbol: 'SAND', name: 'The Sandbox', address: '0x3845badAde8e6dFF049820680d1F14bD3903a5d0', decimals: 18, poolFee: 3000 },
  // #68 PENDLE
  { symbol: 'PENDLE', name: 'Pendle', address: '0x808507121B80c02388fAd14726482e061B8da827', decimals: 18, poolFee: 3000 },
  // #69 AXS
  { symbol: 'AXS', name: 'Axie Infinity', address: '0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b', decimals: 18, poolFee: 3000 },
  // #70 DEXE
  { symbol: 'DEXE', name: 'DeXe', address: '0xde4EE8057785A7e8e800Db58F9784999aA15B21D', decimals: 18, poolFee: 10000 },
  // #71 THETA
  { symbol: 'THETA', name: 'Theta Token', address: '0x3883f5e181fccaF8410FA61e12b59BAd963fb645', decimals: 18, poolFee: 10000 },
  // #72 MANA
  { symbol: 'MANA', name: 'Decentraland', address: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942', decimals: 18, poolFee: 3000 },
  // #73 INST
  { symbol: 'INST', name: 'Instadapp', address: '0x6f40d4A6237C257fff2dB00FA0510DeEECd303eb', decimals: 18, poolFee: 10000 },
  // #74 MX
  { symbol: 'MX', name: 'MX Token', address: '0x11eeF04c884E24d9B7B4760e7476D06ddF797f36', decimals: 18, poolFee: 0 },
  // #75 STRK — lives on Starknet
  // #76 XCN
  { symbol: 'XCN', name: 'Onyxcoin', address: '0xA2cd3D43c775978A96BdBf12d733D5A1ED94fb18', decimals: 18, poolFee: 10000 },
  // #77 COMP
  { symbol: 'COMP', name: 'Compound', address: '0xc00e94Cb662C3520282E6f5717214004A7f26888', decimals: 18, poolFee: 3000 },
  // #78 GALA
  { symbol: 'GALA', name: 'Gala', address: '0xd1d2Eb1B1e90B638588728b4130137D262C87cae', decimals: 8, poolFee: 10000 },
  // #79 STG
  { symbol: 'STG', name: 'Stargate Finance', address: '0xAf5191B0De278C7286d6C7CC6ab6BB8A73bA2Cd6', decimals: 18, poolFee: 3000 },
  // #80 TRAC
  { symbol: 'TRAC', name: 'OriginTrail', address: '0xaA7a9CA87d3694B5755f213B5D04094b8d0F0A6F', decimals: 18, poolFee: 10000 },
  // #81 BAT
  { symbol: 'BAT', name: 'Basic Attention Token', address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF', decimals: 18, poolFee: 3000 },
  // #82 CVX
  { symbol: 'CVX', name: 'Convex Finance', address: '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B', decimals: 18, poolFee: 10000 },
  // #83 OPEN (Qredo)
  { symbol: 'OPEN', name: 'Open Custody Protocol', address: '0x69e8b9528CABDA89fe846C67675B5D73d463a916', decimals: 18, poolFee: 0 },
  // #84 TOMO
  { symbol: 'TOMO', name: 'TomoChain', address: '0x05D3606d5c81EB9b7B18530995eC9B29da05FaBa', decimals: 18, poolFee: 0 },
  // #85 1INCH
  { symbol: '1INCH', name: '1inch', address: '0x111111111117dC0aa78b770fA6A738034120C302', decimals: 18, poolFee: 3000 },
  // #86 OMNI
  { symbol: 'OMNI', name: 'Omni Network', address: '0x36E66fbBce51e4cD5bd3C62B637Eb411b18949D4', decimals: 18, poolFee: 10000 },
  // #87 GLM
  { symbol: 'GLM', name: 'Golem', address: '0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429', decimals: 18, poolFee: 10000 },
  // #88 AUSD
  { symbol: 'AUSD', name: 'AUSD', address: '0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a', decimals: 6, poolFee: 100 },
  // #89 COCOS
  { symbol: 'COCOS', name: 'Cocos-BCX', address: '0xc4C7Ea4FAB34BD9fb9a5e1B1a98Df9E7aC25857D', decimals: 18, poolFee: 0 },
  // #90 GMINING
  { symbol: 'GOMINING', name: 'GoMining', address: '0x7Ddc52c4De30e94Be3A6A0A2b259b2850f421989', decimals: 18, poolFee: 10000 },
  // #91 crvUSD
  { symbol: 'crvUSD', name: 'crvUSD', address: '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E', decimals: 18, poolFee: 500 },
  // #92 COW
  { symbol: 'COW', name: 'CoW Protocol', address: '0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB', decimals: 18, poolFee: 3000 },
  // #93 HEX
  { symbol: 'HEX', name: 'HEX', address: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', decimals: 8, poolFee: 10000 },
  // #94 SNX
  { symbol: 'SNX', name: 'Synthetix', address: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F', decimals: 18, poolFee: 3000 },
  // #95 LPT
  { symbol: 'LPT', name: 'Livepeer', address: '0x58b6A8A3302369DAEc383334672404Ee733aB239', decimals: 18, poolFee: 3000 },
  // #96 BMX
  { symbol: 'BMX', name: 'BitMart Token', address: '0x986EE2B7ae9259E6e403F8E7C8c4B3C2Cf5d9A9E', decimals: 18, poolFee: 0 },
  // #97 FTT
  { symbol: 'FTT', name: 'FTX Token', address: '0x50D1c9771902476076eCFc8B2A83Ad6b9355a4c9', decimals: 18, poolFee: 10000 },
  // #98 BEAM
  { symbol: 'BEAM', name: 'Beam', address: '0x62D0A8458eD7719FDAF978fe5929C6D342B0bFcE', decimals: 18, poolFee: 10000 },
  // #99 TRIBE
  { symbol: 'TRIBE', name: 'Tribe', address: '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B', decimals: 18, poolFee: 10000 },
  // #100 RSR
  { symbol: 'RSR', name: 'Reserve Rights', address: '0x320623b8E4fF03373931769A31Fc52A4E78B5d70', decimals: 18, poolFee: 10000 },
  // #101 AAVE
  { symbol: 'AAVE', name: 'Aave', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, poolFee: 3000 }
]

// ---------------------------------------------------------------------------
// Arbitrum One (chainId: 42161)
// ---------------------------------------------------------------------------
const ARBITRUM_TOKENS: TokenEntry[] = [
  { symbol: 'ETH', name: 'Ethereum', address: 'native', decimals: 18, wrappedAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', poolFee: 500 },
  { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, poolFee: 0 },
  { symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, poolFee: 100 },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, poolFee: 500 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8, poolFee: 3000 },
  { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, poolFee: 3000 },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18, poolFee: 100 },
  { symbol: 'LINK', name: 'Chainlink', address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18, poolFee: 3000 }
]

// ---------------------------------------------------------------------------
// Optimism (chainId: 10)
// ---------------------------------------------------------------------------
const OPTIMISM_TOKENS: TokenEntry[] = [
  { symbol: 'ETH', name: 'Ethereum', address: 'native', decimals: 18, wrappedAddress: '0x4200000000000000000000000000000000000006', poolFee: 500 },
  { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6, poolFee: 0 },
  { symbol: 'USDT', name: 'Tether USD', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6, poolFee: 100 },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18, poolFee: 500 },
  { symbol: 'OP', name: 'Optimism', address: '0x4200000000000000000000000000000000000042', decimals: 18, poolFee: 3000 },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18, poolFee: 100 }
]

// ---------------------------------------------------------------------------
// Sepolia testnet (chainId: 11155111) — prices resolved via mainnet Uniswap V3
// ---------------------------------------------------------------------------
const SEPOLIA_TOKENS: TokenEntry[] = [
  { symbol: 'ETH', name: 'Ethereum', address: 'native', decimals: 18, wrappedAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', poolFee: 500 },
  { symbol: 'USDC', name: 'USD Coin', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6, poolFee: 0, mainnetAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { symbol: 'USDT', name: 'Tether USD', address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', decimals: 6, poolFee: 0, mainnetAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x68194a729C2450ad26072b3D33ADaCbcef39D574', decimals: 18, poolFee: 0, mainnetAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', decimals: 18, poolFee: 500, mainnetAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' }
]

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const TOKEN_REGISTRY: Record<number, TokenEntry[]> = {
  1: ETHEREUM_TOKENS,
  42161: ARBITRUM_TOKENS,
  10: OPTIMISM_TOKENS,
  11155111: SEPOLIA_TOKENS
}

export function getTokensForChain(chainId: number): TokenEntry[] {
  return TOKEN_REGISTRY[chainId] ?? []
}

export function getNativeToken(chainId: number): TokenEntry | undefined {
  return getTokensForChain(chainId).find((t) => t.address === 'native')
}
