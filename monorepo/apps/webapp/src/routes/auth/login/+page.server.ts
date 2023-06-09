import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;

export const actions = {
	default: async (event) => {
		const data = await event.request.formData();

		const name = data.get('name');
		const password = data.get('password');

		const res = await fetch('http://127.0.0.1:8787/auth/login', {
			method: 'POST',
			body: JSON.stringify({
				name,
				password
			})
		});

		if (!res.ok) {
			return { error: res.statusText };
		}

		const { token } = await res.json();

		if (!token) {
			return { error: 'No token' };
		}

		event.cookies.set('token', token, {
			httpOnly: true,
			expires: new Date(Date.now() + 2 * (60 * 60 * 1000)),
			path: '/'
		});

		throw redirect(303, '/');
	}
};
