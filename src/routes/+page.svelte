<script lang="ts">
	import { testDuneConnection, getABXPrice } from '$lib/dune';

	let duneResult: any = null;
	let priceResult: any = null;
	let error: string | null = null;
	let loading = false;

	async function testDune() {
		loading = true;
		error = null;
		try {
			duneResult = await testDuneConnection();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
		}
		loading = false;
	}

	async function testPrice() {
		loading = true;
		error = null;
		try {
			priceResult = await getABXPrice();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
		}
		loading = false;
	}
</script>

<main class="min-h-screen bg-abx-dark p-8">
	<h1 class="mb-4 text-4xl font-bold text-abx-green">abx.guide</h1>
	<p class="mb-8 text-gray-400">Day 1: Testing data layer</p>

	<div class="mb-8 flex gap-4">
		<button
			onclick={testDune}
			class="rounded bg-abx-green px-4 py-2 font-medium text-black hover:opacity-90"
		>
			{loading ? 'Loading...' : 'Test Dune API'}
		</button>

		<button
			onclick={testPrice}
			class="rounded bg-class-merchant px-4 py-2 font-medium text-white hover:opacity-90"
		>
			Test Price API
		</button>
	</div>

	{#if error}
		<div class="mt-4 rounded bg-red-900/50 p-4 text-red-200">
			Error: {error}
		</div>
	{/if}

	{#if duneResult}
		<div class="mt-4 rounded bg-abx-card p-4">
			<p class="mb-2 text-abx-green">✓ Dune API working!</p>
			<pre class="max-h-64 overflow-auto text-xs text-gray-400">{JSON.stringify(
					duneResult,
					null,
					2
				)}</pre>
		</div>
	{/if}

	{#if priceResult}
		<div class="mt-4 rounded bg-abx-card p-4">
			<p class="mb-2 text-abx-green">✓ Price API working!</p>
			<pre class="max-h-64 overflow-auto text-xs text-gray-400">{JSON.stringify(
					priceResult,
					null,
					2
				)}</pre>
		</div>
	{/if}
</main>
