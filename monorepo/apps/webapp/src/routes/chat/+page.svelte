<script lang="ts">
	import { useMeStore } from '$lib/stores';
	import type { PageData } from './$types';

	import Message from '$lib/components/chat/Message.svelte';
	import Prompt from '$lib/components/chat/Prompt.svelte';

	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	export let data: PageData;

	let state: {
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
		});

		es.onopen = function () {
			console.log('open');
		};
		es.onerror = function (e) {
			console.log('error');
			console.log(e);
			es.close();
			if (state) {
				updateMessages(state?.chat.id);
				message = '';
			}
		};
	}

	function closeSSE() {
		es.close();
	}
</script>

<div class="grid grid-cols-12 h-full">
	<div class="col-span-2 bg-surface-900 h-full flex flex-col p-4">
		<p class="h3">Chat History</p>
	</div>

	<div class="col-span-10 flex flex-col justify-between items-center">
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

		<div class="w-[1000px] pb-4 sticky bottom-0">
			<Prompt bind:value={prompt} send={handleSend} />
		</div>
	</div>
</div>
