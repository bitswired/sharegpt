import { useWritable } from '$lib/utils';

interface Me {
	name: string;
	token: string;
}

export const useMeStore = () => useWritable<Me | null>('me', null);
