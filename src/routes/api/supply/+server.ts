/**
 * GET /api/supply
 *
 * Returns ABX supply statistics from Dune Analytics
 * Query 6354422: ABX Supply and Locked
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DUNE_API_KEY } from '$env/static/private';

const CACHE_TTL = 300; // 5 minutes
const QUERY_ID = '6354422';

interface DuneSupplyRow {
	total_supply?: number;
	total_locked?: number;
	circulating_supply?: number;
	percent_locked?: number;
	hour?: string;
}

export const GET: RequestHandler = async ({ setHeaders }) => {
	if (!DUNE_API_KEY) {
		return json(
			{ error: 'Dune API key not configured' },
			{ status: 500 }
		);
	}

	try {
		const url = `https://api.dune.com/api/v1/query/${QUERY_ID}/results`;
		const res = await fetch(url, {
			headers: {
				'X-Dune-API-Key': DUNE_API_KEY,
			},
		});

		if (!res.ok) {
			const text = await res.text();
			console.error('Dune API error:', res.status, text);
			return json(
				{ error: `Dune API error: ${res.status}` },
				{ status: 502 }
			);
		}

		const data = await res.json();
		const rows: DuneSupplyRow[] = data.result?.rows ?? [];

		if (rows.length === 0) {
			return json(
				{ error: 'No supply data available' },
				{ status: 404 }
			);
		}

		// Get the first row (most recent hourly data - sorted desc)
		const latest = rows[0];

		const totalSupply = latest.total_supply ?? 0;
		const lockedSupply = latest.total_locked ?? 0;
		const percentLocked = latest.percent_locked ?? 0;

		// Set cache headers
		setHeaders({
			'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
		});

		return json({
			totalSupply,
			lockedSupply,
			circulatingSupply: latest.circulating_supply ?? (totalSupply - lockedSupply),
			percentLocked: percentLocked * 100, // Convert to percentage (0.76 -> 76%)
			lastUpdated: latest.hour ?? null,
			// Include historical data for charts (last 24 hours)
			history: rows.slice(0, 24).reverse().map(row => ({
				hour: row.hour,
				percentLocked: (row.percent_locked ?? 0) * 100,
				lockedSupply: row.total_locked ?? 0,
			})),
		});
	} catch (error) {
		console.error('Supply API error:', error);
		return json(
			{ error: 'Failed to fetch supply data' },
			{ status: 500 }
		);
	}
};
