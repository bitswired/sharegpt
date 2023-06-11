import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const res = await fetch(`${PUBLIC_API_BASE_URL}/auth/me`, {
		headers: {
			authorization: `Bearer ${event.cookies.get('token')}`
		}
	});

	if (!res.ok) {
		throw error(res.status, res.statusText);
	}

	return json({ ...(await res.json()), token: event.cookies.get('token') });
};
