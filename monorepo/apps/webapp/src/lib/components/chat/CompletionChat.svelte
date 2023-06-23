<script lang="ts">
	import Message from './Message.svelte';

	export let state: {
		chat: any;
		messages: any[];
	} | null = null;

	export let message: string;
</script>

{#if !state}
	<p />
	<p class="text-[4em] font-bold gradient-heading p-8">ShareGPT</p>
{:else}
	<div class="w-full flex flex-col items-center overflow-y-auto">
		{#each state.messages as message (message.id)}
			<Message message={message.text} type={message.type} />
		{/each}

		{#if message.length > 0}
			<Message {message} type="ai" mode={'raw'} />
		{/if}

		<div class="my-16" />
	</div>
{/if}
