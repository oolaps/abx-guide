/**
 * GET /api/price
 *
 * Returns ABX token price from DeFiLlama with 24h change
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CONTRACTS } from '$lib/contracts';

const CACHE_TTL = 30; // seconds

export const GET: RequestHandler = async ({ setHeaders }) => {
	const coinId = `abstract:${CONTRACTS.ABX_TOKEN}`;
	const url = `https://coins.llama.fi/prices/current/${coinId}?searchWidth=4h`;

	try {
		const res = await fetch(url);

		if (!res.ok) {
			return json(
				{ error: `DeFiLlama API error: ${res.status}` },
				{ status: 502 }
			);
		}

		const data = await res.json();
		const coin = data.coins?.[coinId];

		if (!coin) {
			return json(
				{ error: 'ABX price not found' },
				{ status: 404 }
			);
		}

		// Set cache headers
		setHeaders({
			'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
		});

		return json({
			price: coin.price,
			symbol: coin.symbol ?? 'ABX',
			change24h: coin.change24h ?? null,
			timestamp: coin.timestamp,
			confidence: coin.confidence ?? null,
		});
	} catch (error) {
		console.error('Price API error:', error);
		return json(
			{ error: 'Failed to fetch price' },
			{ status: 500 }
		);
	}
};
