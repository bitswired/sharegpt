import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async function ({ event, resolve }) {
	console.log('AHAHAHAHAHAH');
	console.log('AHAHAHAHAHAH');
	console.log('AHAHAHAHAHAH');
	console.log('AHAHAHAHAHAH');
	console.log('AHAHAHAHAHAH');
	console.log('AHAHAHAHAHAH');
	console.log('AHAHAHAHAHAH');

	if (event.url.pathname.startsWith('/chat')) {
		const res = await fetch(`${PUBLIC_API_BASE_URL}/auth/me`, {
			headers: {
				authorization: `Bearer ${event.cookies.get('token')}`
			}
		});

		if (!res.ok) {
			throw redirect(303, '/auth/login');
		}
	}

	const response = await resolve(event);
	return response;
};
