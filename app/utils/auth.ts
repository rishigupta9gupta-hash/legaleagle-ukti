
export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

export interface User {
  name: string;
  email: string;
  password?: string;
  role?: string;
  bio?: string;
  skills?: string;
  picture?: string;
}

const DB_KEY = 'intervue_users_db';
const SESSION_KEY = 'intervue_user';

// --- DATABASE UTILS ---

export const getDatabase = (): User[] => {
  try {
    const dbStr = localStorage.getItem(DB_KEY);
    return dbStr ? JSON.parse(dbStr) : [];
  } catch (e) {
    console.error("Error reading user database", e);
    return [];
  }
};

export const saveDatabase = (users: User[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
};

export const registerUser = (user: User): { success: boolean; message: string } => {
  const db = getDatabase();
  const existing = db.find(u => u.email === user.email);
  
  if (existing) {
    return { success: false, message: 'User already exists. Please log in.' };
  }

  db.push(user);
  saveDatabase(db);
  return { success: true, message: 'Account created successfully.' };
};

export const authenticateUser = (email: string, password?: string): { success: boolean; user?: User; message: string } => {
  const db = getDatabase();
  // Find user by email
  const user = db.find(u => u.email === email);

  if (!user) {
    return { success: false, message: 'User not found. Please sign up.' };
  }

  // If password is provided, validate it (skip for Google Auth context if previously handled)
  if (password !== undefined && user.password !== password) {
    return { success: false, message: 'Invalid password.' };
  }

  // Create session
  createSession(user);
  return { success: true, user, message: 'Login successful.' };
};

export const googleAuthenticate = (googleUser: GoogleUser): { success: boolean; user: User } => {
  const db = getDatabase();
  let user = db.find(u => u.email === googleUser.email);

  if (!user) {
    // Register automatically if Google User doesn't exist
    user = {
      name: googleUser.name,
      email: googleUser.email,
      picture: googleUser.picture,
      password: '', // No password for Google users
      role: '',
      bio: '',
      skills: ''
    };
    db.push(user);
    saveDatabase(db);
  }

  createSession(user);
  return { success: true, user };
};

// --- SESSION UTILS ---

export const createSession = (user: User) => {
  // Store only necessary session info
  const sessionUser = {
    name: user.name,
    email: user.email,
    role: user.role || '',
    picture: user.picture || '',
    bio: user.bio || '',
    skills: user.skills || ''
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
};

export const getSession = (): User | null => {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  } catch (e) {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

// --- JWT PARSER ---

export const parseJwt = (token: string): GoogleUser => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT", e);
    return { name: "User", email: "", picture: "", sub: "" };
  }
};
