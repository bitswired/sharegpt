<script lang="ts">
	export let liveState: LiveState;
	import Prompt from '$lib/components/chat/Prompt.svelte';
	import type { LiveState } from './live-utils';
	import LiveChatMessage from './LiveChatMessage.svelte';
	export let canHide = true;
	export let isViewer = false;
	export let handleSend: ((message: string) => void) | undefined = undefined;
</script>

<div class="flex flex-col h-full gap-2">
	{#if canHide}
		<div class="shadow-lg w-full p-4 flex gap-4 items-center">
			<div class="text-2xl font-bold">Live Chat</div>
			<button
				class="btn btn-md variant-filled"
				on:click={() => {
					if (liveState) {
						liveState.sideChatOpened = false;
					}
				}}
			>
				Hide
			</button>
		</div>
	{/if}

	{#each liveState.messages as m (m.timestamp)}
		<div class="px-4 py-2">
			<LiveChatMessage message={m} {isViewer} {handleSend} />
		</div>
	{/each}

	<div class="mt-auto p-4 sticky bottom-0">
		{#if !isViewer}
			<Prompt
				bind:value={liveState.currentMessage}
				send={() => {
					liveState?.websocket.send(
						JSON.stringify({
							message: {
								type: 'sidechat',
								text: liveState.currentMessage
							}
						})
					);
					liveState.currentMessage = '';
				}}
				primaryActionText="Send"
			/>
		{:else}
			<Prompt
				bind:value={liveState.currentMessage}
				send={() => {
					liveState?.websocket.send(
						JSON.stringify({
							message: {
								type: 'sidechat',
								text: liveState.currentMessage
							}
						})
					);
					liveState.currentMessage = '';
				}}
				secondaryActionText="Prompt"
				secondaryAction={() => {
					liveState?.websocket.send(
						JSON.stringify({
							message: {
								type: 'sidechat',
								text: liveState.currentMessage,
								isPrompt: true
							}
						})
					);
					liveState.currentMessage = '';
				}}
				primaryActionText="Message"
			/>
		{/if}
	</div>
</div>
