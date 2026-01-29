<script lang="ts">
	type Strategy = 'Foundation' | 'Polymath' | 'Vanguard' | 'Harvester' | 'Alchemist' | 'Merchant' | 'Observer';

	interface Props {
		strategy: Strategy | string;
	}

	let { strategy }: Props = $props();

	const strategyColors: Record<string, string> = {
		foundation: 'bg-class-foundation/20 text-class-foundation border-class-foundation/30',
		polymath: 'bg-class-polymath/20 text-class-polymath border-class-polymath/30',
		vanguard: 'bg-class-vanguard/20 text-class-vanguard border-class-vanguard/30',
		harvester: 'bg-class-harvester/20 text-class-harvester border-class-harvester/30',
		alchemist: 'bg-class-alchemist/20 text-class-alchemist border-class-alchemist/30',
		merchant: 'bg-class-merchant/20 text-class-merchant border-class-merchant/30',
		observer: 'bg-class-observer/20 text-class-observer border-class-observer/30',
	};

	const colorClass = $derived(strategyColors[strategy.toLowerCase()] ?? strategyColors.observer);
</script>

<span class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium {colorClass}">
	{strategy}
</span>
