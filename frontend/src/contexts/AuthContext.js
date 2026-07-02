import React, { createContext, useState, useEffect } from 'react';
import { updateProfileApi, authLogin, authSignup, fetchCurrentUser } from '../utils/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // session holds token and user: { token, user }
  const [session, setSession] = useState({ token: null, user: null });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        // stored shape is expected to be { token }
        const token = parsed?.token || null;
        setSession({ token, user: null });
        // If token present, try to restore user from backend
        if (token) {
          setIsAuthLoading(true);
          fetchCurrentUser().then(user => {
            // backend returns user object
            setSession({ token, user });
            setIsAuthLoading(false);
          }).catch(err => {
            // if unauthorized or other error, clear token
            console.warn('Failed to restore session from /api/auth/me:', err?.message || err);
            localStorage.removeItem('currentUser');
            setSession({ token: null, user: null });
            setIsAuthLoading(false);
          });
        } else {
          setIsAuthLoading(false);
        }
      }
    } catch (e) {
      // ignore
      setIsAuthLoading(false);
    }
  }, []);

  // Update profile for current user (name, email, avatar, password)
  const updateProfile = async (updates) => {
    // Try server-side profile update first; if it fails, fall back to localStorage-only update
    try {
      const res = await updateProfileApi(updates);
      // Expecting the API to return the updated user object and optionally a token
      const updated = res.user || res;
      // Update session: preserve token if present
      const newSession = { token: res.token || session.token, user: { email: updated.email, name: updated.name, avatar: updated.avatar } };
      // Persist only the token in localStorage per requirements
      localStorage.setItem('currentUser', JSON.stringify({ token: newSession.token }));
      // Also update local users list so frontend fallback remains consistent
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const idx = users.findIndex(u => u.email === updated.email);
        if (idx !== -1) users[idx] = { ...users[idx], ...updated };
        else users.push({ ...updated });
        localStorage.setItem('users', JSON.stringify(users));
      } catch (e) {
        // ignore local users update failure
      }
      setSession(newSession);
      return newSession;
    } catch (apiErr) {
      // Fallback: update localStorage-only users/session
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const current = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!current) throw new Error('No current user');

        const idx = users.findIndex(u => u.email === current.email);
        if (idx === -1) throw new Error('User record not found');

        // Merge updates into stored user record (note: stored users use plain password property)
        const merged = { ...users[idx], ...updates };
        users[idx] = merged;
        localStorage.setItem('users', JSON.stringify(users));

        // Update session object (do not store password in session)
        const newSession = { token: null, user: { email: merged.email, name: merged.name, avatar: merged.avatar } };
        localStorage.setItem('currentUser', JSON.stringify(newSession));
        setSession(newSession);
        return newSession;
      } catch (err) {
        throw err;
      }
    }
  };

  const signup = async ({ name, email, password }) => {
    // Try backend signup first
    try {
      const res = await authSignup({ name, email, password });
      if (res && res.token && res.user) {
          const s = { token: res.token, user: res.user };
        // Persist only token
        localStorage.setItem('currentUser', JSON.stringify({ token: res.token }));
        setSession(s);
        return s;
      }
    } catch (err) {
      // fall through to local fallback
      console.warn('Backend signup failed, falling back to local signup', err?.message || err);
    }

    // localStorage-backed signup fallback for dev
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const exists = users.find(u => u.email === email);
    if (exists) {
      const err = new Error('User with this email already exists');
      err.response = { data: { message: 'User already exists' } };
      throw err;
    }

    const newUser = { id: Date.now(), name, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    const s = { token: null, user: { email: newUser.email, name: newUser.name } };
    localStorage.setItem('currentUser', JSON.stringify({ token: null }));
    setSession(s);
    return s;
  };

  const login = async (email, password) => {
    // Try backend login first
    try {
      const res = await authLogin({ email, password });
      if (res && res.token && res.user) {
        const s = { token: res.token, user: res.user };
          // Persist only token
          localStorage.setItem('currentUser', JSON.stringify({ token: res.token }));
          setSession(s);
          return s;
      }
    } catch (err) {
      // backend login failed; continue to local fallback
      console.warn('Backend login failed, falling back to local login', err?.message || err);
    }

    // local fallback
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) {
      const err = new Error('Invalid credentials');
      err.response = { data: { message: 'Invalid email or password' } };
      throw err;
    }

    const s = { token: null, user: { email: found.email, name: found.name } };
    localStorage.setItem('currentUser', JSON.stringify({ token: null }));
    setSession(s);
    return s;
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setSession({ token: null, user: null });
  };

  const setAuthSession = (token, user) => {
    try{
      localStorage.setItem('currentUser', JSON.stringify({ token }));
    }catch(e){}
    setSession({ token, user });
  }

  return (
    <AuthContext.Provider value={{ user: session.user, token: session.token, isAuthenticated: !!session.token, isAuthLoading, signup, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
