import { getClientSession } from './auth-api';

export const getMedications = async () => {
    const session = getClientSession();
    if (!session?.id) return { success: false, message: 'User not logged in' };

    try {
        const res = await fetch(`/api/medications?userId=${session.id}`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching medications:', error);
        return { success: false, message: 'Failed to load medications' };
    }
};

export const addMedication = async (medicationData) => {
    const session = getClientSession();
    if (!session?.id) return { success: false, message: 'User not logged in' };

    try {
        const res = await fetch('/api/medications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...medicationData, userId: session.id })
        });
        return await res.json();
    } catch (error) {
        console.error('Error adding medication:', error);
        return { success: false, message: 'Failed to add medication' };
    }
};

export const deleteMedication = async (id) => {
    try {
        const res = await fetch(`/api/medications/${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    } catch (error) {
        console.error('Error deleting medication:', error);
        return { success: false, message: 'Failed to delete medication' };
    }
};

export const updateMedicationDates = async (id, takenDates) => {
    try {
        const res = await fetch(`/api/medications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ takenDates })
        });
        return await res.json();
    } catch (error) {
        console.error('Error updating medication:', error);
        return { success: false, message: 'Failed to update medication' };
    }
};
