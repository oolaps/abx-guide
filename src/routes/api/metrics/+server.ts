/**
 * GET /api/metrics
 *
 * Returns protocol metrics: TVL, volume, fees from DeFiLlama
 * Aborean has two protocols: aborean-amm and aborean-cl (concentrated liquidity)
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const CACHE_TTL = 300; // 5 minutes

interface VolumeResponse {
	total24h?: number;
	total48hto24h?: number;
	total7d?: number;
	totalAllTime?: number;
	change_1d?: number;
}

interface FeesResponse {
	total24h?: number;
	total48hto24h?: number;
	total7d?: number;
	totalAllTime?: number;
	change_1d?: number;
}

export const GET: RequestHandler = async ({ setHeaders }) => {
	try {
		// Aborean has two protocols on DeFiLlama: AMM and CL (concentrated liquidity)
		// Use the simple /tvl/ endpoint for TVL, and fetch volume/fees separately
		const [ammTvlRes, clTvlRes, volumeRes, volumeClRes, feesRes, feesClRes] = await Promise.all([
			fetch('https://api.llama.fi/tvl/aborean-amm'),
			fetch('https://api.llama.fi/tvl/aborean-cl'),
			fetch('https://api.llama.fi/summary/dexs/aborean'),
			fetch('https://api.llama.fi/summary/dexs/aborean-cl'),
			fetch('https://api.llama.fi/summary/fees/aborean'),
			fetch('https://api.llama.fi/summary/fees/aborean-cl'),
		]);

		// Get TVL from simple endpoint (returns just a number)
		let tvl = 0;
		if (ammTvlRes.ok) {
			const ammTvl = await ammTvlRes.text();
			tvl += parseFloat(ammTvl) || 0;
		}
		if (clTvlRes.ok) {
			const clTvl = await clTvlRes.text();
			tvl += parseFloat(clTvl) || 0;
		}

		if (tvl === 0) {
			return json(
				{ error: 'Could not fetch TVL data' },
				{ status: 502 }
			);
		}

		// Aggregate volume data
		let volumeData: VolumeResponse = {};
		if (volumeRes.ok) {
			volumeData = await volumeRes.json();
		}
		if (volumeClRes.ok) {
			const clVolume: VolumeResponse = await volumeClRes.json();
			volumeData.total24h = (volumeData.total24h ?? 0) + (clVolume.total24h ?? 0);
			volumeData.total7d = (volumeData.total7d ?? 0) + (clVolume.total7d ?? 0);
		}

		// Aggregate fees data
		let feesData: FeesResponse = {};
		if (feesRes.ok) {
			feesData = await feesRes.json();
		}
		if (feesClRes.ok) {
			const clFees: FeesResponse = await feesClRes.json();
			feesData.total24h = (feesData.total24h ?? 0) + (clFees.total24h ?? 0);
			feesData.total7d = (feesData.total7d ?? 0) + (clFees.total7d ?? 0);
		}

		// Set cache headers
		setHeaders({
			'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
		});

		return json({
			tvl,
			volume: {
				total24h: volumeData.total24h || null,
				total7d: volumeData.total7d || null,
				change24h: volumeData.change_1d ?? null,
			},
			fees: {
				total24h: feesData.total24h || null,
				total7d: feesData.total7d || null,
				change24h: feesData.change_1d ?? null,
			},
		});
	} catch (error) {
		console.error('Metrics API error:', error);
		return json(
			{ error: 'Failed to fetch metrics' },
			{ status: 500 }
		);
	}
};
