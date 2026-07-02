Auth changes and frontend auth cleanup

What I changed
- Added a centralized AuthContext and wired it in `src/index.js` (wraps App in BrowserRouter + AuthProvider).
- Refactored routing in `src/App.js` so `/login` and `/signup` routes render auth pages and the existing app UI is preserved under the main route.
- Implemented a `Logout` action wired to the sidebar which clears the local session and navigates to `/login`.
- Redesigned and centralized styles for auth pages:
  - Files updated: `src/Components/Login.jsx`, `src/Components/Signup.jsx`.
  - Moved inline styles into `src/App.css` using these classes: `.auth-page`, `.auth-card`, `.auth-logo`, `.auth-title`, `.auth-subtitle`, `.auth-form`, `.auth-label`, `.auth-input`, `.auth-cta`, `.auth-help`, `.auth-link`, `.auth-error`.

How to test locally
1. From the workspace root open a PowerShell terminal and run:

```powershell
cd "c:\Users\SUGMYA\OneDrive\Desktop\finarth-main - Copy\frontend"
npm install    # if you haven't installed deps yet
npm start
```

2. In your browser go to http://localhost:3000/login and http://localhost:3000/signup to verify the pages render with the new centered card design.
3. Create a new account on `/signup` (this demo saves users to `localStorage`), then sign in on `/login` to confirm navigation to `/dashboard` and that the sidebar shows the logout option.
4. Click Logout in the sidebar to confirm you get redirected to `/login` and the `currentUser` is cleared from `localStorage`.

Notes & known issues
- The auth UI styles are centralized, but there are several remaining inline styles across `src/App.js` (visual summary cards, colors, some buttons). A targeted sweep can move these into `App.css` for consistency.
- Duplicate component files: `src/Components/Login.js` and `src/Components/Signup.js` exist alongside `Login.jsx`/`Signup.jsx`. The app currently uses the `.jsx` versions — consider removing or consolidating the duplicates to avoid confusion.
- Dev server produced only deprecation warnings related to webpack-dev-server options (non-blocking).

Recommended next steps (I can do these for you):
- Sweep `src/App.js` and other components to move inline `style={{...}}` usages into `App.css` classes (low risk). I can do this and run the dev server to verify visuals.
- Remove or merge duplicate `Login.js`/`Signup.js` files.
- Add simple unit tests for `AuthContext` and the auth pages (Jest + React Testing Library) to lock regressions.

If you want, I can now:
- Remove the duplicate files and/or
- Replace the inline styles found in `src/App.js` with CSS classes (I'll do this incrementally and run the dev server to catch regressions).

Tell me which follow-up you prefer and I'll proceed.
