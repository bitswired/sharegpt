<script lang="ts">
	import background from '$lib/assets/background.svg';
	import { useMeStore } from '$lib/stores';

	const meStore = useMeStore();
</script>

<div class="relative p-16 flex gap-16 justify-center w-full h-full">
	<div class="absolute top-0 left-0 w-full h-full">
		<img
			alt="The project logo"
			src={background}
			class="w-full h-full object-cover opacity-30 z-0"
		/>
	</div>

	<div
		class="md:w-1/2 flex flex-col gap-8 mt-32 w-full z-10 items-start bg-surface-100 dark:bg-surface-900 dark:bg-opacity-80 bg-opacity-80 h-max p-8 rounded-lg"
	>
		<h1 class="text-[3.5em] leading-tight gradient-heading">ShareGPT</h1>

		<h2 class="text-[2em] leading-tight gradient-heading">
			ChatGPT Clone With Live Session Feature
		</h2>

		<p class="text-[1.3em] leading-snug">
			ShareGPT allows you to chat with an AI (using OpenAI).
			<br />
			But that's not all! You can also share your chat with friends: they see what you generate in live
			and they can chat with you.
			<br />
			They can even propose you prompts that you can try in one click from the chat.
		</p>
		{#if $meStore}
			<a href="/chat" class="btn btn-xl variant-filled-primary">Try it now</a>
		{:else}
			<a href="/auth/signup" class="btn btn-xl variant-filled-primary">Try it now</a>
		{/if}
	</div>
</div>

<style lang="postcss">
</style>
