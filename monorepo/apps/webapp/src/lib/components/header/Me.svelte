<script lang="ts">
	import { useMeStore } from '$lib/stores';

	let me: any;
	let error: any;

	const meStore = useMeStore();
</script>

{#if !$meStore}
	<div>
		<a class="btn btn-sm variant-filled-primary" href="/auth/login"> Login </a>
		<a class="btn btn-sm variant-filled-secondary" href="/auth/signup"> Signup </a>
	</div>
{:else}
	<div class="flex items-center gap-4">
		<span class="text-lg">Welcome , {$meStore.name}</span>
	</div>
{/if}
