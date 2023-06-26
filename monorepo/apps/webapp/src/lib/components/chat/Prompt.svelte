<script lang="ts">
	export let value = '';
	export let send: () => void;
	export let secondaryAction: (() => void) | undefined = undefined;
	export let secondaryActionText: string | undefined = undefined;
	export let primaryActionText: string;
</script>

<div class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-container-token">
	<button
		class="input-group-shim"
		on:click={secondaryAction}
		class:bg-secondary-500={!!secondaryActionText}
		class:text-white={!!secondaryActionText}
	>
		{secondaryActionText ?? '+'}
	</button>
	<textarea
		on:keydown={(e) => {
			if (e.shiftKey && e.key === 'Enter') {
				e.preventDefault();
				send();
			}
		}}
		bind:value
		class="bg-transparent border-0 ring-0"
		name="prompt"
		id="prompt"
		placeholder="Write a message..."
		rows="2"
	/>
	<button class="variant-filled-primary" on:click={send}>{primaryActionText}</button>
</div>
