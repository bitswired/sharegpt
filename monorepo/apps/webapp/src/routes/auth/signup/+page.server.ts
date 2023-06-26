import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;

export const actions = {
	default: async (event) => {
		const data = await event.request.formData();

		const name = data.get('name');
		const password = data.get('password');
		const secret = data.get('secret');

		const res = await fetch(`${PUBLIC_API_BASE_URL}/auth/signup`, {
			method: 'POST',
			body: JSON.stringify({
				name,
				password,
				secret
			})
		});

		if (!res.ok) {
			return fail(res.status, { error: await res.text() });
		}

		throw redirect(303, '/auth/login');
	}
};
