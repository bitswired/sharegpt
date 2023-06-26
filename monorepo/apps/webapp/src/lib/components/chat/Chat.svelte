<script lang="ts">
	import { useMeStore } from '$lib/stores';

	import Prompt from '$lib/components/chat/Prompt.svelte';

	import { invalidateAll } from '$app/navigation';
	import { PUBLIC_API_BASE_URL, PUBLIC_APP_BASE_URL } from '$env/static/public';
	import { fetchEventSource } from '@microsoft/fetch-event-source';
	import { SlideToggle, clipboard, toastStore } from '@skeletonlabs/skeleton';
	import { slide } from 'svelte/transition';
	import CompletionChat from './CompletionChat.svelte';
	import LiveChat from './LiveChat.svelte';
	import Pulse from './Pulse.svelte';
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

	let message = '';

	async function openSSE() {
		if (!state) {
			throw new Error('No state');
		}
		//Create an event source
		await fetchEventSource(
			`${PUBLIC_API_BASE_URL}/chat/sse?chatId=${state.chat.id}&token=${
				$meStore?.token
			}&random=${Math.random()}`,
			{
				openWhenHidden: true,
				onmessage(event) {
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
				},
				async onopen(response) {
					console.log('open');
					console.log(response.status);
					if (response.status === 429) {
						toastStore.trigger({
							message: 'Maximum 1 generation at a time',
							background: 'variant-filled-error'
						});
					}
				},

				async onclose() {
					console.log('close');
					if (state) {
						await updateMessages(state?.chat.id);
						message = '';
						liveState?.websocket.send(
							JSON.stringify({
								message: {
									type: 'mainchat-newmessage',
									message: state.messages.at(-1)
								}
							})
						);
					}
				},

				onerror(e) {
					console.log('error');
					console.log(e);
				}
			}
		).catch((e) => {
			console.log(e);
		});
	}

	let liveState: LiveState | null = null;
	let newMessages = 0;
	$: if (liveState?.sideChatOpened) {
		newMessages = 0;
	}

	async function goLive() {
		if (liveState) {
			liveState.websocket.close();
			toastStore.trigger({
				message: 'Live session ended',
				background: 'variant-filled-warning'
			});

			liveState = null;
			return;
		}

		if (!state) {
			throw new Error('No state');
		}

		if (!$meStore) {
			throw new Error('Not connected');
		}

		toastStore.trigger({
			message: 'Creating private live session ...',
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
				if (!liveState.sideChatOpened) {
					newMessages++;
				}
			}
		};
		liveState.websocket.onopen = function () {
			toastStore.trigger({
				message: 'You are live!',
				background: 'variant-filled-success'
			});
		};
	}
</script>

{#if state}
	<div
		class=" bg-surface-50 dark:bg-surface-600 w-full h-[50px] sticky top-0 z-10 shadow-lg p-2 flex gap-4 items-center px-8"
	>
		<div class="flex items-center gap-2">
			{#if liveState}
				<Pulse />
			{/if}
			<div>Live</div>
			<SlideToggle
				name="slider-large"
				active="bg-primary-500"
				size="md"
				checked={!!liveState}
				on:click={goLive}
			/>
		</div>

		{#if liveState}
			<div class="flex gap-4 items-center">
				<div
					class="hover:border-b-2 text-blue-400 border-blue-400 hover:cursor-pointer"
					on:keypress
					use:clipboard={`${PUBLIC_APP_BASE_URL}/chat/live/${liveState.sessionId}`}
					on:click={() => {
						toastStore.trigger({
							message: 'Shareable link copied',
							background: 'variant-filled-success'
						});
					}}
				>
					Live session URL (click to share)
				</div>
			</div>
		{/if}

		{#if liveState}
			<div class="relative ml-auto mr-8">
				{#if newMessages > 0}
					<span
						class="absolute top-0 left-[-10px] text-sm w-[20px] aspect-square rounded-full bg-black text-center"
						>{newMessages}</span
					>
				{/if}
				<!--  -->
				<button
					class="btn btn-sm variant-filled"
					on:click={() => {
						if (liveState) {
							liveState.sideChatOpened = !liveState.sideChatOpened;
						}
					}}
				>
					Open Live Chat
				</button>
			</div>
			<!-- content here -->
		{/if}
	</div>

	<!-- content here -->
{/if}

<CompletionChat bind:state bind:message />

<div class="w-[1000px] pb-4 fixed bottom-0 backdrop-blur-lg">
	<Prompt bind:value={prompt} send={handleSend} primaryActionText="Send" />
</div>

{#if liveState?.sideChatOpened}
	<div
		class="w-[33%] h-screen fixed top-0 right-0 bg-surface-200 dark:bg-surface-900 z-20 overflow-y-scroll"
		transition:slide={{ axis: 'x' }}
	>
		<LiveChat
			bind:liveState
			handleSend={(m) => {
				prompt = m;
				handleSend();
			}}
		/>
	</div>
{/if}
