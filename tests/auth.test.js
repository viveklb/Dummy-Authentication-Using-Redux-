import { test } from 'node:test';
import assert from 'node:assert/strict';

const saved = new Map();
globalThis.sessionStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) };
const { store, login, logout } = await import('../src/store.js');
const { request } = await import('../src/api.js');

test('authentication persists token and ID, surfaces invalid credentials, and clears logout state', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://dummyjson.com/auth/login');
      assert.equal(options.method, 'POST');
      assert.deepEqual(JSON.parse(options.body), { username: 'emilys', password: 'emilyspass', expiresInMins: 60 });
      return Response.json({ id: 1, accessToken: 'demo-token' });
    };
    await store.dispatch(login({ username: 'emilys', password: 'emilyspass' }));
    assert.deepEqual(store.getState().auth.session, { token: 'demo-token', id: 1 });
    assert.deepEqual(JSON.parse(saved.get('authspace.session')), { token: 'demo-token', id: 1 });
    store.dispatch(logout());
    assert.equal(store.getState().auth.session, null);
    assert.equal(saved.size, 0);
    globalThis.fetch = async () => Response.json({ message: 'Invalid credentials' }, { status: 400 });
    await store.dispatch(login({ username: 'invalid', password: 'wrong' }));
    assert.equal(store.getState().auth.error, 'Invalid credentials');
    assert.equal(store.getState().auth.status, 'idle');
    assert.equal(store.getState().auth.session, null);
  } finally { globalThis.fetch = originalFetch; store.dispatch(logout()); }
});

test('profile requests send the saved ID and token and expose expired session status', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://dummyjson.com/auth/users/1');
      assert.equal(options.headers.Authorization, 'Bearer demo-token');
      return Response.json({ message: 'Token expired' }, { status: 401 });
    };
    await assert.rejects(request('/auth/users/1', { headers: { Authorization: 'Bearer demo-token' } }), error => error.status === 401 && error.message === 'Token expired');
    globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
    await assert.rejects(request('/auth/users/1'), /Check your connection/);
  } finally { globalThis.fetch = originalFetch; }
});
