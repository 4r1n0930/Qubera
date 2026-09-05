const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:5000'

type AuthUser = { id: string; name: string; email: string; profilePhoto?: string }

type ApiResult<T> = { ok: boolean; data?: T; message?: string; notVerified?: boolean }

async function apiPost<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, message: json.message || `Request failed (${res.status})`, notVerified: json.notVerified }
    }
    return { ok: true, data: json as T, message: json.message }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Network error' }
  }
}

// Fallback mock store for when backend is not reachable (keeps UI functional in preview)
const LS_USERS_KEY = 'qubera_mock_users'
const LS_PENDING_EMAIL = 'qubera_pending_email'

type MockUser = { name: string; email: string; password: string; isVerified: boolean; code: string; codeExpires: number }

function getMockUsers(): Record<string, MockUser> {
  try { return JSON.parse(localStorage.getItem(LS_USERS_KEY) || '{}') } catch { return {} }
}
function setMockUsers(u: Record<string, MockUser>) { try { localStorage.setItem(LS_USERS_KEY, JSON.stringify(u)) } catch { /* ignore */ } }
function mockGenerateCode() { return Math.floor(100000 + Math.random()*900000).toString() }

export const authService = {
  async register(name: string, email: string, password: string): Promise<ApiResult<{ email: string }>> {
    const r = await apiPost<{ email: string; message: string }>('/auth/register', { name, email, password })
    if (r.ok) {
      try { localStorage.setItem(LS_PENDING_EMAIL, email) } catch { /* */ }
      return r
    }
    // fallback mock if backend unreachable
    if (r.message?.includes('Network') || r.message?.includes('Failed to fetch')) {
      const users = getMockUsers()
      const key = email.toLowerCase()
      if (users[key]) return { ok: false, message: 'User already exists' }
      const code = mockGenerateCode()
      users[key] = { name, email, password, isVerified: false, code, codeExpires: Date.now()+24*60*60*1000 }
      setMockUsers(users)
      try { localStorage.setItem(LS_PENDING_EMAIL, email) } catch { /* */ }
      console.log(`[Mock] Verification code for ${email}: ${code}`)
      return { ok: true, data: { email }, message: 'User registered. Please verify your email.' }
    }
    return r
  },

  async verifyEmail(email: string, code: string): Promise<ApiResult<{ token: string; user: AuthUser }>> {
    const r = await apiPost<{ token: string; user: AuthUser }>('/auth/verify-email', { email, code })
    if (r.ok) return r
    if (r.message?.includes('Network') || r.message?.includes('Failed to fetch')) {
      const users = getMockUsers()
      const u = users[email.toLowerCase()]
      if (!u || u.code !== code || Date.now() > u.codeExpires) return { ok: false, message: 'Invalid or expired verification code' }
      u.isVerified = true; u.code = ''; setMockUsers(users)
      const token = 'mock_' + btoa(email)
      try { localStorage.setItem('qubera_auth', '1'); localStorage.setItem('qubera_token', token); localStorage.setItem('qubera_user', JSON.stringify({ name: u.name, email })) } catch { /* */ }
      return { ok: true, data: { token, user: { id: 'mock', name: u.name, email } } }
    }
    return r
  },

  async login(email: string, password: string): Promise<ApiResult<{ token: string; user: AuthUser }>> {
    const r = await apiPost<{ token: string; user: AuthUser }>('/auth/login', { email, password })
    if (r.ok) return r
    if (r.message?.includes('Network') || r.message?.includes('Failed to fetch')) {
      const users = getMockUsers()
      const u = users[email.toLowerCase()]
      if (!u || u.password !== password) return { ok: false, message: 'Invalid email or password' }
      if (!u.isVerified) return { ok: false, message: 'Please verify your email before logging in', notVerified: true }
      const token = 'mock_' + btoa(email)
      return { ok: true, data: { token, user: { id: 'mock', name: u.name, email } } }
    }
    return r
  },

  async resendCode(email: string): Promise<ApiResult<unknown>> {
    const r = await apiPost('/auth/resend-code', { email })
    if (r.ok) return r
    if (r.message?.includes('Network') || r.message?.includes('Failed to fetch')) {
      const users = getMockUsers(); const u = users[email.toLowerCase()]
      if (!u) return { ok: false, message: 'User not found' }
      const code = mockGenerateCode(); u.code = code; u.codeExpires = Date.now()+24*60*60*1000; setMockUsers(users)
      console.log(`[Mock] New verification code for ${email}: ${code}`)
      return { ok: true, message: 'New verification code sent' }
    }
    return r
  },

  async forgotPassword(email: string): Promise<ApiResult<unknown>> {
    const r = await apiPost('/auth/forgot-password', { email })
    if (r.ok) return r
    if (r.message?.includes('Network') || r.message?.includes('Failed to fetch')) {
      const users = getMockUsers()
      if (!users[email.toLowerCase()]) return { ok: false, message: 'User not found' }
      const token = Math.random().toString(36).slice(2)
      try { localStorage.setItem('qubera_reset_token_'+email.toLowerCase(), token) } catch { /* */ }
      console.log(`[Mock] Password reset link: /reset-password/${token} for ${email}`)
      return { ok: true, message: 'Reset link sent to your email' }
    }
    return r
  },

  async resetPassword(token: string, password: string): Promise<ApiResult<unknown>> {
    const r = await apiPost(`/auth/reset-password/${token}`, { password })
    if (r.ok) return r
    if (r.message?.includes('Network') || r.message?.includes('Failed to fetch')) {
      // mock: find user with that token
      const users = getMockUsers()
      let found: string | null = null
      for (const k of Object.keys(users)) {
        try { if (localStorage.getItem('qubera_reset_token_'+k) === token) { found = k; break } } catch { /* */ }
      }
      if (!found) return { ok: false, message: 'Invalid or expired token' }
      users[found].password = password
      setMockUsers(users)
      try { localStorage.removeItem('qubera_reset_token_'+found) } catch { /* */ }
      return { ok: true, message: 'Password reset successful' }
    }
    return r
  },

  async googleLogin(credential: string): Promise<ApiResult<{ token: string; user: AuthUser }>> {
    return apiPost('/auth/google', { credential })
  },

  getPendingEmail(): string | null {
    try { return localStorage.getItem(LS_PENDING_EMAIL) } catch { return null }
  },
  setPendingEmail(email: string) { try { localStorage.setItem(LS_PENDING_EMAIL, email) } catch { /* */ } },
  clearPendingEmail() { try { localStorage.removeItem(LS_PENDING_EMAIL) } catch { /* */ } },
}
