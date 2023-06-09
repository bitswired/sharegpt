<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	onMount(async () => {
		console.log('Page data:', data);
		const x = await fetch('/api/me').then((res) => res.json());
		console.log(x);
	});
</script>

<div class="container h-full mx-auto flex justify-center items-center" />

<style lang="postcss">
</style>
