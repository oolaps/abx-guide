/**
 * Aborean Protocol Contract Configuration
 * 
 * All contract addresses are on Abstract L2 (Chain ID: 2741)
 * Source: GitLab repos + verified on-chain
 */

export const CHAIN_ID = 2741;
export const RPC_URL = 'https://api.mainnet.abs.xyz';

// =============================================================================
// CONTRACT ADDRESSES
// =============================================================================

export const CONTRACTS = {
  // Core tokens
  ABX_TOKEN: '0x4c68e4102c0f120cce9f08625bd12079806b7c4d' as const,
  VEABX: '0x27b04370d8087e714a9f557c1eff7901cea6bb63' as const,
  
  // Protocol
  VOTER: '0xc0f53703e9f4b79fa2fb09a2aeba487fa97729c9' as const,
  ROUTER: '0xe8142d2f82036b6fc1e79e4ae85cf53fbffdc998' as const,
  REWARDS_DISTRIBUTOR: '0x36cbf77d8f8355d7a077d670c29e290e41367072' as const,
  
  // Vaults (Relay contracts)
  MAXI_VAULT: '0xcbeB1A72A31670AE5ba27798c124Fcf3Ca1971df' as const,
  REWARDS_VAULT: '0x3E8D887Bba5D4A757FaE757883CA35882AB4a0ee' as const,
} as const;

// Managed veNFT token IDs for vaults
export const VAULT_TOKEN_IDS = {
  MAXI_VAULT: 8241n,
  REWARDS_VAULT: 8813n,
} as const;

// =============================================================================
// ABIs (minimal - only methods we need)
// =============================================================================

export const VEABX_ABI = [
  // Get current max token ID (counter for all locks ever created)
  {
    name: 'tokenId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  // Read total veABX supply (voting power)
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  // Get number of veNFTs owned by address
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  // Get voting power of specific NFT
  {
    name: 'balanceOfNFT',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
  // Get owner of NFT
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  // Get lock info (amount, end time, isPermanent)
  {
    name: 'locked',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    outputs: [
      { name: 'amount', type: 'int128' },
      { name: 'end', type: 'uint256' },
      { name: 'isPermanent', type: 'bool' },
    ],
  },
  // Get escrow type: 0=NORMAL, 1=LOCKED (in vault), 2=MANAGED
  {
    name: 'escrowType',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    outputs: [{ type: 'uint8' }],
  },
  // Get managed NFT ID for a locked token
  {
    name: 'idToManaged',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
  // Get weight of a token in a managed NFT
  {
    name: 'weights',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_tokenId', type: 'uint256' },
      { name: '_mTokenId', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  // Get LockedManagedReward contract for a managed NFT
  {
    name: 'managedToLocked',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_mTokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  // Get token by index for owner
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export const VOTER_ABI = [
  // Get number of pools with gauges
  {
    name: 'length',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  // Get pool address by index
  {
    name: 'pools',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  // Get gauge for pool
  {
    name: 'gauges',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'pool', type: 'address' }],
    outputs: [{ type: 'address' }],
  },
  // Get bribe contract for gauge
  {
    name: 'gaugeToBribe',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gauge', type: 'address' }],
    outputs: [{ type: 'address' }],
  },
  // Get total votes for pool
  {
    name: 'weights',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'pool', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  // Check if gauge is alive
  {
    name: 'isAlive',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gauge', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  // Total voting weight
  {
    name: 'totalWeight',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export const RELAY_ABI = [
  // Get managed token ID
  {
    name: 'mTokenId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  // Get name
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
] as const;

export const BRIBE_REWARD_ABI = [
  // Get reward tokens array
  {
    name: 'rewards',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  // Get rewards for token in epoch
  {
    name: 'tokenRewardsPerEpoch',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'epochStart', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  // Get number of reward tokens
  {
    name: 'rewardsListLength',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export const LOCKED_MANAGED_REWARD_ABI = [
  // Get earned rewards for a token
  {
    name: 'earned',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  // Get balance (weight) of a token in the reward contract
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export const ERC20_ABI = [
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const;
