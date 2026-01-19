import { getClientSession } from './auth-api';

export const getSessions = async () => {
    const session = getClientSession();
    if (!session?.id) return { success: false, message: 'User not logged in' };

    try {
        const res = await fetch(`/api/sessions?userId=${session.id}`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return { success: false, message: 'Failed to load sessions' };
    }
};

export const saveSession = async (sessionData) => {
    const session = getClientSession();
    if (!session?.id) return { success: false, message: 'User not logged in' };

    try {
        const res = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...sessionData, userId: session.id })
        });
        return await res.json();
    } catch (error) {
        console.error('Error saving session:', error);
        return { success: false, message: 'Failed to save session' };
    }
};
