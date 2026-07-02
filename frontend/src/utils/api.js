// Simple API helper: uses stored token if present, but falls back gracefully to localStorage-only flow.

// Simple API helper: uses stored token if present, but falls back gracefully to localStorage-only flow.

export function getAuthToken() {
  try {
    const s = localStorage.getItem('currentUser');
    if (!s) return null;
    const obj = JSON.parse(s);
    return obj?.token || null;
  } catch (e) { return null; }
}

async function apiFetch(path, options = {}) {
  const base = process.env.REACT_APP_API_BASE || '';
  const url = base + path;
  const token = getAuthToken();
  const headers = options.headers || {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = new Error(body.message || 'API error');
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return await res.json().catch(() => ({}));
  } catch (err) {
    // propagate error to caller; caller can fallback to localStorage
    throw err;
  }
}

export async function fetchEntriesFromBackend() {
  return apiFetch('/api/data');
}

export async function createEntryOnBackend(entry) {
  return apiFetch('/api/data', { method: 'POST', body: JSON.stringify(entry) });
}

export async function deleteEntryOnBackend(id) {
  return apiFetch(`/api/data/${id}`, { method: 'DELETE' });
}

export async function changePasswordApi({ currentPassword, newPassword }) {
  return apiFetch('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
}

export async function updateProfileApi(updates) {
  return apiFetch('/api/auth/update-profile', { method: 'POST', body: JSON.stringify(updates) });
}

// Authentication helpers
export async function authSignup({ name, email, password }) {
  return apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export async function authLogin({ email, password }) {
  return apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

// Upload a file for server-side analysis. Expects a FormData instance with field `file`.
export async function uploadFileAnalysis(formData) {
  // Require auth token for file uploads
  const token = getAuthToken();
  if (!token) {
    const err = new Error('Authentication required');
    err.status = 401;
    throw err;
  }
  // apiFetch will not set Content-Type for FormData (correct behavior)
  return apiFetch('/api/analysis', { method: 'POST', body: formData });
}

export async function fetchAnalytics() {
  return apiFetch('/api/analysis/analytics');
}

export async function fetchDashboardConfig() {
  return apiFetch('/api/analytics/dashboard');
}

// Fetch current user (protected). Uses Authorization header if token present.
export async function fetchCurrentUser() {
  return apiFetch('/api/auth/me');
}
