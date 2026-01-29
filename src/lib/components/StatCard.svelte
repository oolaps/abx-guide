<script lang="ts">
	interface Props {
		label: string;
		value?: string;
		loading?: boolean;
		error?: boolean;
		change?: number | null;
		changeLabel?: string;
		subtitle?: string;
		mono?: boolean;
	}

	let {
		label,
		value,
		loading = false,
		error = false,
		change = null,
		changeLabel,
		subtitle,
		mono = true,
	}: Props = $props();

	const isPositive = $derived(change !== null && change >= 0);
	const changeColor = $derived(isPositive ? 'text-abx-green' : 'text-abx-red');
	const changeSign = $derived(isPositive ? '+' : '');
</script>

<div class="rounded-xl border border-abx-border bg-abx-card p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
	<p class="mb-2 text-xs font-medium uppercase tracking-wider text-abx-muted">{label}</p>

	{#if loading}
		<!-- Loading skeleton -->
		<div
			class="h-8 w-28 animate-pulse rounded bg-white/10"
			role="status"
			aria-label="Loading {label}"
		></div>
	{:else if error}
		<!-- Error state -->
		<p class="text-lg text-abx-red">--</p>
	{:else}
		<!-- Value -->
		<p
			class="text-2xl font-semibold text-white {mono ? 'font-mono' : ''}"
			style="font-variant-numeric: tabular-nums;"
		>
			{value ?? '--'}
		</p>

		<!-- Change indicator -->
		{#if change !== null}
			<div class="mt-1 flex items-center gap-1 {changeColor}">
				{#if isPositive}
					<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clip-rule="evenodd" />
					</svg>
				{:else}
					<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clip-rule="evenodd" />
					</svg>
				{/if}
				<span class="text-xs font-medium">
					{changeSign}{typeof change === 'number' ? change.toFixed(2) : change}%
					{#if changeLabel}
						<span class="text-abx-muted">{changeLabel}</span>
					{/if}
				</span>
			</div>
		{/if}

		<!-- Subtitle -->
		{#if subtitle}
			<p class="mt-1 text-xs text-abx-muted">{subtitle}</p>
		{/if}
	{/if}
</div>
