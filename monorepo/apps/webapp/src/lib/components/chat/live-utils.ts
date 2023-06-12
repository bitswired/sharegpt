import { dev } from '$app/environment';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export interface LiveState {
	sessionId: string;
	websocket: WebSocket;
	sideChatOpened: boolean;
	currentMessage: string;
	messages: any[];
}
export function initLiveState(id: string, token: string) {
	const url = new URL(PUBLIC_API_BASE_URL);

	const protocol = dev ? 'ws' : 'wss';

	return {
		sessionId: id,
		websocket: new WebSocket(`${protocol}://${url.hostname}:${url.port}/live/${id}?token=${token}`),
		sideChatOpened: false,
		currentMessage: '',
		messages: []
	};
}
