<script lang="ts">
	import { page } from '$app/stores';
	import CompletionChat from '$lib/components/chat/CompletionChat.svelte';
	import { initLiveState, type LiveState } from '$lib/components/chat/live-utils';
	import Prompt from '$lib/components/chat/Prompt.svelte';
	import { useMeStore } from '$lib/stores';
	import { fade } from 'svelte/transition';

	const meStore = useMeStore();

	let liveState: LiveState | null = null;

	let state: {
		chat: any;
		messages: any[];
	} | null = null;
	let message = '';

	function joinLive() {
		if (!$meStore) {
			throw new Error('Not connected');
		}
		liveState = initLiveState($page.params['id'], $meStore.token);

		liveState.websocket.onmessage = function (e) {};

		liveState.websocket.onmessage = function (e) {
			const m = JSON.parse(e.data);
			console.log(m);

			if (!liveState) {
				throw new Error('No live state');
			}

			if (m?.message.type === 'sidechat') {
				liveState.messages = [...liveState.messages, m];
			}
			if (m?.message.type === 'mainchat-aiupdate') {
				if (!state) {
					state = {
						chat: null,
						messages: []
					};
				}
				message += m.message.delta;
			}
			if (m?.message.type === 'mainchat-newmessage') {
				if (!state) {
					state = {
						chat: null,
						messages: [m.message.message]
					};
				} else {
					state.messages = [...state.messages, m.message.message];
				}
				message = '';
			}
		};
	}
</script>

{#if !liveState}
	<button class="btn btn-lg variant-filled-primary" on:click={joinLive}> JOIN </button>
{:else}
	<div class="grid grid-cols-2 h-full">
		<div class="flex flex-col justify-between items-center">
			<p>a</p>

			<CompletionChat bind:state bind:message />

			<p>a</p>
		</div>

		<div class="bg-surface-700">
			<div class="flex flex-col p-4 h-full gap-2">
				<button
					class="btn btn-md variant-filled-primary"
					on:click={() => {
						if (liveState) {
							liveState.sideChatOpened = false;
						}
					}}
				>
					Hide
				</button>

				{#each liveState.messages as m (m.timestamp)}
					<div transition:fade class="p-2 shadow-sm bg-surface-600 rounded-md">
						<p>{m.message.text}</p>
					</div>
				{/each}

				<div class="mt-auto">
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
						}}
					/>
				</div>
			</div>
		</div>
	</div>
{/if}
