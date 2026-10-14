import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { request } from './api.js';

const SESSION_KEY = 'authspace.session';
function readSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return typeof session?.token === 'string' && Number.isInteger(session?.id) ? session : null;
  } catch { return null; }
}
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...credentials, expiresInMins: 60 }) });
    const session = { token: data.accessToken || data.token, id: data.id };
    if (!session.token || !Number.isInteger(session.id)) throw new Error('The server returned an invalid session.');
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  } catch (error) { return rejectWithValue(error.message); }
});
const auth = createSlice({
  name: 'auth', initialState: { session: readSession(), status: 'idle', error: null },
  reducers: { logout(state) { state.session = null; state.status = 'idle'; state.error = null; }, clearError(state) { state.error = null; } },
  extraReducers: (builder) => builder
    .addCase(login.pending, (state) => { state.status = 'loading'; state.error = null; })
    .addCase(login.fulfilled, (state, action) => { state.status = 'idle'; state.session = action.payload; })
    .addCase(login.rejected, (state, action) => { state.status = 'idle'; state.error = action.payload || 'Login failed.'; }),
});
export const { logout, clearError } = auth.actions;
export const store = configureStore({ reducer: { auth: auth.reducer } });
store.subscribe(() => { if (!store.getState().auth.session) { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Storage may be unavailable. */ } } });
