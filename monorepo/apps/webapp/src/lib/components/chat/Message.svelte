<script lang="ts">
	import { useMeStore } from '$lib/stores';
	import { Avatar } from '@skeletonlabs/skeleton';
	import { fade } from 'svelte/transition';

	export let message: string;
	export let type: 'human' | 'ai';

	const meStore = useMeStore();
</script>

{#if type === 'human'}
	<div class="bg-primary-900 bg-opacity-30 w-full" in:fade>
		<div class="flex gap-4 w-[800px] p-8 m-auto items-start">
			<Avatar initials={$meStore?.name.slice(2)} background="bg-primary-500" width="w-12" />
			<div class="w-full leading-relaxed text-[1.1em]">
				{message}
			</div>
		</div>
	</div>
{:else}
	<div class="bg-secondary-900 bg-opacity-30 w-full" in:fade>
		<div class="flex gap-4 w-[800px] p-8 m-auto items-start">
			<Avatar initials="AI" background="bg-secondary-500" width="w-12" />
			<div class="w-full leading-relaxed text-[1.1em]">
				{message}
			</div>
		</div>
	</div>
{/if}
