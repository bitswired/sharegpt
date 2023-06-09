import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	// console.log(event.cookies.get('token'));

	const res = await fetch('http://127.0.0.1:8787/auth/me', {
		headers: {
			authorization: `Bearer ${event.cookies.get('token')}`
		}
	}).then((res) => res.json());

	return json(res);
};
