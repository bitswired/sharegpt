import { PUBLIC_API_BASE_URL } from '$env/static/public';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	const token = event.cookies.get('token');

	const { chats } = await fetch(`${PUBLIC_API_BASE_URL}/chat`, {
		method: 'GET',
		headers: {
			authorization: `Bearer ${token}`
		}
	}).then((res) => res.json());

	return { chats };
}) satisfies PageServerLoad;
