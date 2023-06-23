<script lang="ts">
	import { useMeStore } from '$lib/stores';
	import { Avatar } from '@skeletonlabs/skeleton';
	import snarkdown from 'snarkdown';
	import { fade } from 'svelte/transition';
	export let mode: 'parsed' | 'raw' = 'parsed';

	export let message: string;
	export let type: 'human' | 'ai';

	const meStore = useMeStore();
</script>

{#if type === 'human'}
	<div class="dark:bg-surface-700 bg-surface-300 bg-opacity-30 w-full" in:fade>
		<div class="flex gap-4 w-[800px] p-8 m-auto items-start">
			<Avatar initials={$meStore?.name} background="bg-primary-500" width="w-12" />
			<div
				class="w-full leading-relaxed text-[1.1em] prose dark:prose-invert prose-code:whitespace-pre"
			>
				{@html snarkdown(message.replaceAll('```', '\n```\n'))}
			</div>
		</div>
	</div>
{:else}
	<div class="dark:bg-surface-600 bg-surface-100 bg-opacity-30 w-full" in:fade>
		<div class="flex gap-4 w-[800px] p-8 m-auto items-start">
			<Avatar initials="AI" background="bg-secondary-500" width="w-12" />
			<div
				class="w-full leading-relaxed text-[1.1em] prose dark:prose-invert prose-code:whitespace-pre"
			>
				{@html mode === 'parsed' ? snarkdown(message.replaceAll('```', '\n```\n')) : message}
			</div>
		</div>
	</div>
{/if}
