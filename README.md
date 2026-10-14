# Dummy Authentication (Redux)

A responsive React/Redux authentication demo using the [DummyJSON API](https://dummyjson.com/docs/auth).

## Run locally

```sh
npm install
npm run dev
```

Demo username: `emilys`. Demo password: `emilyspass`.

## Authentication flow

- Labeled username/password fields, password visibility control, loading state, and frontend API errors.
- Redux Toolkit manages login and session state. Token and ID are saved in sessionStorage, survive refreshes within the tab, and are removed on logout.
- The protected profile route fetches `/auth/users/:id` with the saved Bearer token. Its `useEffect` runs once per profile mount/session, with a deliberate retry only after a failure. Cleanup aborts outstanding requests.
- The fetched user object is saved in `useState`. Recursive rendering displays every returned field, including nested address, bank, company, and crypto information.
- Unauthorized profile responses clear the session and return to login.
- Hash routing allows static deployment without server rewrite rules.

## Build and deploy

```sh
npm run build
npm run preview
```

Deploy `dist/` to a static host. On Netlify or Vercel, use `npm run build` and output directory `dist`. This is an educational demo; all API profile data, including any sensitive-looking fields, is fictional. Use only public demo credentials.
