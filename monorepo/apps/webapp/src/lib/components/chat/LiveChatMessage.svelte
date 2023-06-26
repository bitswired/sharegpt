<script lang="ts">
	import { useMeStore } from '$lib/stores';
	import { Avatar } from '@skeletonlabs/skeleton';
	import { fade } from 'svelte/transition';

	export let message: any;
	export let isViewer = false;
	export let handleSend = (message: string) => {};

	const meStore = useMeStore();

	const isMe = message.name === $meStore?.name;

	const isPrompt = message.message.isPrompt;
</script>

<div
	transition:fade
	class="p-2 px-4 shadow-sm rounded-md w-max max-w-[80%] flex gap-4 items-start overflow-hidden flex-wrap"
	class:ml-auto={isMe}
	class:mr-auto={!isMe}
	class:bg-surface-300={!isMe}
	class:bg-primary-300={isMe}
	class:dark:bg-primary-600={isMe}
	class:dark:bg-surface-600={!isMe}
>
	<div>
		<Avatar
			initials={message.name}
			background={isMe ? 'bg-primary-400' : 'bg-surface-400'}
			width="w-8"
		/>
	</div>

	<p class="break-all">{message.message.text}</p>

	{#if message.message.isPrompt}
		<div class="w-full flex flex-col items-start gap-1">
			<div class="text-sm italic">This message is a prompt proposal</div>
			{#if !isViewer}
				<button
					class="btn btn-sm variant-filled-secondary"
					on:click={() => {
						handleSend(message.message.text);
					}}>Use this prompt</button
				>
			{/if}
		</div>
	{/if}
</div>
