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

	return {
		sessionId: id,
		websocket: new WebSocket(`ws://${url.hostname}:${url.port}/live/${id}?token=${token}`),
		sideChatOpened: false,
		currentMessage: '',
		messages: []
	};
}
