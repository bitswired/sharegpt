<script lang="ts">
	import Prompt from '$lib/components/chat/Prompt.svelte';
	import { useMeStore } from '$lib/stores';
	import type { PageData } from './$types';

	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { Avatar } from '@skeletonlabs/skeleton';

	export let data: PageData;

	let state: {
		chat: any;
		messages: any[];
	} | null = null;

	const meStore = useMeStore();

	let prompt = '';
	async function handleSend() {
		if (!$meStore) {
			return;
		}

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

		const { chat, messages } = await fetch(`${PUBLIC_API_BASE_URL}/chat/${chatId}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${$meStore.token}`
			}
		}).then((res) => res.json());

		state = { chat, messages };

		prompt = '';

		openSSE();
	}

	let es: EventSource;

	let message = '';

	function openSSE() {
		//Create an event source
		es = new EventSource('http://localhost:8787/chat');

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
			<div class="h-full w-full flex flex-col items-center">
				{#each state.messages as message}
					<div class="bg-primary-900 bg-opacity-30 w-full">
						<div class="flex gap-4 w-[800px] p-8 m-auto items-start">
							<Avatar initials="JI" background="bg-primary-500" width="w-8" />
							<div class="w-full">
								{message.text}
							</div>
						</div>
					</div>
				{/each}
				<div class="bg-secondary-900 bg-opacity-30 w-full">
					<div class="flex gap-4 w-[800px] p-8 m-auto items-start">
						<Avatar initials="AI" background="bg-secondary-500" width="w-8" />
						<div class="w-full">
							{message}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<div class="w-[1000px] pb-4">
			<Prompt bind:value={prompt} send={handleSend} />
		</div>
	</div>
</div>
