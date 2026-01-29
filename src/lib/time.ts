/**
 * Aborean Protocol Time Utilities
 * 
 * Epoch and season calculations based on ProtocolTimeLibrary.sol
 * 
 * Key timing:
 * - Epochs are 7 days (1 week)
 * - Epochs start Thursday 00:00 UTC
 * - Voting opens 1 hour after epoch start
 * - Voting closes 1 hour before epoch end (Wednesday 23:00 UTC)
 * - Seasons are 4 epochs (28 days)
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** One week in seconds */
export const WEEK = 7 * 24 * 60 * 60; // 604800

/** One hour in seconds */
export const HOUR = 60 * 60; // 3600

/** Number of epochs per season */
export const EPOCHS_PER_SEASON = 4;

// =============================================================================
// EPOCH CALCULATIONS
// From ProtocolTimeLibrary.sol
// =============================================================================

/**
 * Get the start timestamp of the current epoch
 * Epochs align to Unix week boundaries (Thursday 00:00 UTC)
 */
export function epochStart(timestamp: number): number {
  return timestamp - (timestamp % WEEK);
}

/**
 * Get the start timestamp of the next epoch (end of current epoch)
 */
export function epochNext(timestamp: number): number {
  return epochStart(timestamp) + WEEK;
}

/**
 * Get the timestamp when voting opens for the current epoch
 * (1 hour after epoch start)
 */
export function epochVoteStart(timestamp: number): number {
  return epochStart(timestamp) + HOUR;
}

/**
 * Get the timestamp when voting closes for the current epoch
 * (1 hour before epoch end = Wednesday 23:00 UTC)
 */
export function epochVoteEnd(timestamp: number): number {
  return epochNext(timestamp) - HOUR;
}

/**
 * Calculate the epoch number from a timestamp
 * Epochs are numbered starting from Unix epoch week 0
 */
export function getEpochNumber(timestamp: number): number {
  return Math.floor(timestamp / WEEK);
}

/**
 * Check if voting is currently open
 */
export function isVotingOpen(timestamp: number): boolean {
  const voteStart = epochVoteStart(timestamp);
  const voteEnd = epochVoteEnd(timestamp);
  return timestamp >= voteStart && timestamp < voteEnd;
}

// =============================================================================
// SEASON CALCULATIONS
// =============================================================================

/**
 * Get the current season number (1-indexed)
 * Season 1 started at a specific epoch - we calculate based on epoch number
 */
export function getSeasonNumber(timestamp: number): number {
  const epochNum = getEpochNumber(timestamp);
  // Seasons are 1-indexed, so we add 1 after dividing
  return Math.floor((epochNum - 1) / EPOCHS_PER_SEASON) + 1;
}

/**
 * Get which epoch within the season (1-4)
 */
export function getEpochInSeason(timestamp: number): number {
  const epochNum = getEpochNumber(timestamp);
  return ((epochNum - 1) % EPOCHS_PER_SEASON) + 1;
}

/**
 * Get number of epochs remaining in current season
 */
export function getEpochsRemainingInSeason(timestamp: number): number {
  return EPOCHS_PER_SEASON - getEpochInSeason(timestamp);
}

/**
 * Get the timestamp when the current season ends
 */
export function getSeasonEndTimestamp(timestamp: number): number {
  const seasonNum = getSeasonNumber(timestamp);
  const seasonEndEpoch = seasonNum * EPOCHS_PER_SEASON;
  // Season ends when the last epoch ends (start of next season's first epoch)
  return (seasonEndEpoch + 1) * WEEK;
}

// =============================================================================
// COMPREHENSIVE DATA FUNCTIONS
// =============================================================================

export interface EpochData {
  /** Current epoch number */
  epochNumber: number;
  /** Timestamp when current epoch started */
  epochStartTimestamp: number;
  /** Timestamp when current epoch ends */
  epochEndTimestamp: number;
  /** Timestamp when voting opened */
  votingStartTimestamp: number;
  /** Timestamp when voting closes */
  votingEndTimestamp: number;
  /** Seconds until voting ends */
  secondsUntilVotingEnds: number;
  /** Whether voting is currently open */
  isVotingOpen: boolean;
  /** Seconds until epoch ends */
  secondsUntilEpochEnds: number;
}

/**
 * Get comprehensive epoch data
 */
export function getEpochData(timestamp?: number): EpochData {
  const now = timestamp ?? Math.floor(Date.now() / 1000);
  
  const epochStartTs = epochStart(now);
  const epochEndTs = epochNext(now);
  const votingStartTs = epochVoteStart(now);
  const votingEndTs = epochVoteEnd(now);
  
  return {
    epochNumber: getEpochNumber(now),
    epochStartTimestamp: epochStartTs,
    epochEndTimestamp: epochEndTs,
    votingStartTimestamp: votingStartTs,
    votingEndTimestamp: votingEndTs,
    secondsUntilVotingEnds: Math.max(0, votingEndTs - now),
    isVotingOpen: isVotingOpen(now),
    secondsUntilEpochEnds: Math.max(0, epochEndTs - now),
  };
}

export interface SeasonData {
  /** Current season number */
  seasonNumber: number;
  /** Which epoch within the season (1-4) */
  epochInSeason: number;
  /** Epochs remaining in season */
  epochsRemaining: number;
  /** Timestamp when season ends */
  seasonEndTimestamp: number;
  /** Seconds until season ends */
  secondsUntilSeasonEnds: number;
}

/**
 * Get comprehensive season data
 */
export function getSeasonData(timestamp?: number): SeasonData {
  const now = timestamp ?? Math.floor(Date.now() / 1000);
  
  const seasonEndTs = getSeasonEndTimestamp(now);
  
  return {
    seasonNumber: getSeasonNumber(now),
    epochInSeason: getEpochInSeason(now),
    epochsRemaining: getEpochsRemainingInSeason(now),
    seasonEndTimestamp: seasonEndTs,
    secondsUntilSeasonEnds: Math.max(0, seasonEndTs - now),
  };
}

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

export interface FormattedDuration {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Formatted string like "2d 14h 32m" */
  formatted: string;
  /** Short format like "2d 14h" */
  short: string;
  /** Whether this is urgent (< 1 hour) */
  isUrgent: boolean;
  /** Whether this is a warning (< 24 hours) */
  isWarning: boolean;
}

/**
 * Format seconds into a human-readable duration
 */
export function formatDuration(totalSeconds: number): FormattedDuration {
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  let formatted: string;
  let short: string;
  
  if (days > 0) {
    formatted = `${days}d ${hours}h ${minutes}m`;
    short = `${days}d ${hours}h`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${seconds}s`;
    short = `${hours}h ${minutes}m`;
  } else {
    formatted = `${minutes}m ${seconds}s`;
    short = `${minutes}m ${seconds}s`;
  }
  
  return {
    days,
    hours,
    minutes,
    seconds,
    formatted,
    short,
    isUrgent: totalSeconds < HOUR,
    isWarning: totalSeconds < 24 * HOUR && totalSeconds >= HOUR,
  };
}

/**
 * Get countdown color based on time remaining
 */
export function getCountdownColor(seconds: number): 'default' | 'warning' | 'urgent' {
  if (seconds < HOUR) return 'urgent';
  if (seconds < 24 * HOUR) return 'warning';
  return 'default';
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

/**
 * Format a Unix timestamp to a readable date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

/**
 * Get the day of week for a timestamp
 */
export function getDayOfWeek(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  });
}

/**
 * Check if a timestamp is in the past
 */
export function isPast(timestamp: number): boolean {
  return timestamp < Math.floor(Date.now() / 1000);
}

/**
 * Get current Unix timestamp
 */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}

// =============================================================================
// SEASON CONFIGURATION
// Based on Aborean protocol design
// =============================================================================

export interface SeasonConfig {
  season: number;
  startEpoch: number;
  endEpoch: number;
  rebate: number; // Rebate percentage for this season
}

export const SEASONS: SeasonConfig[] = [
  { season: 1, startEpoch: 1, endEpoch: 6, rebate: 100 },
  { season: 2, startEpoch: 7, endEpoch: 10, rebate: 70 },
  { season: 3, startEpoch: 11, endEpoch: 14, rebate: 49 },
  { season: 4, startEpoch: 15, endEpoch: 18, rebate: 34.3 },
  { season: 5, startEpoch: 19, endEpoch: 22, rebate: 24 },
  { season: 6, startEpoch: 23, endEpoch: 26, rebate: 16.8 },
  { season: 7, startEpoch: 27, endEpoch: 30, rebate: 11.8 },
  { season: 8, startEpoch: 31, endEpoch: 34, rebate: 8.2 },
];

// Epoch genesis: First epoch started Thursday, Oct 9, 2025 00:00:00 UTC (Aborean launch)
export const EPOCH_GENESIS = 1759968000;

/**
 * Get the Aborean epoch number for a given timestamp
 * Epochs started at EPOCH_GENESIS, numbered from 1
 */
export function getAboreanEpochNumber(timestamp?: number): number {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const epochsSinceGenesis = Math.floor((ts - EPOCH_GENESIS) / WEEK);
  return epochsSinceGenesis + 1; // Epochs are 1-indexed
}

export interface AboreanSeasonData {
  season: number;
  rebate: number;
  epochsRemaining: number;
  currentEpoch: number;
  seasonStartEpoch: number;
  seasonEndEpoch: number;
  timeRemainingSeconds: number;
  timeRemainingFormatted: string;
}

/**
 * Get comprehensive season data for the current timestamp
 */
export function getAboreanSeasonData(timestamp?: number): AboreanSeasonData {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const currentEpoch = getAboreanEpochNumber(ts);

  // Find the current season in the predefined list
  const season = SEASONS.find(s => currentEpoch >= s.startEpoch && currentEpoch <= s.endEpoch);

  if (season) {
    // We're in a predefined season
    const epochsRemaining = season.endEpoch - currentEpoch;
    const seasonEndTimestamp = EPOCH_GENESIS + (season.endEpoch * WEEK);
    const timeRemainingSeconds = Math.max(0, seasonEndTimestamp - ts);

    return {
      season: season.season,
      rebate: season.rebate,
      epochsRemaining,
      currentEpoch,
      seasonStartEpoch: season.startEpoch,
      seasonEndEpoch: season.endEpoch,
      timeRemainingSeconds,
      timeRemainingFormatted: formatDuration(timeRemainingSeconds).formatted,
    };
  }

  // Past the last defined season - calculate dynamically
  const lastSeason = SEASONS[SEASONS.length - 1];
  const epochsPerSeason = 4;

  // Calculate how many seasons past the last defined one
  const epochsPastLastSeason = currentEpoch - lastSeason.endEpoch;
  const seasonsPastLast = Math.ceil(epochsPastLastSeason / epochsPerSeason);
  const seasonNumber = lastSeason.season + seasonsPastLast;

  // Calculate the start and end epochs for this dynamic season
  const seasonStartEpoch = lastSeason.endEpoch + 1 + (seasonsPastLast - 1) * epochsPerSeason;
  const seasonEndEpoch = seasonStartEpoch + epochsPerSeason - 1;

  // Calculate rebate with 30% decay per season
  // Season 8: 8.2%, Season 9: 8.2 * 0.7, Season 10: 8.2 * 0.7^2, etc.
  const rebate = lastSeason.rebate * Math.pow(0.7, seasonsPastLast);

  const epochsRemaining = seasonEndEpoch - currentEpoch;
  const seasonEndTimestamp = EPOCH_GENESIS + (seasonEndEpoch * WEEK);
  const timeRemainingSeconds = Math.max(0, seasonEndTimestamp - ts);

  return {
    season: seasonNumber,
    rebate: Math.round(rebate * 100) / 100, // Round to 2 decimal places
    epochsRemaining,
    currentEpoch,
    seasonStartEpoch,
    seasonEndEpoch,
    timeRemainingSeconds,
    timeRemainingFormatted: formatDuration(timeRemainingSeconds).formatted,
  };
}

export interface AboreanEpochData {
  epochNumber: number;
  epochStartTimestamp: number;
  epochEndTimestamp: number;
  timeUntilEndSeconds: number;
  timeUntilEndFormatted: string;
  isVotingOpen: boolean;
  votingEndsAt: number;
}

/**
 * Get comprehensive epoch data for the current timestamp
 */
export function getAboreanEpochData(timestamp?: number): AboreanEpochData {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const epochNumber = getAboreanEpochNumber(ts);

  // Calculate epoch boundaries
  const epochsSinceGenesis = epochNumber - 1;
  const epochStartTimestamp = EPOCH_GENESIS + (epochsSinceGenesis * WEEK);
  const epochEndTimestamp = epochStartTimestamp + WEEK;

  // Voting window: opens 1 hour after epoch start, closes 1 hour before epoch end
  const votingStart = epochStartTimestamp + HOUR;
  const votingEnd = epochEndTimestamp - HOUR;

  const timeUntilEndSeconds = Math.max(0, epochEndTimestamp - ts);

  return {
    epochNumber,
    epochStartTimestamp,
    epochEndTimestamp,
    timeUntilEndSeconds,
    timeUntilEndFormatted: formatDuration(timeUntilEndSeconds).formatted,
    isVotingOpen: ts >= votingStart && ts < votingEnd,
    votingEndsAt: votingEnd,
  };
}
