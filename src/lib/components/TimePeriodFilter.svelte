<script lang="ts">
	type TimePeriod = '24h' | '7d' | '30d' | 'ytd';

	interface Props {
		selected?: TimePeriod;
		onchange?: (period: TimePeriod) => void;
	}

	let { selected = '7d', onchange }: Props = $props();

	const periods: { value: TimePeriod; label: string }[] = [
		{ value: '24h', label: '24H' },
		{ value: '7d', label: '7D' },
		{ value: '30d', label: '30D' },
		{ value: 'ytd', label: 'YTD' },
	];

	function handleSelect(period: TimePeriod) {
		selected = period;
		onchange?.(period);
	}
</script>

<div class="inline-flex rounded-lg border border-abx-border bg-abx-card p-1">
	{#each periods as period}
		<button
			type="button"
			onclick={() => handleSelect(period.value)}
			class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {selected === period.value
				? 'bg-white/10 text-white'
				: 'text-abx-muted hover:text-white'}"
		>
			{period.label}
		</button>
	{/each}
</div>
