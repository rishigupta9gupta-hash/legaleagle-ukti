import { getClientSession } from './auth-api';

export const getReports = async () => {
    const session = getClientSession();
    if (!session?.id) return { success: false, message: 'User not logged in' };

    try {
        const res = await fetch(`/api/reports?userId=${session.id}`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching reports:', error);
        return { success: false, message: 'Failed to load reports' };
    }
};

export const saveReport = async (reportData) => {
    const session = getClientSession();
    if (!session?.id) return { success: false, message: 'User not logged in' };

    try {
        const res = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...reportData, userId: session.id })
        });
        return await res.json();
    } catch (error) {
        console.error('Error adding report:', error);
        return { success: false, message: 'Failed to save report' };
    }
};

export const deleteReport = async (id) => {
    try {
        const res = await fetch(`/api/reports/${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    } catch (error) {
        console.error('Error deleting report:', error);
        return { success: false, message: 'Failed to delete report' };
    }
};
