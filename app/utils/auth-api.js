// API Authentication Utilities

export const loginUser = async (email, password) => {
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
            // Create session in localStorage to maintain client state
            createClientSession(data.user);
        }

        return data;
    } catch (error) {
        console.error('Login request failed', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
};

export const registerUser = async (userData) => {
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Registration request failed', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
};

export const createClientSession = (user) => {
    if (typeof window === 'undefined') return;

    const sessionUser = {
        id: user.id || user._id, // Handle both just in case
        name: user.name,
        email: user.email,
        picture: user.picture || '',
        role: user.role || 'user'
    };

    localStorage.setItem('intervue_user', JSON.stringify(sessionUser));
    // Dispatch event for components to listen to changes
    window.dispatchEvent(new Event('storage'));
};

export const getClientSession = () => {
    if (typeof window === 'undefined') return null;

    try {
        const sessionStr = localStorage.getItem('intervue_user');
        return sessionStr ? JSON.parse(sessionStr) : null;
    } catch (e) {
        return null;
    }
};

export const logoutUser = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('intervue_user');
    window.dispatchEvent(new Event('storage'));
    window.location.href = '/login';
};

export const googleLogin = async (token) => {
    try {
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (data.success) {
            createClientSession(data.user);
        }
        return data;
    } catch (error) {
        console.error('Google login failed', error);
        return { success: false, message: 'Google login failed' };
    }
};
