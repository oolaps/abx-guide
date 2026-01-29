/**
 * GET /api/profile/[address]
 *
 * Resolves wallet display name and avatar
 * Priority: Manual Label > ENS > AGW Portal > Truncated Address
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { KNOWN_LABELS, FOUNDATION_ADDRESSES, FOUNDATION_LABEL, truncateAddress } from '$lib/constants';

const CACHE_TTL = 86400; // 24 hours - names don't change often

interface WalletProfile {
	address: string;
	displayName: string;
	source: 'manual' | 'ens' | 'agw' | 'truncated';
	avatar: string | null;
	url: string;
	isFoundation: boolean;
}

async function fetchENSName(address: string): Promise<string | null> {
	try {
		// Using web3.bio API for ENS reverse lookup
		const res = await fetch(`https://api.web3.bio/ns/ens/${address}`, {
			signal: AbortSignal.timeout(3000),
		});

		if (!res.ok) return null;

		const data = await res.json();
		return data.identity || null;
	} catch {
		return null;
	}
}

async function fetchAGWProfile(address: string): Promise<{ name: string | null; avatar: string | null }> {
	try {
		const res = await fetch(
			`https://api.portal.abs.xyz/api/v1/user/profile/${address}`,
			{ signal: AbortSignal.timeout(3000) }
		);

		if (!res.ok) return { name: null, avatar: null };

		const data = await res.json();
		return {
			name: data.name?.trim() || null,
			avatar: data.avatar || data.pfp || null,
		};
	} catch {
		return { name: null, avatar: null };
	}
}

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const address = params.address?.toLowerCase();

	if (!address || !/^0x[a-f0-9]{40}$/i.test(address)) {
		return json(
			{ error: 'Invalid address format' },
			{ status: 400 }
		);
	}

	const isFoundation = FOUNDATION_ADDRESSES.includes(address as typeof FOUNDATION_ADDRESSES[number]);
	const explorerUrl = `https://abscan.org/address/${address}`;

	// 1. Check manual labels first
	if (isFoundation) {
		setHeaders({
			'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
		});

		return json({
			address,
			displayName: FOUNDATION_LABEL,
			source: 'manual',
			avatar: null,
			url: 'https://aborean.finance/',
			isFoundation: true,
		} satisfies WalletProfile);
	}

	const knownLabel = KNOWN_LABELS[address];
	if (knownLabel) {
		setHeaders({
			'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
		});

		return json({
			address,
			displayName: knownLabel.label,
			source: 'manual',
			avatar: null,
			url: knownLabel.url ?? explorerUrl,
			isFoundation: false,
		} satisfies WalletProfile);
	}

	// 2. Try ENS and AGW in parallel
	const [ensName, agwProfile] = await Promise.all([
		fetchENSName(address),
		fetchAGWProfile(address),
	]);

	// Set cache headers
	setHeaders({
		'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
	});

	// 3. ENS takes priority over AGW
	if (ensName) {
		return json({
			address,
			displayName: ensName.length > 20 ? `${ensName.slice(0, 17)}...` : ensName,
			source: 'ens',
			avatar: null, // Could fetch ENS avatar separately
			url: explorerUrl,
			isFoundation: false,
		} satisfies WalletProfile);
	}

	// 4. AGW Portal
	if (agwProfile.name) {
		return json({
			address,
			displayName: agwProfile.name.length > 20 ? `${agwProfile.name.slice(0, 17)}...` : agwProfile.name,
			source: 'agw',
			avatar: agwProfile.avatar,
			url: `https://portal.abs.xyz/profile/${address}`,
			isFoundation: false,
		} satisfies WalletProfile);
	}

	// 5. Fallback to truncated address
	return json({
		address,
		displayName: truncateAddress(address),
		source: 'truncated',
		avatar: null,
		url: explorerUrl,
		isFoundation: false,
	} satisfies WalletProfile);
};
