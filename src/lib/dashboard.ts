import { getABXPrice, DUNE_QUERIES } from './dune';
import {
  getVeABXTotalSupply,
  getVeABXTotalLocked,
  getTotalVotingWeight,
} from './viem';

const DUNE_API_KEY = import.meta.env.VITE_DUNE_API_KEY;

// =============================================================================
// Types
// =============================================================================

export interface DashboardData {
  price: PriceData | null;
  supply: SupplyData | null;
  epoch: EpochData | null;
  error: string | null;
}

export interface PriceData {
  price: number;
  priceFormatted: string;
}

export interface SupplyData {
  totalNFTs: bigint;
  totalNFTsFormatted: string;
  totalLocked: bigint;
  totalLockedFormatted: string;
  totalVotingWeight: bigint;
  totalVotingWeightFormatted: string;
  percentLocked: number;
  percentLockedFormatted: string;
}

export interface EpochData {
  epochStart: bigint;
  epochEnd: bigint;
  timeUntilEnd: number;
  timeUntilEndFormatted: string;
}

// =============================================================================
// Formatting Helpers
// =============================================================================

/**
 * Format a bigint token amount to a human-readable string
 */
export function formatTokenAmount(amount: bigint, decimals = 18): string {
  const value = Number(amount) / Math.pow(10, decimals);
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(value: number | bigint): string {
  return Number(value).toLocaleString();
}

/**
 * Format a price to USD string
 */
export function formatPrice(price: number): string {
  if (price < 0.01) {
    return `$${price.toFixed(4)}`;
  }
  return `$${price.toFixed(2)}`;
}

/**
 * Format a percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format time remaining as "Xd Xh Xm"
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Epoch ended';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(' ');
}

// =============================================================================
// Data Fetching
// =============================================================================

/**
 * Fetch ABX price from DeFiLlama
 */
export async function fetchPrice(): Promise<PriceData> {
  const data = await getABXPrice();
  const key = 'abstract:0x4c68e4102c0f120cce9f08625bd12079806b7c4d';
  const price = data.coins[key]?.price ?? 0;
  return {
    price,
    priceFormatted: formatPrice(price),
  };
}

/**
 * Fetch veABX supply and locked data from Dune
 */
export async function fetchSupplyFromDune(): Promise<{ percentLocked: number }> {
  const response = await fetch(
    `https://api.dune.com/api/v1/query/${DUNE_QUERIES.ABX_SUPPLY_LOCKED}/results`,
    {
      headers: {
        'X-Dune-API-Key': DUNE_API_KEY || '',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Dune API error: ${response.status}`);
  }

  const data = await response.json();
  const rows = data.result?.rows ?? [];
  if (rows.length === 0) {
    throw new Error('No data from Dune query');
  }

  // Get the latest row (most recent data)
  const latest = rows[rows.length - 1];
  return {
    percentLocked: latest.percent_locked ?? 0,
  };
}

/**
 * Fetch supply data from contracts
 */
export async function fetchSupplyFromContracts(): Promise<SupplyData> {
  const [totalNFTs, totalLocked, totalVotingWeight, duneData] = await Promise.all([
    getVeABXTotalSupply(),
    getVeABXTotalLocked(),
    getTotalVotingWeight(),
    fetchSupplyFromDune().catch(() => ({ percentLocked: 0 })),
  ]);

  // Dune returns percent_locked as a ratio (0.9 = 90%), convert to percentage
  const percentLocked = duneData.percentLocked * 100;

  return {
    totalNFTs,
    totalNFTsFormatted: formatNumber(totalNFTs),
    totalLocked,
    totalLockedFormatted: formatTokenAmount(totalLocked),
    totalVotingWeight,
    totalVotingWeightFormatted: formatTokenAmount(totalVotingWeight),
    percentLocked,
    percentLockedFormatted: formatPercent(percentLocked),
  };
}

// Solidly ve(3,3) epoch constants
const EPOCH_DURATION = 7 * 24 * 60 * 60; // 1 week in seconds
// First epoch started Thursday, Oct 9, 2025 00:00:00 UTC (Aborean launch)
const EPOCH_GENESIS = 1759968000;

/**
 * Calculate epoch timing based on Solidly ve(3,3) pattern
 * Epochs run Thursday 00:00 UTC to Thursday 00:00 UTC
 */
export function getEpochData(): EpochData {
  const now = Math.floor(Date.now() / 1000);

  // Calculate current epoch number
  const epochsSinceGenesis = Math.floor((now - EPOCH_GENESIS) / EPOCH_DURATION);

  // Current epoch boundaries
  const epochStart = BigInt(EPOCH_GENESIS + epochsSinceGenesis * EPOCH_DURATION);
  const epochEnd = BigInt(EPOCH_GENESIS + (epochsSinceGenesis + 1) * EPOCH_DURATION);

  const timeUntilEnd = Number(epochEnd) - now;

  return {
    epochStart,
    epochEnd,
    timeUntilEnd,
    timeUntilEndFormatted: formatTimeRemaining(timeUntilEnd),
  };
}

/**
 * Fetch all dashboard data in parallel
 */
export async function getDashboardData(): Promise<DashboardData> {
  const [priceResult, supplyResult] = await Promise.allSettled([
    fetchPrice(),
    fetchSupplyFromContracts(),
  ]);

  // Epoch data is calculated client-side (no contract call needed)
  const epoch = getEpochData();

  return {
    price: priceResult.status === 'fulfilled' ? priceResult.value : null,
    supply: supplyResult.status === 'fulfilled' ? supplyResult.value : null,
    epoch,
    error: null,
  };
}

// =============================================================================
// Ascension Countdown (based on Abstract Chain launch + 1 year)
// =============================================================================

// Ascension date - first anniversary of Abstract mainnet
// Abstract mainnet launched January 27, 2025
const ASCENSION_DATE = new Date('2026-01-27T00:00:00Z');

export interface AscensionData {
  targetDate: Date;
  timeRemaining: number;
  timeRemainingFormatted: string;
  isPast: boolean;
}

export function getAscensionData(): AscensionData {
  const now = Date.now();
  const timeRemaining = Math.max(0, Math.floor((ASCENSION_DATE.getTime() - now) / 1000));

  return {
    targetDate: ASCENSION_DATE,
    timeRemaining,
    timeRemainingFormatted: formatTimeRemaining(timeRemaining),
    isPast: timeRemaining <= 0,
  };
}
