<script lang="ts">
	import { onMount } from 'svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import TimePeriodFilter from '$lib/components/TimePeriodFilter.svelte';
	import HoldersTable from '$lib/components/HoldersTable.svelte';
	import { formatCompactNumber, formatUSD, formatPercent } from '$lib/constants';
	import { getAboreanEpochData, getAboreanSeasonData } from '$lib/time';

	// Types
	interface PriceData {
		price: number;
		change24h: number | null;
	}

	interface MetricsData {
		tvl: number;
		volume: { total24h: number | null; change24h: number | null };
		fees: { total24h: number | null; change24h: number | null };
	}

	interface SupplyData {
		totalSupply: number;
		lockedSupply: number;
		percentLocked: number;
	}

	interface HolderData {
		rank: number;
		address: string;
		displayName: string;
		veabxPower: number;
		percentOfTotal: number;
		numLocks: number;
		isFoundation: boolean;
	}

	interface HoldersResponse {
		holders: HolderData[];
		pagination: {
			totalCount: number;
		};
	}

	// State
	let price = $state<PriceData | null>(null);
	let metrics = $state<MetricsData | null>(null);
	let supply = $state<SupplyData | null>(null);
	let holders = $state<HolderData[]>([]);
	let holderCount = $state(0);

	let loadingPrice = $state(true);
	let loadingMetrics = $state(true);
	let loadingSupply = $state(true);
	let loadingHolders = $state(true);

	let epochData = $state(getAboreanEpochData());
	let seasonData = $state(getAboreanSeasonData());

	let searchQuery = $state('');

	onMount(() => {
		// Fetch all data
		fetchPrice();
		fetchMetrics();
		fetchSupply();
		fetchHolders();

		// Update countdowns every second
		const interval = setInterval(() => {
			epochData = getAboreanEpochData();
			seasonData = getAboreanSeasonData();
		}, 1000);

		return () => clearInterval(interval);
	});

	async function fetchPrice() {
		loadingPrice = true;
		try {
			const res = await fetch('/api/price');
			if (res.ok) {
				price = await res.json();
			}
		} catch (e) {
			console.error('Failed to fetch price:', e);
		} finally {
			loadingPrice = false;
		}
	}

	async function fetchMetrics() {
		loadingMetrics = true;
		try {
			const res = await fetch('/api/metrics');
			if (res.ok) {
				metrics = await res.json();
			}
		} catch (e) {
			console.error('Failed to fetch metrics:', e);
		} finally {
			loadingMetrics = false;
		}
	}

	async function fetchSupply() {
		loadingSupply = true;
		try {
			const res = await fetch('/api/supply');
			if (res.ok) {
				supply = await res.json();
			}
		} catch (e) {
			console.error('Failed to fetch supply:', e);
		} finally {
			loadingSupply = false;
		}
	}

	async function fetchHolders(search = '') {
		loadingHolders = true;
		try {
			const url = search ? `/api/holders?search=${encodeURIComponent(search)}` : '/api/holders';
			const res = await fetch(url);
			if (res.ok) {
				const data: HoldersResponse = await res.json();
				holders = data.holders;
				holderCount = data.pagination.totalCount;
			}
		} catch (e) {
			console.error('Failed to fetch holders:', e);
		} finally {
			loadingHolders = false;
		}
	}

	function handleSearch(query: string) {
		searchQuery = query;
		fetchHolders(query);
	}

	// Formatted values
	const priceFormatted = $derived(price ? formatUSD(price.price) : '--');
	const tvlFormatted = $derived(metrics ? formatUSD(metrics.tvl) : '--');
	const volumeFormatted = $derived(
		metrics?.volume?.total24h ? formatUSD(metrics.volume.total24h) : '--'
	);
	const feesFormatted = $derived(
		metrics?.fees?.total24h ? formatUSD(metrics.fees.total24h) : '--'
	);
	const lockedSupplyFormatted = $derived(
		supply ? formatCompactNumber(supply.lockedSupply) : '--'
	);
	const percentLockedFormatted = $derived(
		supply ? formatPercent(supply.percentLocked, 1) : '--'
	);
	const holderCountFormatted = $derived(holderCount.toLocaleString());
</script>

<svelte:head>
	<title>Ecosystem | abx.guide</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8">
	<!-- Header -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-white sm:text-3xl">Ecosystem</h1>
		<TimePeriodFilter />
	</div>

	<!-- Stats Grid - 3 columns -->
	<div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<!-- Epoch Countdown -->
		<StatCard
			label="EPOCH {epochData.epochNumber}"
			value={epochData.timeUntilEndFormatted}
			loading={false}
			subtitle="Vote before the epoch ends"
		/>

		<!-- Top Voting APR - Placeholder for now -->
		<StatCard
			label="TOP VOTING APR"
			value="Coming soon"
			loading={false}
			subtitle="Highest bribes this epoch"
			mono={false}
		/>

		<!-- Season Countdown -->
		<StatCard
			label="SEASON {seasonData.season}"
			value={seasonData.timeRemainingFormatted}
			loading={false}
			subtitle="{seasonData.rebate}% rebate rate"
		/>

		<!-- TVL -->
		<StatCard
			label="TVL"
			value={tvlFormatted}
			loading={loadingMetrics}
		/>

		<!-- Volume -->
		<StatCard
			label="VOLUME (24H)"
			value={volumeFormatted}
			loading={loadingMetrics}
			change={metrics?.volume?.change24h}
		/>

		<!-- Fees -->
		<StatCard
			label="FEES (24H)"
			value={feesFormatted}
			loading={loadingMetrics}
			change={metrics?.fees?.change24h}
		/>

		<!-- Locked Supply -->
		<StatCard
			label="LOCKED SUPPLY"
			value={lockedSupplyFormatted}
			loading={loadingSupply}
			subtitle="ABX locked in veABX"
		/>

		<!-- Percent Locked -->
		<StatCard
			label="LOCKED OF TOTAL"
			value={percentLockedFormatted}
			loading={loadingSupply}
		/>

		<!-- Holders -->
		<StatCard
			label="HOLDERS"
			value={holderCountFormatted}
			loading={loadingHolders}
		/>
	</div>

	<!-- Price Section -->
	<div class="mb-6">
		<div class="rounded-xl border border-abx-border bg-abx-card p-4">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-white">ABX Token</h2>
			</div>
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
				<!-- Price stat -->
				<div class="flex-shrink-0">
					{#if loadingPrice}
						<div class="h-10 w-32 animate-pulse rounded bg-white/10"></div>
					{:else}
						<p class="font-mono text-3xl font-bold text-white" style="font-variant-numeric: tabular-nums;">
							{priceFormatted}
						</p>
						{#if price?.change24h !== null && price?.change24h !== undefined}
							<div class="mt-1 flex items-center gap-1 {price.change24h >= 0 ? 'text-abx-green' : 'text-abx-red'}">
								{#if price.change24h >= 0}
									<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clip-rule="evenodd" />
									</svg>
								{:else}
									<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clip-rule="evenodd" />
									</svg>
								{/if}
								<span class="text-sm font-medium">
									{price.change24h >= 0 ? '+' : ''}{price.change24h.toFixed(2)}%
									<span class="text-abx-muted">24h</span>
								</span>
							</div>
						{/if}
					{/if}
				</div>

				<!-- Chart placeholder -->
				<div class="flex-1 rounded-lg border border-abx-border bg-abx-bg p-8 text-center">
					<p class="text-abx-muted">Price chart coming soon</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Holders Section - All Time -->
	<div class="mb-6">
		<HoldersTable
			title="Holders (All Time)"
			{holders}
			loading={loadingHolders}
			showSearch={true}
			onSearch={handleSearch}
		/>
	</div>

	<!-- Holders Section - This Season (placeholder) -->
	<div>
		<div class="rounded-xl border border-abx-border bg-abx-card p-8 text-center">
			<h3 class="mb-2 text-lg font-semibold text-white">Holders (Season {seasonData.season})</h3>
			<p class="text-abx-muted">Season leaderboard coming soon</p>
		</div>
	</div>
</div>
