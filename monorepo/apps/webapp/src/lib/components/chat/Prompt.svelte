<script lang="ts">
	export let value = '';
	export let send: () => void;
</script>

<div class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-container-token">
	<button class="input-group-shim">+</button>
	<textarea
		bind:value
		class="bg-transparent border-0 ring-0"
		name="prompt"
		id="prompt"
		placeholder="Write a message..."
		rows="2"
	/>
	<button class="variant-filled-primary" on:click={send}>Send</button>
</div>
