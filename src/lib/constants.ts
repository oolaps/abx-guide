/**
 * Aborean Dashboard Constants
 * 
 * Known addresses, labels, and configuration
 * Source: Dune queries + manual research
 */

// =============================================================================
// FOUNDATION ADDRESSES
// These addresses belong to Aborean Foundation and should be:
// 1. Grouped together as single "Foundation" entry
// 2. Always ranked #1 in the holders table
// =============================================================================

export const FOUNDATION_ADDRESSES = [
  '0xd29d05bffb2f0afbb76ed217d726ff5922253086',
  '0x4b3e171f4e5123a88ad72f3c8a843f86bde3f18f',
  '0x58564fcfc5a0c57887efc0bedec3eb5ec37f1626',
  '0x030ae831cd177b3ba1577dba2ee81cc45c1604ac',
  '0x8c8d39fdbbf10d8cc574d5610696281dc3711190',
  '0x67c0dadcb6ff386328b5a17ea40df655b097ee74',
  '0xb0e8df6009faa31520592b1821bd1620e4663f81',
  '0xc95fb8a8679d0a212276690186dee989e87560b5',
  '0xd66ca1cf2889c364e0be97235a234ee264bb6343',
  '0x42586102f172008e61dee16fad9528a5c8e466f3',
  '0x4d8971d9932c1c0c16079722b3d93893f16bb065',
] as const;

export const FOUNDATION_LABEL = 'Aborean (Foundation)';
export const FOUNDATION_URL = 'https://aborean.finance/';

// =============================================================================
// KNOWN LABELS
// Manual labels for known protocols/users
// Priority: Manual Label > ENS > AGW Portal > Truncated Address
// =============================================================================

export const KNOWN_LABELS: Record<string, { label: string; url?: string }> = {
  // Foundation (handled separately but included for completeness)
  '0xd29d05bffb2f0afbb76ed217d726ff5922253086': {
    label: FOUNDATION_LABEL,
    url: FOUNDATION_URL,
  },
  
  // Protocols
  '0x81e6f08decd7356ddc5ec7ce836cd111f1bb24a8': {
    label: 'Kona kABX',
    url: 'https://kona.surf/',
  },
  '0x111111f26ab123764da895e1627bf9ba0b000a97': {
    label: 'gBLUE Protocol',
    url: 'https://gblue.xyz/',
  },
  
  // Known users
  '0x5fbd6ade9ff68644ff9b612ecd00f201e154802a': {
    label: 'nix.eth',
    url: 'https://nix.art',
  },
  '0x86362a4c99d900d72d787ef1bdda38fd318aa5e9': {
    label: '0x86362',
    url: 'https://abscan.org/address/0x86362a4c99d900d72d787ef1bdda38fd318aa5e9',
  },
};

// =============================================================================
// API ENDPOINTS
// =============================================================================

export const API_ENDPOINTS = {
  // DeFiLlama
  DEFILLAMA_PROTOCOL: 'https://api.llama.fi/protocol/aborean',
  DEFILLAMA_PRICES: 'https://coins.llama.fi/prices/current',
  
  // Dune Analytics
  DUNE_BASE: 'https://api.dune.com/api/v1/query',
  
  // AGW Profile
  AGW_PROFILE: 'https://api.portal.abs.xyz/api/v1/user/profile',
  
  // Abstract RPC
  ABSTRACT_RPC: 'https://api.mainnet.abs.xyz',
  
  // Block Explorer
  ABSCAN: 'https://abscan.org',
  PORTAL_PROFILE: 'https://portal.abs.xyz/profile',
} as const;

// =============================================================================
// DUNE QUERY IDS
// =============================================================================

export const DUNE_QUERIES = {
  VEABX_LOCKERS: '5947166',        // Holder list with lock details
  ABX_SUPPLY_LOCKED: '6354422',    // Total supply and locked amounts
  VEABX_SNAPSHOT: '6351427',       // Base snapshot (used by lockers query)
  ABOREAN_EPOCHS: '6341322',       // Epoch data
  VOTING_PER_EPOCH: '6576955',     // Voting statistics
  FRESH_LOCKS_WEEKLY: '6538679',   // Historical locks by week
} as const;

// =============================================================================
// TIME FILTER OPTIONS
// =============================================================================

export type TimePeriod = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

export const TIME_PERIODS: { value: TimePeriod; label: string; days: number | null }[] = [
  { value: '24h', label: '24H', days: 1 },
  { value: '7d', label: '7D', days: 7 },
  { value: '30d', label: '30D', days: 30 },
  { value: '90d', label: '90D', days: 90 },
  { value: '1y', label: '1Y', days: 365 },
  { value: 'all', label: 'All', days: null },
];

export const DEFAULT_TIME_PERIOD: TimePeriod = '7d';

// =============================================================================
// HOLDER CLASSIFICATIONS
// =============================================================================

export type HolderClassification = 
  | 'FOUNDATION'  // Aborean Foundation (always #1)
  | 'VANGUARD'    // Max lock + Maxi Vault (pure compounding)
  | 'HARVESTER'   // Rewards Vault OR consistent voting (yield extraction)
  | 'HODLER'      // Long lock, not vaulted, may or may not vote
  | 'TOURIST';    // Short lock or minimal engagement

export const CLASSIFICATION_COLORS: Record<HolderClassification, string> = {
  FOUNDATION: '#10b981', // emerald-500
  VANGUARD: '#8b5cf6',   // violet-500
  HARVESTER: '#f59e0b',  // amber-500
  HODLER: '#3b82f6',     // blue-500
  TOURIST: '#6b7280',    // gray-500
};

export const CLASSIFICATION_DESCRIPTIONS: Record<HolderClassification, string> = {
  FOUNDATION: 'Protocol treasury and team allocations',
  VANGUARD: 'Maximum conviction - max lock + Maxi Vault compounding',
  HARVESTER: 'Yield extractors - Rewards Vault or consistent voters',
  HODLER: 'Long-term believers - extended locks without vault',
  TOURIST: 'Short-term or minimal engagement',
};

// =============================================================================
// DISPLAY CONSTANTS
// =============================================================================

export const MAX_LOCK_DURATION_YEARS = 4;
export const MAX_LOCK_DURATION_SECONDS = MAX_LOCK_DURATION_YEARS * 365 * 24 * 60 * 60;

export const EPOCHS_PER_SEASON = 4;
export const SEASON_DURATION_DAYS = 28; // 4 weeks

// Current rebate rate (update manually each season if needed)
export const CURRENT_REBATE_RATE = 0.343; // 34.3%
export const CURRENT_SEASON = 4;

// =============================================================================
// CACHE TTLs (in seconds)
// =============================================================================

export const CACHE_TTL = {
  PRICE: 30,
  CHART: 300,          // 5 minutes
  TVL_VOLUME_FEES: 300,
  LOCKED_SUPPLY: 300,
  HOLDER_COUNT: 1800,  // 30 minutes
  HOLDER_TABLE: 300,
  CLASSIFICATIONS: 3600, // 1 hour
  ENS_AGW_NAMES: 86400,  // 24 hours
  EPOCH_SEASON: 3600,
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if an address is a Foundation address
 */
export function isFoundationAddress(address: string): boolean {
  return FOUNDATION_ADDRESSES.includes(address.toLowerCase() as any);
}

/**
 * Get known label for address (if exists)
 */
export function getKnownLabel(address: string): { label: string; url?: string } | null {
  const normalized = address.toLowerCase();
  
  // Check Foundation first
  if (isFoundationAddress(normalized)) {
    return { label: FOUNDATION_LABEL, url: FOUNDATION_URL };
  }
  
  // Check known labels
  return KNOWN_LABELS[normalized] || null;
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format large numbers with suffix (K, M, B)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format USD value
 */
export function formatUSD(value: number): string {
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(6)}`;
}
