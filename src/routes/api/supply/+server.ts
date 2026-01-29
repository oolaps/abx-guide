/**
 * GET /api/supply
 *
 * Returns ABX supply statistics queried directly from the blockchain.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getABXTotalSupply, getVeABXTotalLocked, formatTokenAmount } from '$lib/viem';

const CACHE_TTL = 60; // 1 minute

export const GET: RequestHandler = async ({ setHeaders }) => {
	try {
		// Fetch on-chain data
		const [totalSupplyRaw, lockedSupplyRaw] = await Promise.all([
			getABXTotalSupply(),
			getVeABXTotalLocked(),
		]);

		const totalSupply = formatTokenAmount(totalSupplyRaw);
		const lockedSupply = formatTokenAmount(lockedSupplyRaw);
		const percentLocked = totalSupply > 0 ? (lockedSupply / totalSupply) * 100 : 0;

		// Set cache headers
		setHeaders({
			'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
		});

		return json({
			totalSupply,
			lockedSupply,
			circulatingSupply: totalSupply - lockedSupply,
			percentLocked,
		});
	} catch (error) {
		console.error('Supply API error:', error);
		return json(
			{ error: 'Failed to fetch supply data' },
			{ status: 500 }
		);
	}
};
