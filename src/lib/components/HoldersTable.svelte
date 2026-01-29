<script lang="ts">
	import StrategyBadge from './StrategyBadge.svelte';
	import SearchInput from './SearchInput.svelte';
	import { formatCompactNumber, formatPercent } from '$lib/constants';

	interface Holder {
		rank: number;
		address: string;
		displayName: string;
		veabxPower: number;
		percentOfTotal: number;
		numLocks: number;
		isFoundation: boolean;
	}

	interface Props {
		holders: Holder[];
		loading?: boolean;
		title?: string;
		showSearch?: boolean;
		onSearch?: (query: string) => void;
	}

	let { holders, loading = false, title = 'Holders', showSearch = true, onSearch }: Props = $props();

	let searchQuery = $state('');

	function handleSearch(query: string) {
		searchQuery = query;
		onSearch?.(query);
	}

	function getStrategy(holder: Holder): string {
		if (holder.isFoundation) return 'Foundation';
		// Simple classification based on veABX power - can be refined later
		if (holder.veabxPower >= 1000000) return 'Vanguard';
		if (holder.veabxPower >= 100000) return 'Polymath';
		if (holder.veabxPower >= 10000) return 'Harvester';
		if (holder.veabxPower >= 1000) return 'Merchant';
		return 'Observer';
	}

	function formatVeABX(power: number): string {
		return formatCompactNumber(power);
	}
</script>

<div class="rounded-xl border border-abx-border bg-abx-card">
	<!-- Header -->
	<div class="flex flex-col gap-4 border-b border-abx-border p-4 sm:flex-row sm:items-center sm:justify-between">
		<h3 class="text-lg font-semibold text-white">{title}</h3>
		{#if showSearch}
			<div class="w-full sm:w-64">
				<SearchInput
					placeholder="Search wallet..."
					value={searchQuery}
					oninput={handleSearch}
				/>
			</div>
		{/if}
	</div>

	<!-- Table -->
	<div class="overflow-x-auto">
		<table class="w-full">
			<thead>
				<tr class="border-b border-abx-border text-left text-xs font-medium uppercase tracking-wider text-abx-muted">
					<th class="px-4 py-3">Rank</th>
					<th class="px-4 py-3">Wallet</th>
					<th class="px-4 py-3 text-right">veABX</th>
					<th class="hidden px-4 py-3 text-right sm:table-cell">Of Total</th>
					<th class="hidden px-4 py-3 text-right md:table-cell">Locks</th>
					<th class="hidden px-4 py-3 lg:table-cell">Strategy</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-abx-border">
				{#if loading}
					{#each Array(5) as _, i}
						<tr>
							<td class="px-4 py-3">
								<div class="h-5 w-8 animate-pulse rounded bg-white/10"></div>
							</td>
							<td class="px-4 py-3">
								<div class="h-5 w-32 animate-pulse rounded bg-white/10"></div>
							</td>
							<td class="px-4 py-3 text-right">
								<div class="ml-auto h-5 w-20 animate-pulse rounded bg-white/10"></div>
							</td>
							<td class="hidden px-4 py-3 text-right sm:table-cell">
								<div class="ml-auto h-5 w-12 animate-pulse rounded bg-white/10"></div>
							</td>
							<td class="hidden px-4 py-3 text-right md:table-cell">
								<div class="ml-auto h-5 w-8 animate-pulse rounded bg-white/10"></div>
							</td>
							<td class="hidden px-4 py-3 lg:table-cell">
								<div class="h-5 w-20 animate-pulse rounded bg-white/10"></div>
							</td>
						</tr>
					{/each}
				{:else if holders.length === 0}
					<tr>
						<td colspan="6" class="px-4 py-8 text-center text-abx-muted">
							No holders found
						</td>
					</tr>
				{:else}
					{#each holders as holder}
						<tr class="transition-colors hover:bg-white/5 {holder.isFoundation ? 'bg-class-foundation/5' : ''}">
							<td class="px-4 py-3">
								<span class="font-mono text-sm {holder.isFoundation ? 'text-class-foundation' : 'text-abx-muted'}">
									{holder.rank === 0 ? '0.' : `${holder.rank}.`}
								</span>
							</td>
							<td class="px-4 py-3">
								{#if holder.isFoundation}
									<a
										href="https://aborean.finance/"
										target="_blank"
										rel="noopener noreferrer"
										class="text-sm font-medium text-class-foundation hover:text-class-foundation/80"
									>
										{holder.displayName}
									</a>
								{:else}
									<a
										href="https://abscan.org/address/{holder.address}"
										target="_blank"
										rel="noopener noreferrer"
										class="font-mono text-sm text-white hover:text-abx-green"
									>
										{holder.displayName}
									</a>
								{/if}
							</td>
							<td class="px-4 py-3 text-right">
								<span class="font-mono text-sm text-white">
									{formatVeABX(holder.veabxPower)}
								</span>
							</td>
							<td class="hidden px-4 py-3 text-right sm:table-cell">
								<span class="text-sm text-abx-muted">
									{formatPercent(holder.percentOfTotal, 2)}
								</span>
							</td>
							<td class="hidden px-4 py-3 text-right md:table-cell">
								<span class="text-sm text-abx-muted">
									{holder.numLocks}
								</span>
							</td>
							<td class="hidden px-4 py-3 lg:table-cell">
								<StrategyBadge strategy={getStrategy(holder)} />
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
