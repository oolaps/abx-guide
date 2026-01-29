/**
 * GET /api/holders
 *
 * Returns veABX holder leaderboard queried directly from the blockchain.
 *
 * Features:
 * - Real-time on-chain data (no Dune dependency)
 * - Vaulted locks attributed to original depositors
 * - Accrued vault rewards shown before withdrawal
 * - Foundation addresses aggregated as single entry
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getHolders, calculatePercentOfTotal } from '$lib/holders';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	// Parse query params
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 100);
	const search = url.searchParams.get('search')?.toLowerCase() ?? '';
	const forceRefresh = url.searchParams.get('refresh') === 'true';

	try {
		const { holders, totalCount, totalVeABX } = await getHolders({
			forceRefresh,
			search,
			page,
			limit,
		});

		// Transform to API response format
		const transformedHolders = holders.map((h) => ({
			rank: h.rank,
			address: h.address,
			displayName: h.displayName,
			veabxPower: h.votingPower,
			percentOfTotal: calculatePercentOfTotal(h.votingPower, totalVeABX),
			numLocks: h.numLocks,
			numLocksVaulted: h.numLocksVaulted,
			lockIds: h.lockIds.map((id) => id.toString()),
			isFoundation: h.isFoundation,
			accruedRewards: h.accruedRewards,
		}));

		// Set cache headers
		setHeaders({
			'Cache-Control': 'public, max-age=60, s-maxage=60',
		});

		return json({
			holders: transformedHolders,
			pagination: {
				page,
				limit,
				totalCount,
				totalPages: Math.ceil(totalCount / limit),
			},
			totalVeABX,
		});
	} catch (error) {
		console.error('Holders API error:', error);
		return json(
			{ error: 'Failed to fetch holders' },
			{ status: 500 }
		);
	}
};
