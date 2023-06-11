<script lang="ts">
	// The ordering of these imports is critical to your app working properly
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	// Most of your app wide CSS should be put in this file
	import Me from '$lib/components/header/Me.svelte';
	import Navigation from '$lib/components/header/Navigation.svelte';
	import { useMeStore } from '$lib/stores';
	import { AppBar, AppShell, LightSwitch } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import '../app.postcss';

	const meStore = useMeStore();

	onMount(async () => {
		const x = await fetch('/api/me');
		if (x.ok) {
			meStore.set(await x.json());
		}
	});
</script>

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
			<svelte:fragment slot="lead">
				<strong class="text-xl uppercase">Webmardi Chat</strong>
			</svelte:fragment>

			<Navigation />

			<svelte:fragment slot="trail">
				<Me />
				<a
					class="btn btn-sm variant-ghost-surface"
					href="https://github.com/bitswired"
					target="_blank"
					rel="noreferrer"
				>
					GitHub
				</a>

				<LightSwitch />
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>
