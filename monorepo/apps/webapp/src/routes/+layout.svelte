<script lang="ts">
	// The ordering of these imports is critical to your app working properly
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	// Most of your app wide CSS should be put in this file
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import Me from '$lib/components/header/Me.svelte';
	import Navigation from '$lib/components/header/Navigation.svelte';
	import { useMeStore } from '$lib/stores';
	import { AppBar, AppShell, LightSwitch, Toast, toastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import '../app.postcss';

	const meStore = useMeStore();

	onMount(async () => {
		const { fetch: originalFetch } = window;

		window.fetch = async (...args) => {
			console.log('Intercepted Fetch');
			let [resource, config] = args;

			if (resource.toString().includes(PUBLIC_API_BASE_URL)) {
				config = {
					...config,
					headers: {
						...config?.headers,
						Authorization: `Bearer ${$meStore?.token}`
					}
				};
			}

			console.log(config);

			// request interceptor starts
			console.log('Before Fetch');
			const response = await originalFetch(resource, config);
			console.log('After Fetch');

			if (response.status === 401) {
				toastStore.trigger({
					message: 'Your session has expired. Please login again.',
					background: 'variant-filled-error'
				});

				if ($page.url.pathname !== '/') {
					goto('/auth/login');
				}
			}

			// response interceptor here
			return response;
		};

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
				<strong class="text-xl uppercase">
					<a href="/"> ShareGPT</a>
				</strong>
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
<Toast position="tr" />
