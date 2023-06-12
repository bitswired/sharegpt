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
	<p class="text-[4em] font-bold gradient-heading p-8">Webmardi Chat</p>
{:else}
	<div class="h-full w-full flex flex-col items-center overflow-y-auto flex-grow">
		{#each state.messages as message (message.id)}
			<Message message={message.text} type={message.type} />
		{/each}

		{#if message.length > 0}
			<Message {message} type="ai" />
			<!-- content here -->
		{/if}
	</div>
{/if}
