import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { AuthShell } from '../../components/auth/AuthShell'
import { authService } from '../../services/authService'

export function ResetPassword() {
  const { token: paramToken } = useParams()
  const [search] = useSearchParams()
  const token = paramToken || search.get('token') || search.get('t') || ''
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const e: Record<string,string> = {}
    if (!pw) e.pw = 'Password is required.'
    else if (pw.length < 8) e.pw = 'Use at least 8 characters.'
    if (!confirm) e.confirm = 'Please confirm.'
    else if (confirm !== pw) e.confirm = 'Passwords do not match.'
    if (!token) e.token = 'Reset link is missing or expired.'
    setErrors(e)
    return Object.keys(e).length===0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setServerError('')
    if (!validate()) return
    setLoading(true)
    const res = await authService.resetPassword(token, pw)
    setLoading(false)
    if (!res.ok) { setServerError(res.message || 'Could not reset.'); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-faint text-forest">✓</div>
          <h1 className="mt-4 text-[20px] font-bold text-forest">Password updated successfully</h1>
          <p className="mt-2 text-sm text-inkmuted">You can now log in with your new password.</p>
          <Link to="/login" className="mt-6 flex h-[50px] w-full items-center justify-center rounded-[14px] bg-forest text-sm font-semibold text-white">Back to Login</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <header>
        <h1 className="text-[22px] font-bold tracking-tight text-forest">Create a new password</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-inkmuted">Enter your new password below.</p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.6px] text-forest">NEW PASSWORD</label>
          <div className="relative">
            <input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} placeholder="Enter new password"
              className="h-[52px] w-full rounded-[14px] border border-inputborder bg-white px-4 pr-10 text-[14px] text-ink placeholder:text-inkmuted/50 outline-none focus:border-sage focus:ring-2 focus:ring-sage/15"/>
            <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-inkmuted/70">
              {showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            </button>
          </div>
          {errors.pw && <p className="mt-1 text-[12px] text-red-700">{errors.pw}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.6px] text-forest">CONFIRM PASSWORD</label>
          <div className="relative">
            <input type={showConfirm?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm new password"
              className="h-[52px] w-full rounded-[14px] border border-inputborder bg-white px-4 pr-10 text-[14px] text-ink placeholder:text-inkmuted/50 outline-none focus:border-sage focus:ring-2 focus:ring-sage/15"/>
            <button type="button" onClick={()=>setShowConfirm(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-inkmuted/70">
              {showConfirm ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            </button>
          </div>
          {errors.confirm && <p className="mt-1 text-[12px] text-red-700">{errors.confirm}</p>}
        </div>

        {errors.token && <p className="text-[12px] text-red-700">{errors.token}</p>}
        {serverError && <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-[13px] text-red-700">{serverError}</p>}

        <button type="submit" disabled={loading} className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-forest text-sm font-semibold text-white hover:bg-forest-light disabled:opacity-60">
          {loading ? 'Updating...' : 'Update Password →'}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-inkmuted"><Link to="/login" className="font-medium text-sage hover:text-sage-dark">Back to login</Link></p>
    </AuthShell>
  )
}
