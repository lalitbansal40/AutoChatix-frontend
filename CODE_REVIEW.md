# AutoChatix Frontend - Comprehensive Code Review

**Reviewed:** React 18 + TypeScript 4.9 WhatsApp Business chatbot dashboard  
**Date:** May 2026  
**Reviewer:** Code Analysis

---

## Executive Summary

The AutoChatix frontend is a moderately complex React dashboard with several critical security, performance, and architectural concerns. The most pressing issues involve **token handling security**, **open redirect vulnerability**, **excessive `any` type abuse**, and **problematic dependency choices** (jsonwebtoken in browser, deprecated react-scripts). While the core structure is sound, multiple findings require immediate remediation before production deployment.

---

## Top Issues Summary

### Critical (Fix Immediately)
1. **Open Redirect via `location.state.from`** — Can be exploited for phishing
2. **Insecure Token Storage in localStorage** — No HttpOnly protection; vulnerable to XSS
3. **Unvalidated URL opening** — `window.open()` with user/API data without origin checking
4. **`jsonwebtoken` in browser bundle** — Red flag; verify it's not signing tokens client-side

### High (Fix Before Release)
5. **Console logs leaking auth details** — `console.log(response.data)` on login
6. **Missing CORS/CSRF protection** — No CSRF tokens in interceptor or headers
7. **Unsafe `any` abuse (217 occurrences)** — Loss of type safety, especially in API layers
8. **Unencrypted WebSocket URLs in console** — Debug logs expose `accountId` parameter
9. **Deprecated `react-scripts ^5.0.1`** — Known security vulnerabilities; migrate to Vite

### Medium (Schedule for Next Sprint)
10. **Prop drilling instead of context** — Inconsistent state management (Redux + React Query + Context)
11. **Missing error handling on JSON.parse** — Silent failures in `ChatHistory.tsx`
12. **Hardcoded test credentials** — Email/password in `AuthLogin.tsx` initialValues
13. **No token refresh logic** — Single JWT without refresh token rotation mechanism
14. **`@ts-ignore` in Firebase social login** — Type safety bypassed, functions may not exist

---

## Detailed Findings

### 1. SECURITY ISSUES

#### **CRITICAL: Open Redirect via `location.state.from`**
- **Severity:** Critical
- **File:** `/src/utils/route-guard/GuestGuard.tsx:20`
- **Issue:**
  ```typescript
  navigate(location?.state?.from ? location?.state?.from : APP_DEFAULT_PATH, {
  ```
  The `location.state.from` is set by the AuthGuard after redirect and can be manipulated by attackers. A crafted URL like `?from=https://evil.com` in state could redirect users to external sites after login.

- **Why it matters:** Phishing attacks; users trust redirect after auth, attackers abuse it
- **Fix:**
  ```typescript
  // Whitelist internal paths only
  const safeRedirect = (path: string) => {
    if (!path || !path.startsWith('/')) return APP_DEFAULT_PATH;
    const allowedPrefixes = ['/chats', '/channels', '/automations', '/integrations'];
    return allowedPrefixes.some(p => path.startsWith(p)) ? path : APP_DEFAULT_PATH;
  };
  navigate(safeRedirect(location?.state?.from), { replace: true });
  ```

---

#### **CRITICAL: Insecure Token Storage in localStorage**
- **Severity:** Critical
- **File:** `/src/contexts/JWTContext.tsx:39`
- **Issue:**
  ```typescript
  localStorage.setItem('serviceToken', serviceToken);
  ```
  JWT stored in plain localStorage without HttpOnly flag. Accessible via XSS; no secure-only transmission.

- **Why it matters:** XSS attack → token theft → account compromise; no automatic logout on browser close
- **Fix:**
  1. **Backend:** Issue tokens as HttpOnly, Secure, SameSite cookies
  2. **Frontend:** Remove localStorage token; rely on cookies (automatically included in requests)
  3. **Alternative (if cookies unavailable):** Use sessionStorage + add Content-Security-Policy header to mitigate XSS
  ```typescript
  // Temporary: Use sessionStorage instead, but backend MUST handle HttpOnly cookies
  sessionStorage.setItem('serviceToken', serviceToken);
  ```

---

#### **CRITICAL: Unvalidated window.open() URLs**
- **Severity:** Critical (XSS/injection vector)
- **Files:**
  - `/src/sections/ChatHistory.tsx:250, 268, 310, 346, 387`
  - `/src/utils/buttonActions.ts:10`
- **Issue:**
  ```typescript
  // Line 310 in ChatHistory.tsx
  onClick={() => url && window.open(url, '_blank')}
  
  // Line 10 in buttonActions.ts
  window.open(btn.url, "_blank");  // btn.url from API, not sanitized
  ```
  URLs from WhatsApp message payloads opened directly without validation. If API is compromised or returns malicious URLs, users are redirected.

- **Why it matters:** Phishing; malware distribution via trusted chat app
- **Fix:**
  ```typescript
  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };
  
  onClick={() => isValidUrl(url) && window.open(url, '_blank')}
  ```

---

#### **HIGH: Console Logs Leaking Credentials**
- **Severity:** High
- **File:** `/src/contexts/JWTContext.tsx:85-88`
- **Issue:**
  ```typescript
  const login = async (email: string, password: string) => {
    console.log("hello")  // Line 86
    const response = await axios.post('/auth/login', { email, password });
    console.log(response.data)  // Line 88 — LOGS FULL RESPONSE INCLUDING TOKEN
  ```

- **Why it matters:** Token visible in browser console and DevTools; persists in error reporting tools if used
- **Fix:**
  ```typescript
  const login = async (email: string, password: string) => {
    const response = await axios.post('/auth/login', { email, password });
    const { token, user } = response.data;
    // NO console.log of token or full response
    setSession(token);
    dispatch({ type: LOGIN, payload: { isLoggedIn: true, user } });
  };
  ```

---

#### **HIGH: WebSocket accountId Exposed in Console Logs**
- **Severity:** High
- **File:** `/src/contexts/WebSocketContext.tsx:32-40, 52, 73`
- **Issue:**
  ```typescript
  console.log(`[WS] Connecting → ${wsUrl}?accountId=${accountId}`);
  console.log('[WS] Message received:', data);
  ```
  Account ID and message data logged to browser console in development; accidental production leak.

- **Why it matters:** Account enumeration; session hijacking if logs are accessible
- **Fix:**
  ```typescript
  if (process.env.NODE_ENV === 'development') {
    console.log('[WS] Connecting...');  // Don't log URL with accountId
  }
  // Remove console.log of data entirely; use structured logging if needed
  ```

---

#### **HIGH: Missing CSRF Token in Axios Interceptor**
- **Severity:** High
- **File:** `/src/utils/axios.ts`
- **Issue:** No CSRF token header being added to requests. If backend expects CSRF protection, forms are vulnerable to cross-site request forgery.

- **Why it matters:** CSRF attacks on state-changing operations (create automation, delete channel, etc.)
- **Fix:**
  ```typescript
  axiosServices.interceptors.request.use((config) => {
    // Add CSRF token from meta tag or cookie
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
      config.headers['X-CSRF-Token'] = token;
    }
    return config;
  });
  ```

---

#### **HIGH: @ts-ignore Bypass in Firebase Social Login**
- **Severity:** High (Type Safety)
- **File:** `/src/sections/auth/auth-forms/FirebaseSocial.tsx:19-20`
- **Issue:**
  ```typescript
  // @ts-ignore
  const { firebaseFacebookSignIn, firebaseGoogleSignIn, firebaseTwitterSignIn } = useAuth();
  ```
  Methods don't exist in `useAuth()` hook (returns JWT context). Ignoring type error masks missing implementation.

- **Why it matters:** Functions silently fail; potential unhandled errors at runtime
- **Fix:** Either implement these methods in JWTContext or remove the component if unused.

---

### 2. DEPENDENCY & BUILD ISSUES

#### **HIGH: Deprecated `react-scripts ^5.0.1`**
- **Severity:** High (Security/Maintenance)
- **File:** `package.json:45`
- **Issue:** Create React App is in maintenance mode; react-scripts has known vulnerabilities. See: https://github.com/facebook/create-react-app/issues/13427

- **Impact:** No security patches; large bundle; slow builds
- **Fix:** Migrate to **Vite** or **Next.js**:
  ```json
  // Remove react-scripts, add Vite
  "build": "vite build",
  "preview": "vite preview"
  ```

---

#### **CRITICAL: `jsonwebtoken` in Browser Bundle**
- **Severity:** Critical
- **File:** `package.json:30`
- **Issue:** `jsonwebtoken` (Node.js library) is installed for browser. This is a code smell; if frontend is **signing tokens**, that's a severe security issue (private key exposed).

- **Check:** Search codebase for `.sign()` usage.
- **Fix:** If not signing tokens (only decoding):
  ```bash
  npm uninstall jsonwebtoken  # Use only jwt-decode for decoding
  ```
  If signing is needed, that **must move to backend**.

---

#### **HIGH: Browser-ified Node Modules (Unnecessary)**
- **Severity:** High (Bundle Size)
- **File:** `config-overrides.js:5-11`
- **Issue:**
  ```javascript
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  ```
  Including crypto and stream polyfills for browser without clear need. Adds ~100KB+ to bundle.

- **Impact:** Slower app startup; likely only needed if old libraries require them
- **Fix:** Audit which dependencies actually need these. Remove if unnecessary.

---

#### **MEDIUM: @mui/lab Alpha Versions Mixed with Stable**
- **Severity:** Medium
- **File:** `package.json:13`
- **Issue:** `@mui/lab@^5.0.0-alpha.127` mixed with stable Material-UI 5. Alpha versions can break.

- **Fix:**
  ```json
  "@mui/lab": "^5.0.0"  // Use stable version when available
  ```

---

### 3. TYPESCRIPT & TYPE SAFETY

#### **HIGH: 217 Instances of `any` Type Abuse**
- **Severity:** High
- **Files:** Scattered across 46 files (see grep output count)
- **Examples:**
  - `/src/pages/Chat.tsx:28` — `const data: HistoryProps[] = []` immediately becomes `any`
  - `/src/pages/AutomationBuilder.tsx:39-46` — `buttons?: any[]`
  - `/src/contexts/WebSocketContext.tsx:72` — `(user as any)?.account_id`

- **Why it matters:** Loses type safety; errors caught at runtime not compile-time; IDE autocomplete fails
- **Fix:** Define proper interfaces:
  ```typescript
  interface UserProfile {
    account_id?: string;
    _id?: string;
    id?: string;
  }
  const accountId = user?.account_id || user?._id || user?.id;
  ```

---

### 4. AUTH & TOKEN HANDLING

#### **MEDIUM: No Token Refresh Mechanism**
- **Severity:** High (Session Management)
- **File:** `/src/contexts/JWTContext.tsx:26-35`
- **Issue:**
  ```typescript
  const verifyToken = (serviceToken) => {
    const decoded = jwtDecode(serviceToken);
    return decoded.exp > Date.now() / 1000;  // Only checks expiry, doesn't refresh
  };
  ```
  Once token expires, user is logged out. No silent refresh; bad UX for long sessions.

- **Fix:**
  ```typescript
  // Add refresh token endpoint
  const refreshToken = async () => {
    const response = await axios.post('/auth/refresh', {
      refreshToken: localStorage.getItem('refreshToken')
    });
    setSession(response.data.token);
  };
  
  // In axios interceptor:
  if (error.response.status === 401) {
    try {
      await refreshToken();
      return axiosServices(originalRequest);
    } catch {
      // Refresh failed, logout
    }
  }
  ```

---

#### **MEDIUM: Hardcoded Test Credentials**
- **Severity:** Medium
- **File:** `/src/sections/auth/auth-forms/AuthLogin.tsx:53-56`
- **Issue:**
  ```typescript
  initialValues={{
    email: 'info@codedthemes.com',
    password: '123456',
  }}
  ```

- **Fix:** Remove for production:
  ```typescript
  initialValues={{ email: '', password: '', submit: null }}
  ```

---

### 5. STATE MANAGEMENT

#### **MEDIUM: Mixed State Management Patterns**
- **Severity:** Medium
- **Files:** Redux (auth, chat, menu), React Query (automations, channels), Context (WebSocket, config)
- **Issue:** No clear separation of concerns. Redux for auth, React Query for API data, Context for WebSocket leads to prop drilling and cognitive overhead.

- **Impact:** Hard to trace data flow; potential race conditions
- **Fix:** Standardize on one approach:
  - **Option A:** Redux Toolkit for all state (mature, predictable)
  - **Option B:** React Query for server state + Context for client state (modern, lighter)

---

#### **MEDIUM: Silent Failures in JSON Parsing**
- **Severity:** Medium
- **File:** `/src/sections/ChatHistory.tsx:112`
- **Issue:**
  ```typescript
  try { parsed = JSON.parse(response); } catch { return <Typography>{response}</Typography>; }
  ```
  Silently ignores parse errors; displays raw string instead of error UI.

- **Fix:**
  ```typescript
  try {
    parsed = JSON.parse(response);
  } catch (e) {
    console.error('Failed to parse flow response:', e);
    return <Typography color="error">Invalid response format</Typography>;
  }
  ```

---

### 6. PERFORMANCE

#### **MEDIUM: Large Lodash Bundle for Single Function**
- **Severity:** Medium
- **File:** `/src/themes/overrides/index.ts:5`
- **Issue:**
  ```typescript
  import { merge } from 'lodash';  // Pulls in 70KB+ minified
  ```
  Only `merge` is used. Full lodash added to bundle.

- **Fix:**
  ```typescript
  import merge from 'lodash/merge';  // Tree-shakeable, ~4KB
  ```

---

#### **MEDIUM: No Lazy Loading on Heavy Components**
- **Severity:** Medium
- **File:** `/src/pages/Chat.tsx` and others
- **Issue:** Large component file (Chat.tsx) loaded immediately with `heic2any`, `emoji-picker-react`, media recorder—not lazy-loaded.

- **Fix:**
  ```typescript
  const ChatPage = lazy(() => import('pages/Chat'));
  const EmojiPicker = lazy(() => import('emoji-picker-react'));
  ```

---

### 7. FORMIK & VALIDATION

#### **MEDIUM: Inconsistent Validation**
- **Severity:** Medium
- **File:** `/src/sections/auth/auth-forms/` (all auth forms)
- **Issue:** Client-side validation only; no clear documentation of server-side expectations.

- **Fix:** Add backend validation docs; consider shared validation schema.

---

## Summary Table

| Category | Count | Top Issue |
|----------|-------|-----------|
| Security | 8 | Open redirect + localStorage tokens |
| Dependencies | 3 | Deprecated react-scripts + jsonwebtoken |
| TypeScript | 217 | `any` type abuse |
| Auth | 3 | No refresh tokens, hardcoded creds |
| State Mgmt | 3 | Mixed patterns (Redux + RQ + Context) |
| Performance | 3 | Full lodash, no lazy loading |
| **Total** | **237** | **Fix critical + high in 1-2 sprints** |

---

## Recommended Roadmap

### Sprint 1 (Immediate)
- [ ] Fix open redirect vulnerability (GuestGuard.tsx)
- [ ] Move JWT to HttpOnly cookies or sessionStorage
- [ ] Remove console.log of tokens and sensitive data
- [ ] Sanitize URLs before `window.open()`
- [ ] Remove hardcoded test credentials

### Sprint 2 (Before Release)
- [ ] Add token refresh mechanism
- [ ] Add CSRF token to interceptor
- [ ] Fix jsonwebtoken (verify no signing, remove if unneeded)
- [ ] Remove @ts-ignore, implement missing auth methods
- [ ] Reduce `any` to <50 instances (priority: API response types)

### Sprint 3 (Next Release)
- [ ] Migrate from react-scripts to Vite
- [ ] Consolidate state management (Redux OR React Query + Context)
- [ ] Add E2E tests for auth flow
- [ ] Implement error boundaries and structured error handling

---

## Files Requiring Immediate Review

1. `/src/contexts/JWTContext.tsx` — Token handling
2. `/src/utils/route-guard/GuestGuard.tsx` — Open redirect
3. `/src/sections/ChatHistory.tsx` — URL validation
4. `/src/utils/axios.ts` — CSRF + 401 handling
5. `package.json` — Dependency audit
6. `config-overrides.js` — Polyfill justification

---

## Conclusion

The codebase is **functionally complete but requires security hardening** before production deployment. The three critical issues (open redirect, token storage, URL validation) should be fixed within 1-2 days. TypeScript type safety and state management consolidation are lower-priority but will improve long-term maintainability.

**Estimated effort to address all findings:** 3-4 weeks (phased across 3 sprints).

