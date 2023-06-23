<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { useMeStore } from '$lib/stores';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	const meStore = useMeStore();
</script>

<form
	class="flex flex-col gap-4 w-[600px] dark:bg-surface-900 rounded-lg p-8 m-auto mt-[2em] shadow-lg bg-surface-100"
	method="post"
	use:enhance={({ formElement, formData, action, cancel, submitter }) => {
		return async ({ result, update }) => {
			const res = await fetch('/api/me');
			if (res.ok) {
				meStore.set(await res.json());
			}
			await applyAction(result);
		};
	}}
>
	<h1 class="h1 gradient-heading">Welcome to ShareGPT</h1>

	<h2 class="h2">Login</h2>

	<br />

	<label class="label">
		<span>Name</span>
		<input class="input" name="name" type="text" placeholder="Your name" />
	</label>

	<label class="label">
		<span>Password</span>
		<input class="input" name="password" type="password" placeholder="Your password" />

		<label class="label">
			<span>Secret Signup Token</span>
			<input class="input" name="secret" type="password" placeholder="Your password" />
		</label>
	</label>

	<br />

	<button class="btn btn-lg variant-filled-primary" type="submit">Login</button>
</form>
