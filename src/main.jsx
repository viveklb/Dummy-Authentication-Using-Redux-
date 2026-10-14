import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { HashRouter, Navigate, Route, Routes, Link } from 'react-router-dom';
import { store, login, logout, clearError } from './store';
import { request } from './api';
import './styles.css';

function Brand() { return <Link className="brand" to="/"><span className="brand-mark">a.</span>authspace<span className="demo-badge">DEMO</span></Link>; }

function Login() {
  const dispatch = useDispatch();
  const { session, status, error } = useSelector(state => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  if (session) return <Navigate to="/profile" replace />;
  function submit(event) { event.preventDefault(); dispatch(login({ username: username.trim(), password })); }
  return <div className="login-layout"><aside className="welcome-panel"><Brand/><div className="welcome-copy"><span className="eyebrow">YOUR PERSONAL SPACE</span><h1>A little more<br/>connected.<br/><em>A lot more you.</em></h1><p>One sign-in. Everything about you,<br/>beautifully in one place.</p><div className="abstract" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="sphere"/><span className="spark">✦</span></div></div><div className="panel-bottom"><span>Made for the everyday.</span><span>↗</span></div></aside><main className="login-main"><div className="mobile-brand"><Brand/></div><div className="login-card"><span className="eyebrow muted">LET’S GET YOU IN</span><h2>Welcome back.</h2><p className="subtitle">Sign in to explore your profile.</p><form onSubmit={submit}><label htmlFor="username">Username</label><input id="username" autoComplete="username" placeholder="Enter your username" required value={username} onChange={e => { setUsername(e.target.value); dispatch(clearError()); }} disabled={status === 'loading'}/><label htmlFor="password">Password</label><div className="password-field"><input id="password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={e => { setPassword(e.target.value); dispatch(clearError()); }} disabled={status === 'loading'}/><button type="button" className="reveal" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</button></div>{error && <p className="error" role="alert">{error}</p>}<button className="primary" disabled={status === 'loading'}>{status === 'loading' ? 'Signing in…' : 'Sign in'}<span aria-hidden="true">→</span></button></form><div className="demo-note"><span className="note-icon">i</span><div><strong>Just taking a look?</strong><p>Try the public demo account.</p><code>emilys <span>/</span> emilyspass</code><button className="text-button" type="button" disabled={status === 'loading'} onClick={() => { setUsername('emilys'); setPassword('emilyspass'); dispatch(clearError()); }}>Use demo credentials ↗</button></div></div><p className="small-print">A learning project powered by DummyJSON.<br/>Use demo credentials only.</p></div><footer>YOUR DETAILS. YOUR SPACE.</footer></main></div>;
}

function label(key) { return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, char => char.toUpperCase()); }
function Details({ data }) {
  return <dl className="details">{Object.entries(data).map(([key, value]) => <div className={value !== null && typeof value === 'object' ? 'detail nested' : 'detail'} key={key}><dt>{label(key)}</dt><dd>{value !== null && typeof value === 'object' ? <Details data={value}/> : value === null ? 'Not provided' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</dd></div>)}</dl>;
}
function Profile() {
  const { session } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    setError(''); setUser(null);
    request(`/auth/users/${session.id}`, { headers: { Authorization: `Bearer ${session.token}` }, signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setUser(data); })
      .catch(err => { if (controller.signal.aborted) return; if (err.status === 401 || err.status === 403) { dispatch(logout()); } else setError(err.message); });
    return () => controller.abort();
  }, [session, dispatch, attempt]);
  if (!session) return <Navigate to="/" replace/>;
  return <div className="profile-page"><header><Brand/><button className="secondary" onClick={() => dispatch(logout())}>Sign out ↗</button></header><main className="profile-main"><div className="profile-heading"><div><span className="eyebrow muted">YOUR PERSONAL SPACE</span><h1>My profile<span>.</span></h1><p className="subtitle">A closer look at everything that makes you, you.</p></div><span className="session-badge"><span/> Signed in</span></div>{error ? <div className="status-card" role="alert"><h2>Couldn’t load your profile.</h2><p>{error}</p><button className="secondary" onClick={() => setAttempt(n => n + 1)}>Try again</button></div> : !user ? <div className="status-card" role="status"><div className="spinner"/><p>Getting your profile ready…</p></div> : <><section className="identity-card"><img src={user.image} alt={`${user.firstName} ${user.lastName}`} width="96" height="96"/><div><span className="eyebrow">HELLO AGAIN</span><h2>{user.firstName} {user.lastName}</h2><p>@{user.username} <span className="dot">·</span> {user.email}</p></div><span className="member-tag">{user.role || 'Member'}</span></section><section className="information-card"><div className="section-heading"><h2>Your information</h2><span>FULL PROFILE</span></div><Details data={user}/></section><p className="profile-footnote">All fields shown as returned by the DummyJSON demo API.</p></>}</main><footer>AUTHSPACE <span>Made for the everyday.</span></footer></div>;
}
function App() { return <Provider store={store}><HashRouter><Routes><Route path="/" element={<Login/>}/><Route path="/profile" element={<Profile/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></HashRouter></Provider>; }
createRoot(document.getElementById('root')).render(<App/>);
