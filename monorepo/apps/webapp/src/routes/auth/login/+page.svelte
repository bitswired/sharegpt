<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let name = '';
	let password = '';
</script>

{JSON.stringify(form)}

<form
	class="flex flex-col gap-4 w-[600px] bg-surface-900 rounded-lg p-8 m-auto mt-[2em]"
	method="post"
>
	<h1 class="h1 gradient-heading">Welcome to Webmardi Chat Demo</h1>

	<h2 class="h2">Login</h2>

	<br />

	<label class="label">
		<span>Name</span>
		<input class="input" name="name" type="text" placeholder="Your name" bind:value={name} />
	</label>

	<label class="label">
		<span>Password</span>
		<input
			class="input"
			name="password"
			type="password"
			placeholder="Your password"
			bind:value={password}
		/>
	</label>

	<br />

	<button class="btn btn-lg variant-filled-primary" type="submit">Login</button>
</form>
