<script lang="ts">
	import { useMeStore } from '$lib/stores';

	import Prompt from '$lib/components/chat/Prompt.svelte';

	import { invalidateAll } from '$app/navigation';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { SlideToggle, toastStore } from '@skeletonlabs/skeleton';
	import { fade, slide } from 'svelte/transition';
	import CompletionChat from './CompletionChat.svelte';
	import { initLiveState, type LiveState } from './live-utils';

	export let state: {
		chat: any;
		messages: any[];
	} | null = null;

	const meStore = useMeStore();

	let prompt = '';

	async function updateMessages(chatId: number) {
		if (!$meStore) {
			return;
		}

		const { chat, messages } = await fetch(`${PUBLIC_API_BASE_URL}/chat/${chatId}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${$meStore.token}`
			}
		}).then((res) => res.json());

		console.log('UP{DATE', chat, messages);

		state = { chat, messages };
	}

	async function handleSend() {
		if (!$meStore) {
			return;
		}

		if (!state) {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/chat`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$meStore.token}`
				},
				body: JSON.stringify({ message: prompt })
			});

			if (!res.ok) {
				throw new Error('Failed to send message');
			}

			const { chatId } = await res.json();

			await updateMessages(parseInt(chatId));

			invalidateAll();
		} else {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/chat`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$meStore.token}`
				},
				body: JSON.stringify({ message: prompt, chatId: state.chat.id })
			});

			if (!res.ok) {
				throw new Error('Failed to send message');
			}

			await updateMessages(parseInt(state.chat.id));

			console.log(state.messages.slice(-1)[0]);

			liveState?.websocket.send(
				JSON.stringify({
					message: {
						type: 'mainchat-newmessage',
						message: state.messages.slice(-1)[0]
					}
				})
			);
		}

		prompt = '';

		openSSE();
	}

	let es: EventSource;

	let message = '';

	function openSSE() {
		if (!state) {
			throw new Error('No state');
		}
		//Create an event source
		es = new EventSource(
			`${PUBLIC_API_BASE_URL}/chat/sse?chatId=${state.chat.id}&token=${$meStore?.token}`
		);

		// Listen to the event
		es.addEventListener('message', (event) => {
			console.log('Message from server ', event);
			message += event.data;

			liveState?.websocket.send(
				JSON.stringify({
					message: {
						type: 'mainchat-aiupdate',
						delta: event.data
					}
				})
			);
		});

		es.onopen = function () {
			console.log('open');
		};
		es.onerror = async function (e) {
			console.log('error');
			console.log(e);
			es.close();
			if (state) {
				await updateMessages(state?.chat.id);
				message = '';
				liveState?.websocket.send(
					JSON.stringify({
						message: {
							type: 'mainchat-newmessage',
							message: state.messages.slice(-1)[0]
						}
					})
				);
			}
		};
	}

	function closeSSE() {
		es.close();
	}

	let liveState: LiveState | null = null;

	async function goLive() {
		if (!state) {
			throw new Error('No state');
		}

		if (!$meStore) {
			throw new Error('Not connected');
		}

		toastStore.trigger({
			message: 'Creating live session ...',
			background: 'variant-filled'
		});

		const { id } = await fetch(`${PUBLIC_API_BASE_URL}/live`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${$meStore.token}`
			}
		}).then((res) => res.json());

		liveState = initLiveState(id, $meStore.token);

		liveState.websocket.onmessage = function (e) {
			const m = JSON.parse(e.data);
			console.log(e);

			if (!liveState) {
				throw new Error('No live state');
			}

			if (m?.message.type === 'sidechat') {
				liveState.messages = [...liveState.messages, m];
			}
		};
		// liveState.websocket.onopen = function () {
		// 	liveState?.websocket.send(JSON.stringify({ name: 'master' }));
		// };
	}
</script>

{#if state}
	<div class="bg-red-500 w-full h-[50px] sticky top-0 z-10 shadow-lg p-2 flex gap-4 items-center">
		<div class="flex items-center gap-2">
			<div>Live</div>
			<SlideToggle
				name="slider-large"
				active="bg-primary-500"
				size="md"
				checked={!!liveState}
				on:click={goLive}
			/>
		</div>
		<p>
			{liveState?.sessionId}
		</p>
		<button
			class="btn btn-md variant-filled-primary"
			on:click={() => {
				if (liveState) {
					liveState.sideChatOpened = !liveState.sideChatOpened;
				}
			}}
		>
			Chat
		</button>
	</div>

	<!-- content here -->
{/if}

<CompletionChat bind:state bind:message />

<div class="w-[1000px] pb-4 sticky bottom-0">
	<Prompt bind:value={prompt} send={handleSend} />
</div>

{#if liveState?.sideChatOpened}
	<div
		class="w-[33%] h-screen fixed top-0 right-0 bg-surface-800 z-20 overflow-y-scroll"
		transition:slide={{ axis: 'x' }}
	>
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
{/if}
