<script lang="ts">
	import Bubble from '$lib/components/chat/Bubble.svelte';
	import Prompt from '$lib/components/chat/Prompt.svelte';
	import { fade } from 'svelte/transition';

	let currentMessage = '';

	let messageFeed = [
		{
			id: 0,
			host: true,
			avatar: 48,
			name: 'Jane',
			timestamp: 'Yesterday @ 2:30pm',
			message: 'Some message text.',
			color: 'variant-soft-primary'
		},
		{
			id: 1,
			host: false,
			avatar: 14,
			name: 'Michael',
			timestamp: 'Yesterday @ 2:45pm',
			message: 'Some message text.',
			color: 'variant-soft-primary'
		}
	];

	function addMessage() {
		messageFeed = [
			...messageFeed,
			{
				id: messageFeed.length,
				host: true,
				avatar: 48,
				name: 'Jane',
				timestamp: 'Yesterday @ 2:30pm',
				message: currentMessage,
				color: 'variant-soft-primary'
			}
		];
	}
</script>

<section class="w-full max-h-[400px] p-4 overflow-y-auto space-y-4 max-w-[800px]">
	{#each messageFeed as bubble (bubble.id)}
		<div transition:fade>
			{#if bubble.host === true}
				<div transition:fade>
					<Bubble {bubble} isHost={true} />
				</div>
			{:else}
				<div transition:fade>
					<Bubble {bubble} isHost={false} />
				</div>
			{/if}
		</div>
	{/each}

	<Prompt bind:value={currentMessage} send={addMessage} />
</section>
