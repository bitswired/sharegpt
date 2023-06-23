<script lang="ts">
	import { page } from '$app/stores';
	import CompletionChat from '$lib/components/chat/CompletionChat.svelte';
	import LiveChat from '$lib/components/chat/LiveChat.svelte';
	import Pulse from '$lib/components/chat/Pulse.svelte';
	import { initLiveState, type LiveState } from '$lib/components/chat/live-utils';
	import { useMeStore } from '$lib/stores';
	import { toastStore } from '@skeletonlabs/skeleton';

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

			if (m.error) {
				toastStore.trigger({
					message: 'The owner has not yet joined or the session is ended',
					background: 'variant-filled-error'
				});
				liveState.websocket.close();
				liveState = null;
				return;
			}

			if (m.end) {
				toastStore.trigger({
					message: 'Live session ended',
					background: 'variant-filled-warning'
				});
				liveState.websocket.close();
				liveState = null;
				return;
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
					console.log([...state.messages, m.message.message]);
					state.messages = [...state.messages, m.message.message];
				}
				message = '';
			}
		};
	}
</script>

{#if !liveState}
	<div class="flex justify-center items-center h-full w-full">
		<button class="btn btn-xl variant-filled-primary" on:click={joinLive}>CLICK TO JOIN </button>
	</div>
{:else}
	<div class="grid grid-cols-2 h-[calc(100vh-64px)]">
		<div class="flex flex-col items-center shadow-lg bg-surface-700 overflow-y-auto">
			<div class="flex gap-4 items-center">
				<div class="h2 p-4 font-bold">Live Chat Completion</div>
				<Pulse />
			</div>

			<CompletionChat bind:state bind:message />
		</div>

		<div class="bg-surface-900 overflow-y-auto">
			<LiveChat bind:liveState canHide={false} isViewer={true} />
		</div>
	</div>
{/if}
