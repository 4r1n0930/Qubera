import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const nav = [
  { label: 'Home', to: '/' },
  { label: 'Learn', to: '/learn' },
  { label: 'Quantum Lab', to: '/quantum-lab' },
  { label: 'Code Editor', to: '/code-editor' },
  { label: 'Contact Us', to: '/contact' },
]

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="home-header">
      <div className="home-header-inner">
        <Link to="/" className="home-logo">QUBERA</Link>

        <nav className="home-nav" aria-label="Primary">
          {nav.map(i => (
            <NavLink key={i.to} to={i.to} end={i.to==='/'}
              className={({isActive}) => `home-nav-link${isActive?' active':''}`}>
              {i.label}
            </NavLink>
          ))}
        </nav>

        <div className="home-header-actions">
          <Link to="/login" className="home-login">Log in</Link>
          <Link to="/login" className="home-cta">Get Started <span aria-hidden>→</span></Link>
          <button className="home-mobile-toggle" onClick={()=>setOpen(v=>!v)} aria-label={open?'Close menu':'Open menu'} aria-expanded={open}>
            {open ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
      </div>
      <div className={`home-mobile-nav${open?' open':''}`}>
        {nav.map(i => (
          <NavLink key={i.to} to={i.to} end={i.to==='/' } onClick={()=>setOpen(false)}
            className={({isActive})=>isActive?'active':''}>{i.label}</NavLink>
        ))}
        <Link to="/login" onClick={()=>setOpen(false)} style={{marginTop:8, background:'var(--color-forest)', color:'#fff', textAlign:'center'}}>Log in</Link>
        <Link to="/login" onClick={()=>setOpen(false)} style={{background:'var(--color-sage-faint)', color:'var(--color-forest)', textAlign:'center', border:'1px solid var(--color-cardborder)'}}>Get Started →</Link>
      </div>
    </header>
  )
}
