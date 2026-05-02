const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken(): string {
  try {
    const auth = localStorage.getItem('verimat_auth');
    if (!auth) return '';
    const parsed = JSON.parse(auth);
    return parsed.token || '';
  } catch {
    return '';
  }
}

export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}${path}`;
  const headers = {
    ...authHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  // Auto-logout if token expired
  if (response.status === 401) {
    localStorage.removeItem('verimat_auth');
    localStorage.removeItem('verimat_login_time');
    window.location.href = '/login';
  }

  return response;
}

export { API_URL };
