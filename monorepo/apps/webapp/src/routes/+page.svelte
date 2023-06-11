<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

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

	onMount(async () => {
		console.log('JDDDDI');
		console.log('Page data:', data);
		const x = await fetch('/api/me').then((res) => res.json());
	});
</script>

<button class="btn btn-lg variant-filled-primary" on:click={openSSE}> Open SSE </button>

<button class="btn btn-lg variant-filled-primary" on:click={closeSSE}> Close SSE </button>

<div class="container mx-auto flex justify-center items-center">
	<p>{message}</p>
</div>

<style lang="postcss">
</style>
