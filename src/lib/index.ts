/**
 * Aborean Dashboard Library
 * 
 * Central exports for all utilities, constants, and API functions
 */

// Contract configuration
export * from './contracts';

// Constants and known data
export * from './constants';

// Time utilities (epoch, season calculations)
// Note: EPOCHS_PER_SEASON is exported from both, constants takes precedence
export {
  WEEK,
  HOUR,
  epochStart,
  epochNext,
  epochVoteStart,
  epochVoteEnd,
  getEpochNumber,
  isVotingOpen,
  getSeasonNumber,
  getEpochInSeason,
  getEpochsRemainingInSeason,
  getSeasonEndTimestamp,
  getEpochData,
  getSeasonData,
  formatDuration,
  getCountdownColor,
  formatTimestamp,
  getDayOfWeek,
  isPast,
  now,
  SEASONS,
  EPOCH_GENESIS,
  getAboreanEpochNumber,
  getAboreanSeasonData,
  getAboreanEpochData,
  type EpochData,
  type SeasonData,
  type FormattedDuration,
  type SeasonConfig,
  type AboreanSeasonData,
  type AboreanEpochData,
} from './time';

// API utilities (DeFiLlama, Dune, AGW)
export * from './api';

// Viem client and on-chain reads
export * from './viem';
