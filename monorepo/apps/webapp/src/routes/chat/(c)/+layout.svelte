<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	async function handleDeleteChat(id: number) {
		console.log('JKNDSFKJN');
		await fetch(`${PUBLIC_API_BASE_URL}/chat/${id}`, {
			method: 'DELETE'
		});
		invalidateAll();
	}
</script>

<div class="grid grid-cols-12 h-full">
	<div
		class="col-span-2 dark:bg-surface-900 bg-slate-300 h-screen flex flex-col p-4 gap-4 overflow-x-scroll"
	>
		<p class="h3">Chat History</p>

		<a class="btn btn-md variant-filled-primary" href="/chat">+ Add Chat</a>

		{#each data.chats as chat (chat.id)}
			<div class="rounded-lg p-2 bg-surface-500 flex gap-4 items-center" animate:flip>
				<p>
					{chat.id}
				</p>
				<p class="" transition:fade>
					<a href={`/chat/${chat.id}`} class="underline">{chat.name}</a>
				</p>

				<button
					type="button"
					class="btn-icon btn-icon-sm variant-filled"
					on:click={() => handleDeleteChat(chat.id)}>X</button
				>
			</div>
		{/each}
	</div>

	<div class="col-span-10 flex flex-col justify-between items-center">
		<slot />
	</div>
</div>
