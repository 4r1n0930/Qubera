import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthShell } from '../../components/auth/AuthShell'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Handles the redirect back from a backend OAuth provider (GitHub, and Google
 * when the redirect-based flow is used). The backend appends a signed JWT as a
 * `token` query param on success, or an `error` param on failure.
 *
 * On success the token is stored (same mechanism as email login) and the user
 * is sent to the Dashboard. On failure a friendly error is shown.
 */
export function AuthCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { loginWithToken } = useAuth()
  const handledRef = useRef(false)

  // Derive the outcome deterministically from the URL so no render-elsewhere
  // state churn is needed for the error/loading views.
  const errParam = params.get('error')
  const token = params.get('token')
  const userParam = params.get('user')

  // Missing both token and error means something went wrong server-side.
  const missing = !errParam && !token

  const error = (errParam || (missing ? 'Authentication failed. No credentials were returned.' : null)) as string | null

  useEffect(() => {
    if (handledRef.current || error || !token) return

    if (userParam) {
      try {
        const user = JSON.parse(userParam)
        localStorage.setItem('qubera_user', JSON.stringify(user))
        localStorage.setItem('user', JSON.stringify(user))
      } catch {
        // ignore malformed user payload; token alone is sufficient
      }
    }

    handledRef.current = true
    loginWithToken(token)
    navigate('/dashboard', { replace: true })
  }, [error, token, userParam, loginWithToken, navigate])

  if (error) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">!</div>
          <h1 className="mt-4 text-[22px] font-bold text-forest">Sign-in failed</h1>
          <p className="mt-2 max-w-[360px] text-[13px] leading-relaxed text-inkmuted">{error}</p>
          <Link
            to="/login"
            className="mt-6 flex h-[50px] w-full items-center justify-center rounded-[14px] bg-forest text-sm font-semibold text-white hover:bg-forest-light"
          >
            Back to login
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-faint text-forest">✓</div>
        <h1 className="mt-4 text-[22px] font-bold text-forest">Signing you in…</h1>
        <p className="mt-2 text-[13px] text-inkmuted">Please wait while we complete authentication.</p>
      </div>
    </AuthShell>
  )
}
