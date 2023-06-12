import { PUBLIC_API_BASE_URL } from '$env/static/public';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	const chatId = event.params.id;

	const token = event.cookies.get('token');

	const { chats } = await fetch(`${PUBLIC_API_BASE_URL}/chat`, {
		method: 'GET',
		headers: {
			authorization: `Bearer ${token}`
		}
	}).then((res) => res.json());

	const { chat, messages } = await fetch(`${PUBLIC_API_BASE_URL}/chat/${chatId}`, {
		method: 'GET',
		headers: {
			authorization: `Bearer ${token}`
		}
	}).then((res) => res.json());

	return { chats, state: { chat, messages } };
}) satisfies PageServerLoad;
