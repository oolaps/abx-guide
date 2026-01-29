<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
</svelte:head>

<div class="flex min-h-screen">
	<Sidebar />

	<!-- Main content area -->
	<main class="flex-1 pt-14 lg:ml-60 lg:pt-0">
		<div class="min-h-screen">
			{@render children()}
		</div>
	</main>
</div>
