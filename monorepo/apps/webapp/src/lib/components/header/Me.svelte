<script lang="ts">
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { useMeStore } from '$lib/stores';

	const meStore = useMeStore();

	async function logout() {
		const res = await fetch(`${PUBLIC_API_BASE_URL}/auth/logout`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${$meStore?.token}`
			}
		});

		console.log(res.ok);

		window.location.href = '/';
	}
</script>

{#if !$meStore}
	<div>
		<a class="btn btn-sm variant-filled-primary" href="/auth/login"> Login </a>
		<a class="btn btn-sm variant-filled-secondary" href="/auth/signup"> Signup </a>
	</div>
{:else}
	<div class="flex items-center gap-4">
		<span class="text-sm">Welcome {$meStore.name}</span>
		<button class="btn btn-sm variant-filled-secondary" on:click={logout}> Logout </button>
	</div>
{/if}
