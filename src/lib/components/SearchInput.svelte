<script lang="ts">
	interface Props {
		value?: string;
		placeholder?: string;
		oninput?: (value: string) => void;
	}

	let { value = '', placeholder = 'Search...', oninput }: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		oninput?.(value);
	}
</script>

<div class="relative">
	<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
		<svg class="h-4 w-4 text-abx-muted" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
		</svg>
	</div>
	<input
		type="text"
		{value}
		{placeholder}
		oninput={handleInput}
		class="w-full rounded-lg border border-abx-border bg-abx-card py-2 pl-10 pr-4 text-sm text-white placeholder-abx-muted focus:border-abx-green focus:outline-none focus:ring-1 focus:ring-abx-green"
	/>
</div>
