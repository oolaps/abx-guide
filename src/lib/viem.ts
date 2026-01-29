/**
 * Viem Client Configuration for Abstract L2
 * 
 * Provides configured clients for reading on-chain data
 */

import { createPublicClient, http, defineChain } from 'viem';
import { CHAIN_ID, RPC_URL, CONTRACTS, VEABX_ABI, VOTER_ABI, RELAY_ABI, ERC20_ABI } from './contracts';

// =============================================================================
// CHAIN DEFINITION
// =============================================================================

export const abstract = defineChain({
  id: CHAIN_ID,
  name: 'Abstract',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Abscan',
      url: 'https://abscan.org',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  },
});

// =============================================================================
// PUBLIC CLIENT
// =============================================================================

export const publicClient = createPublicClient({
  chain: abstract,
  transport: http(RPC_URL),
});

// =============================================================================
// CONTRACT READ HELPERS
// =============================================================================

/**
 * Get total veABX supply (number of locks)
 */
export async function getVeABXTotalSupply(): Promise<bigint> {
  return publicClient.readContract({
    address: CONTRACTS.VEABX as `0x${string}`,
    abi: VEABX_ABI,
    functionName: 'totalSupply',
  });
}

/**
 * Get number of veABX locks owned by address
 */
export async function getVeABXBalance(address: string): Promise<bigint> {
  return publicClient.readContract({
    address: CONTRACTS.VEABX as `0x${string}`,
    abi: VEABX_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });
}

/**
 * Get voting power of a specific veNFT
 */
export async function getVeABXPower(tokenId: bigint): Promise<bigint> {
  return publicClient.readContract({
    address: CONTRACTS.VEABX as `0x${string}`,
    abi: VEABX_ABI,
    functionName: 'balanceOfNFT',
    args: [tokenId],
  });
}

/**
 * Get owner of a veNFT
 */
export async function getVeABXOwner(tokenId: bigint): Promise<string> {
  return publicClient.readContract({
    address: CONTRACTS.VEABX as `0x${string}`,
    abi: VEABX_ABI,
    functionName: 'ownerOf',
    args: [tokenId],
  });
}

/**
 * Get lock info (amount, end time) for a veNFT
 */
export async function getVeABXLocked(tokenId: bigint): Promise<{ amount: bigint; end: bigint }> {
  const result = await publicClient.readContract({
    address: CONTRACTS.VEABX as `0x${string}`,
    abi: VEABX_ABI,
    functionName: 'locked',
    args: [tokenId],
  });
  
  return {
    amount: result[0],
    end: result[1],
  };
}

/**
 * Get all token IDs owned by an address
 */
export async function getVeABXTokenIds(address: string): Promise<bigint[]> {
  const balance = await getVeABXBalance(address);
  const tokenIds: bigint[] = [];
  
  for (let i = 0n; i < balance; i++) {
    const tokenId = await publicClient.readContract({
      address: CONTRACTS.VEABX as `0x${string}`,
      abi: VEABX_ABI,
      functionName: 'tokenOfOwnerByIndex',
      args: [address as `0x${string}`, i],
    });
    tokenIds.push(tokenId);
  }
  
  return tokenIds;
}

/**
 * Get total ABX locked in veABX contract
 * This is the ABX balance held by the veABX contract
 */
export async function getVeABXTotalLocked(): Promise<bigint> {
  return publicClient.readContract({
    address: CONTRACTS.ABX_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [CONTRACTS.VEABX as `0x${string}`],
  });
}

/**
 * Get ABX token total supply
 */
export async function getABXTotalSupply(): Promise<bigint> {
  return publicClient.readContract({
    address: CONTRACTS.ABX_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
  });
}

/**
 * Get ABX balance of an address
 */
export async function getABXBalance(address: string): Promise<bigint> {
  return publicClient.readContract({
    address: CONTRACTS.ABX_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });
}

// =============================================================================
// VOTER CONTRACT READS
// =============================================================================

/**
 * Get total number of pools with gauges
 */
export async function getPoolCount(): Promise<bigint> {
  return publicClient.readContract({
    address: CONTRACTS.VOTER as `0x${string}`,
    abi: VOTER_ABI,
    functionName: 'length',
  });
}

/**
 * Get pool address by index
 */
export async function getPoolByIndex(index: bigint): Promise<string> {
  return publicClient.readContract({
    address: CONTRACTS.VOTER as `0x${string}`,
    abi: VOTER_ABI,
    functionName: 'pools',
    args: [index],
  });
}

/**
 * Get gauge address for a pool
 */
export async function getGaugeForPool(pool: string): Promise<string> {
  return publicClient.readContract({
    address: CONTRACTS.VOTER as `0x${string}`,
    abi: VOTER_ABI,
    functionName: 'gauges',
    args: [pool as `0x${string}`],
  });
}

/**
 * Get total votes (weight) for a pool
 */
export async function getPoolWeight(pool: string): Promise<bigint> {
  return publicClient.readContract({
    address: CONTRACTS.VOTER as `0x${string}`,
    abi: VOTER_ABI,
    functionName: 'weights',
    args: [pool as `0x${string}`],
  });
}

/**
 * Check if a gauge is alive
 */
export async function isGaugeAlive(gauge: string): Promise<boolean> {
  return publicClient.readContract({
    address: CONTRACTS.VOTER as `0x${string}`,
    abi: VOTER_ABI,
    functionName: 'isAlive',
    args: [gauge as `0x${string}`],
  });
}

/**
 * Get total voting weight across all pools
 */
export async function getTotalVotingWeight(): Promise<bigint> {
  return publicClient.readContract({
    address: CONTRACTS.VOTER as `0x${string}`,
    abi: VOTER_ABI,
    functionName: 'totalWeight',
  });
}

// =============================================================================
// VAULT CONTRACT READS
// =============================================================================

/**
 * Get managed token ID for a vault
 */
export async function getVaultManagedTokenId(
  vault: 'maxi' | 'rewards'
): Promise<bigint> {
  const address = vault === 'maxi' ? CONTRACTS.MAXI_VAULT : CONTRACTS.REWARDS_VAULT;
  
  return publicClient.readContract({
    address: address as `0x${string}`,
    abi: RELAY_ABI,
    functionName: 'mTokenId',
  });
}

/**
 * Check if a veNFT is deposited in a vault
 * (by checking if the vault's managed token ID owns the NFT)
 */
export async function isTokenInVault(
  tokenId: bigint,
  vault: 'maxi' | 'rewards'
): Promise<boolean> {
  const owner = await getVeABXOwner(tokenId);
  const vaultAddress = vault === 'maxi' ? CONTRACTS.MAXI_VAULT : CONTRACTS.REWARDS_VAULT;
  return owner.toLowerCase() === vaultAddress.toLowerCase();
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format bigint to number with decimals
 */
export function formatTokenAmount(amount: bigint, decimals = 18): number {
  return Number(amount) / Math.pow(10, decimals);
}

/**
 * Parse number to bigint with decimals
 */
export function parseTokenAmount(amount: number, decimals = 18): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}
