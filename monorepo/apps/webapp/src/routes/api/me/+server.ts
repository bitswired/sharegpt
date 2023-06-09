import { API_BASE_URL } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const res = await fetch(`${API_BASE_URL}/auth/me`, {
		headers: {
			authorization: `Bearer ${event.cookies.get('token')}`
		}
	}).then((res) => res.json());

	return json(res);
};
