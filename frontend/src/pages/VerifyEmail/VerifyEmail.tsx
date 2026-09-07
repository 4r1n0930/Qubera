import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { AuthShell } from '../../components/auth/AuthShell'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../services/authService'

export function VerifyEmail() {
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()
  const email = authService.getPendingEmail() || ''
  const [codes, setCodes] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [seconds, setSeconds] = useState(45)
  const refs = useRef<(HTMLInputElement|null)[]>([])

  useEffect(() => {
    if (!email) { navigate('/signup', { replace: true }) }
  }, [email, navigate])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  const handleChange = (idx: number, v: string) => {
    if (!/^\d*$/.test(v)) return
    const next = [...codes]
    next[idx] = v.slice(-1)
    setCodes(next)
    setError('')
    if (v && idx < 5) refs.current[idx+1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codes[idx] && idx > 0) {
      refs.current[idx-1]?.focus()
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx-1]?.focus()
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx+1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6).split('')
    if (pasted.length === 0) return
    const next = Array(6).fill('')
    pasted.forEach((c,i)=> next[i]=c)
    setCodes(next)
    const last = Math.min(pasted.length, 6)-1
    refs.current[last]?.focus()
  }

  const handleVerify = async () => {
    const code = codes.join('')
    if (code.length !== 6) { setError('Please enter the 6-digit code.'); return }
    setLoading(true); setError('')
    const res = await authService.verifyEmail(email, code)
    setLoading(false)
    if (!res.ok) {
      const msg = res.message || 'Invalid code.'
      if (msg.toLowerCase().includes('expired')) setError('This code has expired. Please request a new one.')
      else setError('Invalid code. Please check and try again.')
      return
    }
    setSuccess(true)
    if (res.data?.token) loginWithToken(res.data.token)
    else loginWithToken('verified')
    authService.clearPendingEmail()
    setTimeout(() => navigate('/dashboard', { replace: true }), 900)
  }

  const handleResend = async () => {
    if (seconds > 0) return
    const res = await authService.resendCode(email)
    if (!res.ok) setError(res.message || 'Could not resend code.')
    else { setSeconds(45); setError('') }
  }

  if (success) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-faint text-forest">✓</div>
          <h1 className="mt-5 text-[22px] font-bold text-forest">Email verified</h1>
          <p className="mt-2 text-sm text-inkmuted">Your Qubera account is ready.</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-faint">
          <MailCheck className="h-7 w-7 text-forest" />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-forest text-[11px] text-white">✓</span>
        </div>
        <h1 className="mt-4 text-[22px] font-bold tracking-tight text-forest">Verify your email</h1>
        <p className="mt-2 max-w-[360px] text-[13px] leading-relaxed text-inkmuted">
          We&apos;ve sent a 6-digit verification code to
          <br /><span className="font-semibold text-ink">{email}</span>
        </p>
        <p className="mt-3 text-[12px] leading-relaxed text-inkmuted">Enter the code below to verify your email<br />and activate your Qubera account.</p>
      </div>

      <div className="mt-7 flex justify-center gap-2" onPaste={handlePaste}>
        {codes.map((c,i)=>(
          <input
            key={i}
            ref={el=>{refs.current[i]=el}}
            value={c}
            onChange={e=>handleChange(i, e.target.value)}
            onKeyDown={e=>handleKeyDown(i,e)}
            inputMode="numeric"
            maxLength={1}
            className={`h-[44px] w-[42px] rounded-xl border bg-white text-center text-[18px] font-semibold text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/15 ${c ? 'border-sage/40 bg-sage-faint/30' : 'border-inputborder'}`}
          />
        ))}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-[13px] text-red-700">{error}</p>}

      <button onClick={handleVerify} disabled={loading} className="mt-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-forest text-sm font-semibold text-white hover:bg-forest-light disabled:opacity-60">
        {loading ? 'Verifying...' : <>Verify Email <span>→</span></>}
      </button>

      <p className="mt-5 text-center text-[12px] text-inkmuted">
        Didn&apos;t receive the code?{' '}
        {seconds > 0 ? (
          <span className="font-medium text-ink">Resend code in 00:{String(seconds).padStart(2,'0')}</span>
        ) : (
          <button onClick={handleResend} className="font-medium text-sage hover:text-sage-dark">Resend code</button>
        )}
      </p>

      <p className="mt-3 text-center text-[12px] text-inkmuted">
        Wrong email? <Link to="/signup" className="font-medium text-sage hover:text-sage-dark">Change email</Link>
      </p>
    </AuthShell>
  )
}
