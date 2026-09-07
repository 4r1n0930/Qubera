import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { AuthShell } from '../../components/auth/AuthShell'
import { Divider } from '../../components/login/Divider'
import { SocialLogin } from '../../components/login/SocialLogin'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../services/authService'

export function ForgotPassword() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const validate = () => {
    if (!email.trim()) { setError('Email is required.'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email.'); return false }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    const res = await authService.forgotPassword(email.trim())
    setLoading(false)
    if (!res.ok) { setError(res.message || 'Could not send reset link.'); return }
    setSent(true)
  }

  const handleResend = async () => {
    setError('')
    const res = await authService.forgotPassword(email.trim())
    if (!res.ok) setError(res.message || 'Could not resend.')
  }

  if (sent) {
    return (
      <AuthShell>
        <div className="text-center">
          <h1 className="text-[22px] font-bold tracking-tight text-forest">Check your email</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-inkmuted">We&apos;ve sent a password reset link to:</p>
          <p className="mt-1 text-sm font-semibold text-ink">{email}</p>
        </div>
        <div className="mt-8 rounded-2xl border border-sage/20 bg-sage-faint px-4 py-4 text-center text-[13px] text-inkmuted">
          Click the link in the email to reset your password. The link expires in 1 hour.
        </div>
        <p className="mt-6 text-center text-[13px] text-inkmuted">Didn&apos;t receive the email? <button onClick={handleResend} className="font-medium text-sage hover:text-sage-dark">Resend email</button></p>
        {error && <p className="mt-3 text-center text-[13px] text-red-700">{error}</p>}
        <Link to="/login" className="mt-6 flex h-[50px] w-full items-center justify-center rounded-[14px] border border-inputborder bg-white text-sm font-semibold text-ink hover:bg-ivory/60">Back to login</Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <header>
        <h1 className="text-[22px] font-bold tracking-tight text-forest">Forgot Password?</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-inkmuted">No worries! Enter your email address and we&apos;ll send you a link to reset your password.</p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <label htmlFor="fp-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.6px] text-forest">EMAIL ADDRESS</label>
          <div className="relative">
            <input id="fp-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email"
              className="h-[52px] w-full rounded-[14px] border border-inputborder bg-white px-4 pr-10 text-[14px] text-ink placeholder:text-inkmuted/50 outline-none focus:border-sage focus:ring-2 focus:ring-sage/15"/>
            <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted/60" />
          </div>
          {error && <p className="mt-1.5 text-[12px] text-red-700">{error}</p>}
        </div>

        <button type="submit" disabled={loading} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-forest text-sm font-semibold text-white hover:bg-forest-light disabled:opacity-60">
          {loading ? 'Sending...' : <>Send Reset Link <span>↗</span></>}
        </button>
      </form>

      <div className="mt-6"><Divider /></div>
      <div className="mt-5"><SocialLogin onGoogleLogin={e=>{e.preventDefault(); login(); window.location.href='/dashboard'}} onGithubLogin={e=>{e.preventDefault(); login(); window.location.href='/dashboard'}} /></div>

      <p className="mt-5 text-center text-[13px] text-inkmuted">Remember your password? <Link to="/login" className="font-medium text-sage hover:text-sage-dark">Log in</Link></p>
    </AuthShell>
  )
}
