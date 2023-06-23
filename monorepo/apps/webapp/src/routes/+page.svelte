<script lang="ts">
	import logo from '$lib/assets/logo-sharegpt.png';
</script>

<div class="p-16 flex gap-16 justify-center">
	<div class="w-1/2 flex flex-col gap-8 mt-32">
		<h1 class="text-[3.5em] leading-tight gradient-heading">
			ShareGPT: ChatGPT Clone With Live Session Feature
		</h1>

		<p class="text-[1.5em] leading-tight">
			ShareGPT allows you to chat with an AI (using OpenAI). But that's not all! You can also share
			your chat with friends: they see what you generate in live and they can chat with you.
			<br />
			They can even propose you prompts that you can try in one click from the chat.
		</p>

		<siv>
			<a href="/auth/signup" class="btn btn-xl variant-filled-primary">Try it now</a>
		</siv>
	</div>

	<div class="">
		<img alt="The project logo" src={logo} class="object-contain max-w-[600px]" />
	</div>
</div>

<style lang="postcss">
</style>
