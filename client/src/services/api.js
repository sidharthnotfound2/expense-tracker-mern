// All calls to the backend live in this file.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // network problem: server down or no internet
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  register: (body) => request('POST', '/auth/register', body),
  login: (body) => request('POST', '/auth/login', body),
  me: () => request('GET', '/auth/me'),

  listExpenses: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) query.set(key, value);
    });
    return request('GET', `/expenses?${query.toString()}`);
  },
  summary: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) query.set(key, value);
    });
    return request('GET', `/expenses/summary?${query.toString()}`);
  },
  getExpense: (id) => request('GET', `/expenses/${id}`),
  createExpense: (body) => request('POST', '/expenses', body),
  updateExpense: (id, body) => request('PUT', `/expenses/${id}`, body),
  deleteExpense: (id) => request('DELETE', `/expenses/${id}`),
};

export const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Education', 'Other'];
