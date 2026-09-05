import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Mail } from 'lucide-react'
import { AuthShell } from '../../components/auth/AuthShell'
import { Divider } from '../../components/login/Divider'
import { SocialLogin } from '../../components/login/SocialLogin'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../services/authService'

export function Signup() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const e: Record<string,string> = {}
    if (!name.trim()) e.name = 'Full name is required.'
    if (!email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Please enter a valid email.'
    if (!password) e.password = 'Password is required.'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.'
    else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) e.password = 'Use letters and numbers.'
    if (!confirm) e.confirm = 'Please confirm your password.'
    else if (confirm !== password) e.confirm = 'Passwords do not match.'
    if (!agree) e.agree = 'You must agree to the Terms and Privacy Policy.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setServerError('')
    if (!validate()) return
    setLoading(true)
    const res = await authService.register(name.trim(), email.trim(), password)
    setLoading(false)
    if (!res.ok) {
      setServerError(res.message || 'Could not create account.')
      return
    }
    authService.setPendingEmail(email.trim())
    navigate('/verify-email', { replace: true })
  }

  const handleGoogle = () => { login(); navigate('/dashboard', { replace:true }) }
  const handleGithub = () => { login(); navigate('/dashboard', { replace:true }) }

  return (
    <AuthShell>
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-forest">Create your account</h1>
        <p className="mt-2 text-[14px] text-inkmuted">Start your quantum learning journey with Qubera.</p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
        <div>
          <label htmlFor="su-name" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.6px] text-forest">FULL NAME</label>
          <div className="relative">
            <input id="su-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your full name"
              className="h-[52px] w-full rounded-[14px] border border-inputborder bg-white px-4 pr-10 text-[14px] text-ink placeholder:text-inkmuted/50 outline-none focus:border-sage focus:ring-2 focus:ring-sage/15"/>
            <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted/60" />
          </div>
          {errors.name && <p className="mt-1.5 text-[12px] text-red-700">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="su-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.6px] text-forest">EMAIL ADDRESS</label>
          <div className="relative">
            <input id="su-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email"
              className="h-[52px] w-full rounded-[14px] border border-inputborder bg-white px-4 pr-10 text-[14px] text-ink placeholder:text-inkmuted/50 outline-none focus:border-sage focus:ring-2 focus:ring-sage/15"/>
            <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted/60" />
          </div>
          {errors.email && <p className="mt-1.5 text-[12px] text-red-700">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="su-password" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.6px] text-forest">PASSWORD</label>
          <div className="relative">
            <input id="su-password" type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a password"
              className="h-[52px] w-full rounded-[14px] border border-inputborder bg-white px-4 pr-10 text-[14px] text-ink placeholder:text-inkmuted/50 outline-none focus:border-sage focus:ring-2 focus:ring-sage/15"/>
            <button type="button" onClick={()=>setShowPw(v=>!v)} aria-label={showPw?'Hide':'Show'} className="absolute right-3 top-1/2 -translate-y-1/2 text-inkmuted/70 hover:text-forest">
              {showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-[12px] text-red-700">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="su-confirm" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.6px] text-forest">CONFIRM PASSWORD</label>
          <div className="relative">
            <input id="su-confirm" type={showConfirm?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm your password"
              className="h-[52px] w-full rounded-[14px] border border-inputborder bg-white px-4 pr-10 text-[14px] text-ink placeholder:text-inkmuted/50 outline-none focus:border-sage focus:ring-2 focus:ring-sage/15"/>
            <button type="button" onClick={()=>setShowConfirm(v=>!v)} aria-label={showConfirm?'Hide':'Show'} className="absolute right-3 top-1/2 -translate-y-1/2 text-inkmuted/70 hover:text-forest">
              {showConfirm ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            </button>
          </div>
          {errors.confirm && <p className="mt-1.5 text-[12px] text-red-700">{errors.confirm}</p>}
        </div>

        <label className="flex items-start gap-2 pt-1">
          <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-inputborder text-forest focus:ring-sage/20"/>
          <span className="text-[12px] leading-snug text-inkmuted">I agree to the <span className="font-medium text-forest">Terms of Service</span> and <span className="font-medium text-forest">Privacy Policy</span></span>
        </label>
        {errors.agree && <p className="-mt-2 text-[12px] text-red-700">{errors.agree}</p>}

        {serverError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-center text-[13px] text-red-700">{serverError}</p>}

        <button type="submit" disabled={loading} className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-forest text-[14px] font-semibold text-white transition hover:bg-forest-light disabled:opacity-60">
          {loading ? 'Creating...' : <>Create Account <span>→</span></>}
        </button>
      </form>

      <div className="mt-6"><Divider /></div>
      <div className="mt-5"><SocialLogin onGoogleLogin={e=>{e.preventDefault(); handleGoogle()}} onGithubLogin={e=>{e.preventDefault(); handleGithub()}} /></div>

      <p className="mt-6 text-center text-[13px] text-inkmuted">Already have an account? <Link to="/login" className="font-medium text-sage hover:text-sage-dark">Log in</Link></p>
    </AuthShell>
  )
}
