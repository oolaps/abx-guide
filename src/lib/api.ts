/**
 * Aborean Dashboard API Utilities
 * 
 * Fetch functions for external data sources:
 * - DeFiLlama (price, TVL, volume, fees)
 * - Dune Analytics (holder data, supply stats)
 * - AGW Portal (user profiles)
 * - ENS (name resolution)
 */

import { API_ENDPOINTS, DUNE_QUERIES, getKnownLabel, truncateAddress } from './constants';
import { CONTRACTS } from './contracts';

// =============================================================================
// TYPES
// =============================================================================

export interface PriceData {
  price: number;
  change24h: number | null;
  timestamp: number;
}

export interface ProtocolMetrics {
  tvl: number;
  volume24h: number | null;
  fees24h: number | null;
}

export interface SupplyData {
  totalSupply: number;
  lockedSupply: number;
  lockedPercent: number;
  circulatingSupply: number;
}

export interface HolderData {
  rank: number;
  address: string;
  displayName: string;
  displayUrl: string | null;
  veabxPower: number;
  percentOfTotal: number;
  numLocks: number;
  numLocksVaulted: number;
  lockIds: string[];
  isFoundation: boolean;
  classification: string;
}

export interface AGWProfile {
  name: string | null;
  avatar: string | null;
}

export interface WalletDisplay {
  name: string;
  url: string | null;
  source: 'manual' | 'ens' | 'agw' | 'truncated';
}

// =============================================================================
// DEFILLAMA API
// =============================================================================

/**
 * Fetch ABX token price from DeFiLlama
 */
export async function fetchABXPrice(): Promise<PriceData> {
  const coinId = `abstract:${CONTRACTS.ABX_TOKEN}`;
  const url = `${API_ENDPOINTS.DEFILLAMA_PRICES}/${coinId}`;
  
  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`DeFiLlama price API error: ${res.status}`);
    }
    
    const data = await res.json();
    const coin = data.coins?.[coinId];
    
    if (!coin) {
      throw new Error('ABX price not found in DeFiLlama response');
    }
    
    return {
      price: coin.price,
      change24h: coin.change24h ?? null,
      timestamp: coin.timestamp,
    };
  } catch (error) {
    console.error('Failed to fetch ABX price:', error);
    throw error;
  }
}

/**
 * Fetch protocol metrics (TVL, volume, fees) from DeFiLlama
 */
export async function fetchProtocolMetrics(): Promise<ProtocolMetrics> {
  try {
    const res = await fetch(API_ENDPOINTS.DEFILLAMA_PROTOCOL);

    if (!res.ok) {
      throw new Error(`DeFiLlama protocol API error: ${res.status}`);
    }
    
    const data = await res.json();
    
    return {
      tvl: data.tvl ?? 0,
      volume24h: data.volume24h ?? null,
      fees24h: data.fees24h ?? null,
    };
  } catch (error) {
    console.error('Failed to fetch protocol metrics:', error);
    throw error;
  }
}

// =============================================================================
// DUNE ANALYTICS API
// =============================================================================

/**
 * Generic Dune query fetcher
 * Requires DUNE_API_KEY environment variable
 */
async function fetchDuneQuery<T = any>(queryId: string): Promise<T[]> {
  const apiKey = process.env.DUNE_API_KEY;
  
  if (!apiKey) {
    throw new Error('DUNE_API_KEY environment variable not set');
  }
  
  const url = `${API_ENDPOINTS.DUNE_BASE}/${queryId}/results`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'X-Dune-API-Key': apiKey,
      },
    });

    if (!res.ok) {
      throw new Error(`Dune API error: ${res.status}`);
    }
    
    const data = await res.json();
    return data.result?.rows ?? [];
  } catch (error) {
    console.error(`Failed to fetch Dune query ${queryId}:`, error);
    throw error;
  }
}

/**
 * Fetch veABX holder list from Dune
 */
export async function fetchHolders(): Promise<HolderData[]> {
  const rows = await fetchDuneQuery(DUNE_QUERIES.VEABX_LOCKERS);
  
  return rows.map((row: any, index: number) => ({
    rank: row.rank ?? index + 1,
    address: row.addresses?.split(',')[0] ?? '',
    displayName: row.holder ?? truncateAddress(row.addresses?.split(',')[0] ?? ''),
    displayUrl: null, // Will be resolved by wallet display logic
    veabxPower: parseFloat(row.veabx) || 0,
    percentOfTotal: parseFloat(row.pct_of_total) || 0,
    numLocks: parseInt(row.num_locks) || 0,
    numLocksVaulted: parseInt(row.num_locks_vaulted) || 0,
    lockIds: row.lock_ids?.split(',') ?? [],
    isFoundation: row.holder?.includes('Foundation') ?? false,
    classification: 'HODLER', // Default, will be calculated
  }));
}

/**
 * Fetch supply statistics from Dune
 */
export async function fetchSupplyStats(): Promise<SupplyData> {
  const rows = await fetchDuneQuery(DUNE_QUERIES.ABX_SUPPLY_LOCKED);
  
  if (rows.length === 0) {
    throw new Error('No supply data returned from Dune');
  }
  
  const row = rows[0];
  const totalSupply = parseFloat(row.total_supply) || 0;
  const lockedSupply = parseFloat(row.locked_supply) || 0;
  
  return {
    totalSupply,
    lockedSupply,
    lockedPercent: totalSupply > 0 ? (lockedSupply / totalSupply) * 100 : 0,
    circulatingSupply: totalSupply - lockedSupply,
  };
}

// =============================================================================
// AGW PORTAL API
// =============================================================================

/**
 * Fetch AGW profile for an address
 */
export async function fetchAGWProfile(address: string): Promise<AGWProfile> {
  const url = `${API_ENDPOINTS.AGW_PROFILE}/${address}`;
  
  try {
    const res = await fetch(url);

    if (!res.ok) {
      return { name: null, avatar: null };
    }

    const data = await res.json();

    return {
      name: data.name?.trim() || null,
      avatar: data.avatar || data.pfp || null,
    };
  } catch (error) {
    // Silently fail - not all addresses have AGW profiles
    return { name: null, avatar: null };
  }
}

// =============================================================================
// ENS RESOLUTION
// Using web3.bio API for ENS reverse lookup
// =============================================================================

/**
 * Fetch ENS name for an address
 */
export async function fetchENSName(address: string): Promise<string | null> {
  const url = `https://api.web3.bio/ns/ens/${address}`;
  
  try {
    const res = await fetch(url);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.identity || null;
  } catch (error) {
    // Silently fail
    return null;
  }
}

// =============================================================================
// WALLET DISPLAY RESOLUTION
// Priority: Manual Label > ENS > AGW Portal > Truncated
// =============================================================================

/**
 * Resolve display name and URL for a wallet address
 * Uses caching to avoid repeated lookups
 */
export async function resolveWalletDisplay(address: string): Promise<WalletDisplay> {
  const normalizedAddress = address.toLowerCase();
  
  // 1. Check manual labels first
  const knownLabel = getKnownLabel(normalizedAddress);
  if (knownLabel) {
    return {
      name: knownLabel.label,
      url: knownLabel.url ?? `${API_ENDPOINTS.ABSCAN}/address/${normalizedAddress}`,
      source: 'manual',
    };
  }
  
  // 2. Try ENS
  const ensName = await fetchENSName(normalizedAddress);
  if (ensName) {
    return {
      name: ensName.length > 20 ? `${ensName.slice(0, 17)}...` : ensName,
      url: `${API_ENDPOINTS.ABSCAN}/address/${normalizedAddress}`,
      source: 'ens',
    };
  }
  
  // 3. Try AGW Portal
  const agwProfile = await fetchAGWProfile(normalizedAddress);
  if (agwProfile.name) {
    return {
      name: agwProfile.name.length > 20 ? `${agwProfile.name.slice(0, 17)}...` : agwProfile.name,
      url: `${API_ENDPOINTS.PORTAL_PROFILE}/${normalizedAddress}`,
      source: 'agw',
    };
  }
  
  // 4. Fallback to truncated address
  return {
    name: truncateAddress(normalizedAddress),
    url: `${API_ENDPOINTS.ABSCAN}/address/${normalizedAddress}`,
    source: 'truncated',
  };
}

/**
 * Batch resolve wallet displays (more efficient for tables)
 */
export async function resolveWalletDisplaysBatch(
  addresses: string[]
): Promise<Map<string, WalletDisplay>> {
  const results = new Map<string, WalletDisplay>();
  
  // Process in parallel with concurrency limit
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (address) => {
        const display = await resolveWalletDisplay(address);
        return [address.toLowerCase(), display] as const;
      })
    );
    
    for (const [address, display] of batchResults) {
      results.set(address, display);
    }
  }
  
  return results;
}

// =============================================================================
// PRICE CHART DATA
// =============================================================================

export interface ChartDataPoint {
  timestamp: number;
  price: number;
}

/**
 * Fetch historical price data for chart
 * Note: DeFiLlama may have limited historical data for newer tokens
 */
export async function fetchPriceHistory(
  days: number | null = 7
): Promise<ChartDataPoint[]> {
  // For now, return empty - DeFiLlama historical API format TBD
  // Will need to implement based on actual API response
  console.warn('fetchPriceHistory not fully implemented yet');
  return [];
}
