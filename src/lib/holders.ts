/**
 * On-chain veABX Holders Query
 *
 * Queries the veABX contract directly to build the holders leaderboard
 * without relying on Dune Analytics.
 *
 * Key concepts:
 * - veABX is an ERC721 where each NFT represents a lock
 * - Voting power decays linearly over time (max 4 years)
 * - Permanent locks don't decay
 * - Locks can be deposited into vaults (Maxi or Rewards)
 * - When vaulted, the lock's voting power is managed by the vault
 * - Accrued rewards in vault can be queried before withdrawal
 */

import { publicClient, formatTokenAmount } from './viem';
import { CONTRACTS, VEABX_ABI, LOCKED_MANAGED_REWARD_ABI } from './contracts';
import {
	FOUNDATION_ADDRESSES,
	FOUNDATION_LABEL,
	KNOWN_LABELS,
	isFoundationAddress,
} from './constants';

// =============================================================================
// TYPES
// =============================================================================

// EscrowType enum from VotingEscrow contract
const ESCROW_TYPE = {
	NORMAL: 0,
	LOCKED: 1,  // Deposited in vault
	MANAGED: 2, // The vault's managed NFT
} as const;

export interface LockData {
	tokenId: bigint;
	owner: string;
	amount: bigint; // Locked ABX
	votingPower: bigint; // Current voting power
	escrowType: number;
	managedTokenId: bigint; // If LOCKED, which managed NFT it's in
	weight: bigint; // Weight in managed NFT (for LOCKED tokens)
	accruedRewards: bigint; // Pending rewards in vault (for LOCKED tokens)
	isPermanent: boolean;
}

export interface HolderData {
	address: string;
	displayName: string;
	lockedAmount: number; // Total ABX locked
	votingPower: number; // Total veABX power
	accruedRewards: number; // Pending vault rewards
	numLocks: number;
	numLocksVaulted: number;
	lockIds: bigint[];
	isFoundation: boolean;
	rank: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const VEABX_ADDRESS = CONTRACTS.VEABX as `0x${string}`;
const ABX_ADDRESS = CONTRACTS.ABX_TOKEN as `0x${string}`;
const MAXI_VAULT = CONTRACTS.MAXI_VAULT.toLowerCase();
const REWARDS_VAULT = CONTRACTS.REWARDS_VAULT.toLowerCase();

// Batch size for multicall queries
const BATCH_SIZE = 100;

// Cache for holder data
let holdersCache: { data: HolderData[]; timestamp: number; totalVeABX: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache for managed NFT reward contracts
const managedToLockedCache = new Map<string, string>();

// =============================================================================
// CONTRACT READS
// =============================================================================

async function getMaxTokenId(): Promise<bigint> {
	return publicClient.readContract({
		address: VEABX_ADDRESS,
		abi: VEABX_ABI,
		functionName: 'tokenId',
	});
}

async function getManagedToLocked(mTokenId: bigint): Promise<string> {
	const cacheKey = mTokenId.toString();
	if (managedToLockedCache.has(cacheKey)) {
		return managedToLockedCache.get(cacheKey)!;
	}

	const address = await publicClient.readContract({
		address: VEABX_ADDRESS,
		abi: VEABX_ABI,
		functionName: 'managedToLocked',
		args: [mTokenId],
	}) as string;

	managedToLockedCache.set(cacheKey, address);
	return address;
}

/**
 * Fetch lock data for a batch of token IDs using multicall
 */
async function fetchLockBatch(tokenIds: bigint[]): Promise<LockData[]> {
	const results: LockData[] = [];

	// First pass: get basic info (owner, locked, balanceOfNFT, escrowType)
	const basicCalls = tokenIds.flatMap((tokenId) => [
		{
			address: VEABX_ADDRESS,
			abi: VEABX_ABI,
			functionName: 'ownerOf',
			args: [tokenId],
		},
		{
			address: VEABX_ADDRESS,
			abi: VEABX_ABI,
			functionName: 'locked',
			args: [tokenId],
		},
		{
			address: VEABX_ADDRESS,
			abi: VEABX_ABI,
			functionName: 'balanceOfNFT',
			args: [tokenId],
		},
		{
			address: VEABX_ADDRESS,
			abi: VEABX_ABI,
			functionName: 'escrowType',
			args: [tokenId],
		},
	]);

	try {
		const basicResults = await publicClient.multicall({
			contracts: basicCalls as any,
			allowFailure: true,
		});

		// Parse basic results
		const pendingLockData: {
			tokenId: bigint;
			owner: string;
			amount: bigint;
			isPermanent: boolean;
			votingPower: bigint;
			escrowType: number;
		}[] = [];

		for (let i = 0; i < tokenIds.length; i++) {
			const tokenId = tokenIds[i];
			const ownerResult = basicResults[i * 4];
			const lockedResult = basicResults[i * 4 + 1];
			const powerResult = basicResults[i * 4 + 2];
			const escrowResult = basicResults[i * 4 + 3];

			if (ownerResult.status !== 'success' || !ownerResult.result) continue;

			const owner = (ownerResult.result as string).toLowerCase();
			if (owner === '0x0000000000000000000000000000000000000000') continue;

			const locked = lockedResult.status === 'success'
				? lockedResult.result as [bigint, bigint, boolean]
				: [0n, 0n, false];
			const amount = locked[0];
			const isPermanent = locked[2];
			const escrowType = escrowResult.status === 'success'
				? Number(escrowResult.result)
				: ESCROW_TYPE.NORMAL;

			// Skip managed NFTs (they belong to vaults, not users)
			if (escrowType === ESCROW_TYPE.MANAGED) continue;

			// For LOCKED tokens, amount is 0 but we track them separately
			// For NORMAL tokens, skip if no amount
			if (escrowType === ESCROW_TYPE.NORMAL && amount <= 0n) continue;

			const votingPower = powerResult.status === 'success' ? powerResult.result as bigint : 0n;

			pendingLockData.push({
				tokenId,
				owner,
				amount,
				isPermanent,
				votingPower,
				escrowType,
			});
		}

		// Second pass: for LOCKED tokens, get their weight and managed NFT info
		const lockedTokens = pendingLockData.filter(l => l.escrowType === ESCROW_TYPE.LOCKED);

		if (lockedTokens.length > 0) {
			// Get idToManaged for locked tokens
			const managedCalls = lockedTokens.map((l) => ({
				address: VEABX_ADDRESS,
				abi: VEABX_ABI,
				functionName: 'idToManaged',
				args: [l.tokenId],
			}));

			const managedResults = await publicClient.multicall({
				contracts: managedCalls as any,
				allowFailure: true,
			});

			// Get weights and accrued rewards
			const weightCalls: any[] = [];
			const rewardCalls: any[] = [];
			const lockedRewardAddresses: string[] = [];

			for (let i = 0; i < lockedTokens.length; i++) {
				const mTokenId = managedResults[i].status === 'success'
					? managedResults[i].result as bigint
					: 0n;

				if (mTokenId > 0n) {
					weightCalls.push({
						address: VEABX_ADDRESS,
						abi: VEABX_ABI,
						functionName: 'weights',
						args: [lockedTokens[i].tokenId, mTokenId],
					});

					// Get the LockedManagedReward contract address
					const lockedRewardAddr = await getManagedToLocked(mTokenId);
					lockedRewardAddresses.push(lockedRewardAddr);

					rewardCalls.push({
						address: lockedRewardAddr as `0x${string}`,
						abi: LOCKED_MANAGED_REWARD_ABI,
						functionName: 'earned',
						args: [ABX_ADDRESS, lockedTokens[i].tokenId],
					});
				}
			}

			const [weightResults, rewardResults] = await Promise.all([
				weightCalls.length > 0
					? publicClient.multicall({ contracts: weightCalls, allowFailure: true })
					: [],
				rewardCalls.length > 0
					? publicClient.multicall({ contracts: rewardCalls, allowFailure: true })
					: [],
			]);

			// Build lock data for locked tokens
			let weightIdx = 0;
			for (let i = 0; i < lockedTokens.length; i++) {
				const l = lockedTokens[i];
				const mTokenId = managedResults[i].status === 'success'
					? managedResults[i].result as bigint
					: 0n;

				let weight = 0n;
				let accruedRewards = 0n;

				if (mTokenId > 0n && weightIdx < (weightResults as any[]).length) {
					weight = (weightResults as any[])[weightIdx]?.status === 'success'
						? (weightResults as any[])[weightIdx].result as bigint
						: 0n;
					accruedRewards = (rewardResults as any[])[weightIdx]?.status === 'success'
						? (rewardResults as any[])[weightIdx].result as bigint
						: 0n;
					weightIdx++;
				}

				results.push({
					tokenId: l.tokenId,
					owner: l.owner,
					amount: weight, // For vaulted locks, use weight as the "amount"
					votingPower: weight, // Vaulted locks contribute their weight as voting power
					escrowType: l.escrowType,
					managedTokenId: mTokenId,
					weight,
					accruedRewards,
					isPermanent: true, // Vaulted locks are always permanent in effect
				});
			}
		}

		// Add normal (non-vaulted) tokens
		for (const l of pendingLockData) {
			if (l.escrowType === ESCROW_TYPE.NORMAL) {
				results.push({
					tokenId: l.tokenId,
					owner: l.owner,
					amount: l.amount,
					votingPower: l.votingPower,
					escrowType: l.escrowType,
					managedTokenId: 0n,
					weight: 0n,
					accruedRewards: 0n,
					isPermanent: l.isPermanent,
				});
			}
		}
	} catch (error) {
		console.error('Multicall batch failed:', error);
	}

	return results;
}

async function fetchAllLocks(): Promise<LockData[]> {
	console.log('Fetching veABX locks from chain...');

	const maxTokenId = await getMaxTokenId();
	console.log(`Max token ID: ${maxTokenId}`);

	const allLocks: LockData[] = [];

	for (let start = 1n; start <= maxTokenId; start += BigInt(BATCH_SIZE)) {
		const end = start + BigInt(BATCH_SIZE) - 1n > maxTokenId ? maxTokenId : start + BigInt(BATCH_SIZE) - 1n;
		const tokenIds: bigint[] = [];

		for (let id = start; id <= end; id++) {
			tokenIds.push(id);
		}

		const batchLocks = await fetchLockBatch(tokenIds);
		allLocks.push(...batchLocks);

		if ((Number(start) / BATCH_SIZE) % 10 === 0) {
			console.log(`Processed ${start} / ${maxTokenId} tokens...`);
		}
	}

	console.log(`Fetched ${allLocks.length} active locks`);
	return allLocks;
}

// =============================================================================
// AGGREGATION
// =============================================================================

function aggregateHolders(locks: LockData[]): HolderData[] {
	const holderMap = new Map<string, {
		locks: LockData[];
		totalAmount: bigint;
		totalPower: bigint;
		totalAccrued: bigint;
		vaultedCount: number;
	}>();

	for (const lock of locks) {
		const owner = lock.owner;
		const existing = holderMap.get(owner) || {
			locks: [],
			totalAmount: 0n,
			totalPower: 0n,
			totalAccrued: 0n,
			vaultedCount: 0,
		};

		existing.locks.push(lock);
		existing.totalAmount += lock.amount;
		existing.totalPower += lock.votingPower;
		existing.totalAccrued += lock.accruedRewards;

		if (lock.escrowType === ESCROW_TYPE.LOCKED) {
			existing.vaultedCount++;
		}

		holderMap.set(owner, existing);
	}

	const holders: HolderData[] = [];

	for (const [address, data] of holderMap) {
		let displayName = KNOWN_LABELS[address]?.label;
		if (!displayName) {
			displayName = `${address.slice(0, 7)}...${address.slice(-5)}`;
		}

		holders.push({
			address,
			displayName,
			lockedAmount: formatTokenAmount(data.totalAmount),
			votingPower: formatTokenAmount(data.totalPower),
			accruedRewards: formatTokenAmount(data.totalAccrued),
			numLocks: data.locks.length,
			numLocksVaulted: data.vaultedCount,
			lockIds: data.locks.map((l) => l.tokenId),
			isFoundation: isFoundationAddress(address),
			rank: 0,
		});
	}

	return holders;
}

function aggregateFoundation(holders: HolderData[]): HolderData[] {
	const foundationHolders = holders.filter((h) => h.isFoundation);
	const nonFoundationHolders = holders.filter((h) => !h.isFoundation);

	if (foundationHolders.length === 0) {
		return nonFoundationHolders;
	}

	const foundationAggregate: HolderData = {
		address: FOUNDATION_ADDRESSES[0],
		displayName: FOUNDATION_LABEL,
		lockedAmount: foundationHolders.reduce((sum, h) => sum + h.lockedAmount, 0),
		votingPower: foundationHolders.reduce((sum, h) => sum + h.votingPower, 0),
		accruedRewards: foundationHolders.reduce((sum, h) => sum + h.accruedRewards, 0),
		numLocks: foundationHolders.reduce((sum, h) => sum + h.numLocks, 0),
		numLocksVaulted: foundationHolders.reduce((sum, h) => sum + h.numLocksVaulted, 0),
		lockIds: foundationHolders.flatMap((h) => h.lockIds),
		isFoundation: true,
		rank: 0,
	};

	return [foundationAggregate, ...nonFoundationHolders];
}

function rankHolders(holders: HolderData[]): HolderData[] {
	const sorted = [...holders].sort((a, b) => b.votingPower - a.votingPower);

	let rank = 1;
	for (const holder of sorted) {
		if (holder.isFoundation) {
			holder.rank = 0;
		} else {
			holder.rank = rank++;
		}
	}

	return sorted.sort((a, b) => {
		if (a.isFoundation) return -1;
		if (b.isFoundation) return 1;
		return a.rank - b.rank;
	});
}

// =============================================================================
// PUBLIC API
// =============================================================================

export async function getHolders(options?: {
	forceRefresh?: boolean;
	search?: string;
	page?: number;
	limit?: number;
}): Promise<{
	holders: HolderData[];
	totalCount: number;
	totalVeABX: number;
}> {
	const { forceRefresh = false, search = '', page = 1, limit = 50 } = options || {};

	const now = Date.now();
	if (!forceRefresh && holdersCache && (now - holdersCache.timestamp) < CACHE_TTL) {
		let holders = holdersCache.data;

		if (search) {
			const searchLower = search.toLowerCase();
			holders = holders.filter(
				(h) =>
					h.address.toLowerCase().includes(searchLower) ||
					h.displayName.toLowerCase().includes(searchLower)
			);
		}

		const totalCount = holders.length;
		const start = (page - 1) * limit;
		const paginatedHolders = holders.slice(start, start + limit);

		return { holders: paginatedHolders, totalCount, totalVeABX: holdersCache.totalVeABX };
	}

	const locks = await fetchAllLocks();
	let holders = aggregateHolders(locks);
	holders = aggregateFoundation(holders);
	holders = rankHolders(holders);

	const totalVeABX = holders.reduce((sum, h) => sum + h.votingPower, 0);
	holdersCache = { data: holders, timestamp: now, totalVeABX };

	let filteredHolders = holders;
	if (search) {
		const searchLower = search.toLowerCase();
		filteredHolders = holders.filter(
			(h) =>
				h.address.toLowerCase().includes(searchLower) ||
				h.displayName.toLowerCase().includes(searchLower)
		);
	}

	const totalCount = filteredHolders.length;
	const start = (page - 1) * limit;
	const paginatedHolders = filteredHolders.slice(start, start + limit);

	return { holders: paginatedHolders, totalCount, totalVeABX };
}

export function calculatePercentOfTotal(votingPower: number, totalVeABX: number): number {
	if (totalVeABX === 0) return 0;
	return (votingPower / totalVeABX) * 100;
}
