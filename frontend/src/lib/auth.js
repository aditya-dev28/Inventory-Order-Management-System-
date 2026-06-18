// Lightweight frontend-only auth helpers backed by localStorage.
// NOT a real authentication system — purely for demo/welcome UX.

const STORAGE_KEY = "iom_auth_session";

export const DEMO_CREDENTIALS = {
  email: "admin@example.in",
  password: "admin123",
};

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getSession()?.email;
}

export function login(email) {
  const session = {
    email,
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}
